/* كادر — export the edit as a video (frame-accurate MP4 with WebCodecs, real-time fallback) */
const EXP = { res: 720, fps: 24, ov: false, film: false, busy: false, cancel: false, blob: null, url: null, ext: 'mp4', dl: null };
function inFrame() { try { return window.top !== window; } catch (e) { return true; } }
function expSupportFast() { return !!(window.VideoEncoder && window.VideoFrame && window.Mp4Muxer); }
function openExport() {
  const multi = PRJ && PRJ.scenes.length > 1; if (!multi) EXP.film = false;
  if (!ST.shots.length && !EXP.film) return toast('أضف لقطات إلى المونتاج أولًا');
  if (EXP.busy) return;
  pause(); if (PRJ) flushSave();
  const fd = multi ? PRJ.scenes.reduce((a, S) => a + sceneDur(S), 0) : 0;
  openModal('تصدير الفيديو', `<div class="exp" id="exp">
  ${multi ? `<div class="row"><span>ماذا تصدّر</span><div class="chips">${chip(`هذا المشهد <small><bdi dir="ltr">${fmt(totalDur())}s</bdi></small>`, !EXP.film, 'data-act="expFilm" data-v="0"')}${chip(`الفيلم كاملًا <small>${PRJ.scenes.length} مشاهد · <bdi dir="ltr">${fmt(fd)}s</bdi></small>`, EXP.film, 'data-act="expFilm" data-v="1"')}</div></div>` : ''}
  <p class="note">يُرسم المونتاج صورةً صورة ثم يُحفظ فيديو. ${EXP.film ? `المدة <bdi dir="ltr">${fmt(fd)}s</bdi> · ${prjStats(PRJ).shots} لقطة` : `المدة <bdi dir="ltr">${fmt(totalDur())}s</bdi> · ${ST.shots.length} لقطات`} · النسبة <bdi dir="ltr">${ST.aspect}</bdi></p>
  <div class="row"><span>الدقة</span><div class="chips">${chip('<bdi dir="ltr">720p</bdi>', EXP.res !== 1080, 'data-act="expRes" data-v="720"')}${chip('<bdi dir="ltr">1080p</bdi>', EXP.res === 1080, 'data-act="expRes" data-v="1080"')}</div></div>
  <div class="row"><span>الإيقاع</span><div class="chips">${chip('<bdi dir="ltr">24 fps</bdi> سينمائي', EXP.fps !== 30, 'data-act="expFps" data-v="24"')}${chip('<bdi dir="ltr">30 fps</bdi>', EXP.fps === 30, 'data-act="expFps" data-v="30"')}</div></div>
  <div class="row"><span>على الصورة</span><div class="chips">${chip('بطاقة اللقطة والزمن', EXP.ov, 'data-act="expOv"')}</div></div>
  <p class="note">${expSupportFast() ? 'الصيغة: <bdi dir="ltr">MP4 (H.264)</bdi>. يعمل التصدير بسرعة جهازك ولا تسقط أي صورة.' : 'هذا المتصفح لا يدعم الترميز السريع: سيُسجَّل الفيديو في الوقت الحقيقي، وقد تكون الصيغة <bdi dir="ltr">WebM</bdi>.'}</p>
  <div class="btns"><button class="btn pri" data-act="expGo">${IC.film} ابدأ التصدير</button></div></div>`);
}
function expAct(A, v) {
  switch (A) {
    case 'expRes': EXP.res = +v; openExport(); break;
    case 'expFps': EXP.fps = +v; openExport(); break;
    case 'expOv': EXP.ov = !EXP.ov; openExport(); break;
    case 'expFilm': EXP.film = v === '1'; openExport(); break;
    case 'expGo': runExport(); break;
    case 'expCancel': EXP.cancel = true; break;
    case 'expSave': expSave(); break;
    case 'expShare': expShare(); break;
  }
}
async function runExport() {
  if (EXP.busy) return; EXP.busy = true; EXP.cancel = false;
  const box = $('#exp');
  box.innerHTML = `<p class="note" id="expMsg">جارٍ التحضير…</p><div class="bar"><i id="expBar"></i></div><div class="btns" style="margin-top:12px"><button class="btn" data-act="expCancel">إلغاء</button></div>`;
  try {
    const r = await renderVideo(p => { const b = $('#expBar'), m = $('#expMsg'); if (b) b.style.width = (p * 100).toFixed(1) + '%'; if (m) m.textContent = `يُرسم الفيديو… ${Math.round(p * 100)}%`; });
    EXP.busy = false;
    if (!r) { openExport(); toast('أُلغي التصدير'); return; }
    EXP.blob = r.blob; EXP.ext = r.ext; if (EXP.url) URL.revokeObjectURL(EXP.url); EXP.url = URL.createObjectURL(r.blob);
    const mb = (r.blob.size / 1048576).toFixed(1), share = !inFrame() && navigator.canShare && navigator.canShare({ files: [new File([r.blob], 'kadr.' + r.ext, { type: r.blob.type })] });
    const host = $('#exp'); if (!host) return;
    host.innerHTML = `<video src="${EXP.url}" controls playsinline style="width:100%;max-height:52vh;background:#000;border-radius:10px;display:block"></video>
    <p class="note" style="margin-top:8px">الفيديو جاهز: <bdi dir="ltr">${r.ext.toUpperCase()} · ${r.w}×${r.h} · ${mb} MB</bdi></p>
    <div class="btns"><button class="btn pri" data-act="expSave">${IC.dl} حفظ الفيديو</button>${share ? `<button class="btn" data-act="expShare">مشاركة</button>` : ''}<button class="btn" data-act="export">إعدادات أخرى</button></div>`;
  } catch (err) {
    console.error(err); EXP.busy = false; const host = $('#exp');
    if (host) host.innerHTML = `<p class="note">تعذّر التصدير: ${esc(err && err.message || err)}</p><div class="btns"><button class="btn" data-act="export">حاول مجددًا</button></div>`;
  } finally { EXP.busy = false; RT.dirty = true; }
}
async function pickCodec(W, H, fps) {
  for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.640033', 'avc1.42001f']) {
    try { const r = await VideoEncoder.isConfigSupported({ codec, width: W, height: H, bitrate: 6e6, framerate: fps }); if (r && r.supported) return codec; } catch (e) { }
  }
  return null;
}
function rrect(cx, x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
function drawOverlay(cx, pf, t, W, H) {
  const k = H / 720, c = pf.pc.cfg, pad = 18 * k, ph = 36 * k;
  cx.save(); cx.font = `600 ${Math.round(21 * k)}px "IBM Plex Sans Arabic", sans-serif`; cx.textBaseline = 'middle'; cx.textAlign = 'center';
  const pill = (txt, x, y, right, bg, fg, dir) => { cx.direction = dir || 'rtl'; const w = cx.measureText(txt).width + 22 * k, x0 = right ? x - w : x; cx.fillStyle = bg; rrect(cx, x0, y, w, ph, 8 * k); cx.fill(); cx.fillStyle = fg; cx.fillText(txt, x0 + w / 2, y + ph / 2 + 1); return w; };
  pill('● ' + tc(t), pad, pad, false, 'rgba(15,7,6,.72)', '#f5e9db', 'ltr');
  const sw = pill(`لقطة ${pf.pc.shot.i + 1}/${ST.shots.length}`, W - pad, pad, true, 'rgba(15,7,6,.72)', '#f5e9db');
  if (EXP.film && PRJ) pill(`${PRJ.scenes.indexOf(ST) + 1}. ${ST.name}`, W - pad - sw - 6 * k, pad, true, 'rgba(15,7,6,.72)', '#f2a23a');
  let x = W - pad, y = H - pad - ph;
  x -= pill(c.name, x, y, true, '#f2a23a', '#1c0e0c', 'ltr') + 6 * k;
  x -= pill(c.mode === 'free' ? 'كاميرا حرة' : `${SZ[c.size].ar} · ${c.size}`, x, y, true, 'rgba(15,7,6,.78)', '#f5e9db') + 6 * k;
  if (c.mode !== 'free') x -= pill(ANG[c.angle].ar, x, y, true, 'rgba(15,7,6,.78)', '#f5e9db') + 6 * k;
  if (c.move !== 'static') pill(MV[c.move].ar, x, y, true, 'rgba(15,7,6,.78)', '#f5e9db');
  cx.restore();
}
function drawExportFrame(r2, cam, cx, t, W, H) {
  const pf = programFrame(t); applyAll(t); placeBackdrop(pf.R); weatherTick(t, pf.R);
  cx.globalAlpha = 1; cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H);
  const shoot = R => { composeCam(cam, R); cam.aspect = W / H; cam.updateProjectionMatrix(); r2.render(scene, cam); };
  if (pf.R) { shoot(pf.R); cx.drawImage(r2.domElement, 0, 0, W, H); }
  if (pf.R2 && pf.mixA > .002) { shoot(pf.R2); cx.globalAlpha = pf.mixA; cx.drawImage(r2.domElement, 0, 0, W, H); cx.globalAlpha = 1; }
  if (pf.fadeA > 0) { cx.globalAlpha = pf.fadeA; cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H); cx.globalAlpha = 1; }
  if (EXP.ov && pf.pc) drawOverlay(cx, pf, t, W, H);
}
async function renderVideo(onP) {
  const asp = aspV(), base = EXP.res === 1080 ? 1080 : 720; let W, H;
  if (asp >= 1) { H = base; W = Math.round(base * asp / 2) * 2; if (W > 1920) { W = 1920; H = Math.round(1920 / asp / 2) * 2; } }
  else { W = base; H = Math.round(base / asp / 2) * 2; }
  const fps = EXP.fps === 30 ? 30 : 24, film = EXP.film && PRJ && PRJ.scenes.length > 1, home = PRJ ? PRJ.cur : 0;
  const segs = film ? PRJ.scenes.map((S, i) => ({ i, n: Math.round(sceneDur(S) * fps) })).filter(g => g.n > 0) : [{ i: home, n: Math.max(1, Math.round(totalDur() * fps)) }];
  const N = segs.reduce((a, g) => a + g.n, 0); let curSeg = home;
  const useScene = k => { if (!film || k === curSeg) return; ST = normalize(PRJ.scenes[k]); curSeg = k; setBackdrop(null); refreshWorld(); };
  const at = i => { for (const g of segs) { if (i < g.n) return [g.i, i]; i -= g.n; } const g = segs[segs.length - 1]; return [g.i, g.n - 1]; };
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const r2 = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true });
  r2.setPixelRatio(1); r2.setSize(W, H, false); r2.shadowMap.enabled = true; r2.shadowMap.type = THREE.PCFSoftShadowMap;
  const comp = document.createElement('canvas'); comp.width = W; comp.height = H; const cx = comp.getContext('2d');
  const cam = new THREE.PerspectiveCamera(40, W / H, .02, 600), tick = () => new Promise(r => setTimeout(r, 0));
  const frame = i => { const [k, j] = at(i); useScene(k); drawExportFrame(r2, cam, cx, j / fps, W, H); };
  try {
    if (expSupportFast()) {
      const codec = await pickCodec(W, H, fps);
      if (codec) {
        const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H, frameRate: fps }, fastStart: 'in-memory' });
        let encErr = null;
        const enc = new VideoEncoder({ output: (ch, meta) => muxer.addVideoChunk(ch, meta), error: e => { encErr = e; } });
        enc.configure({ codec, width: W, height: H, bitrate: W * H > 1e6 ? 8e6 : 5e6, framerate: fps });
        for (let i = 0; i < N; i++) {
          if (EXP.cancel) { try { enc.close(); } catch (e) { } return null; }
          if (encErr) throw encErr;
          frame(i);
          const vf = new VideoFrame(comp, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
          enc.encode(vf, { keyFrame: i % (fps * 2) === 0 }); vf.close();
          onP((i + 1) / N);
          while (enc.encodeQueueSize > 6) await tick();
          if (i % 2 === 0) await tick();
        }
        await enc.flush(); muxer.finalize(); enc.close(); if (encErr) throw encErr;
        return { blob: new Blob([muxer.target.buffer], { type: 'video/mp4' }), ext: 'mp4', w: W, h: H };
      }
    }
    const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    const mime = window.MediaRecorder && types.find(t => MediaRecorder.isTypeSupported(t));
    if (!mime || !comp.captureStream) throw new Error('هذا المتصفح لا يدعم تسجيل الفيديو');
    const stream = comp.captureStream(fps), rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6e6 }), chunks = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    const done = new Promise(r => { rec.onstop = r; });
    frame(0); rec.start(250); const t0 = performance.now();
    for (let i = 0; i < N; i++) {
      if (EXP.cancel) { rec.stop(); await done; return null; }
      const wait = t0 + i * 1000 / fps - performance.now(); if (wait > 0) await new Promise(r => setTimeout(r, wait));
      frame(i); onP((i + 1) / N);
    }
    await new Promise(r => setTimeout(r, 1000 / fps + 60)); rec.stop(); await done;
    return { blob: new Blob(chunks, { type: mime.split(';')[0] }), ext: mime.includes('mp4') ? 'mp4' : 'webm', w: W, h: H };
  } finally { r2.dispose(); try { r2.forceContextLoss(); } catch (e) { } if (film && curSeg !== home) { ST = PRJ.scenes[home]; refreshWorld(); loadBd(); } applyAll(RT.t); RT.dirty = true; }
}
function blobB64(b) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(b); }); }
function expName() { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${PRJ ? fileSafe(PRJ.name).replace(/\s+/g, '-') : 'kadr'}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.${EXP.ext}`; }
async function expSave() { if (EXP.blob) await saveBlob(expName(), EXP.blob); }
async function expShare() {
  try { await navigator.share({ files: [new File([EXP.blob], expName(), { type: EXP.blob.type })], title: 'كادر' }); } catch (e) { if (e && e.name !== 'AbortError') toast('تعذّرت المشاركة'); }
}
if (window.claude && window.claude.use) { try { window.claude.use('downloads').then(d => { EXP.dl = d; }).catch(() => { }); } catch (e) { } }

/* ---------- installable app (web version outside Claude) ---------- */
let installEvt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (TAB === 'scene') renderPanel(); });
function apkUrl() { const h = location.hostname; if (!/\.github\.io$/.test(h)) return null; const owner = h.split('.')[0], repo = location.pathname.split('/').filter(Boolean)[0]; return repo ? `https://github.com/${owner}/${repo}/releases/latest/download/kadr.apk` : null; }
function appSection() {
  if (window.AndroidBridge) return '';
  if (inFrame()) return `<section><h3>التطبيق على هاتفك</h3><p class="note">للتثبيت على الشاشة الرئيسية أو تحميل تطبيق أندرويد، افتح النسخة المستقلة من «كادر» على موقعها الخاص.</p></section>`;
  const apk = apkUrl(), ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<section><h3>التطبيق على هاتفك</h3>
  ${installEvt ? `<button class="btn pri" data-act="install">${IC.dl} ثبّت «كادر» على هذا الجهاز</button>` : ios ? `<p class="note">على آيفون: اضغط زر المشاركة في Safari ثم «إضافة إلى الشاشة الرئيسية».</p>` : `<p class="note">من قائمة المتصفح اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</p>`}
  ${apk ? `<p style="margin:10px 0 0"><a class="btn" href="${apk}">${IC.android} حمّل تطبيق أندرويد (APK)</a></p>` : ''}</section>`;
}
async function doInstall() { if (!installEvt) return; installEvt.prompt(); try { await installEvt.userChoice; } catch (e) { } installEvt = null; renderPanel(); }
function registerSW() {
  if (!('serviceWorker' in navigator) || inFrame() || location.protocol !== 'https:' || window.AndroidBridge) return;
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) toast('وصل تحديث جديد لـ«كادر»: أعد فتح التطبيق لتراه'); }); });
  }).catch(() => { });
}
