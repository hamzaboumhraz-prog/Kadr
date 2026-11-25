/* كادر — engine: state, evaluation over time, camera math, rendering, director controls, edit analysis */
let ST = null;
const RT = { t: 0, playing: false, loop: true, view: 'cam', src: 'edit', sel: null, selShot: null, pick: null, camPrevOn: false, camPrev: 0, dirty: true, quiz: null, flags: [], lastShot: -1, frameRect: { x: 0, y: 0, w: 1, h: 1 }, pipR: null, bdImg: null, R: null, pc: null };
let renderer, scene, shotCam, dirCam, tmpCam, envG = null, envKey = null, envInfo = null, hemi, sun, LAMPS = [], ringM, axisL, pathL, frus, mixCtx, monEl, bdMesh = null;
const OBJ = {}, GIZ = {}, HND = { rot: null, knobs: [] };
let pathAll = null, rainL = null;
const ORB = { tx: 0, ty: .9, tz: 0, r: 11, th: .75, ph: .5 }, ORS = Object.assign({}, ORB);
/* smooth director camera: ORB is where it is going, ORS is where it is drawn */
function orbStep(dt) {
  const k = 1 - Math.exp(-dt * 13); let moving = false;
  for (const key in ORB) { const d = ORB[key] - ORS[key]; if (Math.abs(d) > (key === 'r' ? ORS.r * 1e-4 : 1e-4)) { ORS[key] += d * k; moving = true; } else ORS[key] = ORB[key]; }
  if (moving && RT.view === 'dir') RT.dirty = true;
}
function orbSnap() { Object.assign(ORS, ORB); }
const _cr = new THREE.Vector3(), _cu = new THREE.Vector3();
function orbPan(dx, dy) { dirCam.updateMatrixWorld(); _cr.setFromMatrixColumn(dirCam.matrixWorld, 0); _cu.setFromMatrixColumn(dirCam.matrixWorld, 1); const k = ORB.r * .0017; ORB.tx -= (_cr.x * dx - _cu.x * dy) * k; ORB.ty = clamp(ORB.ty - (_cr.y * dx - _cu.y * dy) * k, -5, 60); ORB.tz -= (_cr.z * dx - _cu.z * dy) * k; RT.dirty = true; }
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t, smooth = t => t * t * (3 - 2 * t);
function lerpAng(a, b, t) { const d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * t; }
const ANG = {}; ANGLES.forEach(a => ANG[a.k] = a);
const SIZE_IDX = {}; SIZES.forEach((s, i) => SIZE_IDX[s.k] = i);
const SZ = {}; SIZES.forEach(s => SZ[s.k] = s);
const MV = {}; MOVES.forEach(m => MV[m.k] = m);

function itemById(id) { return ST.items.find(s => s.id === id); }
function camById(id) { return ST.cams.find(c => c.id === id); }
function aspV() { const a = ASPECTS.find(a => a.k === ST.aspect); return a ? a.v : 16 / 9; }
function totalDur() { return ST.shots.reduce((a, s) => a + s.dur, 0); }
function shotStarts() { const r = []; let a = 0; for (const s of ST.shots) { r.push(a); a += s.dur; } return r; }
function shotAt(t) { const n = ST.shots.length; if (!n) return null; let a = 0; for (let i = 0; i < n; i++) { const s = ST.shots[i]; if (t < a + s.dur || i === n - 1) return { i, s, start: a, p: clamp((t - a) / s.dur, 0, 1) }; a += s.dur; } return null; }
function actEnd() { let m = 0; ST.items.forEach(s => (s.actions || []).forEach(a => m = Math.max(m, a.t + a.dur))); return m; }
function tlLen() { return Math.max(totalDur(), actEnd() + .5, 4); }

/* ---------- three setup ---------- */
function init3D() {
  monEl = document.getElementById('mon');
  const cv = document.getElementById('cv');
  renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.autoClear = false;
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  scene = new THREE.Scene();
  SKY = makeSky(); scene.add(SKY.mesh); scene.onBeforeRender = (r, sc, cam) => cutWalls(cam); pmrem = new THREE.PMREMGenerator(renderer); envScene = new THREE.Scene(); ENVSKY = makeSky(true); envScene.add(ENVSKY.mesh);
  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, .6); scene.add(hemi);
  sun = new THREE.DirectionalLight(0xffffff, .9); sun.castShadow = true;
  const ms = innerWidth < 700 ? 1024 : 2048; sun.shadow.mapSize.set(ms, ms);
  const c = sun.shadow.camera; c.left = -16; c.right = 16; c.top = 16; c.bottom = -16; c.near = .5; c.far = 90;
  sun.shadow.bias = -.0005; sun.shadow.normalBias = .045; scene.add(sun); scene.add(sun.target);
  shotCam = new THREE.PerspectiveCamera(40, 16 / 9, .02, 600);
  tmpCam = new THREE.PerspectiveCamera(40, 16 / 9, .02, 600);
  dirCam = new THREE.PerspectiveCamera(42, 1.6, .05, 900); dirCam.layers.enable(1);
  ringM = new THREE.Mesh(new THREE.RingGeometry(.42, .5, 40), new THREE.MeshBasicMaterial({ color: '#f2a23a', side: THREE.DoubleSide, depthTest: false, transparent: true }));
  ringM.rotation.x = -Math.PI / 2; ringM.layers.set(1); ringM.renderOrder = 5; scene.add(ringM);
  axisL = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(0, 0, 0), V3(1, 0, 0)]), new THREE.LineDashedMaterial({ color: '#ff6a5f', dashSize: .3, gapSize: .18 }));
  axisL.layers.set(1); axisL.frustumCulled = false; scene.add(axisL);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(60 * 3), 3));
  pathL = new THREE.LineSegments(pg, new THREE.LineBasicMaterial({ color: '#79c4e6' })); pathL.layers.set(1); pathL.frustumCulled = false; scene.add(pathL);
  frus = frustumLines('#f2a23a'); scene.add(frus);
  const pa = new THREE.BufferGeometry(); pa.setAttribute('position', new THREE.BufferAttribute(new Float32Array(240 * 3), 3));
  pathAll = new THREE.LineSegments(pa, new THREE.LineBasicMaterial({ color: '#79c4e6', transparent: true, opacity: .35 })); pathAll.layers.set(1); pathAll.frustumCulled = false; scene.add(pathAll);
  pathL.material = new THREE.LineBasicMaterial({ color: '#79c4e6', depthTest: false, transparent: true }); pathL.renderOrder = 11;
  HND.rot = makeRotHandle(); scene.add(HND.rot);
  mixCtx = document.getElementById('mix').getContext('2d');
  new ResizeObserver(onResize).observe(monEl);
  onResize();
  initPointer(); if (window.initPlan) initPlan();
}
/* ---------- sky dome and image-based light ---------- */
let SKY = null, ENVSKY = null, pmrem = null, envScene = null, envRT = null, iblKey = '', envT = 0;
function makeSky(forEnv) {
  const u = { top: { value: new THREE.Color() }, hz: { value: new THREE.Color() }, gnd: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunC: { value: new THREE.Color() }, sunK: { value: 1 } };
  const m = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false, depthTest: !forEnv, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 hz; uniform vec3 gnd; uniform vec3 sunDir; uniform vec3 sunC; uniform float sunK; varying vec3 vD;
      void main(){ vec3 d = normalize(vD); float y = d.y;
        vec3 c = y > 0.0 ? mix(hz, top, pow(smoothstep(0.0, 0.62, y), 0.75)) : mix(hz, gnd, smoothstep(0.0, 0.1, -y));
        float s = max(dot(d, normalize(sunDir)), 0.0); c += sunC * (pow(s, 900.0) * 9.0 + pow(s, 14.0) * 0.22) * sunK;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(forEnv ? 50 : 420, 32, 16), m); mesh.frustumCulled = false; mesh.renderOrder = -10;
  if (!forEnv) mesh.onBeforeRender = (r, sc, cam) => { mesh.position.setFromMatrixPosition(cam.matrixWorld); mesh.updateMatrixWorld(); };
  return { mesh, u };
}
const INDOOR = { room: 1, house: 1, classroom: 1, studio: 1 };
function setEnvK(k) { scene.traverse(o => { const m = o.material; if (!m) return; (Array.isArray(m) ? m : [m]).forEach(x => { if (x.isMeshStandardMaterial && x.envMapIntensity !== k) x.envMapIntensity = k; }); }); RT.envK = k; }
function rebuildEnv() {
  if (RT.exporting) { RT.envPending = true; return; }
  envT = 0; const old = envRT; envRT = pmrem.fromScene(envScene, 0, .1, 100); scene.environment = envRT.texture; if (old) old.dispose(); RT.dirty = true;
}
function lerpTod(h) {
  const K = TOD; if (h <= K[0].h) return K[0]; if (h >= K[K.length - 1].h) return K[K.length - 1];
  let i = 0; while (K[i + 1].h < h) i++; const a = K[i], b = K[i + 1], t = (h - a.h) / (b.h - a.h), o = { h };
  ['sky', 'hz', 'hs', 'hg', 'sc'].forEach(k => o[k] = new THREE.Color(a[k]).lerp(new THREE.Color(b[k]), t));
  ['hi', 'si', 'el', 'lamp'].forEach(k => o[k] = lerp(a[k], b[k], t)); return o;
}
/* effective lighting of the current scene: preset + time of day + manual overrides */
function lightOf(S) {
  S = S || ST; const P = LIGHTS[S.light] || LIGHTS.day, o = S.lt || {};
  let L;
  if (o.tod != null) { const k = lerpTod(o.tod); L = Object.assign({}, k, { az: 60 - (o.tod - 12) * 12 }); if (S.light === 'warm') L.lamp = Math.max(L.lamp, .9); }
  else { const sp = P.sp; L = Object.assign({}, P, { az: Math.atan2(sp[0], sp[2]) / D2R, el: Math.atan2(sp[1], Math.hypot(sp[0], sp[2])) / D2R }); ['sky', 'hz', 'hs', 'hg', 'sc'].forEach(k => L[k] = new THREE.Color(P[k])); }
  if (o.az != null) L.az = o.az;
  L.si *= o.si != null ? o.si : 1; L.hi *= o.amb != null ? o.amb : 1; L.exp = o.exp || 1; L.tod = o.tod != null ? o.tod : P.tod;
  return L;
}
function onResize() {
  const W = monEl.clientWidth, H = monEl.clientHeight; if (!W || !H) return;
  renderer.setSize(W, H, false);
  const mx = document.getElementById('mix'), pr = renderer.getPixelRatio(); mx.width = W * pr; mx.height = H * pr;
  RT.dirty = true; if (window.onMonResize) onMonResize();
}

