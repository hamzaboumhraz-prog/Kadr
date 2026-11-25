/* كادر — مكتبتي: sets, objects, animals and people imported from files.
   Two kinds of file:
   1) a Kadr asset file (JSON, "kadr":"asset") made of simple shapes, colours, textures and lights;
   2) a 3D model (.glb) from any modelling tool or free model library, optionally with walk/idle animations.
   Everything is stored on the device (IndexedDB) and travels inside project files. */
const LIB = { items: {}, models: {}, ready: false };
const LDB = 'kadr-lib', LST = 'assets';
function libDB() { return new Promise((res, rej) => { const r = indexedDB.open(LDB, 1); r.onupgradeneeded = () => r.result.createObjectStore(LST, { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function libTx(mode, fn) { return libDB().then(db => new Promise((res, rej) => { const tx = db.transaction(LST, mode), st = tx.objectStore(LST), q = fn(st); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); })); }
async function libLoad() {
  try { const all = await libTx('readonly', st => st.getAll()); (all || []).forEach(a => LIB.items[a.id] = a); } catch (e) { console.warn('library', e); }
  LIB.ready = true; libRegister(); if (ST) { refreshWorld(); renderPanel(); }
}
async function libPut(a) { LIB.items[a.id] = a; delete LIB.models[a.id]; libRegister(); try { await libTx('readwrite', st => st.put(a)); } catch (e) { toast('تعذّر حفظ العنصر في ذاكرة الجهاز'); } }
async function libDel(id) { delete LIB.items[id]; delete LIB.models[id]; libRegister(); try { await libTx('readwrite', st => st.delete(id)); } catch (e) { } }
const libId = s => String(s || 'asset').toLowerCase().replace(/[^a-z0-9؀-ۿ_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'asset';
const isLib = t => typeof t === 'string' && t.startsWith('lib:');
/* make library entries visible to the rest of the app as places, objects, animals and people */
function libRegister() {
  [PROPS, ANIMALS, CAST, ENVS].forEach(T => Object.keys(T).forEach(k => { if (isLib(k)) delete T[k]; }));
  Object.values(LIB.items).forEach(a => {
    const k = 'lib:' + a.id, col = a.color || (a.floor && a.floor.color) || '#9a8a74';
    if (a.fmt === 'glb') { if (a.kind === 'animal' || a.kind === 'person') ANIMALS[k] = { ar: a.name, color: col, lib: a.id, model: 1 }; else PROPS[k] = { ar: a.name, color: col, lib: a.id, model: 1 }; return; }
    if (a.kind === 'set') { ENVS[k] = { ar: a.name, light: a.light || 'day', r: a.r || 14, lib: a.id }; ENV_SW[k] = `linear-gradient(${a.sky || '#c9dced'} 40%, ${col} 40%)`; }
    else if (a.kind === 'animal') ANIMALS[k] = { ar: a.name, color: col, lib: a.id };
    else if (a.kind === 'person') CAST[k] = Object.assign({ ar: a.name, age: 'adult', h: 172, build: 1, skin: '#c99a74', hair: 'short', hairC: '#2b1d14', top: '#ece5d6', bot: '#44502f', btype: 'pants', sleeves: 0, acc: {} }, a.person || {}, { ar: a.name });
    else PROPS[k] = { ar: a.name, color: col, lib: a.id };
  });
}
/* ---------- building from shapes ---------- */
const TXC = {};
function libTex(p) {
  const c = p.color || '#999', rx = p.repeat ? +p.repeat[0] || 1 : 1, ry = p.repeat ? +p.repeat[1] || 1 : 1, key = [p.tex, c, rx, ry, p.seed || 0].join('|');
  return TXC[key] || (TXC[key] = libTex0(p, c, rx, ry));
}
function libTex0(p, c, rx, ry) {
  switch (p.tex) {
    case 'books': return TX.books(rx, ry, p.seed);
    case 'wood': return TX.wood(rx, ry); case 'tile': return TX.tile(rx, ry); case 'carpet': return TX.carpet(); case 'stone': return TX.stone(rx, ry);
    case 'cobble': return TX.cobble(rx, ry); case 'terra': return TX.terra(rx, ry); case 'lino': return TX.lino(rx, ry);
    case 'plaster': case 'noise': default: return TX.noise(c, [shade(c, .86), shade(c, 1.1)], p.tex === 'plaster' ? .22 : .32, rx, ry);
  }
}
function libMat(p) {
  const o = { roughness: p.rough != null ? p.rough : .85, metalness: p.metal || 0 };
  if (p.double) o.side = THREE.DoubleSide; if (p.opacity != null && p.opacity < 1) { o.transparent = true; o.opacity = p.opacity; }
  if (p.glow) { o.emissive = new THREE.Color(p.glowColor || p.color || '#ffd9a0'); o.emissiveIntensity = p.glow; }
  if (p.tex) { if (p.tint) o.color = new THREE.Color(p.tint); return tmat(libTex(p), o); }
  return p.glow || o.transparent ? new THREE.MeshStandardMaterial(Object.assign({ color: p.color || '#999' }, o)) : mat(p.color || '#999', o);
}
function libGeo(p) {
  const s = p.size || [1, 1, 1], n = v => +v || 0;
  switch (p.shape) {
    case 'box': return new THREE.BoxGeometry(n(s[0]) || 1, n(s[1]) || 1, n(s[2]) || 1);
    case 'cyl': case 'cylinder': return new THREE.CylinderGeometry(p.r != null ? p.r : .5, p.r2 != null ? p.r2 : (p.r != null ? p.r : .5), p.h || 1, p.seg || 24);
    case 'sphere': return new THREE.SphereGeometry(p.r || .5, p.seg || 24, Math.max(8, (p.seg || 24) * .66 | 0));
    case 'cone': return new THREE.ConeGeometry(p.r || .5, p.h || 1, p.seg || 24);
    case 'plane': return new THREE.PlaneGeometry(n(s[0]) || 1, n(s[1]) || 1);
    case 'circle': return new THREE.CircleGeometry(p.r || .5, p.seg || 32);
    case 'torus': return new THREE.TorusGeometry(p.r || .5, p.tube || .08, 12, p.seg || 32, (p.arc || 360) * D2R);
    case 'capsule': return capGeo(p.r || .2, p.r2 != null ? p.r2 : p.r || .2, p.h || 1, p.seg || 16);
    case 'lathe': return new THREE.LatheGeometry((p.profile || [[.5, 0], [.5, 1]]).map(([r, y]) => new THREE.Vector2(Math.max(1e-4, +r), +y)), p.seg || 28);
    case 'ext': case 'extrude': { const sh = new THREE.Shape(); (p.points || [[0, 0], [1, 0], [0, 1]]).forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); return new THREE.ExtrudeGeometry(sh, { depth: p.depth || .1, bevelEnabled: false }); }
    case 'arch': { const g = archMesh(p.w || 1, p.h || 2, p.color || '#6e4a31').geometry; return g; }
    default: return new THREE.BoxGeometry(.4, .4, .4);
  }
}
function libParts(parts, g, lamps, cuts) {
  (parts || []).forEach(p => {
    if (!p) return;
    if (p.repeatAt) { (p.repeatAt || []).forEach(at2 => libParts([Object.assign({}, p, { repeatAt: null, at: at2 })], g, lamps, cuts)); return; }
    if (p.light) { const at2 = p.at || [0, 2, 0], L = new THREE.PointLight(p.color || '#ffd59a', 0, p.dist || 8, 2); L.position.set(+at2[0] || 0, +at2[1] || 0, +at2[2] || 0); g.add(L); if (lamps) lamps.push({ light: L, mats: [] }); return; }
    const m = new THREE.Mesh(libGeo(p), libMat(p)), at2 = p.at || [0, 0, 0], r = p.rot || [0, 0, 0], sc = p.scale;
    m.position.set(+at2[0] || 0, +at2[1] || 0, +at2[2] || 0); m.rotation.set((+r[0] || 0) * D2R, (+r[1] || 0) * D2R, (+r[2] || 0) * D2R);
    if (sc) Array.isArray(sc) ? m.scale.set(+sc[0] || 1, +sc[1] || 1, +sc[2] || 1) : m.scale.setScalar(+sc || 1);
    m.castShadow = p.shadow !== false; m.receiveShadow = true; g.add(m);
    if (cuts && (p.roof || p.plan === false)) { m.userData.roofY = p.roof ? (+at2[1] || 0) - .05 : null; cuts.push(m); }
    else if (cuts && p.wall !== false) { const s = p.size || [], sx = +s[0] || 0, sy = +s[1] || 0, sz = +s[2] || 0, thin = Math.min(sx, sz), long = Math.max(sx, sz);
      if (p.wall === true || p.wall === 'x' || p.wall === 'z' || (p.shape === 'box' && sy >= 1.8 && thin <= .6 && long >= 1.5)) {
        const ry = (+r[1] || 0) * D2R, ax = p.wall === 'x' ? 1 : p.wall === 'z' ? 0 : sx <= sz ? 1 : 0, az = 1 - ax; let nx = ax * Math.cos(ry) + az * Math.sin(ry), nz = -ax * Math.sin(ry) + az * Math.cos(ry);
        const cx = m.position.x, cz = m.position.z; if (Math.hypot(cx, cz) > .3) { if (nx * -cx + nz * -cz < 0) { nx = -nx; nz = -nz; } m.userData.cut = { x: cx, z: cz, nx, nz }; cuts.push(m); } } }
  });
  return g;
}
function libPropGroup(type, lamps) {
  const a = LIB.items[type.slice(4)], g = G();
  if (!a) { g.add(bx(.5, .5, .5, '#888', 0, .25, 0)); return g; }
  return libParts(a.parts, g, lamps);
}
function libSet(key, lamps) {
  const a = LIB.items[key.slice(4)], g = G(), info = { fog: null, ground: '#777' };
  if (!a) { g.add(plane(300, 300, mat('#8d8a86'), 0, 0, 0, -Math.PI / 2, 0)); return { g, info }; }
  const f = a.floor || {}, fs = f.size || [60, 60];
  g.add(plane(fs[0], fs[1], f.tex ? tmat(libTex(Object.assign({ repeat: [fs[0] / 2, fs[1] / 2] }, f))) : mat(f.color || '#8d8a86', { roughness: .9 }), 0, 0, 0, -Math.PI / 2, 0));
  if (f.outer !== false) g.add(plane(400, 400, mat(f.outerColor || shade(f.color || '#8d8a86', .9)), 0, -.02, 0, -Math.PI / 2, 0));
  const cuts = []; libParts(a.parts, g, lamps, cuts); CUTS = cuts;
  if (a.fog) info.fog = a.fog; return { g, info };
}
/* walls between the camera and the set are lifted out, like the wild walls of a studio set; they still cast shadows */
let CUTS = []; const GHOST = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
function cutWalls(cam) {
  if (!CUTS.length) return; const ortho = !!(cam && cam.isOrthographicCamera), p = cam && !ortho ? cam.position : null;
  for (const m of CUTS) { const u = m.userData, c = u.cut, out = c ? p && (p.x - c.x) * c.nx + (p.z - c.z) * c.nz < -.05 : ortho || (u.roofY != null && p && p.y > u.roofY);
    if (out) { if (m.material !== GHOST) { m.userData.mat0 = m.material; m.material = GHOST; } } else if (m.userData.mat0) { m.material = m.userData.mat0; m.userData.mat0 = null; } }
}
/* ---------- 3D models (.glb) ---------- */
function libModel(id) {
  const M = LIB.models[id]; if (M) return M.ready ? M : null;
  const a = LIB.items[id]; if (!a || !a.data || !THREE.GLTFLoader) return null;
  LIB.models[id] = { ready: false };
  parseGlb(a.data).then(R => { LIB.models[id] = Object.assign({ ready: true }, R); Object.values(OBJ).forEach(o => { if (o.pending === id) o.hash = 'stale'; }); if (ST) { syncItems(); RT.dirty = true; } })
    .catch(e => { LIB.models[id] = { ready: false, err: true }; console.warn(e); toast('تعذّرت قراءة النموذج «' + a.name + '»'); });
  return null;
}
function parseGlb(buf) {
  return new Promise((res, rej) => new THREE.GLTFLoader().parse(buf.slice(0), '', gl => {
    const sc = gl.scene || gl.scenes[0]; sc.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(sc);
    res({ scene: sc, clips: gl.animations || [], h0: Math.max(.001, b.max.y - b.min.y), ground: -b.min.y, cx: (b.min.x + b.max.x) / 2, cz: (b.min.z + b.max.z) / 2, w0: b.max.x - b.min.x, d0: b.max.z - b.min.z });
  }, rej));
}
function buildModel(s) {
  const id = s.type.slice(4), a = LIB.items[id], M = libModel(id), root = G();
  if (!M) { const box = new THREE.Mesh(new THREE.BoxGeometry(.5, 1, .5), new THREE.MeshStandardMaterial({ color: '#f2a23a', wireframe: true })); box.position.y = .5; root.add(box); return { root, kind: s.kind, pending: id }; }
  const inst = THREE.SkeletonUtils ? THREE.SkeletonUtils.clone(M.scene) : M.scene.clone(true), k = (a.h || M.h0) / M.h0;
  const wrap = G(); wrap.rotation.y = (a.ry || 0) * D2R; wrap.add(inst); inst.scale.setScalar(k); inst.position.set(-M.cx * k, M.ground * k, -M.cz * k);
  inst.traverse(o => { o.userData.shared = 1; if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.frustumCulled = !o.isSkinnedMesh; } });
  root.add(wrap);
  const o = { root, kind: s.kind, model: true, clips: M.clips, sc: 1, h: a.h || M.h0 };
  if (M.clips.length) { o.mixer = new THREE.AnimationMixer(inst); o.acts = {}; M.clips.forEach(c => o.acts[c.name] = o.mixer.clipAction(c)); }
  return o;
}
function poseModel(o, st, t) {
  if (!o.mixer || !o.clips.length) return;
  const mv = st.gA > .05, pick = re => o.clips.find(c => re.test(c.name));
  const clip = (mv ? (st.run ? pick(/run|gallop|sprint/i) : null) || pick(/walk|move|trot/i) || pick(/run/i) : pick(/idle|stand|breath|rest/i)) || o.clips[0];
  if (o.cur !== clip) { o.mixer.stopAllAction(); o.cur = clip; o.act = o.acts[clip.name]; o.act.play(); }
  const d = clip.duration || 1, tt = mv ? (st.gait || 0) / Math.max(.3, (o.h || 1.7) * (st.run ? 1.3 : .8)) * d : t; o.act.time = ((tt % d) + d) % d; o.mixer.update(0);
}
/* ---------- importing files into the library ---------- */
function libPick() { const f = $('#libIn'); f.value = ''; f.click(); }
function onLibFile(e) {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  if (f.size > 40e6) return toast('الملف أكبر من 40 ميغابايت');
  const rd = new FileReader();
  rd.onload = () => { const buf = rd.result, head = new Uint8Array(buf, 0, 4); if (String.fromCharCode(...head) === 'glTF') glbDialog(buf, f.name); else { try { libFromText(new TextDecoder().decode(buf), f.name); } catch (err) { toast('هذا الملف ليس ملف عناصر ولا نموذجًا ثلاثي الأبعاد'); } } };
  rd.readAsArrayBuffer(f);
}
function libFromText(txt, fname) {
  const J = JSON.parse(String(txt).replace(/^﻿/, '').trim());
  if (J && J.kadr === 'asset') return libInstall(J.assets || [J], true);
  if (window.importText) importText(txt, fname);
}
async function libInstall(list, announce) {
  let n = 0; const names = [];
  for (const a0 of list || []) {
    if (!a0 || typeof a0 !== 'object') continue;
    const a = Object.assign({}, a0); a.id = libId(a.id || a.name); a.fmt = a.fmt || (a.glb ? 'glb' : 'kadr'); a.kind = ['set', 'prop', 'animal', 'person'].includes(a.kind) ? a.kind : 'prop';
    if (a.fmt === 'glb') { const b64 = a.glb || a.data; if (typeof b64 !== 'string') continue; a.data = b64ToBuf(b64); delete a.glb; }
    a.name = String(a.name || a.id); a.added = Date.now(); await libPut(a); n++; names.push(a.name);
  }
  if (announce) { if (n) { ITEMCAT = 'mine'; if (ST) { refreshWorld(); renderPanel(); } openModal('أُضيف إلى مكتبتك', `<p>${n} ${n === 1 ? 'عنصر' : 'عناصر'}: ${names.map(esc).join('، ')}</p><p class="note">الديكورات تظهر في «المشهد» ضمن الأماكن، والعناصر والحيوانات في «العناصر» ← «مكتبتي».</p>`); } else toast('لم أجد عناصر في الملف'); }
  return n;
}
function b64ToBuf(b64) { const s = atob(b64.replace(/^data:[^,]*,/, '')), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
function bufToB64(buf) { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); }
let GLBNEW = null;
async function glbDialog(buf, fname) {
  let R; try { R = await parseGlb(buf); } catch (e) { toast('تعذّرت قراءة النموذج'); return; }
  const base = String(fname || 'نموذج').replace(/\.[^.]+$/, ''), h0 = R.h0, sane = h0 > .15 && h0 < 6;
  GLBNEW = { buf, name: base, kind: 'prop', h: +(sane ? h0 : 1).toFixed(2), ry: 0, clips: R.clips.map(c => c.name) };
  renderGlbDialog();
}
function renderGlbDialog() {
  const G2 = GLBNEW; if (!G2) return;
  openModal('نموذج ثلاثي الأبعاد جديد', `<label class="pname"><span>الاسم</span><input type="text" id="glbName" value="${esc(G2.name)}" maxlength="60"></label>
  <div class="row"><span>نوعه</span><div class="chips">${[['prop', 'شيء أو ديكور'], ['animal', 'حيوان'], ['person', 'شخص']].map(([k, t]) => chip(t, G2.kind === k, `data-lib="kind" data-v="${k}"`)).join('')}</div></div>
  <label class="pname"><span>الارتفاع بالمتر</span><input type="number" id="glbH" min=".05" max="50" step=".05" value="${G2.h}"></label>
  <div class="row"><span>اتجاه الوجه</span><div class="chips">${[0, 90, 180, -90].map(v => chip(v + '°', G2.ry === v, `data-lib="ry" data-v="${v}"`)).join('')}</div></div>
  <p class="note">${G2.clips.length ? `فيه حركات: <bdi dir="ltr">${esc(G2.clips.slice(0, 6).join(', '))}</bdi>. كادر يستعمل «walk» عند المشي و«run» عند الركض و«idle» عند الوقوف.` : 'لا يحتوي على حركات: سيتحرك في المشهد دون تحريك أطرافه.'}</p>
  <div class="btns" style="margin-top:12px"><button class="btn pri" data-lib="save">أضف إلى مكتبتي</button></div>`);
}
async function onLibClick(e) {
  const b = e.target.closest('[data-lib]'); if (!b) return;
  const A = b.dataset.lib, v = b.dataset.v;
  if (A === 'pick') return libPick();
  if (A === 'del') { if (b.dataset.ok) { await libDel(v); toast('حُذف من مكتبتك'); renderPanel(); } else { b.dataset.ok = 1; b.textContent = 'تأكيد'; b.classList.add('danger'); } return; }
  if (!GLBNEW) return;
  const nm = $('#glbName'), hh = $('#glbH'); if (nm) GLBNEW.name = nm.value.trim() || GLBNEW.name; if (hh) GLBNEW.h = clamp(+hh.value || 1, .05, 50);
  if (A === 'kind') { GLBNEW.kind = v; if (v === 'person' && (GLBNEW.h < 1.2 || GLBNEW.h > 2.2)) GLBNEW.h = 1.75; renderGlbDialog(); }
  else if (A === 'ry') { GLBNEW.ry = +v; renderGlbDialog(); }
  else if (A === 'save') { const a = { id: libId(GLBNEW.name) + '-' + Date.now().toString(36).slice(-4), name: GLBNEW.name, kind: GLBNEW.kind, fmt: 'glb', h: GLBNEW.h, ry: GLBNEW.ry, data: GLBNEW.buf, added: Date.now() }; GLBNEW = null; await libPut(a); closeModal(); ITEMCAT = 'mine'; switchTab('items'); toast(`«${a.name}» في مكتبتك: اضغط عليه لإضافته إلى المشهد`); }
}
function libGallery() {
  const all = Object.values(LIB.items).filter(a => a.kind !== 'set').sort((x, y) => (y.added || 0) - (x.added || 0)), sets = Object.values(LIB.items).filter(a => a.kind === 'set');
  const kindAr = { prop: 'شيء', animal: 'حيوان', person: 'شخص' };
  return `<p class="note">استورد ديكورًا أو عنصرًا أو حيوانًا من ملف كادر (أصنعه لك من وصف)، أو نموذجًا ثلاثي الأبعاد بصيغة <bdi dir="ltr">.glb</bdi> من مواقع النماذج المجانية.</p>
  <div class="btns"><button class="btn pri" data-lib="pick">${IC.file} استيراد ملف</button></div>
  ${all.length ? `<div class="grid3" style="margin-top:10px">${all.map(a => `<div class="libtile"><button class="tile" data-act="add" data-v="lib:${a.id}"><span class="sw" style="background:${a.fmt === 'glb' ? 'linear-gradient(135deg,#f2a23a,#7a3b2a)' : a.color || '#9a8a74'}"></span><span>${esc(a.name)}</span><small>${a.fmt === 'glb' ? '3D · ' : ''}${kindAr[a.kind] || ''}</small></button><button class="mini" data-lib="del" data-v="${a.id}" aria-label="حذف ${esc(a.name)} من المكتبة">${IC.trash}</button></div>`).join('')}</div>` : '<p class="note" style="margin-top:10px">مكتبتك فارغة بعد.</p>'}
  ${sets.length ? `<p class="note" style="margin-top:10px">ديكورات في مكتبتك: ${sets.map(a => esc(a.name)).join('، ')}. تجدها في «المشهد» ضمن الأماكن.</p>` : ''}`;
}
/* assets used by a project, to carry them inside its file */
function libUsed(P) {
  const ids = new Set(); (P.scenes || []).forEach(S => { if (isLib(S.env)) ids.add(S.env.slice(4)); (S.items || []).forEach(s => { if (isLib(s.type)) ids.add(s.type.slice(4)); }); });
  return [...ids].map(id => LIB.items[id]).filter(Boolean).map(a => { const c = Object.assign({}, a); if (a.fmt === 'glb') { c.glb = bufToB64(a.data); delete c.data; } return c; });
}
function bindLib() {
  $('#libIn').addEventListener('change', onLibFile);
  document.addEventListener('click', e => { if (e.target.closest('[data-lib]')) onLibClick(e); });
  libLoad();
}
