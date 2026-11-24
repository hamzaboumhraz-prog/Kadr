package ma.oslob.kadr;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/** كادر — a thin Android shell around the web app, which ships inside the APK (assets/www). */
public class MainActivity extends Activity {
  private static final String HOST = "appassets.androidplatform.net";
  private static final int PICK_FILE = 41;
  private WebView web;
  private ValueCallback<Uri[]> fileCallback;

  @Override
  protected void onCreate(Bundle state) {
    super.onCreate(state);
    web = new WebView(this);
    web.setBackgroundColor(0xFF1C0E0C);
    setContentView(web);

    final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
        .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
        .build();

    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setAllowFileAccess(false);

    web.setWebViewClient(new WebViewClient() {
      @Override
      public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        return loader.shouldInterceptRequest(request.getUrl());
      }

      @Override
      public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri u = request.getUrl();
        if (HOST.equals(u.getHost())) return false;
        try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
        return true;
      }
    });

    web.setWebChromeClient(new WebChromeClient() {
      @Override
      public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        fileCallback = callback;
        try {
          startActivityForResult(params.createIntent(), PICK_FILE);
        } catch (Exception e) {
          fileCallback = null;
          return false;
        }
        return true;
      }
    });

    web.addJavascriptInterface(new Bridge(), "AndroidBridge");
    if (state != null) web.restoreState(state);
    else web.loadUrl("https://" + HOST + "/assets/www/index.html");
  }

  @Override
  protected void onSaveInstanceState(Bundle out) {
    super.onSaveInstanceState(out);
    web.saveState(out);
  }

  @Override
  protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    if (requestCode == PICK_FILE && fileCallback != null) {
      fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
      fileCallback = null;
      return;
    }
    super.onActivityResult(requestCode, resultCode, data);
  }

  @Override
  public void onBackPressed() {
    web.evaluateJavascript("(window.kadrBack&&window.kadrBack())?'1':'0'", value -> {
      if (value == null || !value.contains("1")) MainActivity.super.onBackPressed();
    });
  }

  private void toast(final String msg) {
    runOnUiThread(() -> Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show());
  }

  /** Writes a file to Movies/Kadr (videos) or Downloads/Kadr (other files). Returns null on success, else the reason. */
  private String writeOut(String name, String mime, InputStream in) {
    try {
      boolean video = mime != null && mime.startsWith("video");
      if (Build.VERSION.SDK_INT >= 29) {
        ContentValues cv = new ContentValues();
        cv.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
        cv.put(MediaStore.MediaColumns.MIME_TYPE, mime);
        cv.put(MediaStore.MediaColumns.RELATIVE_PATH, (video ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_DOWNLOADS) + "/Kadr");
        Uri collection = video ? MediaStore.Video.Media.EXTERNAL_CONTENT_URI : MediaStore.Downloads.EXTERNAL_CONTENT_URI;
        Uri uri = getContentResolver().insert(collection, cv);
        if (uri == null) return "الهاتف رفض إنشاء الملف";
        try (OutputStream os = getContentResolver().openOutputStream(uri)) { copy(in, os); }
        toast(video ? "حُفظ الفيديو في Movies/Kadr" : "حُفظ الملف في Download/Kadr");
      } else {
        File dir = new File(getExternalFilesDir(video ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_DOWNLOADS), "Kadr");
        if (!dir.exists()) dir.mkdirs();
        File f = new File(dir, name);
        try (FileOutputStream os = new FileOutputStream(f)) { copy(in, os); }
        toast("حُفظ الملف: " + f.getAbsolutePath());
      }
      return null;
    } catch (Throwable e) {
      return e.getClass().getSimpleName() + (e.getMessage() != null ? ": " + e.getMessage() : "");
    }
  }

  private static void copy(InputStream in, OutputStream os) throws java.io.IOException {
    byte[] buf = new byte[65536]; int n;
    while ((n = in.read(buf)) > 0) os.write(buf, 0, n);
  }

  /** Called from the page. Small files: saveFile(name, base64, mime). Large files in pieces: saveBegin, saveChunk…, saveEnd. */
  class Bridge {
    private final Map<String, File> parts = new HashMap<>();
    private final Map<String, String[]> meta = new HashMap<>();

    @JavascriptInterface
    public void saveFile(String name, String base64, String mime) {
      String err;
      try { err = writeOut(name, mime, new ByteArrayInputStream(Base64.decode(base64, Base64.DEFAULT))); }
      catch (Throwable e) { err = e.getClass().getSimpleName(); }
      if (err != null) toast("تعذّر حفظ الملف: " + err);
    }

    @JavascriptInterface
    public synchronized String saveBegin(String name, String mime) {
      String id = UUID.randomUUID().toString();
      File f = new File(getCacheDir(), id + ".part");
      f.delete();
      parts.put(id, f); meta.put(id, new String[] { name, mime });
      return id;
    }

    @JavascriptInterface
    public synchronized boolean saveChunk(String id, String base64) {
      File f = parts.get(id); if (f == null) return false;
      try (FileOutputStream os = new FileOutputStream(f, true)) { os.write(Base64.decode(base64, Base64.DEFAULT)); return true; }
      catch (Throwable e) { return false; }
    }

    @JavascriptInterface
    public synchronized String saveEnd(String id) {
      File f = parts.remove(id); String[] m = meta.remove(id);
      if (f == null || m == null) return "انقطع الحفظ";
      String err;
      try (InputStream in = new FileInputStream(f)) { err = writeOut(m[0], m[1], in); }
      catch (Throwable e) { err = e.getClass().getSimpleName(); }
      f.delete();
      return err == null ? "" : err;
    }
  }
}