/* ---------- environment & lighting ---------- */
function disposeObj(r) {
  const keep = new Set(MC.values());
  r.traverse(m => {
    if (m.userData && m.userData.shared) return;
    if (m.geometry) m.geometry.dispose(); if (m.userData && m.userData.rt) m.userData.rt.dispose();
    (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => { if (!x) return; if (x.map) x.map.dispose(); if (!keep.has(x)) x.dispose(); });
  });
}
function syncEnv() {
  if (envKey === ST.env && envG) return;
  if (envG) { scene.remove(envG); disposeObj(envG); }
  LAMPS = []; const e = buildEnv(ST.env, LAMPS); envG = e.g; envInfo = e.info; scene.add(envG); envKey = ST.env;
  applyLight(); RT.dirty = true;
}
function applyLight() {
  const L = lightOf(), wx = ST.weather || 'clear', inside = !!INDOOR[ST.env] || !!(isLib(ST.env) && LIB.items[ST.env.slice(4)] && LIB.items[ST.env.slice(4)].indoor);
  const top = L.sky.clone(), hz = L.hz.clone(), sunC = L.sc.clone();
  let si = L.si, hi = L.hi;
  if (wx === 'fog') { const f = new THREE.Color('#c9c9c4'); top.lerp(f, .75); hz.lerp(f, .85); hi *= .95; si *= .5; }
  if (wx === 'rain') { const f = new THREE.Color('#7f8a94'); top.lerp(f, .7); hz.lerp(f, .75); hi *= .85; si *= .35; }
  hemi.color.copy(L.hs); hemi.groundColor.copy(L.hg); hemi.intensity = hi * .72;
  const el = Math.max(L.el, 4) * D2R, az = L.az * D2R, R = 28;
  const ctr = actionCenter(), span = ctr.r;
  sun.color.copy(sunC); sun.intensity = si * (L.el < 0 ? .35 : 1);
  sun.position.set(ctr.x + Math.sin(az) * Math.cos(el) * R, Math.sin(el) * R, ctr.z + Math.cos(az) * Math.cos(el) * R); sun.target.position.set(ctr.x, 0, ctr.z); sun.target.updateMatrixWorld();
  const c = sun.shadow.camera; c.left = -span; c.right = span; c.top = span; c.bottom = -span; c.far = 80; c.updateProjectionMatrix();
  renderer.toneMappingExposure = L.exp;
  const sd = new THREE.Vector3(Math.sin(az) * Math.cos(L.el * D2R), Math.sin(L.el * D2R), Math.cos(az) * Math.cos(L.el * D2R));
  const gnd = L.hg.clone().multiplyScalar(.6);
  [SKY, ENVSKY].forEach((K, i) => { K.u.top.value.copy(top); K.u.hz.value.copy(hz); K.u.gnd.value.copy(i ? L.hg : gnd); K.u.sunDir.value.copy(sd); K.u.sunC.value.copy(sunC); K.u.sunK.value = (L.el < -1 ? 0 : 1) * (wx === 'clear' ? 1 : .25) * (i ? 3 : 1); });
  scene.background = null;
  scene.fog = wx === 'fog' ? new THREE.Fog(hz, 2.5, 30) : wx === 'rain' ? new THREE.Fog(hz, 10, 70) : envInfo && envInfo.fog ? new THREE.Fog(hz, envInfo.fog[0], envInfo.fog[1]) : null;
  ensureRain(wx === 'rain');
  const ek = [top.getHex(), hz.getHex(), sunC.getHex(), Math.round(L.az), Math.round(L.el), wx].join('|');
  if (ek !== iblKey) { iblKey = ek; clearTimeout(envT); if (envRT) envT = setTimeout(rebuildEnv, 90); else rebuildEnv(); }
  setEnvK(inside ? .32 : .55);
  const all = LAMPS.slice(); Object.values(OBJ).forEach(o => (o.lamps || []).forEach(l => all.push(l)));
  const cap = innerWidth < 700 ? 3 : 5, wp = new THREE.Vector3();
  if (envG) envG.updateMatrixWorld(true); Object.values(OBJ).forEach(o => o.root.updateMatrixWorld(true));
  all.forEach(l => { l.light.getWorldPosition(wp); l.d = (wp.x - ctr.x) ** 2 + (wp.z - ctr.z) ** 2; }); all.sort((a, b) => a.d - b.d);
  all.forEach((l, i) => { l.light.visible = L.lamp > 0 && i < cap; l.light.intensity = L.lamp; l.mats.forEach(m => m.emissiveIntensity = L.lamp > 0 ? Math.min(1.2, .35 + L.lamp * .5) : 0); });
  RT.dirty = true;
}
function actionCenter() {
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, n = 0;
  const add = (x, z) => { if (!isFinite(x) || !isFinite(z)) return; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); n++; };
  ST.items.forEach(s => { add(s.x, s.z); (s.actions || []).forEach(a => { if (a.tx != null) add(a.tx, a.tz); }); });
  if (!n) return { x: 0, z: 0, r: 14 };
  return { x: (x0 + x1) / 2, z: (z0 + z1) / 2, r: clamp(Math.max(x1 - x0, z1 - z0) / 2 + 7, 9, 34) };
}

