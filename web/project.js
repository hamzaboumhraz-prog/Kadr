/* كادر — projects → scenes → shots: storage, home screen, scene list, whole-film playback */
const IDX_KEY = 'kadr-index', PKEY = id => 'kadr-p-' + id, OLD_KEY = 'kadr-project-v1';
let PRJ = null, saveT = null, quotaWarned = false;
const HOME = { step: null, menu: null, del: null, ren: null };
const SHEET = { del: null, add: false };
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ---------- storage ---------- */
function readJSON(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function prjIndex() { const a = readJSON(IDX_KEY, []); return Array.isArray(a) ? a : []; }
function writeIndex(a) { try { localStorage.setItem(IDX_KEY, JSON.stringify(a)); } catch (e) { } }
function prjStats(P) { let shots = 0, dur = 0; (P.scenes || []).forEach(s => (s.shots || []).forEach(h => { shots++; dur += h.dur || 0; })); return { shots, dur }; }
function prjMeta(P) { const st = prjStats(P); return { id: P.id, name: P.name, n: P.scenes.length, shots: st.shots, dur: +st.dur.toFixed(1), updated: P.updated || Date.now(), lessons: !!P.lessons, env: P.scenes[0] && P.scenes[0].env }; }
function writePrj(P) {
  try { localStorage.setItem(PKEY(P.id), JSON.stringify(P)); const ix = prjIndex().filter(m => m.id !== P.id); ix.unshift(prjMeta(P)); writeIndex(ix); return true; }
  catch (e) { if (!quotaWarned) { quotaWarned = true; toast('مساحة الحفظ في هذا الجهاز ممتلئة: احذف مشروعًا قديمًا أو احفظه كملف'); } return false; }
}
function loadProject(id) { const P = readJSON(PKEY(id), null); return P && Array.isArray(P.scenes) ? P : null; }
function removeProject(id) { try { localStorage.removeItem(PKEY(id)); } catch (e) { } writeIndex(prjIndex().filter(m => m.id !== id)); }
function flushSave() { clearTimeout(saveT); saveT = null; if (!PRJ || !ST) return; PRJ.scenes[PRJ.cur] = ST; PRJ.updated = Date.now(); writePrj(PRJ); }
function save() { if (!PRJ) return; clearTimeout(saveT); saveT = setTimeout(flushSave, 400); }
addEventListener('pagehide', flushSave);
document.addEventListener('visibilitychange', () => { if (document.hidden) flushSave(); });
function migrateOld() {
  if (prjIndex().length) return;
  const old = readJSON(OLD_KEY, null);
  if (old && Array.isArray(old.items)) { const P = makeProject('مشروعي الأول', [sceneOf(old, 'المشهد 1')]); writePrj(P); }
  try { localStorage.removeItem(OLD_KEY); } catch (e) { }
}
function bdKey() { return 'kadr-bd-' + (PRJ ? PRJ.id : 'x') + '-' + (ST && ST.id || 'x'); }

/* ---------- building projects and scenes ---------- */
function sceneOf(S, name) { S.id = S.id || uid('sc'); S.name = name || S.name || 'مشهد'; return S; }
function makeProject(name, scenes, extra) { return Object.assign({ v: 2, id: uid('p'), name: name || 'مشروع جديد', scenes, cur: 0, created: Date.now(), updated: Date.now() }, extra || {}); }
function lessonsProject() { return makeProject('دروس كادر', LESSONS.map(L => sceneOf(lessonState(L.k), L.t)), { id: 'lessons', lessons: true }); }
function blankScene(env, cast, aspect) {
  const S = { v: 1, seq: 1, env, light: ENVS[env].light, weather: 'clear', aspect: aspect || '16:9', items: [], cams: [], shots: [], bd: null, ov: { thirds: 1, safe: 0, lbl: 1 }, lesson: null };
  const prev = ST; ST = S;
  const src = cast && cast.length ? cast : [newItemSpec('man', 0, 0, 0)];
  const la = isLib(env) && LIB.items[env.slice(4)], o0 = la && Array.isArray(la.start) ? la.start : [0, 0];
  src.forEach((c, i) => { const it = JSON.parse(JSON.stringify(c)); it.id = nid('i'); it.actions = []; it.pose = 'stand'; it.x = +((i - (src.length - 1) / 2) * 1.2 + (+o0[0] || 0)).toFixed(2); it.z = +o0[1] || 0; it.rot = 0; S.items.push(it); });
  const c = newCam({ target: S.items[0].id, size: 'MS' }, 0); S.cams.push(c); S.shots.push({ id: nid('s'), cam: c.id, dur: 3, trans: 'cut' });
  ST = prev; return S;
}

/* ---------- opening ---------- */
function openProject(P, idx) {
  if (PRJ && PRJ !== P) flushSave();
  PRJ = P; P.scenes = (P.scenes || []).filter(s => s && Array.isArray(s.items));
  if (!P.scenes.length) P.scenes.push(sceneOf(blankScene('studio'), 'المشهد 1'));
  P.scenes.forEach((S, i) => sceneOf(S, S.name || 'المشهد ' + (i + 1)));
  if (P.lessons) TAB = 'learn'; else if (TAB === 'learn') TAB = 'scene';
  enterScene(clamp(idx == null ? (P.cur || 0) : idx, 0, P.scenes.length - 1));
  renderTabs(); renderPanel(); hideHome(); writePrj(PRJ);
}
function enterScene(i) {
  PRJ.cur = i; ST = normalize(PRJ.scenes[i]); PRJ.scenes[i] = ST;
  Object.assign(RT, { t: 0, playing: false, src: 'edit', sel: null, selShot: null, selAct: null, quiz: null, camPrevOn: false, view: 'cam', pick: null, ctxCam: null, popFor: null });
  RT.cam = ST.cams[0] ? ST.cams[0].id : null;
  if (window.closePop) closePop(); RT.bdImg = null; setBackdrop(null);
  fitOrbit(); refreshWorld(); HIST.s = [JSON.stringify(ST)]; HIST.i = 0;
  renderAll(); updHead(); loadBd();
}
function goScene(i) { if (!PRJ || i < 0 || i >= PRJ.scenes.length) return; pause(); flushSave(); enterScene(i); toast(`المشهد ${i + 1}: ${PRJ.scenes[i].name}`); }
function openLesson(k) {
  if (PRJ && PRJ.lessons) {
    const i = PRJ.scenes.findIndex(s => s.lesson === k), L = LESSONS.find(l => l.k === k);
    if (i >= 0 && i === PRJ.cur && L) { const id = ST.id; PRJ.scenes[i] = sceneOf(lessonState(k), L.t); PRJ.scenes[i].id = id; enterScene(i); flushSave(); toast('أُعيد الدرس إلى حالته الأولى'); return; }
    if (i >= 0) { goScene(i); return; }
  }
  flushSave(); const P = loadProject('lessons') || lessonsProject(), i = Math.max(0, P.scenes.findIndex(s => s.lesson === k));
  openProject(P, i); toast('فُتح الدرس في «دروس كادر»، ومشروعك محفوظ');
}

/* ---------- header ---------- */
function updHead() {
  const b = $('#bScenes'); if (!b || !PRJ) return;
  b.innerHTML = `<b>${esc(PRJ.name)}</b><small>المشهد ${PRJ.cur + 1} من ${PRJ.scenes.length} · ${esc(ST.name || '')}</small>${IC.down}`;
}

/* ---------- scene list (sheet) ---------- */
function sceneDur(S) { return (S.shots || []).reduce((a, h) => a + (h.dur || 0), 0); }
function openScenes() {
  if (!PRJ) return; pause(); flushSave();
  const n = PRJ.scenes.length;
  let h;
  if (SHEET.add) {
    h = `<p class="note">اختر مكان المشهد الجديد. كل مشهد له مكانه الخاص، وتنتقل إليه الشخصيات نفسها من المشهد الحالي.</p>
    <div class="grid2">${Object.entries(ENVS).map(([k, e]) => `<button class="tile" data-pa="addEnv" data-v="${k}"><span class="sw" style="background:${ENV_SW[k] || '#555'}"></span><span>${e.ar}</span></button>`).join('')}</div>
    <div class="btns" style="margin-top:12px"><button class="btn" data-pa="addBack">رجوع</button></div>`;
  } else {
    h = `<label class="pname"><span>اسم المشروع</span><input type="text" data-pr="pname" value="${esc(PRJ.name)}" maxlength="80"></label>
    <div class="scl">${PRJ.scenes.map((S, i) => `<div class="scn${i === PRJ.cur ? ' on' : ''}">
      <button class="scn-go" data-pa="go" data-v="${i}" aria-label="افتح المشهد ${i + 1}"><span class="num">${i + 1}</span><span class="sw" style="background:${ENV_SW[S.env] || '#555'}"></span></button>
      <div class="scn-b"><input type="text" data-pr="sname" data-v="${i}" value="${esc(S.name)}" aria-label="اسم المشهد ${i + 1}" maxlength="80">
      <small>${esc((ENVS[S.env] || ENVS.studio).ar)} · ${(S.shots || []).length} لقطات · <bdi dir="ltr">${fmt(sceneDur(S))}s</bdi></small></div>
      <div class="scn-t">${SHEET.del === i ? `<button class="btn danger" data-pa="delOk" data-v="${i}">احذف نهائيًا</button><button class="btn" data-pa="delNo">لا</button>` : `
        <button class="mini" data-pa="up" data-v="${i}" aria-label="إلى الأعلى"${i ? '' : ' disabled'}>${IC.up}</button><button class="mini" data-pa="dn" data-v="${i}" aria-label="إلى الأسفل"${i < n - 1 ? '' : ' disabled'}>${IC.down}</button>
        <button class="mini" data-pa="dup" data-v="${i}" aria-label="نسخ المشهد">${IC.copy}</button><button class="mini" data-pa="del" data-v="${i}" aria-label="حذف المشهد"${n > 1 ? '' : ' disabled'}>${IC.trash}</button>`}</div></div>`).join('')}</div>
    <div class="btns" style="margin-top:12px"><button class="btn pri" data-pa="add">${IC.plus} مشهد جديد</button><button class="btn" data-pa="film">${IC.play} شغّل الفيلم كاملًا</button></div>
    <div class="btns" style="margin-top:8px"><button class="btn" data-pa="save">${IC.dl} احفظ المشروع كملف</button><button class="btn" data-pa="home">${IC.home} كل المشاريع</button></div>
    <p class="note" style="margin-top:10px">الفيلم كاملًا <bdi dir="ltr">${fmt(PRJ.scenes.reduce((a, S) => a + sceneDur(S), 0))}s</bdi> · ${prjStats(PRJ).shots} لقطة في ${n} مشاهد.</p>`;
  }
  openModal(SHEET.add ? 'مشهد جديد' : 'المشاهد', h);
}
function onSheetClick(e) {
  const b = e.target.closest('[data-pa]'); if (!b || b.disabled) return;
  const A = b.dataset.pa, i = +b.dataset.v;
  switch (A) {
    case 'go': SHEET.del = null; closeModal(); if (i !== PRJ.cur) goScene(i); break;
    case 'up': case 'dn': { const j = A === 'up' ? i - 1 : i + 1; if (j < 0 || j >= PRJ.scenes.length) break; const cur = PRJ.scenes[PRJ.cur]; const a = PRJ.scenes; [a[i], a[j]] = [a[j], a[i]]; PRJ.cur = a.indexOf(cur); writePrj(PRJ); updHead(); openScenes(); break; }
    case 'dup': { const c = JSON.parse(JSON.stringify(PRJ.scenes[i])); c.id = uid('sc'); c.name = PRJ.scenes[i].name + ' (نسخة)'; PRJ.scenes.splice(i + 1, 0, c); if (PRJ.cur > i) PRJ.cur++; writePrj(PRJ); updHead(); openScenes(); break; }
    case 'del': SHEET.del = i; openScenes(); break;
    case 'delNo': SHEET.del = null; openScenes(); break;
    case 'delOk': { SHEET.del = null; if (PRJ.scenes.length < 2) break; const wasCur = i === PRJ.cur; PRJ.scenes.splice(i, 1); try { localStorage.removeItem('kadr-bd-' + PRJ.id + '-' + (ST && ST.id)); } catch (err) { } if (wasCur) enterScene(Math.min(i, PRJ.scenes.length - 1)); else { if (PRJ.cur > i) PRJ.cur--; } writePrj(PRJ); updHead(); openScenes(); toast('حُذف المشهد'); break; }
    case 'add': SHEET.add = true; openScenes(); break;
    case 'addBack': SHEET.add = false; openScenes(); break;
    case 'addEnv': { SHEET.add = false; const cast = ST.items.filter(s => s.kind === 'human'); const S = sceneOf(blankScene(b.dataset.v, cast, ST.aspect), 'المشهد ' + (PRJ.scenes.length + 1)); PRJ.scenes.splice(PRJ.cur + 1, 0, S); closeModal(); goScene(PRJ.cur + 1); break; }
    case 'film': closeModal(); startFilm(); break;
    case 'save': exportProjectFile(PRJ); break;
    case 'home': closeModal(); showHome(); break;
    case 'copyPrj': if (helpBlob) helpBlob.blob.text().then(t => copyText(t)); break;
    case 'sharePrj': if (helpBlob) navigator.share({ files: [new File([helpBlob.blob], helpBlob.name, { type: helpBlob.blob.type || 'application/octet-stream' })], title: 'كادر' }).catch(() => { }); break;
    case 'retrySave': if (helpBlob) { closeModal(); saveBlob(helpBlob.name, helpBlob.blob); } break;
  }
}
function onSheetChange(e) {
  const el = e.target; if (!el.dataset.pr || !PRJ) return;
  const v = el.value.trim();
  if (el.dataset.pr === 'pname') { PRJ.name = v || PRJ.name; }
  if (el.dataset.pr === 'sname') { const S = PRJ.scenes[+el.dataset.v]; if (S) S.name = v || S.name; }
  writePrj(PRJ); updHead();
}

/* ---------- whole-film playback ---------- */
function startFilm() {
  if (!PRJ) return; flushSave();
  const first = PRJ.scenes.findIndex(S => (S.shots || []).length); if (first < 0) return toast('لا توجد لقطات في المشاهد بعد');
  if (PRJ.cur !== first) enterScene(first);
  cine(true); RT.film = true;
}
function filmNext() {
  if (!RT.film || !PRJ) return false;
  let j = PRJ.cur + 1; while (j < PRJ.scenes.length && !(PRJ.scenes[j].shots || []).length) j++;
  if (j >= PRJ.scenes.length) { RT.film = false; return false; }
  flushSave(); enterScene(j); RT.film = true; RT.t = 0; RT.playing = true; RT.lastShot = -1; updTransport(); return true;
}

/* ---------- saving and opening files ---------- */
async function androidSave(name, blob) {
  const B = window.AndroidBridge, type = /\.kadr$/i.test(name) ? 'application/octet-stream' : (blob.type || 'application/octet-stream');
  if (!B.saveBegin) { B.saveFile(name, await blobB64(blob), type); return; }
  const id = B.saveBegin(name, type), step = 786432;
  for (let o = 0; o < blob.size; o += step) { if (!B.saveChunk(id, await blobB64(blob.slice(o, o + step)))) { B.saveEnd(id); throw new Error('انقطعت الكتابة في ذاكرة الهاتف'); } }
  const err = B.saveEnd(id); if (err) throw new Error(err);
}
const SAVE_WHY = {
  host_unavailable: 'تطبيق Claude على هذا الهاتف لا يسمح بحفظ الملفات من داخل الصفحة.',
  unavailable: 'الحفظ غير متاح في هذا العرض.', not_granted: 'الحفظ غير متاح في هذا العرض.', capability_disabled: 'الحفظ غير متاح في هذا العرض.', capability_removed: 'الحفظ غير متاح في هذا العرض.',
  too_large: 'الملف أكبر مما يقبله هذا العرض.', rejected_extension: 'هذا العرض لا يقبل هذا النوع من الملفات.', extension_not_enabled: 'هذا العرض لا يقبل هذا النوع من الملفات.'
};
async function saveBlob(name, blob) {
  if (window.AndroidBridge && AndroidBridge.saveFile) {
    try { await androidSave(name, blob); } catch (e) { saveHelp(name, blob, 'تعذّر الحفظ في الهاتف: ' + (e && e.message || e)); }
    return;
  }
  if (EXP.dl) {
    const fname = /\.kadr$/i.test(name) ? name + '.json' : name;
    try { await EXP.dl.save({ filename: fname, data: blob }); toast('حُفظ الملف'); }
    catch (e) {
      const c = e && e.code;
      if (c === 'declined') toast('لم يُحفظ الملف');
      else if (c === 'rate_limited') toast('نافذة الحفظ مفتوحة أو المحاولات كثيرة: انتظر لحظة ثم أعد المحاولة');
      else saveHelp(name, blob, SAVE_WHY[c] || 'تعذّر الحفظ هنا' + (c ? ` (${c})` : ''));
    }
    return;
  }
  if (inFrame()) { saveHelp(name, blob, 'الحفظ غير متاح داخل هذا الإطار.'); return; }
  const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); toast('بدأ تحميل الملف');
}
let helpBlob = null;
function saveHelp(name, blob, why) {
  helpBlob = { name, blob };
  const isPrj = /\.kadr$/i.test(name), canShare = !inFrame() && navigator.canShare && navigator.canShare({ files: [new File([blob], name, { type: blob.type || 'application/octet-stream' })] });
  openModal('تعذّر الحفظ', `<p>${esc(why)}</p>
  <div class="card"><b>الحل</b>
  <p>${window.AndroidBridge ? 'أعد المحاولة بعد إغلاق التطبيقات الأخرى. إن تكرر الخطأ، صدّر بدقة 720p أو احفظ المشروع كملف ثم صدّره من الحاسوب.' : 'افتح كادر من تطبيق الأندرويد المثبَّت (APK) أو من رابط الويب في المتصفح، فالحفظ هناك يعمل دائمًا.'}</p>
  ${isPrj ? '<p>أو انسخ نص المشروع هنا، ثم في الجهاز الآخر: «افتح ملف سيناريو» ← «الصق نص الملف».</p>' : ''}</div>
  <div class="btns" style="margin-top:12px">${isPrj ? `<button class="btn pri" data-pa="copyPrj">${IC.copy} انسخ نص المشروع</button>` : ''}${canShare ? `<button class="btn" data-pa="sharePrj">مشاركة الملف</button>` : ''}<button class="btn" data-pa="retrySave">${IC.dl} أعد المحاولة</button></div>`);
}
function fileSafe(n) { return String(n || 'kadr').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 60) || 'kadr'; }
function exportProjectFile(P) {
  if (!P) return; if (P === PRJ) flushSave();
  const data = Object.assign({ kadr: 'project', v: 2 }, P); delete data.lessons; const used = window.libUsed ? libUsed(P) : []; if (used.length) data.assets = used;
  saveBlob(fileSafe(P.name) + '.kadr', new Blob([JSON.stringify(data)], { type: 'application/json' }));
}
function pickFile() { const f = $('#fileIn'); f.value = ''; f.click(); }
function onFilePicked(e) {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  if (f.size > 60e6) return toast('الملف كبير جدًا');
  const rd = new FileReader();
  rd.onload = () => { const buf = rd.result; if (String.fromCharCode(...new Uint8Array(buf, 0, Math.min(4, buf.byteLength))) === 'glTF') { if (PRJ) hideHome(); glbDialog(buf, f.name); } else importText(new TextDecoder().decode(buf), f.name); };
  rd.onerror = () => toast('تعذّرت قراءة الملف'); rd.readAsArrayBuffer(f);
}
async function importText(txt, fname) {
  let J; try { J = JSON.parse(String(txt).replace(/^\uFEFF/, '').trim()); } catch (e) { openModal('الملف غير صالح', `<p>هذا الملف ليس ملف كادر صالحًا (نص <bdi dir="ltr">JSON</bdi>).</p><p class="note">${esc(e.message || '')}</p>`); return; }
  if (J && J.kadr === 'asset') { if (homeOn() && PRJ) hideHome(); await libInstall(J.assets || [J], true); return; }
  if (J && Array.isArray(J.assets) && J.assets.length) { const n = await libInstall(J.assets, false); if (n) toast(`أُضيف ${n} من الديكورات والعناصر إلى مكتبتك`); }
  let P, rep;
  try {
    if (J && (J.kadr === 'project' || (Array.isArray(J.scenes) && J.scenes[0] && Array.isArray(J.scenes[0].items) && J.scenes[0].cams))) {
      P = Object.assign({}, J); delete P.kadr; P.v = 2; P.id = uid('p'); P.scenes = (P.scenes || []).map((S, i) => sceneOf(S, S.name || 'المشهد ' + (i + 1))); P.updated = Date.now(); P.name = P.name || (fname || 'مشروع').replace(/\.[^.]+$/, '');
      rep = { scenes: P.scenes.length, shots: prjStats(P).shots, warn: [] };
    } else if (J && Array.isArray(J.items) && Array.isArray(J.cams)) {
      P = makeProject((fname || 'مشروع').replace(/\.[^.]+$/, ''), [sceneOf(J, 'المشهد 1')]); rep = { scenes: 1, shots: J.shots.length, warn: [] };
    } else {
      const r = buildFromScript(J); P = r.prj; rep = r.rep;
    }
  } catch (e) { console.error(e); openModal('تعذّر فتح الملف', `<p>${esc(e.message || e)}</p>`); return; }
  openProject(P, 0);
  openModal('جاهز', `<p><b>${esc(P.name)}</b>: ${rep.scenes} مشاهد و${rep.shots} لقطة.</p>
  ${P.scenes.map((S, i) => `<p class="note" style="margin:2px 0">${i + 1}. ${esc(S.name)} · ${esc((ENVS[S.env] || ENVS.studio).ar)} · ${S.shots.length} لقطات</p>`).join('')}
  ${rep.warn.length ? `<div class="card"><b>ملاحظات أثناء القراءة</b>${rep.warn.slice(0, 12).map(w => `<p>${esc(w)}</p>`).join('')}</div>` : ''}
  <div class="btns" style="margin-top:12px"><button class="btn pri" data-pa="film">${IC.play} شغّل الفيلم كاملًا</button><button class="btn" data-act="board">${IC.board} لوحة القصة</button></div>`);
}