/* ---------- items ---------- */
function itemHash(s) { const o = Object.assign({}, s); ['x', 'z', 'rot', 'actions', 'name', 'pose', 'id', 'power', 'lc', 'angle', 'tilt', 'aim'].forEach(k => delete o[k]); return JSON.stringify(o); }
/* fades to and from black are painted only over the shot, never over the director's view */
let FADE = null;
function fadeQuad(a) {
  if (!(a > .002)) return;
  if (!FADE) { const m = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }); FADE = { cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), sc: new THREE.Scene(), m }; FADE.sc.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m)); }
  FADE.m.opacity = Math.min(1, a); const ac = renderer.autoClear; renderer.autoClear = false; renderer.render(FADE.sc, FADE.cam); renderer.autoClear = ac;
}
function buildItem(s) {
  let o;
  if (s.kind === 'human') o = makeHuman(s);
  else if (isLib(s.type) && LIB.items[s.type.slice(4)] && LIB.items[s.type.slice(4)].fmt === 'glb') o = buildModel(s);
  else if (s.kind === 'animal') { const la = isLib(s.type) && LIB.items[s.type.slice(4)]; o = la ? makeAnimal(s.type, s.color, Object.assign({ base: 'dog' }, la.animal || {})) : makeAnimal(s.type, s.color); }
  else { const lamps = []; const inner = makeProp(s.type, s.color, lamps); const root = G(); root.add(inner); o = { root, kind: 'prop', lamps, wheels: inner.userData.wheels || null, film: inner.userData.film || null }; }
  if (s.kind !== 'human') { const sc = s.scale || 1; o.root.scale.setScalar(sc); o.sc = sc; _box.setFromObject(o.root); o.lastR = Math.max(_box.max.x - _box.min.x, _box.max.z - _box.min.z) / 2; o.fp = { w: _box.max.x - _box.min.x, d: _box.max.z - _box.min.z }; }
  return o;
}
function syncItems() {
  const ids = new Set(ST.items.map(s => s.id));
  for (const id in OBJ) if (!ids.has(id)) { scene.remove(OBJ[id].root); disposeObj(OBJ[id].root); delete OBJ[id]; }
  let lampsChanged = false;
  for (const s of ST.items) {
    const h = itemHash(s); let o = OBJ[s.id];
    if (!o || o.hash !== h) {
      if (o) { scene.remove(o.root); disposeObj(o.root); }
      o = buildItem(s); o.hash = h; o.root.userData.itemId = s.id; scene.add(o.root); OBJ[s.id] = o;
      if (o.lamps && o.lamps.length) lampsChanged = true;
    }
  }
  if (lampsChanged) applyLight(); else setEnvK(RT.envK || .5);
  RT.gizmoTM = true; RT.dirty = true;
}
function blendPose(a, b, t) { for (const k in b) a[k] = lerp(a[k] || 0, b[k], t); }
const wrapA = a => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
function evalItem(s, t, shallow) {
  const st = { x: s.x, z: s.z, rot: (s.rot || 0) * D2R, pose: Object.assign({}, POSES[s.pose] || POSES.stand), gait: 0, gA: 0, run: 0, wave: 0, waveT: 0, hold: POSE_HOLD[s.pose] || null, moving: false, jumpY: 0, crouch: 0, talk: 0, laugh: 0, nod: 0, shakeH: 0, clap: 0, gest: 0, dance: 0, bend: 0, gazeX: 0, gazeY: 0, fx: 0, dress: 0, asit: s.pose === 'sit' ? 1 : 0, alie: s.pose === 'lie' ? 1 : 0 };
  const animal = s.kind === 'animal';
  const env = p => Math.max(0, Math.min(1, p * 6, (1 - p) * 6));
  const acts = (s.actions || []).slice().sort((a, b) => a.t - b.t);
  for (const a of acts) {
    if (t < a.t) break;
    const dur = Math.max(.05, a.dur || 1), el = t - a.t, p = clamp(el / dur, 0, 1), e = smooth(p);
    if (p < 1) st.moving = true;
    if (animal && (a.type === 'sit' || a.type === 'lie' || a.type === 'stand')) { st.asit = lerp(st.asit, a.type === 'sit' ? 1 : 0, e); st.alie = lerp(st.alie, a.type === 'lie' ? 1 : 0, e); continue; }
    switch (a.type) {
      case 'walk': case 'run': {
        const sx = st.x, sz = st.z, tx = a.tx == null ? sx : a.tx, tz = a.tz == null ? sz : a.tz, dx = tx - sx, dz = tz - sz, dist = Math.hypot(dx, dz);
        st.x = sx + dx * p; st.z = sz + dz * p;
        if (animal && p < 1) { st.asit *= 1 - clamp(el / .3, 0, 1); st.alie *= 1 - clamp(el / .3, 0, 1); }
        if (dist > .02 && !a.back) st.rot = lerpAng(st.rot, Math.atan2(dx, dz), clamp(el / .35, 0, 1));
        if (p < 1) { st.gait = dist * p; st.gA = clamp(Math.min(el, dur - el) * 3, 0, 1); st.run = a.type === 'run' ? 1 : 0; }
        break;
      }
      case 'turn': st.rot += (a.v == null ? 90 : a.v) * D2R * e; break;
      case 'look': st.pose.neckY = lerp(st.pose.neckY, (a.v == null ? 60 : a.v) * D2R, e); break;
      case 'watch': {
        const T = !shallow && a.to && itemById(a.to); if (!T || p >= 1) break;
        const ts = evalItem(T, t, true), k = smooth(clamp(Math.min(el, dur - el) / .35, 0, 1));
        let d = wrapA(Math.atan2(ts.x - st.x, ts.z - st.z) - st.rot); const lim = 1.25;
        if (Math.abs(d) > lim && !st.moving) { const extra = (Math.abs(d) - lim) * Math.sign(d); st.rot += extra * k; d -= extra; }
        if (Math.abs(d) > lim) d = Math.sign(d) * lim;
        st.pose.neckY = lerp(st.pose.neckY, d, k); st.gazeX = lerp(st.gazeX, clamp(-d * .6, -1, 1) * .4, k); break;
      }
      case 'dress': if (p < 1) { st.dress = env(p); st.dressP = p; st.fx = el; } break;
      case 'wave': if (p < 1) { st.wave = Math.pow(Math.sin(Math.PI * p), .3); st.waveT = el; } break;
      case 'jump': if (p < 1) { const q = clamp((p - .15) / .7, 0, 1); st.jumpY = Math.sin(Math.PI * q) * .45; st.crouch = Math.max(0, 1 - p / .15) * (p < .15 ? Math.sin(Math.PI * p / .15) : 0) + (p > .85 ? Math.sin(Math.PI * (p - .85) / .15) : 0); } break;
      case 'talk': if (p < 1) { st.talk = Math.max(st.talk, env(p)); st.fx = el; if (a.line) { st.line = a.line; st.lineP = el / Math.max(.1, dur - .15); } } break;
      case 'laugh': if (p < 1) { st.laugh = env(p); st.fx = el; } break;
      case 'nod': if (p < 1) { st.nod = env(p); st.fx = el; } break;
      case 'shake': if (p < 1) { st.shakeH = env(p); st.fx = el; } break;
      case 'clap': if (p < 1) { st.clap = env(p); st.fx = el; } break;
      case 'gesture': if (p < 1) { st.gest = env(p); st.talk = Math.max(st.talk, env(p)); st.fx = el; } break;
      case 'dance': if (p < 1) { st.dance = env(p); st.fx = el; } break;
      case 'bend': if (p < 1) st.bend = Math.sin(Math.PI * p); break;
      case 'eyes': { const v = a.v == null ? 1 : a.v, gx = Math.abs(v) === 1 ? v : 0, gy = v === 2 ? 1 : v === -2 ? -1 : 0, k = smooth(clamp(p * 3, 0, 1)); st.gazeX = lerp(st.gazeX, gx, k); st.gazeY = lerp(st.gazeY, gy, k); break; }
      default: {
        const pk = ACTS[a.type] && ACTS[a.type].pose;
        if (pk) { const ny = st.pose.neckY, bp = a.type === 'raise' ? smooth(clamp(p / .55, 0, 1)) : e; blendPose(st.pose, POSES[pk], bp); st.pose.neckY = ny; if (bp > .6) st.hold = POSE_HOLD[pk] || null; else if (bp > .4 && !POSE_HOLD[pk]) st.hold = null; }
      }
    }
  }
  return st;
}
function setPose(o, P) {
  const r = o.rig, U = r.P.uLeg;
  r.pelvis.position.set(0, r.hipH + P.hipY * U, P.hipZ * U);
  r.spine.rotation.set(P.spine, 0, 0);
  r.neck.rotation.set(P.neckX, P.neckY, 0);
  r.lSh.rotation.set(-P.lShX, 0, P.lShZ); r.rSh.rotation.set(-P.rShX, 0, -P.rShZ);
  r.lEl.rotation.set(-P.lEl, 0, 0); r.rEl.rotation.set(-P.rEl, 0, 0);
  r.lHip.rotation.set(-P.lHipX, 0, 0); r.rHip.rotation.set(-P.rHipX, 0, 0);
  r.lKnee.rotation.set(P.lKnee, 0, 0); r.rKnee.rotation.set(P.rKnee, 0, 0);
  r.body.rotation.x = -Math.PI / 2 * P.lie; r.body.position.y = P.lie * (.5 / o.sc + .14);
}
/* lip sync from the written line: open on vowels, closed on m/b/f, small on other consonants */
const VOW = new Set('اأإآوىيةaeiouyéèàâêôûو'.split('')), CLOSED = new Set('مبفپmbpfvw'.split(''));
function visemeOf(ch) { if (!ch || /[\s.,،؛;:!?؟…\-–—"«»()]/.test(ch)) return .05; if (CLOSED.has(ch.toLowerCase())) return 0; if (VOW.has(ch.toLowerCase())) return 1; if (/[\u064B-\u0652]/.test(ch)) return .7; return .42; }
function visemeOpen(line, p) {
  const c = [...line]; if (!c.length || p >= 1 || p < 0) return 0;
  const x = p * c.length, i = Math.floor(x), f = x - i, a = visemeOf(c[i]), b = visemeOf(c[i + 1]);
  return lerp(a, b, f * f * (3 - 2 * f)) * (.85 + .15 * Math.sin(x * 2.3));
}
function updSubs() {
  const el = document.getElementById('subs'); if (!el) return;
  const L = ST.ov.subs === 0 || RT.view === 'dir' && !RT.pipR ? [] : activeLines(RT.t), key = L.map(x => x.a.line).join('|');
  if (el.dataset.k !== key) { el.dataset.k = key; el.innerHTML = L.map(x => `<span dir="auto">${esc(x.a.line)}</span>`).join(''); }
  const f = RT.frameRect; el.style.left = (f.x + f.w * .07) + 'px'; el.style.width = (f.w * .86) + 'px'; el.style.bottom = (monEl.clientHeight - f.y - f.h + Math.max(f.h * .07, 50)) + 'px';
}
function activeLines(t) {
  const out = [];
  ST.items.forEach(s => (s.actions || []).forEach(a => { if (a.type === 'talk' && a.line && t >= a.t && t < a.t + a.dur + .25) out.push({ s, a }); }));
  return out;
}
function blinkAt(t, seed) { const per = 3.1 + (seed % 7) * .27, ph = ((t + seed * .37) % per + per) % per; return ph < .14 ? Math.sin(ph / .14 * Math.PI) : 0; }
function poseHuman(o, st, t) {
  const P = Object.assign({}, st.pose), r = o.rig, T = st.fx;
  if (st.bend > 0) blendPose(P, POSES.bend, st.bend);
  if (st.crouch > 0) { P.lKnee += .9 * st.crouch; P.rKnee += .9 * st.crouch; P.lHipX += .55 * st.crouch; P.rHipX += .55 * st.crouch; P.hipY -= .22 * st.crouch; P.spine += .25 * st.crouch; P.lShX -= .4 * st.crouch; P.rShX -= .4 * st.crouch; }
  if (st.jumpY > 0) { P.lShX += 1.6 * st.jumpY; P.rShX += 1.6 * st.jumpY; P.lKnee += .5 * st.jumpY; P.rKnee += .5 * st.jumpY; }
  if (st.gest > 0) { const g = st.gest; P.lShX = lerp(P.lShX, .55, g) + .22 * Math.sin(T * 4) * g; P.lEl = lerp(P.lEl, 1.35, g) + .3 * Math.sin(T * 5.2) * g; P.rShX = lerp(P.rShX, .65, g) + .22 * Math.sin(T * 4.6 + 1) * g; P.rEl = lerp(P.rEl, 1.45, g) + .3 * Math.sin(T * 5.7 + 1) * g; P.lShZ = lerp(P.lShZ, .3, g); P.rShZ = lerp(P.rShZ, .3, g); }
  if (st.talk > 0) { P.neckX += .035 * Math.sin(T * 3.7) * st.talk; P.neckY += .04 * Math.sin(T * 1.9) * st.talk; }
  if (st.nod > 0) P.neckX += .26 * Math.sin(T * 9) * st.nod;
  if (st.shakeH > 0) P.neckY += .38 * Math.sin(T * 10) * st.shakeH;
  if (st.laugh > 0) { const l = st.laugh; P.neckX -= .16 * l; P.spine += (.03 + .03 * Math.sin(T * 18)) * l; P.lShZ += .08 * Math.sin(T * 18) * l; P.rShZ += .08 * Math.sin(T * 18) * l; }
  if (st.clap > 0) { const c = st.clap, k = .5 + .5 * Math.sin(T * 14); P.lShX = lerp(P.lShX, 1.05, c); P.rShX = lerp(P.rShX, 1.05, c); P.lEl = lerp(P.lEl, .75, c); P.rEl = lerp(P.rEl, .75, c); P.lShZ = lerp(P.lShZ, -.32 + .34 * k, c); P.rShZ = lerp(P.rShZ, -.32 + .34 * k, c); }
  if (st.dance > 0) { const d = st.dance, b = .5 + .5 * Math.sin(T * 12); P.spine += .1 * Math.sin(T * 6) * d; P.lShZ = lerp(P.lShZ, 1.5 + .5 * Math.sin(T * 6), d); P.rShZ = lerp(P.rShZ, 1.5 + .5 * Math.sin(T * 6 + Math.PI), d); P.lEl = lerp(P.lEl, 1.1, d); P.rEl = lerp(P.rEl, 1.1, d); P.lKnee += .3 * b * d; P.rKnee += .3 * b * d; P.hipY -= .06 * b * d; P.neckX += .08 * Math.sin(T * 12) * d; }
  if (!st.moving) P.spine += .012 * Math.sin(t * 1.7 + o.seed);
  if (o.elder) { P.spine += .22 * (1 - P.lie); P.neckX -= .16; P.lKnee += .1; P.rKnee += .1; }
  if (st.gA > 0) {
    const stride = r.P.uLeg * (st.run ? 4.6 : 3.3), ph = st.gait / stride * TAU, A = st.gA * (st.run ? 1.45 : 1), s1 = Math.sin(ph);
    P.lHipX += .42 * A * s1; P.rHipX -= .42 * A * s1;
    P.lKnee += .6 * A * Math.max(0, Math.cos(ph)); P.rKnee += .6 * A * Math.max(0, -Math.cos(ph));
    if (!st.hold) { P.lShX -= .34 * A * s1; P.rShX += .34 * A * s1; }
    P.hipY -= .035 * A * Math.abs(s1);
    if (st.run) { P.spine += .2 * st.gA; P.lEl += 1.2 * st.gA; P.rEl += 1.2 * st.gA; }
  }
  if (st.wave > 0) { const w = st.wave; P.rShZ = lerp(P.rShZ, 2.6, w); P.rShX = lerp(P.rShX, .1, w); P.rEl = lerp(P.rEl, .45, w) + Math.sin(st.waveT * 11) * .45 * w; }
  if (st.dress > 0) { const d = st.dress, q = st.dressP || 0, a1 = Math.sin(Math.PI * clamp(q / .5, 0, 1)), a2 = Math.sin(Math.PI * clamp((q - .4) / .5, 0, 1));
    P.lShX = lerp(P.lShX, -.55, a1 * d); P.lShZ = lerp(P.lShZ, .55, a1 * d); P.lEl = lerp(P.lEl, .35, a1 * d);
    P.rShX = lerp(P.rShX, -.55, a2 * d); P.rShZ = lerp(P.rShZ, .55, a2 * d); P.rEl = lerp(P.rEl, .35, a2 * d);
    P.spine += .08 * Math.sin(st.fx * 5) * d; P.neckX += .12 * d; }
  setPose(o, P);
  o.hold.binoc.visible = st.hold === 'binoc'; o.hold.phone.visible = st.hold === 'phone'; if (o.hold.tphone) o.hold.tphone.visible = st.hold === 'tphone'; if (o.hold.book) o.hold.book.visible = st.hold === 'book';
  const lip = st.line ? visemeOpen(st.line, st.lineP) : st.talk * (.5 + .5 * Math.sin(st.fx * 15)) * (.55 + .45 * Math.sin(st.fx * 5.3 + 1));
  const bl = st.hold === 'binoc' ? 0 : blinkAt(t, o.seed), open = Math.max(st.line ? lip * st.talk : lip, st.laugh * (.65 + .2 * Math.sin(st.fx * 18)), st.hold === null && P.lShX > 2 ? .5 : 0, st.dance * .35);
  r.eyes.forEach(e => { e.g.scale.y = 1 - .92 * bl; e.p.position.x = st.gazeX * r.r * .055; e.p.position.y = st.gazeY * r.r * .05; });
  r.mouth.scale.y = .2 + open * .85; r.mouth.scale.x = 1.25 + st.laugh * .25; if (r.lipLo) r.lipLo.position.y = r.r * (.55 - open * .1);
  const browUp = (P.lShX > 2 ? .07 : 0) + st.laugh * .03; r.brows.forEach(b => { b.position.y = r.r * 1.33 + browUp * r.r; });
}
function poseAnimal(o, st, t) {
  const r = o.rig, A = st.gA * (st.run ? 1.4 : 1), ph = st.gait / Math.max(.12, r.A.leg * 2.2) * TAU, lie = st.alie || 0, sit = st.asit || 0, four = r.legs.length === 4;
  r.legs.forEach((l, i) => { const off = (i === 0 || i === 3) ? 0 : Math.PI, front = i < 2; l.rotation.x = Math.sin(ph + off) * .55 * A + (st.jumpY > 0 ? (front ? -.6 : .6) * Math.min(1, st.jumpY * 3) : 0) + (four ? (front ? -1.45 : 1.45) * lie + (front ? .5 : -.95) * sit : 0); });
  o.root.rotation.order = 'YXZ'; o.root.rotation.x = four ? -.5 * sit : 0; o.root.position.y += -(r.A.leg || .1) * (.82 * lie + .3 * sit);
  if (r.neck && r.A.nx != null) { r.neck.rotation.order = 'YXZ'; r.neck.rotation.x = r.A.nx + .55 * lie + .3 * sit; }
  if (o.type === 'bird') r.body.position.y = .17 + Math.abs(Math.sin(ph)) * .05 * A;
  if (r.tail) r.tail.rotation.z = Math.sin(t * (st.gA > 0 ? 14 : 4)) * (o.type === 'horse' ? .15 : .35);
  r.neck.rotation.y = st.pose.neckY;
}
function applyItem(o, s, t) {
  const st = evalItem(s, t);
  o.root.position.set(st.x, st.jumpY * (o.kind === 'human' ? o.sc * 1.75 / 1.72 : o.kind === 'animal' ? .7 : 1), st.z); o.root.rotation.set(0, st.rot, 0);
  if (o.model) poseModel(o, st, t);
  else if (o.kind === 'human') poseHuman(o, st, t);
  else if (o.kind === 'animal') poseAnimal(o, st, t);
  else if (o.wheels) o.wheels.forEach(w => w.rotation.x = st.gait / .34);
  if (o.film) poseFilm(o, s, t);
  o.st = st; return st;
}
/* film lights: power, colour, beam, tilt, and optional aim at a person */
function poseFilm(o, s, t) {
  const F = o.film, L = F.light, pw = s.power == null ? 1 : s.power;
  L.color.set(s.lc || '#fff1dc'); F.em.color.set(s.lc || '#fff1dc'); F.em.emissive.set(s.lc || '#fff1dc'); F.em.emissiveIntensity = pw > 0 ? 1 : .05;
  L.visible = pw > 0;
  if (F.kind === 'bulb') { L.intensity = pw * 1.6; return; }
  L.intensity = pw * (F.kind === 'spot' ? 2.6 : 1.5); L.angle = clamp((s.angle || (F.kind === 'spot' ? 30 : 60)) * D2R, .08, 1.45);
  let yaw = 0, pit = (s.tilt == null ? -15 : s.tilt) * D2R;
  if (s.aim) { const L2 = lmOf(s.aim, t); if (L2) { const T = (L2.chest || L2.eye).clone(); o.root.updateMatrixWorld(); const hp = new THREE.Vector3(); F.head.getWorldPosition(hp); const v = T.sub(hp), rot = (o.st ? o.st.rot : (s.rot || 0) * D2R); yaw = wrapA(Math.atan2(v.x, v.z) - rot); pit = Math.atan2(v.y, Math.hypot(v.x, v.z)); } }
  F.head.rotation.set(-pit, yaw, 0, 'YXZ');
}
function applyAll(t) { for (const s of ST.items) { const o = OBJ[s.id]; if (o) applyItem(o, s, t); } }

/* ---------- landmarks & framing ---------- */
const _box = new THREE.Box3();
function lmOf(id, t) {
  const s = itemById(id), o = OBJ[id]; if (!s || !o) return null;
  applyItem(o, s, t); o.root.updateMatrixWorld(true);
  const rot = o.st.rot;
  let L;
  if (o.mk) {
    const g = n => o.mk[n].getWorldPosition(new THREE.Vector3()); L = { top: g('top'), eye: g('eye'), chin: g('chin'), chest: g('chest'), hip: g('hip'), knee: g('knee'), hand: g('hand') };
    L.r = o.kind === 'human' ? .25 * (L.top.y + .1) : (o.rig.A.L ? o.rig.A.L / 2 + o.rig.A.R : .15) * (o.sc || 1); L.foot = 0;
  } else {
    _box.setFromObject(o.root); const mn = _box.min, mx = _box.max, h = mx.y - mn.y, cx = (mn.x + mx.x) / 2, cz = (mn.z + mx.z) / 2, P = f => V3(cx, mn.y + h * f, cz);
    L = { top: P(1), eye: P(.88), chin: P(.8), chest: P(.7), hip: P(.48), knee: P(.28), hand: P(.5) }; L.r = Math.max(mx.x - mn.x, mx.z - mn.z) / 2; L.foot = mn.y;
  }
  L.base = o.root.position.clone(); L.rot = rot;
  L.fwd = V3(Math.sin(rot), 0, Math.cos(rot)); L.H = Math.max(.05, L.top.y - L.foot); L.human = o.kind === 'human'; L.kind = o.kind;
  return L;
}
function frameSpan(L, k) {
  const H = L.H, f = L.foot, T = L.top.y, hh = Math.max(.04, L.top.y - L.chin.y);
  let b, t, w = 1, pt = L.eye;
  switch (k) {
    case 'ELS': b = f - 2 * H; t = T + 3 * H; w = .5; break;
    case 'LS': b = f - .35 * H; t = T + .42 * H; w = .5; break;
    case 'FS': b = f - .06 * H; t = T + .07 * H; w = .5; break;
    case 'MLS': b = L.knee.y - .03 * H; t = T + .06 * H; w = .6; break;
    case 'MS': b = L.hip.y + .07 * H; t = T + .06 * H; w = .75; break;
    case 'MCU': b = L.chest.y - .03 * H; t = T + .05 * H; w = .9; break;
    case 'CU': b = L.chin.y - hh * .55; t = T + hh * .12; pt = L.top.clone().lerp(L.eye, .35); break;
    case 'BCU': b = L.chin.y - hh * .06; t = L.eye.y + hh * .3; pt = L.top.clone().lerp(L.eye, .5); break;
    case 'ECU': b = L.eye.y - hh * .17; t = L.eye.y + hh * .17; pt = L.top.clone().lerp(L.eye, .8); break;
    case 'INS': { const s = Math.max(.07, H * .09); b = L.hand.y - s; t = L.hand.y + s; pt = L.hand; break; }
    default: b = f; t = T;
  }
  if (t - b < .03) { const m = (t + b) / 2; b = m - .015; t = m + .015; }
  return { b, t, cx: lerp(L.base.x, pt.x, w), cz: lerp(L.base.z, pt.z, w) };
}
function lensFov(f, asp) {
  f = Math.max(4, f);
  if (asp >= 1) { const hf = 2 * Math.atan(18 / f); return { hf, vf: 2 * Math.atan(Math.tan(hf / 2) / asp) }; }
  const vf = 2 * Math.atan(18 / f); return { hf: 2 * Math.atan(Math.tan(vf / 2) * asp), vf };
}
function focalOf(R) { return R.asp >= 1 ? 18 / Math.tan(R.hf / 2) : 18 / Math.tan(R.vf / 2); }
function restP(c) {
  const d = c.dir || 1;
  switch (c.move) { case 'pan': case 'tilt': case 'ped': return 1; case 'dolly': case 'zoom': case 'vertigo': return d > 0 ? 1 : 0; case 'crane': return d > 0 ? 0 : 1; case 'truck': case 'arc': return .5; default: return 0; }
}
const nz = (t, f) => Math.sin(t * f * 6.1) * .5 + Math.sin(t * f * 13.7 + 1.3) * .3 + Math.sin(t * f * 2.3 + .7) * .2;
function shakeR(R, t, k) {
  R.noise = V3(nz(t, 1.3) * .03 * k, nz(t, 1.7) * .025 * k, nz(t, 1.1) * .02 * k);
  R.yaw += nz(t, .9) * .016 * k; R.pitch += nz(t, 1.4) * .013 * k; R.roll += nz(t, .7) * .02 * k;
}
function applyMove(R, c, p, tn) {
  const dir = c.dir || 1, amt = c.amt == null ? 1 : c.amt, q = smooth(clamp(p, 0, 1));
  switch (c.move) {
    case 'pan': R.yaw += dir * amt * .6 * (1 - q); break;
    case 'tilt': R.pitch += -dir * amt * .5 * (1 - q); break;
    case 'dolly': R.d *= 1 + amt * (dir > 0 ? (1 - q) : q); break;
    case 'truck': R.lat += dir * amt * Math.max(.6, R.d) * .45 * (2 * q - 1); break;
    case 'ped': R.vert += -dir * amt * .9 * (1 - q); break;
    case 'crane': { const k = dir > 0 ? q : (1 - q); R.e = Math.min(R.e + amt * .75 * k, 89 * D2R); R.d *= 1 + 1.1 * amt * k; break; }
    case 'arc': R.a += dir * amt * 1.2 * (q - .5); break;
    case 'zoom': { const k = 1 + 1.6 * amt * (dir > 0 ? (1 - q) : q); R.vf = 2 * Math.atan(Math.tan(R.vf / 2) * k); R.hf = 2 * Math.atan(Math.tan(R.hf / 2) * k); break; }
    case 'vertigo': { const m = 1 + 1.6 * amt * (dir > 0 ? (1 - q) : q); R.d *= m; R.vf = 2 * Math.atan(Math.tan(R.vf / 2) / m); R.hf = 2 * Math.atan(Math.tan(R.hf / 2) / m); break; }
    case 'hand': shakeR(R, tn, amt); break;
    case 'whip': if (p > .55) { const k = (p - .55) / .45; R.yaw -= dir * amt * 1.7 * k * k; R.whip = k; } break;
    case 'roll': R.roll += dir * amt * .5 * q; break;
  }
}
function lookPoint(id, t) { const L = lmOf(id, t); if (!L) return null; return L.human ? L.eye.clone().lerp(L.chin, .3) : V3(L.base.x, L.foot + L.H * .6, L.base.z); }
function computeFree(cfg, p, tn) {
  const asp = aspV(), fv = lensFov(cfg.lens || 35, asp); let yaw = (cfg.yaw || 0) * D2R, pit = clamp(cfg.pitch || 0, -89, 89) * D2R;
  const P = V3(cfg.px || 0, cfg.py == null ? 1.5 : cfg.py, cfg.pz || 0); let D = cfg.fd || 4;
  if (cfg.look) { const Q = lookPoint(cfg.look, tn); if (Q) { const v = Q.sub(P), h = Math.hypot(v.x, v.z); if (v.length() > .05) { yaw = Math.atan2(v.x, v.z); pit = Math.atan2(v.y, h); D = clamp(v.length(), .3, 60); } } }
  const f = V3(Math.sin(yaw) * Math.cos(pit), Math.sin(pit), Math.cos(yaw) * Math.cos(pit));
  const R = { asp, hf: fv.hf, vf: fv.vf, yaw: 0, pitch: 0, lat: 0, vert: 0, roll: (cfg.roll || 0) * D2R, tY: 0, whip: 0, c: P.clone().addScaledVector(f, D), d: D, a: Math.atan2(-f.x, -f.z), e: Math.asin(clamp(-f.y, -1, 1)), place: 'c', m: 'free' };
  applyMove(R, cfg, p, tn); if (cfg.shake) shakeR(R, tn + 3.7, cfg.shake); R.f = focalOf(R); return R;
}
function freezeCam(c) {
  const R = computeCam(c, restP(c), RT.t, RT.t); if (!R) return false; composeCam(tmpCam, R);
  const f = new THREE.Vector3(); tmpCam.getWorldDirection(f); const P = tmpCam.position;
  Object.assign(c, { mode: 'free', px: +P.x.toFixed(2), py: +P.y.toFixed(2), pz: +P.z.toFixed(2), yaw: Math.round(Math.atan2(f.x, f.z) / D2R), pitch: Math.round(Math.asin(clamp(f.y, -1, 1)) / D2R), lens: Math.round(R.f), fd: +clamp(R.d, 1, 30).toFixed(1), roll: Math.round(R.roll / D2R), eAdj: 0, dOff: 1 });
  if (c.move === 'track') c.move = 'static'; return true;
}
function aimCam(c, P) { const dx = P.x - (c.px || 0), dy = P.y - (c.py == null ? 1.5 : c.py), dz = P.z - (c.pz || 0), h = Math.hypot(dx, dz); c.yaw = Math.round(Math.atan2(dx, dz) / D2R); c.pitch = Math.round(Math.atan2(dy, h) / D2R); c.fd = +clamp(Math.hypot(h, dy), 1, 30).toFixed(1); }
function aimPoint(id) { const L = lmOf(id, RT.t); if (!L) return null; return L.human ? L.eye.clone() : V3(L.base.x, L.foot + L.H * .6, L.base.z); }
function camFollow(cfg) { return cfg.move === 'track' ? 'move' : (cfg.follow || 'pan'); }
function computeCam(cfg, p, tb, tn) {
  if (!cfg) return null;
  if (cfg.mode === 'free') return computeFree(cfg, p, tn);
  const fol = camFollow(cfg); let R;
  if (fol === 'move') R = baseCam(cfg, tn);
  else if (fol === 'off' || Math.abs(tn - tb) < 1e-4) R = baseCam(cfg, tb);
  else {
    const R0 = baseCam(cfg, tb), R1 = R0 && baseCam(cfg, tn);
    if (!R0 || !R1) R = R0 || R1;
    else {
      const ce = Math.cos(R0.e), P0 = R0.c.clone().addScaledVector(V3(Math.sin(R0.a) * ce, Math.sin(R0.e), Math.cos(R0.a) * ce), R0.d);
      const v = P0.sub(R1.c), d = Math.max(.25, v.length());
      R = R1; R.d = d; R.a = Math.atan2(v.x, v.z); R.e = Math.asin(clamp(v.y / d, -1, 1)); R.vf = R0.vf; R.hf = R0.hf;
    }
  }
  if (!R) return null;
  applyMove(R, cfg, p, tn);
  if (cfg.shake) shakeR(R, tn + 3.7, cfg.shake);
  R.f = focalOf(R);
  return R;
}
function baseCam(cfg, tS) {
  const asp = aspV();
  const S = lmOf(cfg.target, tS); if (!S) return null;
  const ang = ANG[cfg.angle || 'eye'] || ANG.eye;
  const R = { asp, yaw: 0, pitch: 0, lat: 0, vert: 0, roll: ((ang.roll || 0) + (cfg.roll || 0)) * D2R, tY: 0, whip: 0 };
  const fr = frameSpan(S, cfg.size || 'MS');
  let O = null; const mode = cfg.mode || 'single';
  if (mode !== 'single' && cfg.other && cfg.other !== cfg.target) O = lmOf(cfg.other, tS);
  const m = O ? mode : 'single';
  if (m === 'single' || m === 'pair') {
    const fv = lensFov(cfg.lens || 35, asp); R.hf = fv.hf; R.vf = fv.vf;
    let b = fr.b, t = fr.t, cx = fr.cx, cz = fr.cz, a;
    if (m === 'pair') {
      const f2 = frameSpan(O, cfg.size || 'MS'); b = Math.min(b, f2.b); t = Math.max(t, f2.t); cx = (fr.cx + f2.cx) / 2; cz = (fr.cz + f2.cz) / 2;
      let ux = O.base.x - S.base.x, uz = O.base.z - S.base.z; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
      let nx = uz, nzz = -ux; const fs = S.fwd.clone().add(O.fwd), dp = nx * fs.x + nzz * fs.z;
      if (dp < -.05 || (Math.abs(dp) <= .05 && (nzz < -1e-3 || (Math.abs(nzz) <= 1e-3 && nx < 0)))) { nx = -nx; nzz = -nzz; }
      a = Math.atan2(nx, nzz) + (cfg.side || 0) * D2R;
    } else a = S.rot + (cfg.side || 0) * D2R;
    let d = ((t - b) / 2) / Math.tan(R.vf / 2);
    if (m === 'pair') { const rx = Math.cos(a), rz = -Math.sin(a); const hw = Math.max(Math.abs((S.eye.x - cx) * rx + (S.eye.z - cz) * rz), Math.abs((O.eye.x - cx) * rx + (O.eye.z - cz) * rz)) + .5 * Math.max(S.H, O.H) / 1.7; d = Math.max(d, hw / Math.tan(R.hf / 2)); }
    else if (!S.human && ['ELS', 'LS', 'FS', 'MLS'].includes(cfg.size)) d = Math.max(d, (S.r * 1.1) / Math.tan(R.hf / 2) + S.r * .6);
    d *= cfg.dOff || 1;
    R.c = V3(cx, (b + t) / 2, cz); R.a = a; R.e = clamp((ang.e + (cfg.eAdj || 0)) * D2R, -85 * D2R, 89 * D2R); R.d = d;
  } else {
    const sc = O.H / 1.7; let pos;
    if (m === 'ots') {
      let ux = O.eye.x - S.eye.x, uz = O.eye.z - S.eye.z; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
      const sg = (cfg.side || 0) >= 0 ? 1 : -1, px = -uz * sg, pz = ux * sg;
      pos = V3(O.eye.x + ux * .85 * sc + px * .5 * sc, O.eye.y + .07 * sc, O.eye.z + uz * .85 * sc + pz * .5 * sc); R.shoulder = V3(px, 0, pz);
    } else pos = O.eye.clone().addScaledVector(O.fwd, .08 * sc);
    const eOff = { high: .45, low: -.4, bird: 1.6, worm: -.9 }[cfg.angle] || 0; pos.y = Math.max(.15, pos.y + eOff * sc);
    const tgt = V3(fr.cx, (fr.b + fr.t) / 2, fr.cz), v = pos.clone().sub(tgt), d = Math.max(.05, v.length());
    let vf = 2 * Math.atan(((fr.t - fr.b) / 2) / d) * (cfg.dOff || 1);
    vf = clamp(vf, 2 * D2R, 110 * D2R); R.vf = vf; R.hf = 2 * Math.atan(Math.tan(vf / 2) * asp);
    R.c = tgt; R.d = d; R.e = Math.asin(clamp(v.y / d, -1, 1)) + (cfg.eAdj || 0) * D2R; R.a = Math.atan2(v.x, v.z);
  }
  let place = cfg.place || 'auto';
  const rx = Math.cos(R.a), rz = -Math.sin(R.a);
  if (place === 'auto') {
    if (m === 'pair' || m === 'pov' || cfg.size === 'ECU' || cfg.size === 'INS' || ang.k === 'bird' || cfg.size === 'ELS') place = 'c';
    else if (m === 'ots') place = (R.shoulder.x * rx + R.shoulder.z * rz) > 0 ? 'r' : 'l';
    else { const f = S.fwd.x * rx + S.fwd.z * rz; place = f > .35 ? 'l' : f < -.35 ? 'r' : 'c'; }
  }
  const th = Math.atan(Math.tan(R.hf / 2) / 3) * (m === 'ots' ? .7 : 1);
  R.tY = place === 'l' ? -th : place === 'r' ? th : 0; R.place = place;
  R.m = m; R.S = S;
  return R;
}
function composeCam(cam, R) {
  const ce = Math.cos(R.e), dir = V3(Math.sin(R.a) * ce, Math.sin(R.e), Math.cos(R.a) * ce), right = V3(Math.cos(R.a), 0, -Math.sin(R.a));
  const off = right.multiplyScalar(R.lat).add(V3(0, R.vert, 0));
  const pos = R.c.clone().addScaledVector(dir, R.d).add(off), tgt = R.c.clone().add(off);
  if (R.noise) pos.add(R.noise);
  if (pos.y < .08) pos.y = .08;
  cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(tgt);
  cam.rotateY(R.yaw + R.tY); cam.rotateX(R.pitch); cam.rotateZ(R.roll);
  cam.fov = R.vf / D2R; cam.aspect = R.asp; cam.near = clamp(R.d * .04, .01, .3); cam.updateProjectionMatrix();
}

/* ---------- program (what the monitor shows) ---------- */
function progCam() {
  if (RT.quiz) return { cfg: RT.quiz.cfg, p: 0, tb: RT.t, tn: RT.t };
  if (RT.src !== 'edit') {
    const c = camById(RT.src);
    if (c) return { cfg: c, p: RT.camPrevOn ? RT.camPrev : restP(c), tb: RT.t, tn: RT.t + (RT.camPrevOn ? RT.camPrev * 3 : 0), live: true };
    RT.src = 'edit';
  }
  const sa = shotAt(RT.t); if (!sa) return null;
  const c = camById(sa.s.cam); if (!c) return null;
  return { cfg: c, p: sa.p, tb: sa.start, tn: RT.t, shot: sa };
}

/* ---------- gizmos ---------- */
function updateGizmos(R, pc) {
  const used = new Set(), asp = aspV();
  ST.cams.forEach((c, i) => {
    const col = CAM_COLORS[i % CAM_COLORS.length];
    let g = GIZ[c.id];
    if (!g || g.userData.name !== c.name || g.userData.col !== col) { if (g) scene.remove(g); g = camGizmo(c.name, col); g.userData = { name: c.name, col, camId: c.id }; GIZ[c.id] = g; scene.add(g); }
    used.add(c.id);
    const cur = pc && pc.cfg === c, Rc = cur ? R : computeCam(c, restP(c), RT.t, RT.t);
    if (!Rc) { g.visible = false; return; }
    composeCam(tmpCam, Rc); g.visible = true; g.position.copy(tmpCam.position); g.quaternion.copy(tmpCam.quaternion);
    const sc = clamp(dirCam.position.distanceTo(tmpCam.position) / 9, .6, 3); g.scale.setScalar(sc);
    if (cur) {
      const D = clamp(Rc.d, .3, 30), hh = Math.tan(Rc.vf / 2) * D, hw = Math.tan(Rc.hf / 2) * D, arr = frus.geometry.attributes.position.array;
      const cs = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => tmpCam.localToWorld(V3(x, y, -D)));
      const P0 = tmpCam.position; let k = 0; const put = v => { arr[k++] = v.x; arr[k++] = v.y; arr[k++] = v.z; };
      cs.forEach(v => { put(P0); put(v); }); for (let j = 0; j < 4; j++) { put(cs[j]); put(cs[(j + 1) % 4]); }
      frus.geometry.attributes.position.needsUpdate = true; frus.material.color.set(col); frus.visible = true;
    }
  });
  if (!pc || !R) frus.visible = false;
  for (const id in GIZ) if (!used.has(id)) { scene.remove(GIZ[id]); delete GIZ[id]; }
}
function updateMarks() {
  const s = RT.sel && itemById(RT.sel), o = s && OBJ[s.id];
  ringM.visible = !!o;
  if (o) { const r = s.kind === 'human' ? .45 : Math.max(.45, (o.lastR || .5)); ringM.position.set(o.root.position.x, .03, o.root.position.z); ringM.scale.setScalar(s.kind === 'human' ? 1 : clamp(r / .45, 1, 6)); }
  const ap = axisPair();
  if (ap) {
    const a = OBJ[ap[0]], b = OBJ[ap[1]];
    if (a && b) { const A = a.root.position, B = b.root.position, d = V3(B.x - A.x, 0, B.z - A.z); const L = d.length() || 1; d.multiplyScalar(1 / L);
      const p = axisL.geometry.attributes.position.array; p[0] = A.x - d.x * 6; p[1] = .04; p[2] = A.z - d.z * 6; p[3] = B.x + d.x * 6; p[4] = .04; p[5] = B.z + d.z * 6;
      axisL.geometry.attributes.position.needsUpdate = true; axisL.computeLineDistances(); axisL.visible = true; }
  } else axisL.visible = false;
  const arr = pathL.geometry.attributes.position.array; let k = 0;
  if (s) { let x = s.x, z = s.z; (s.actions || []).slice().sort((a, b) => a.t - b.t).forEach(a => { if ((a.type === 'walk' || a.type === 'run') && k < 57 * 3) { arr[k++] = x; arr[k++] = .05; arr[k++] = z; arr[k++] = a.tx; arr[k++] = .05; arr[k++] = a.tz; x = a.tx; z = a.tz; } }); }
  for (let j = k; j < arr.length; j++) arr[j] = 0;
  pathL.geometry.attributes.position.needsUpdate = true; pathL.visible = k > 0;
}

/* ---------- on-screen handles (director view) ---------- */
const hmat = c => new THREE.MeshBasicMaterial({ color: c, depthTest: false, transparent: true, opacity: .96 });
function makeRotHandle() {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(.05, .01, .72), hmat('#f2a23a')); shaft.position.z = .5; g.add(shaft);
  const head = new THREE.Mesh(new THREE.ConeGeometry(.12, .26, 14), hmat('#f2a23a')); head.rotation.x = Math.PI / 2; head.position.z = .95; g.add(head);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.15, 16, 12), hmat('#ffd28a')); knob.position.set(0, .03, 1.12); g.add(knob);
  g.traverse(o => { o.layers.set(1); o.renderOrder = 12; o.userData.handle = { type: 'rot' }; }); g.visible = false; return g;
}
function makeKnob() {
  const g = new THREE.Group();
  const k = new THREE.Mesh(new THREE.SphereGeometry(.15, 16, 12), hmat('#79c4e6')); k.position.y = .05; g.add(k);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.22, .29, 28), hmat('#79c4e6')); ring.rotation.x = -Math.PI / 2; g.add(ring);
  const head = new THREE.Mesh(new THREE.ConeGeometry(.12, .28, 14), hmat('#79c4e6')); head.rotation.x = Math.PI / 2; head.position.set(0, .03, -.48); g.add(head);
  g.traverse(o => { o.layers.set(1); o.renderOrder = 12; }); scene.add(g); return g;
}
function updateHandles() {
  const s = RT.sel && itemById(RT.sel), o = s && OBJ[s.id], show = !!o && !RT.playing && !document.body.classList.contains('cine');
  HND.rot.visible = show;
  let kn = 0;
  if (show) {
    const sz = s.kind === 'human' ? 1 : clamp((o.lastR || .5) / .55, 1, 3.2), k = clamp(dirCam.position.distanceTo(o.root.position) / 10, .75, 2.6);
    HND.rot.position.set(o.root.position.x, .05, o.root.position.z); HND.rot.rotation.set(0, o.st.rot, 0); HND.rot.scale.set(k * sz, k, k * sz);
    let x = s.x, z = s.z;
    (s.actions || []).map((a, i) => ({ a, i })).sort((p, q) => p.a.t - q.a.t).forEach(({ a, i }) => {
      if (a.type !== 'walk' && a.type !== 'run') return;
      const tx = a.tx == null ? x : a.tx, tz = a.tz == null ? z : a.tz, K = HND.knobs[kn] || (HND.knobs[kn] = makeKnob());
      K.visible = true; K.position.set(tx, .04, tz); K.rotation.set(0, Math.atan2(tx - x, tz - z), 0); K.scale.setScalar(clamp(dirCam.position.distanceTo(K.position) / 10, .75, 2.6));
      const hd = { type: 'tgt', id: s.id, ai: i }, on = RT.selAct && RT.selAct.id === s.id && RT.selAct.ai === i;
      K.traverse(c => { c.userData.handle = hd; if (c.material) c.material.color.set(on ? '#f2a23a' : '#79c4e6'); });
      x = tx; z = tz; kn++;
    });
  }
  for (let j = kn; j < HND.knobs.length; j++) HND.knobs[j].visible = false;
  const arr = pathAll.geometry.attributes.position.array; let n = 0;
  ST.items.forEach(it => { if (it.id === RT.sel) return; let x = it.x, z = it.z; (it.actions || []).slice().sort((a, b) => a.t - b.t).forEach(a => { if ((a.type === 'walk' || a.type === 'run') && n < 234) { arr[n++] = x; arr[n++] = .04; arr[n++] = z; arr[n++] = a.tx; arr[n++] = .04; arr[n++] = a.tz; x = a.tx; z = a.tz; } }); });
  for (let j = n; j < arr.length; j++) arr[j] = 0; pathAll.geometry.attributes.position.needsUpdate = true; pathAll.visible = n > 0;
}

/* ---------- weather ---------- */
function ensureRain(on) {
  if (on && !rainL) {
    const N = 1700, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
    rainL = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#d6dee8', transparent: true, opacity: .5 })); rainL.frustumCulled = false;
    rainL.userData.seed = Array.from({ length: N }, () => [Math.random(), Math.random(), Math.random()]); scene.add(rainL);
  }
  if (rainL) rainL.visible = !!on;
}
function weatherTick(t, R) {
  if (!rainL || !rainL.visible) return;
  const a = rainL.geometry.attributes.position.array, S = rainL.userData.seed, cx = R ? R.c.x : ORB.tx, cz = R ? R.c.z : ORB.tz, RR = 14, H = 11;
  for (let i = 0; i < S.length; i++) { const [u, v, w] = S[i], x = cx + (u - .5) * 2 * RR, z = cz + (v - .5) * 2 * RR, y = H - ((w * H + t * 11) % H); a[i * 6] = x; a[i * 6 + 1] = y; a[i * 6 + 2] = z; a[i * 6 + 3] = x + .02; a[i * 6 + 4] = y + .42; a[i * 6 + 5] = z + .015; }
  rainL.geometry.attributes.position.needsUpdate = true;
}

/* ---------- backdrop photo ---------- */
function setBackdrop(img) {
  if (bdMesh) { scene.remove(bdMesh); bdMesh.material.map && bdMesh.material.map.dispose(); bdMesh = null; }
  if (!img) return;
  const tex = new THREE.Texture(img); tex.needsUpdate = true; tex.encoding = THREE.sRGBEncoding;
  bdMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, fog: false, toneMapped: false }));
  bdMesh.userData.asp = img.width / img.height; scene.add(bdMesh); RT.dirty = true;
}
function placeBackdrop(R) {
  if (!bdMesh) return;
  const bd = ST.bd || { follow: 1, dist: 12 }, a = bdMesh.userData.asp;
  if (bd.follow && R) {
    composeCam(tmpCam, R); const cp = tmpCam.position.clone(), dir = R.c.clone().sub(cp).normalize();
    const D = cp.distanceTo(R.c) + (bd.dist || 12), pos = cp.clone().addScaledVector(dir, D);
    bdMesh.position.copy(pos); bdMesh.lookAt(cp);
    const h = 2 * Math.tan(R.vf / 2) * D * 1.25, w = Math.max(h * a, 2 * Math.tan(R.hf / 2) * D * 1.25);
    bdMesh.scale.set(w, w / a, 1);
  } else { const h = bd.size || 10; bdMesh.scale.set(h * a, h, 1); bdMesh.position.set(0, h / 2 - .5, -(bd.dist || 12)); bdMesh.rotation.set(0, 0, 0); }
}