/* ---------- home screen ---------- */
function homeOn() { return !$('#home').hidden; }
function showHome() { if (PRJ) flushSave(); pause(); if (window.stageOn && stageOn()) exitStage(); if (document.body.classList.contains('cine')) cine(false); closeModal(); Object.assign(HOME, { step: null, menu: null, del: null, ren: null }); renderHome(); $('#home').hidden = false; document.body.classList.add('homeon'); $('#home').scrollTop = 0; }
function hideHome() { $('#home').hidden = true; document.body.classList.remove('homeon'); RT.dirty = true; setTimeout(onResize, 30); }
function ago(ms) {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return 'الآن'; if (m < 60) return `قبل ${m} د`; const h = Math.round(m / 60); if (h < 24) return `قبل ${h} س`;
  const d = Math.round(h / 24); if (d < 30) return `قبل ${d} يوم`; return new Date(ms).toLocaleDateString('ar-MA');
}
const LOGO = '<svg class="logo" viewBox="0 0 40 40" aria-hidden="true"><rect x="2" y="7" width="36" height="26" rx="5" fill="#f2a23a"/><rect x="6" y="11" width="28" height="18" rx="2" fill="#1c0e0c"/><path d="M6 17v-6h6M34 17v-6h-6M6 23v6h6M34 23v6h-6" stroke="#f2a23a" stroke-width="2" fill="none"/><circle cx="20" cy="20" r="3.2" fill="#ef7f37"/></svg>';
function renderHome() {
  const ix = prjIndex().filter(m => !m.lessons), L = prjIndex().find(m => m.lessons);
  let body;
  if (HOME.step === 'new') {
    HOME.env = HOME.env || 'house'; HOME.asp = HOME.asp || '16:9';
    body = `<section class="hsec"><h2>مشروع جديد</h2>
    <label class="pname"><span>اسم المشروع</span><input type="text" id="hName" placeholder="مثلًا: فيلمي القصير" maxlength="80" value="${esc(HOME.name || '')}"></label>
    <h3>مكان المشهد الأول</h3><div class="grid2">${Object.entries(ENVS).map(([k, e]) => `<button class="tile${HOME.env === k ? ' on' : ''}" data-h="env" data-v="${k}"><span class="sw" style="background:${ENV_SW[k] || '#555'}"></span><span>${e.ar}</span></button>`).join('')}</div>
    <h3>نسبة العرض</h3><div class="chips">${ASPECTS.map(a => chip(`<bdi dir="ltr">${a.k}</bdi> <small>${a.ar}</small>`, HOME.asp === a.k, `data-h="asp" data-v="${a.k}"`)).join('')}</div>
    <div class="btns" style="margin-top:14px"><button class="btn pri" data-h="create">ابدأ</button><button class="btn" data-h="back">رجوع</button></div></section>`;
  } else if (HOME.step === 'import') {
    body = `<section class="hsec"><h2>افتح ملف سيناريو</h2>
    <p class="note">ملف <bdi dir="ltr">.kadr</bdi> يحمل المشاهد والأماكن والشخصيات والحركات واللقطات. عند فتحه يبني كادر المشاهد كلها، ثم تعدّل ما تريد: الإضاءة، الملابس، الحركة، اللقطات.</p>
    <div class="btns"><button class="btn pri" data-h="pick">${IC.file} اختر الملف من جهازك</button></div>
    <h3 style="margin-top:16px">أو الصق نص الملف هنا</h3><textarea id="hPaste" dir="ltr" spellcheck="false" placeholder='{ "kadr": "script", ... }'></textarea>
    <div class="btns" style="margin-top:10px"><button class="btn" data-h="paste">افتح النص الملصق</button><button class="btn" data-h="back">رجوع</button></div></section>`;
  } else {
    const card = m => `<div class="hcard${HOME.menu === m.id ? ' open' : ''}">
      <button class="hc-main" data-h="open" data-v="${m.id}"><span class="hc-sw" style="background:${ENV_SW[m.env] || '#555'}"></span><span class="hc-t"><b>${esc(m.name)}</b><small>${m.n} مشاهد · ${m.shots || 0} لقطة · <bdi dir="ltr">${fmt(m.dur || 0)}s</bdi> · ${ago(m.updated)}</small></span></button>
      <button class="mini" data-h="menu" data-v="${m.id}" aria-label="خيارات المشروع" aria-expanded="${HOME.menu === m.id}">${IC.more}</button>
      ${HOME.menu === m.id ? `<div class="hc-menu">${HOME.ren === m.id ? `<input type="text" id="hRen" value="${esc(m.name)}" maxlength="80" aria-label="الاسم الجديد"><button class="btn pri" data-h="renOk" data-v="${m.id}">حفظ</button>`
        : HOME.del === m.id ? `<span>حذف «${esc(m.name)}» نهائيًا؟</span><button class="btn danger" data-h="delOk" data-v="${m.id}">احذف</button><button class="btn" data-h="menu" data-v="${m.id}">لا</button>`
          : `<button class="btn" data-h="ren" data-v="${m.id}">${IC.edit} إعادة التسمية</button><button class="btn" data-h="dup" data-v="${m.id}">${IC.copy} نسخة</button><button class="btn" data-h="exp" data-v="${m.id}">${IC.dl} حفظ كملف</button><button class="btn danger" data-h="del" data-v="${m.id}">${IC.trash} حذف</button>`}</div>` : ''}</div>`;
    body = `<div class="hact"><button class="hbig pri" data-h="new">${IC.plus}<span><b>مشروع جديد</b><small>مشهد أول تختار مكانه، ثم تضيف المشاهد واللقطات</small></span></button>
    <button class="hbig" data-h="import">${IC.file}<span><b>افتح ملف سيناريو</b><small>ديكوباج جاهز يتحول إلى مشاهد متحركة</small></span></button></div>
    <section class="hsec"><h2>مشاريعي</h2>${ix.length ? ix.map(card).join('') : '<p class="note">لا توجد مشاريع بعد. ابدأ مشروعًا جديدًا أو افتح ملف سيناريو.</p>'}</section>
    <section class="hsec"><h2>تعلّم</h2><div class="hcard"><button class="hc-main" data-h="open" data-v="lessons"><span class="hc-sw" style="background:${ENV_SW.medina}"></span><span class="hc-t"><b>دروس كادر</b><small>${LESSONS.length} دروس جاهزة: القطع على الحركة، الحوار وقاعدة 180°، تقديم الشخصية…</small></span></button>${L ? `<button class="mini" data-h="resetL" aria-label="إعادة الدروس إلى حالتها الأولى" title="إعادة الدروس">${IC.undo}</button>` : ''}</div></section>`;
  }
  $('#home').innerHTML = `<div class="hwrap"><header class="hhead">${LOGO}<div><h1>كادر</h1><p>مختبر اللغة السينمائية: مشروع، مشاهد، لقطات</p></div>${PRJ && !HOME.step ? `<button class="btn" data-h="resume">${IC.play} رجوع إلى «${esc(PRJ.name)}»</button>` : ''}</header>${body}</div>`;
}
function onHomeClick(e) {
  const b = e.target.closest('[data-h]'); if (!b) return;
  const A = b.dataset.h, v = b.dataset.v;
  switch (A) {
    case 'new': HOME.step = 'new'; HOME.name = ''; renderHome(); setTimeout(() => { const i = $('#hName'); if (i) i.focus(); }, 50); break;
    case 'import': HOME.step = 'import'; renderHome(); break;
    case 'back': HOME.step = null; renderHome(); break;
    case 'env': HOME.env = v; renderHome(); break;
    case 'asp': HOME.asp = v; renderHome(); break;
    case 'create': { const name = ($('#hName') && $('#hName').value.trim()) || 'مشروع بدون عنوان'; const P = makeProject(name, [sceneOf(blankScene(HOME.env || 'house', null, HOME.asp), 'المشهد 1')], { aspect: HOME.asp }); HOME.step = null; HOME.name = ''; openProject(P, 0); toast('مشروع جديد: أضف المشاهد من زر المشاهد في الأعلى'); break; }
    case 'pick': pickFile(); break;
    case 'paste': { const t = $('#hPaste') && $('#hPaste').value.trim(); if (!t) return toast('الصق نص الملف أولًا'); importText(t, 'سيناريو'); break; }
    case 'open': { if (PRJ && PRJ.id === v) { hideHome(); break; } const P = v === 'lessons' ? (loadProject('lessons') || lessonsProject()) : loadProject(v); if (!P) { toast('تعذّر فتح المشروع'); removeProject(v); renderHome(); break; } openProject(P); break; }
    case 'resume': hideHome(); break;
    case 'menu': HOME.menu = HOME.menu === v && !HOME.del && !HOME.ren ? null : v; HOME.del = null; HOME.ren = null; renderHome(); break;
    case 'ren': HOME.ren = v; renderHome(); setTimeout(() => { const i = $('#hRen'); if (i) { i.focus(); i.select(); } }, 50); break;
    case 'renOk': { const P = loadProject(v), n = $('#hRen') && $('#hRen').value.trim(); if (P && n) { P.name = n; if (PRJ && PRJ.id === v) { PRJ.name = n; updHead(); } writePrj(PRJ && PRJ.id === v ? PRJ : P); } HOME.ren = null; HOME.menu = null; renderHome(); break; }
    case 'dup': { if (PRJ && PRJ.id === v) flushSave(); const P = loadProject(v); if (P) { const c = JSON.parse(JSON.stringify(P)); c.id = uid('p'); c.name = P.name + ' (نسخة)'; c.updated = Date.now(); delete c.lessons; writePrj(c); } HOME.menu = null; renderHome(); toast('أُنشئت نسخة'); break; }
    case 'exp': { if (PRJ && PRJ.id === v) flushSave(); const P = loadProject(v); if (P) exportProjectFile(P); break; }
    case 'del': HOME.del = v; renderHome(); break;
    case 'delOk': { removeProject(v); if (PRJ && PRJ.id === v) PRJ = null; HOME.menu = null; HOME.del = null; renderHome(); toast('حُذف المشروع'); break; }
    case 'resetL': { removeProject('lessons'); if (PRJ && PRJ.lessons) PRJ = null; renderHome(); toast('أُعيدت الدروس إلى حالتها الأولى'); break; }
  }
}
function bindProject() {
  $('#home').addEventListener('click', onHomeClick);
  $('#home').addEventListener('input', e => { if (e.target.id === 'hName') HOME.name = e.target.value; });
  $('#home').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'hRen') { const b = $('[data-h="renOk"]'); if (b) b.click(); } if (e.key === 'Enter' && e.target.id === 'hName') { const b = $('[data-h="create"]'); if (b) b.click(); } });
  $('#mb').addEventListener('click', onSheetClick); $('#mb').addEventListener('change', onSheetChange);
  $('#fileIn').addEventListener('change', onFilePicked);
  $('#bScenes').onclick = () => { SHEET.add = false; SHEET.del = null; openScenes(); };
  $('#bHome').onclick = showHome;
}