/* ---------- transitions & program at any time (used by monitor and export) ---------- */
function transAt(T) {
  const st = shotStarts(), out = { R2: null, mixA: 0, fadeA: 0 };
  for (let j = 1; j < ST.shots.length; j++) {
    const tr = ST.shots[j].trans || 'cut'; if (tr === 'cut') continue;
    const C = st[j], w = tr === 'fade' ? .4 : .35; if (T <= C - w || T >= C + w) continue;
    if (tr === 'fade') out.fadeA = 1 - Math.abs(T - C) / w;
    else { const k = (T - (C - w)) / (2 * w); const oth = T < C ? { c: camById(ST.shots[j].cam), p: 0, tb: C } : { c: camById(ST.shots[j - 1].cam), p: 1, tb: st[j - 1] }; if (oth.c) { out.R2 = computeCam(oth.c, oth.p, oth.tb, T); out.mixA = T < C ? k : 1 - k; } }
  }
  if (ST.shots[0] && ST.shots[0].trans === 'fade' && T < .5) out.fadeA = Math.max(out.fadeA, 1 - T / .5);
  ST.shots.forEach((sh, j) => { if (sh.end !== 'fade') return; const e = st[j] + sh.dur, w = Math.min(1.2, sh.dur * .5); if (T > e - w && (T <= e || j === ST.shots.length - 1)) out.fadeA = Math.max(out.fadeA, clamp((T - (e - w)) / w, 0, 1)); });
  return out;
}
function programFrame(t) {
  const sa = shotAt(t); if (!sa) return { R: null }; const c = camById(sa.s.cam); if (!c) return { R: null };
  const pc = { cfg: c, p: sa.p, tb: sa.start, tn: t, shot: sa }, R = computeCam(c, pc.p, pc.tb, pc.tn), tr = transAt(t);
  return { pc, R, R2: tr.R2, mixA: tr.mixA, fadeA: tr.fadeA };
}

/* ---------- drawing ---------- */
function vp(x, y, w, h, H) { renderer.setViewport(x, H - y - h, w, h); renderer.setScissor(x, H - y - h, w, h); }
function pipRect(W, H, a) { const st = document.body.classList.contains('stage'), nar = innerWidth <= 640, b = st ? (nar ? 122 : 84) + (RT.src !== 'edit' ? 60 : 0) : 12; let w = Math.round(Math.min(W * (W < 600 ? .3 : st ? .22 : .26), 300)), h = Math.round(w / a); if (h > H * .38) { h = Math.round(H * .38); w = Math.round(h * a); } return { x: 12, y: H - h - b, w, h }; }
function gizmoTM() { RT.gizmoTM = false; scene.traverse(o => { if (o.layers.mask === 2 && o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.toneMapped !== false) { m.toneMapped = false; m.needsUpdate = true; } }); }); }
function draw() {
  const W = monEl.clientWidth, H = monEl.clientHeight; if (!W || !H || !ST) return;
  if (RT.gizmoTM !== false) gizmoTM();
  updSubs();
  const asp = aspV(); let fw = W, fh = W / asp; if (fh > H) { fh = H; fw = H * asp; } fw = Math.floor(fw); fh = Math.floor(fh);
  const fx = Math.floor((W - fw) / 2), fy = Math.floor((H - fh) / 2); RT.frameRect = { x: fx, y: fy, w: fw, h: fh };
  const pc = progCam(); let R = pc ? computeCam(pc.cfg, pc.p, pc.tb, pc.tn) : null, R2 = null, mixA = 0, fadeA = 0;
  if (pc && pc.shot) { const tr = transAt(RT.t); R2 = tr.R2; mixA = tr.mixA; fadeA = tr.fadeA; }
  RT.R = R; RT.pc = pc;
  updateGizmos(R, pc);
  placeBackdrop(R);
  applyAll(RT.t);
  updateMarks(); updateHandles(); weatherTick(RT.t, R);
  const cp = Math.cos(ORS.ph); dirCam.position.set(ORS.tx + ORS.r * Math.sin(ORS.th) * cp, ORS.ty + ORS.r * Math.sin(ORS.ph), ORS.tz + ORS.r * Math.cos(ORS.th) * cp); dirCam.lookAt(ORS.tx, ORS.ty, ORS.tz);
  dirCam.near = clamp(ORS.r * .01, .02, .5); dirCam.updateProjectionMatrix();
  renderer.setScissorTest(false); renderer.setClearColor(0x0b0505, 1); renderer.clear(); renderer.setScissorTest(true);
  const mixEl = document.getElementById('mix');
  if (RT.view === 'cam') {
    if (R2 && mixA > .002) {
      composeCam(shotCam, R2); vp(fx, fy, fw, fh, H); renderer.render(scene, shotCam);
      const pr = renderer.getPixelRatio(), X = Math.round(fx * pr), Y = Math.round(fy * pr), FW = Math.round(fw * pr), FH = Math.round(fh * pr); mixCtx.clearRect(0, 0, mixEl.width, mixEl.height); mixCtx.drawImage(renderer.domElement, X, Y, FW, FH, X, Y, FW, FH);
      mixEl.style.opacity = mixA; vp(0, 0, W, H, H); renderer.clear();
    } else mixEl.style.opacity = 0;
    if (R) { composeCam(shotCam, R); vp(fx, fy, fw, fh, H); renderer.render(scene, shotCam); fadeQuad(fadeA); }
    if (!document.body.classList.contains('cine')) {
      const pr = pipRect(W, H, 1.6); RT.pipR = pr; dirCam.aspect = pr.w / pr.h; dirCam.updateProjectionMatrix();
      vp(pr.x, pr.y, pr.w, pr.h, H); renderer.setClearColor(0x140908, 1); renderer.clear(); renderer.render(scene, dirCam);
    } else RT.pipR = null;
  } else {
    mixEl.style.opacity = 0;
    if (RT.dmode === '2d' && planCam) { planFit(); vp(0, 0, W, H, H); renderPlan3D(W, H); }
    else { dirCam.aspect = W / H; dirCam.updateProjectionMatrix(); vp(0, 0, W, H, H); renderer.render(scene, dirCam); }
    if (R) { const pr = pipRect(W, H, asp); RT.pipR = pr; composeCam(shotCam, R); vp(pr.x, pr.y, pr.w, pr.h, H); renderer.clear(); renderer.render(scene, shotCam); fadeQuad(fadeA); } else RT.pipR = null;
  }
  renderer.setScissorTest(false);
  if (PLAN.cv) { const on = planOn(); PLAN.cv.style.display = on ? 'block' : 'none'; if (on) { drawPlan(W, H); if (RT.pipR) { const r = RT.pipR; PLAN.g.clearRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4); } } }

  monEl.style.filter = R && R.whip > .05 && RT.view === 'cam' ? `blur(${(R.whip * 3).toFixed(1)}px)` : '';
  if (window.onDrawn) onDrawn(R, pc);
}

/* ---------- director controls ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), gPlane = new THREE.Plane(V3(0, 1, 0), 0);
function setRay(x, y) { const W = monEl.clientWidth, H = monEl.clientHeight; ndc.set(x / W * 2 - 1, -(y / H) * 2 + 1); dirCam.aspect = W / H; dirCam.updateProjectionMatrix(); ray.setFromCamera(ndc, dirCam); }
function pickAt(x, y) {
  setRay(x, y);
  ray.layers.set(1);
  const hs = [HND.rot].concat(HND.knobs).filter(h => h && h.visible), hh = hs.length ? ray.intersectObjects(hs, true) : [];
  if (hh.length) return { handle: hh[0].object.userData.handle };
  const gz = ray.intersectObjects(Object.values(GIZ), true);
  if (gz.length) { let o = gz[0].object; while (o && !(o.userData && o.userData.camId)) o = o.parent; if (o) return { cam: o.userData.camId }; }
  ray.layers.set(0); const hits = ray.intersectObjects(Object.values(OBJ).map(o => o.root), true);
  if (hits.length) { let o = hits[0].object; while (o && !(o.userData && o.userData.itemId)) o = o.parent; if (o) return { item: o.userData.itemId }; }
  const near = nearestOnScreen(x, y, dirCam, 0, 0, monEl.clientWidth, monEl.clientHeight, 30);
  return near ? { item: near } : null;
}
function nearestOnScreen(x, y, cam, rx, ry, rw, rh, tol) {
  let best = null, bd = tol; const a = new THREE.Vector3(), b = new THREE.Vector3();
  for (const s of ST.items) {
    const o = OBJ[s.id]; if (!o) continue;
    a.copy(o.root.position); b.copy(o.root.position); b.y += s.kind === 'human' ? s.h / 100 : Math.max(.3, (o.lastR || .4) * 1.2);
    a.project(cam); b.project(cam); if (a.z > 1 || b.z > 1) continue;
    const ax = rx + (a.x + 1) / 2 * rw, ay = ry + (1 - a.y) / 2 * rh, bx2 = rx + (b.x + 1) / 2 * rw, by = ry + (1 - b.y) / 2 * rh;
    const dx = bx2 - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1, u = clamp(((x - ax) * dx + (y - ay) * dy) / L2, 0, 1), d = Math.hypot(x - (ax + u * dx), y - (ay + u * dy));
    if (d < bd) { bd = d; best = s.id; }
  }
  return best;
}
function pickInFrame(x, y) {
  const fr = RT.frameRect; if (!RT.R || !inRect(x, y, fr)) return null;
  ndc.set((x - fr.x) / fr.w * 2 - 1, -((y - fr.y) / fr.h) * 2 + 1); ray.setFromCamera(ndc, shotCam); ray.layers.set(0);
  const hits = ray.intersectObjects(Object.values(OBJ).map(o => o.root), true);
  if (hits.length) { let o = hits[0].object; while (o && !(o.userData && o.userData.itemId)) o = o.parent; if (o) return o.userData.itemId; }
  return nearestOnScreen(x, y, shotCam, fr.x, fr.y, fr.w, fr.h, 34);
}
function groundAt(x, y) { setRay(x, y); ray.layers.set(0); const p = new THREE.Vector3(); return ray.ray.intersectPlane(gPlane, p) ? p : null; }
function framingCam() { if (RT.quiz) return null; if (RT.src !== 'edit') return camById(RT.src); const sa = shotAt(RT.t); return sa ? camById(sa.s.cam) : null; }
function inRect(x, y, r) { return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
function initPointer() {
  const ptrs = new Map(); let drag = null;
  const loc = e => { const r = monEl.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  monEl.addEventListener('contextmenu', e => e.preventDefault());
  monEl.addEventListener('pointerdown', e => {
    if (e.target.closest('.srcbar,.ctx,.dmode')) return; if (planOn() && e.target === PLAN.cv) return;
    const p = loc(e); ptrs.set(e.pointerId, p); try { monEl.setPointerCapture(e.pointerId); } catch (_) { }
    if (ptrs.size === 2) { if (drag && drag.lp) clearTimeout(drag.lp); const [a, b] = [...ptrs.values()]; drag = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), r0: ORB.r, cam: framingCam(), o0: (framingCam() || {}).dOff || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; return; }
    if (RT.pipR && inRect(p.x, p.y, RT.pipR) && !document.body.classList.contains('cine')) { drag = { type: 'pip', x: p.x, y: p.y, moved: false }; return; }
    if (RT.view === 'dir') {
      if (RT.pick) { const g = groundAt(p.x, p.y); if (g && window.onPickGround) onPickGround(g); drag = null; return; }
      const h = pickAt(p.x, p.y);
      if (h && h.handle) { const hd = h.handle; if (hd.type === 'rot') drag = { type: 'rotH', id: RT.sel, moved: false }; else { drag = { type: 'tgtH', id: hd.id, ai: hd.ai, moved: false }; RT.selAct = { id: hd.id, ai: hd.ai }; RT.dirty = true; } return; }
      if (h && h.item) { const s = itemById(h.item), g = groundAt(p.x, p.y); if (window.onSelectItem) onSelectItem(h.item); drag = g ? { type: 'item', id: h.item, ox: s.x - g.x, oz: s.z - g.z, moved: false } : null; return; }
      if (h && h.cam) { const c = camById(h.cam); if (window.onSelectCam) onSelectCam(h.cam); const g = groundAt(p.x, p.y); drag = c && c.mode === 'free' && g ? { type: 'camMove', cam: c, ox: (c.px || 0) - g.x, oz: (c.pz || 0) - g.z, moved: false } : null; return; }
      drag = { type: (e.button === 2 || e.shiftKey) ? 'pan' : 'orbit', x: p.x, y: p.y, moved: false };
      if (RT.sel && drag.type === 'orbit') { const d0 = drag; d0.lp = setTimeout(() => { if (drag === d0 && !d0.moved) { const g = groundAt(d0.x, d0.y); drag = null; if (g && window.onLongPressGround) onLongPressGround(g); } }, 560); }
    } else drag = { type: 'frame', x: p.x, y: p.y, moved: false, cam: framingCam() };
  });
  monEl.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    const p = loc(e), prev = ptrs.get(e.pointerId); ptrs.set(e.pointerId, p);
    if (!drag) return;
    const dx = p.x - prev.x, dy = p.y - prev.y;
    if (Math.abs(p.x - (drag.x ?? p.x)) + Math.abs(p.y - (drag.y ?? p.y)) > 6) { drag.moved = true; if (drag.lp) { clearTimeout(drag.lp); drag.lp = null; } }
    if (drag.type === 'pinch' && ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      if (RT.view === 'dir') { ORB.r = clamp(drag.r0 * drag.d0 / d, .3, 500); const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; orbPan(mx - drag.mx, my - drag.my); drag.mx = mx; drag.my = my; }
      else if (drag.cam && drag.cam.mode === 'free') { const c = drag.cam, k = (d - (drag.dl || drag.d0)) * .01, y = (c.yaw || 0) * D2R; c.px = +((c.px || 0) + Math.sin(y) * k).toFixed(3); c.pz = +((c.pz || 0) + Math.cos(y) * k).toFixed(3); drag.dl = d; drag.changed = true; }
      else if (drag.cam) { drag.cam.dOff = clamp(drag.o0 * drag.d0 / d, .3, 3); drag.changed = true; }
      RT.dirty = true; return;
    }
    if (drag.type === 'orbit') { ORB.th -= dx * .008; ORB.ph = clamp(ORB.ph + dy * .006, -1.35, 1.56); RT.dirty = true; }
    else if (drag.type === 'pan') orbPan(dx, dy);
    else if (drag.type === 'rotH') { const g = groundAt(p.x, p.y), s = itemById(drag.id), o = OBJ[drag.id]; if (g && s && o) { const ang = Math.atan2(g.x - o.root.position.x, g.z - o.root.position.z), d = (ang - o.st.rot) / D2R; s.rot = Math.round(((((s.rot || 0) + d) % 360) + 540) % 360 - 180); drag.moved = true; RT.dirty = true; } }
    else if (drag.type === 'tgtH') { const g = groundAt(p.x, p.y), s = itemById(drag.id), a = s && s.actions[drag.ai]; if (g && a) { a.tx = +g.x.toFixed(2); a.tz = +g.z.toFixed(2); const s0 = evalItem(s, a.t), dist = Math.hypot(a.tx - s0.x, a.tz - s0.z); a.dur = +Math.max(.4, dist / (a.type === 'run' ? 3.4 : 1.3)).toFixed(2); drag.moved = true; RT.dirty = true; } }
    else if (drag.type === 'camMove') { const g = groundAt(p.x, p.y); if (g) { drag.cam.px = +(g.x + drag.ox).toFixed(2); drag.cam.pz = +(g.z + drag.oz).toFixed(2); drag.moved = true; RT.dirty = true; } }
    else if (drag.type === 'item') { const g = groundAt(p.x, p.y); const s = itemById(drag.id); if (g && s) { s.x = +(g.x + drag.ox).toFixed(2); s.z = +(g.z + drag.oz).toFixed(2); drag.moved = true; RT.dirty = true; } }
    else if (drag.type === 'frame' && drag.cam) {
      const c = drag.cam;
      if (c.mode === 'free') { c.yaw = Math.round(((c.yaw || 0) + dx * .25 + 540) % 360 - 180); c.pitch = Math.round(clamp((c.pitch || 0) + dy * .2, -89, 89)); }
      else if (c.mode === 'ots' || c.mode === 'pov') c.eAdj = clamp((c.eAdj || 0) - dy * .12, -40, 40);
      else { let sd = (c.side || 0) - dx * .35; sd = ((sd + 180) % 360 + 360) % 360 - 180; c.side = Math.round(sd); c.eAdj = clamp((c.eAdj || 0) - dy * .15, -40, 40); }
      drag.changed = true; RT.dirty = true;
    }
  });
  const up = e => {
    if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId);
    if (!drag) return;
    if (drag.type === 'pinch') { if (ptrs.size === 0) { if (drag.changed && window.onCamEdited) onCamEdited(); drag = null; } return; }
    if (drag.type === 'pip' && !drag.moved && window.onSwapView) onSwapView();
    if (drag.lp) clearTimeout(drag.lp);
    if ((drag.type === 'item' || drag.type === 'camMove' || drag.type === 'rotH' || drag.type === 'tgtH') && drag.moved && window.onItemMoved) onItemMoved();
    if ((drag.type === 'rotH' || drag.type === 'tgtH') && !drag.moved && window.onHandleTap) onHandleTap(drag);
    if (drag.type === 'frame' && drag.changed && window.onCamEdited) onCamEdited();
    if (drag.type === 'frame' && !drag.moved && !drag.changed && window.onSelectItem) { const id = pickInFrame(drag.x, drag.y); onSelectItem(id); }
    if (drag.type === 'orbit' && !drag.moved) {
      const now = performance.now();
      if (now - (RT.lastTap || 0) < 330) { const g = groundAt(drag.x, drag.y); if (g) { ORB.tx = g.x; ORB.tz = g.z; ORB.ty = .9; ORB.r = Math.max(2.5, ORB.r * .6); RT.dirty = true; } RT.lastTap = 0; }
      else { RT.lastTap = now; if (window.onSelectItem) onSelectItem(null); }
    }
    drag = null;
  };
  monEl.addEventListener('pointerup', up); monEl.addEventListener('pointercancel', up);
  let wt = null;
  monEl.addEventListener('wheel', e => {
    e.preventDefault();
    if (RT.view === 'dir') { const r0 = ORB.r; ORB.r = clamp(ORB.r * (1 + e.deltaY * .0012), .3, 500); if (e.deltaY < 0) { const r = monEl.getBoundingClientRect(), g = groundAt(e.clientX - r.left, e.clientY - r.top); if (g) { const f = 1 - ORB.r / r0; ORB.tx += (g.x - ORB.tx) * f; ORB.tz += (g.z - ORB.tz) * f; } } }
    else { const c = framingCam(); if (c && c.mode === 'free') { const y = (c.yaw || 0) * D2R, k = -e.deltaY * .004; c.px = +((c.px || 0) + Math.sin(y) * k).toFixed(3); c.pz = +((c.pz || 0) + Math.cos(y) * k).toFixed(3); clearTimeout(wt); wt = setTimeout(() => window.onCamEdited && onCamEdited(), 350); }
      else if (c) { c.dOff = clamp((c.dOff || 1) * (1 + e.deltaY * .001), .3, 3); clearTimeout(wt); wt = setTimeout(() => window.onCamEdited && onCamEdited(), 350); } }
    RT.dirty = true;
  }, { passive: false });
}

/* ---------- edit analysis ---------- */
function axisPair() {
  const c = ST.cams.find(c => (c.mode === 'pair' || c.mode === 'ots') && c.other && itemById(c.other) && itemById(c.target));
  if (c) return [c.target, c.other];
  const hs = ST.items.filter(s => s.kind === 'human'); return hs.length >= 2 ? [hs[0].id, hs[1].id] : null;
}
function sideOf(P1, P2, Q) { const v = (P2.x - P1.x) * (Q.z - P1.z) - (P2.z - P1.z) * (Q.x - P1.x); return Math.abs(v) < .08 ? 0 : Math.sign(v); }
function analyze() {
  const flags = [], st = shotStarts(), n = ST.shots.length, ax = axisPair();
  for (let j = 1; j < n; j++) {
    const C = st[j], A = camById(ST.shots[j - 1].cam), B = camById(ST.shots[j].cam), f = { j, C, list: [] };
    flags.push(f); if (!A || !B) continue;
    let on = false, late = false;
    ST.items.forEach(s => (s.actions || []).forEach(a => { const e = a.t + a.dur; if (C > a.t + .05 && C < e - .05) on = true; else if (C >= e - .05 && C < e + 1) late = true; }));
    if (on) f.list.push('on'); else if (late) f.list.push('late');
    if (A.id === B.id) { f.list.push('same'); continue; }
    const RA = computeCam(A, 1, st[j - 1], C), RB = computeCam(B, 0, C, C);
    if (!RA || !RB) continue;
    composeCam(tmpCam, RA); const pA = tmpCam.position.clone(); composeCam(tmpCam, RB); const pB = tmpCam.position.clone();
    if (ax && A.mode !== 'pov' && B.mode !== 'pov' && A.angle !== 'bird' && B.angle !== 'bird') {
      const L1 = lmOf(ax[0], C), L2 = lmOf(ax[1], C);
      if (L1 && L2) { const a = sideOf(L1.base, L2.base, pA), b = sideOf(L1.base, L2.base, pB); if (a * b < 0) f.list.push('cross'); }
    }
    if (A.mode !== 'free' && B.mode !== 'free' && A.target === B.target && (A.mode || 'single') === (B.mode || 'single') && (A.mode || 'single') === 'single') {
      const va = pA.clone().sub(RA.c).setY(0), vb = pB.clone().sub(RB.c).setY(0);
      if (va.lengthSq() > 1e-6 && vb.lengthSq() > 1e-6) { const dg = Math.acos(clamp(va.normalize().dot(vb.normalize()), -1, 1)) / D2R; if (dg < 30 && Math.abs(SIZE_IDX[A.size] - SIZE_IDX[B.size]) <= 1) f.list.push('jump'); }
    }
  }
  RT.flags = flags; RT.dirty = true;
}
