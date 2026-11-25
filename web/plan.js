/* كادر — المخطط: the director's eye seen from above, in 2D.
   Big, simple shapes; names; directions; paths; cameras with their field of view; lights with their beams.
   Tap to select, drag to move, drag the round handle to turn, drag a path end to change where someone goes,
   long-press the ground to send the selected person there, pinch or wheel to zoom, drag the ground to pan. */
const PLAN = { cx: 0, cz: 0, k: 34, cv: null, g: null, drag: null, ptrs: new Map(), lastTap: 0, fitted: '' };
let planCam = null;
const _pp = new THREE.Vector3(), _pf = new THREE.Vector3();
function planOn() { return RT.view === 'dir' && RT.dmode === '2d'; }
function initPlan() {
  const cv = document.createElement('canvas'); cv.id = 'plan'; cv.className = 'plan'; cv.setAttribute('aria-label', 'مخطط المشهد من الأعلى');
  monEl.insertBefore(cv, document.getElementById('frame')); PLAN.cv = cv; PLAN.g = cv.getContext('2d');
  planCam = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 300); planCam.up.set(0, 0, -1);
  cv.addEventListener('pointerdown', planDown); cv.addEventListener('pointermove', planMove);
  cv.addEventListener('pointerup', planUp); cv.addEventListener('pointercancel', planUp);
  cv.addEventListener('wheel', e => { e.preventDefault(); const p = planLoc(e); planZoom(p, Math.exp(-e.deltaY * .0015)); }, { passive: false });
  cv.addEventListener('contextmenu', e => e.preventDefault());
}
function planFit(force) {
  const key = PRJ ? PRJ.id + ST.id : ST.id; if (!force && PLAN.fitted === key) return; PLAN.fitted = key;
  const c = actionCenter(), W = monEl.clientWidth || 400, H = monEl.clientHeight || 300;
  PLAN.cx = c.x; PLAN.cz = c.z; PLAN.k = clamp(Math.min(W, H) / ((c.r - 5) * 2 + 4), 8, 140);
}
const w2s = (x, z) => [monEl.clientWidth / 2 + (x - PLAN.cx) * PLAN.k, monEl.clientHeight / 2 + (z - PLAN.cz) * PLAN.k];
const s2w = (sx, sy) => ({ x: PLAN.cx + (sx - monEl.clientWidth / 2) / PLAN.k, z: PLAN.cz + (sy - monEl.clientHeight / 2) / PLAN.k });
function planLoc(e) { const r = PLAN.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function planZoom(p, f) { const a = s2w(p.x, p.y); PLAN.k = clamp(PLAN.k * f, 4, 260); const b = s2w(p.x, p.y); PLAN.cx += a.x - b.x; PLAN.cz += a.z - b.z; RT.dirty = true; }
/* render the scene from straight above (the real décor), then draw the plan on top */
function renderPlan3D(W, H) {
  const hw = W / 2 / PLAN.k, hh = H / 2 / PLAN.k;
  Object.assign(planCam, { left: -hw, right: hw, top: hh, bottom: -hh }); planCam.updateProjectionMatrix();
  planCam.position.set(PLAN.cx, 120, PLAN.cz); planCam.lookAt(PLAN.cx, 0, PLAN.cz);
  const fog = scene.fog; scene.fog = null; renderer.render(scene, planCam); scene.fog = fog;
}
function posOf(s) { const o = OBJ[s.id], st = o && o.st; return st ? { x: st.x, z: st.z, rot: st.rot } : { x: s.x, z: s.z, rot: (s.rot || 0) * D2R }; }
function isLight(s) { return s.kind === 'prop' && PROPS[s.type] && PROPS[s.type].light; }
function camPose(c) {
  const R = computeCam(c, restP(c), RT.t, RT.t); if (!R) return null;
  composeCam(tmpCam, R); tmpCam.updateMatrixWorld(); tmpCam.getWorldDirection(_pf);
  const hf = 2 * Math.atan(Math.tan(tmpCam.fov * D2R / 2) * aspV());
  return { x: tmpCam.position.x, z: tmpCam.position.z, yaw: Math.atan2(_pf.x, _pf.z), hf, R };
}
function txt(g, s, x, y, o) {
  o = o || {}; g.font = `${o.w || 600} ${o.size || 12}px "IBM Plex Sans Arabic", sans-serif`; g.direction = /[؀-ۿ]/.test(s) ? 'rtl' : 'ltr'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = g.measureText(s).width + 10, h = (o.size || 12) + 6;
  if (o.bg !== false) { g.fillStyle = o.bg || 'rgba(20,10,8,.82)'; rr(g, x - w / 2, y - h / 2, w, h, h / 2); g.fill(); }
  g.fillStyle = o.c || '#f5e9db'; g.fillText(s, x, y + .5);
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function arrowHead(g, x, y, ang, sz) { g.beginPath(); g.moveTo(x + Math.sin(ang) * sz, y + Math.cos(ang) * sz); g.lineTo(x + Math.sin(ang + 2.5) * sz * .7, y + Math.cos(ang + 2.5) * sz * .7); g.lineTo(x + Math.sin(ang - 2.5) * sz * .7, y + Math.cos(ang - 2.5) * sz * .7); g.closePath(); g.fill(); }
function itemR(s) { const o = OBJ[s.id]; return s.kind === 'human' ? .3 : Math.max(.25, (o && o.lastR) || .4); }
function handlePos(s) { const p = posOf(s), d = Math.max(itemR(s) + .25, 34 / PLAN.k); return { x: p.x + Math.sin(p.rot) * d, z: p.z + Math.cos(p.rot) * d }; }
function drawPlan(W, H) {
  const cv = PLAN.cv, g = PLAN.g, dpr = Math.min(devicePixelRatio || 1, 2);
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  g.fillStyle = 'rgba(16,8,6,.38)'; g.fillRect(0, 0, W, H);
  // grid in metres
  const k = PLAN.k, step = k >= 26 ? 1 : k >= 9 ? 5 : 10, a = s2w(0, 0), b = s2w(W, H);
  g.lineWidth = 1;
  for (let x = Math.floor(a.x / step) * step; x <= b.x; x += step) { const [sx] = w2s(x, 0); g.strokeStyle = x % (step * 5) === 0 ? 'rgba(255,240,220,.22)' : 'rgba(255,240,220,.09)'; g.beginPath(); g.moveTo(sx, 0); g.lineTo(sx, H); g.stroke(); }
  for (let z = Math.floor(a.z / step) * step; z <= b.z; z += step) { const [, sy] = w2s(0, z); g.strokeStyle = z % (step * 5) === 0 ? 'rgba(255,240,220,.22)' : 'rgba(255,240,220,.09)'; g.beginPath(); g.moveTo(0, sy); g.lineTo(W, sy); g.stroke(); }
  const [ox, oz] = w2s(0, 0); g.strokeStyle = 'rgba(242,162,58,.35)'; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(ox, 0); g.lineTo(ox, H); g.moveTo(0, oz); g.lineTo(W, oz); g.stroke(); g.setLineDash([]);
  // cameras: field of view
  const pc = RT.pc, poses = {};
  ST.cams.forEach((c, i) => {
    const P = camPose(c); if (!P) return; poses[c.id] = P;
    const [sx, sy] = w2s(P.x, P.z), on = pc && pc.cfg === c, sel = RT.ctxCam === c.id || (TAB === 'cams' && RT.cam === c.id), col = CAM_COLORS[i % 8], L = Math.max(70, (P.R && P.R.d ? P.R.d * k : 90));
    g.globalAlpha = on ? .2 : sel ? .14 : .07; g.fillStyle = col; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.sin(P.yaw - P.hf / 2) * L, sy + Math.cos(P.yaw - P.hf / 2) * L); g.lineTo(sx + Math.sin(P.yaw + P.hf / 2) * L, sy + Math.cos(P.yaw + P.hf / 2) * L); g.closePath(); g.fill();
    g.globalAlpha = on || sel ? .9 : .4; g.strokeStyle = col; g.lineWidth = on ? 2 : 1.2; g.beginPath(); g.moveTo(sx + Math.sin(P.yaw - P.hf / 2) * L, sy + Math.cos(P.yaw - P.hf / 2) * L); g.lineTo(sx, sy); g.lineTo(sx + Math.sin(P.yaw + P.hf / 2) * L, sy + Math.cos(P.yaw + P.hf / 2) * L); g.stroke(); g.globalAlpha = 1;
  });
  // light beams
  ST.items.filter(isLight).forEach(s => {
    const o = OBJ[s.id], p = posOf(s), [sx, sy] = w2s(p.x, p.z); if (!o || !o.film) return;
    if (s.type === 'bulb') { const gr = g.createRadialGradient(sx, sy, 0, sx, sy, 3 * k); gr.addColorStop(0, hexA(s.lc || '#fff1dc', .35)); gr.addColorStop(1, hexA(s.lc || '#fff1dc', 0)); g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, 3 * k, 0, TAU); g.fill(); return; }
    o.film.head.getWorldDirection(_pf); const yaw = Math.atan2(_pf.x, _pf.z), half = (s.angle || (s.type === 'spot' ? 30 : 60)) * D2R / 2, L = 4 * k;
    const gr = g.createRadialGradient(sx, sy, 0, sx, sy, L); gr.addColorStop(0, hexA(s.lc || '#fff1dc', .38)); gr.addColorStop(1, hexA(s.lc || '#fff1dc', 0));
    g.fillStyle = gr; g.beginPath(); g.moveTo(sx, sy); g.arc(sx, sy, L, Math.PI / 2 - yaw - half, Math.PI / 2 - yaw + half); g.closePath(); g.fill();
  });
  // paths of walks and runs
  ST.items.forEach(s => (s.actions || []).forEach((a, ai) => {
    if ((a.type !== 'walk' && a.type !== 'run') || a.tx == null) return;
    const st = evalItem(s, a.t), [x0, y0] = w2s(st.x, st.z), [x1, y1] = w2s(a.tx, a.tz), sel = RT.sel === s.id, done = RT.t >= a.t + a.dur;
    g.strokeStyle = sel ? '#79c4e6' : 'rgba(121,196,230,.55)'; g.lineWidth = sel ? 3 : 2; g.setLineDash(done ? [] : [8, 6]);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
    g.fillStyle = g.strokeStyle; arrowHead(g, x1, y1, Math.atan2(x1 - x0, y1 - y0), sel ? 12 : 9);
    if (sel) { g.fillStyle = '#0c1820'; g.strokeStyle = '#79c4e6'; g.lineWidth = 3; g.beginPath(); g.arc(x1, y1, 13, 0, TAU); g.fill(); g.stroke(); txt(g, `${a.type === 'run' ? 'يركض' : 'يمشي'} · ${fmt(a.t)}s`, x1, y1 + 26, { size: 11, c: '#bfe6f5' }); }
  }));
  // items
  const labels = [];
  ST.items.forEach(s => {
    const p = posOf(s), [sx, sy] = w2s(p.x, p.z), sel = RT.sel === s.id, R = Math.max(itemR(s) * k, s.kind === 'prop' ? 10 : 15), dirx = Math.sin(p.rot), diry = Math.cos(p.rot);
    g.save(); g.translate(sx, sy);
    if (s.kind === 'human') {
      g.fillStyle = s.outer && s.outer !== 'none' ? (s.outerC || s.top) : s.top; g.strokeStyle = sel ? '#f2a23a' : 'rgba(0,0,0,.65)'; g.lineWidth = sel ? 4 : 2;
      g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = s.skin; g.beginPath(); g.arc(dirx * R * .35, diry * R * .35, R * .42, 0, TAU); g.fill();
    } else if (s.kind === 'animal') {
      g.rotate(-p.rot); g.fillStyle = s.color || (ANIMALS[s.type] || {}).color || '#aaa'; g.strokeStyle = sel ? '#f2a23a' : 'rgba(0,0,0,.6)'; g.lineWidth = sel ? 4 : 2;
      g.beginPath(); g.ellipse(0, 0, R * .6, R, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(0, R * .95, R * .38, 0, TAU); g.fill(); g.stroke();
    } else if (isLight(s)) {
      g.fillStyle = s.lc || '#fff1dc'; g.strokeStyle = sel ? '#f2a23a' : '#2a1a14'; g.lineWidth = sel ? 4 : 2.5; g.beginPath(); g.arc(0, 0, 12, 0, TAU); g.fill(); g.stroke();
      g.strokeStyle = s.lc || '#fff1dc'; g.lineWidth = 2; for (let i = 0; i < 8; i++) { const an = i * TAU / 8; g.beginPath(); g.moveTo(Math.cos(an) * 16, Math.sin(an) * 16); g.lineTo(Math.cos(an) * 21, Math.sin(an) * 21); g.stroke(); }
    } else {
      const o = OBJ[s.id], fp = o && o.fp || { w: .8, d: .8 }; g.rotate(-p.rot);
      const w = Math.max(fp.w * k, 16), d = Math.max(fp.d * k, 16); g.fillStyle = hexA(s.color || (PROPS[s.type] || {}).color || '#999', .78); g.strokeStyle = sel ? '#f2a23a' : 'rgba(0,0,0,.55)'; g.lineWidth = sel ? 4 : 1.5;
      rr(g, -w / 2, -d / 2, w, d, Math.min(6, w / 4)); g.fill(); g.stroke();
    }
    g.restore();
    if (s.kind !== 'prop' || isLight(s) || sel) { g.fillStyle = sel ? '#f2a23a' : 'rgba(255,255,255,.9)'; const ex = sx + dirx * (R + 7), ey = sy + diry * (R + 7); arrowHead(g, ex, ey, p.rot, s.kind === 'prop' && !isLight(s) ? 8 : 10); }
    labels.push([s, sx, sy + R + 13, sel]);
    if (sel) { const h = handlePos(s), [hx, hy] = w2s(h.x, h.z); g.strokeStyle = 'rgba(242,162,58,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(hx, hy); g.stroke(); g.fillStyle = '#f2a23a'; g.beginPath(); g.arc(hx, hy, 13, 0, TAU); g.fill(); g.strokeStyle = '#1c0e0c'; g.lineWidth = 2.5; g.beginPath(); g.arc(hx, hy, 6, -2.4, 1.4); g.stroke(); arrowHead(g, hx + Math.cos(1.4) * 6, hy + Math.sin(1.4) * 6, -0.2, 5); }
  });
  const used = []; g.font = '600 12px "IBM Plex Sans Arabic", sans-serif';
  labels.sort((a, b) => b[3] - a[3]).forEach(([s, x, y, sel]) => { const w = g.measureText(s.name).width + 12, r = [x - w / 2, y - 9, w, 18]; if (!sel && used.some(u => r[0] < u[0] + u[2] && u[0] < r[0] + r[2] && r[1] < u[1] + u[3] && u[1] < r[1] + r[3])) return; used.push(r); txt(g, s.name, x, y, { size: sel ? 13 : 12, c: sel ? '#f2a23a' : '#f5e9db' }); });
  // camera icons (on top)
  ST.cams.forEach((c, i) => {
    const P = poses[c.id]; if (!P) return; const [sx, sy] = w2s(P.x, P.z), on = pc && pc.cfg === c, sel = RT.ctxCam === c.id, col = CAM_COLORS[i % 8];
    g.save(); g.translate(sx, sy); g.rotate(-P.yaw); g.fillStyle = '#1c0e0c'; g.strokeStyle = on || sel ? '#f2a23a' : col; g.lineWidth = on || sel ? 3 : 2;
    rr(g, -11, -16, 22, 18, 4); g.fill(); g.stroke(); g.fillStyle = col; g.beginPath(); g.moveTo(-7, 2); g.lineTo(7, 2); g.lineTo(10, 11); g.lineTo(-10, 11); g.closePath(); g.fill(); g.restore();
    txt(g, c.name + (c.mode === 'free' ? '' : ' · ' + c.size), sx, sy - 26, { size: 11, bg: 'rgba(20,10,8,.85)', c: on ? '#f2a23a' : '#f5e9db', w: 700 });
  });
  // scale bar and selected-item coordinates
  const m = step, len = m * k; g.strokeStyle = '#f5e9db'; g.lineWidth = 2; g.beginPath(); g.moveTo(W - 14, H - 16); g.lineTo(W - 14 - len, H - 16); g.moveTo(W - 14, H - 21); g.lineTo(W - 14, H - 11); g.moveTo(W - 14 - len, H - 21); g.lineTo(W - 14 - len, H - 11); g.stroke();
  txt(g, `${m} م`, W - 14 - len / 2, H - 30, { size: 11, bg: false });
  const s = itemById(RT.sel); if (s) { const p = posOf(s); txt(g, `x ${fmt(p.x, 1)} · z ${fmt(p.z, 1)} · ${Math.round(((p.rot / D2R) % 360 + 540) % 360 - 180)}°`, W / 2, H - 16, { size: 12, c: '#f2a23a' }); }
}
function hexA(hex, a) { const c = new THREE.Color(hex).convertLinearToSRGB(); return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`; }

/* ---------- touch and mouse ---------- */
function planHit(x, y) {
  const near = (wx, wz, r) => { const [sx, sy] = w2s(wx, wz); return Math.hypot(x - sx, y - sy) <= r; };
  const s = itemById(RT.sel);
  if (s) { const h = handlePos(s); if (near(h.x, h.z, 22)) return { type: 'rot', s }; }
  const order = s ? [s].concat(ST.items.filter(o => o !== s)) : ST.items;
  if (s) { const p = posOf(s), [px, py] = w2s(p.x, p.z), onItem = Math.hypot(x - px, y - py) <= 24;
    for (let ai = 0; ai < (s.actions || []).length; ai++) { const a = s.actions[ai]; if ((a.type === 'walk' || a.type === 'run') && a.tx != null && near(a.tx, a.tz, 22)) { const [kx, ky] = w2s(a.tx, a.tz); if (!onItem || Math.hypot(kx - px, ky - py) > 26) return { type: 'knob', s, ai }; } } }
  let best = null, bd = 1e9;
  for (const it of ST.items) { const p = posOf(it), [sx, sy] = w2s(p.x, p.z), r = Math.max(itemR(it) * PLAN.k, 22), d = Math.hypot(x - sx, y - sy); if (d <= r && d < bd) { bd = d; best = { type: 'item', s: it }; } }
  for (const c of ST.cams) { const P = camPose(c); if (!P) continue; const [sx, sy] = w2s(P.x, P.z), d = Math.hypot(x - sx, y - sy); if (d <= 22 && d < bd - 2) { bd = d; best = { type: 'cam', c, P }; } }
  return best;
}
function planDown(e) {
  const p = planLoc(e); PLAN.ptrs.set(e.pointerId, p); try { PLAN.cv.setPointerCapture(e.pointerId); } catch (_) { }
  if (PLAN.ptrs.size === 2) { if (PLAN.drag && PLAN.drag.lp) clearTimeout(PLAN.drag.lp); const [a, b] = [...PLAN.ptrs.values()]; PLAN.drag = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), k0: PLAN.k, m: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }; return; }
  if (RT.pipR && inRect(p.x, p.y, RT.pipR)) { PLAN.drag = { type: 'pip', x: p.x, y: p.y }; return; }
  const h = planHit(p.x, p.y), w = s2w(p.x, p.y);
  if (RT.pick) { if (window.onPickGround) onPickGround(V3(w.x, 0, w.z)); PLAN.drag = null; return; }
  if (h && h.type === 'rot') PLAN.drag = { type: 'rot', s: h.s, x: p.x, y: p.y };
  else if (h && h.type === 'knob') { RT.selAct = { id: h.s.id, ai: h.ai }; PLAN.drag = { type: 'knob', s: h.s, ai: h.ai, x: p.x, y: p.y }; }
  else if (h && h.type === 'item') { if (RT.sel !== h.s.id && window.onSelectItem) onSelectItem(h.s.id); PLAN.drag = { type: 'item', s: h.s, ox: h.s.x - w.x, oz: h.s.z - w.z, x: p.x, y: p.y }; }
  else if (h && h.type === 'cam') { if (window.onSelectCam) onSelectCam(h.c.id); PLAN.drag = { type: 'cam', c: h.c, x: p.x, y: p.y, base: h.P }; }
  else {
    PLAN.drag = { type: 'pan', x: p.x, y: p.y, cx: PLAN.cx, cz: PLAN.cz };
    const cur = itemById(RT.sel);
    if (cur && cur.kind !== 'prop') { const d0 = PLAN.drag; d0.lp = setTimeout(() => { if (PLAN.drag === d0 && !d0.moved) { PLAN.drag = null; if (window.onLongPressGround) onLongPressGround(V3(w.x, 0, w.z)); } }, 560); }
  }
  RT.dirty = true;
}
function planMove(e) {
  if (!PLAN.ptrs.has(e.pointerId)) return; const p = planLoc(e); PLAN.ptrs.set(e.pointerId, p);
  const D = PLAN.drag; if (!D) return;
  if (D.type === 'pinch' && PLAN.ptrs.size >= 2) {
    const [a, b] = [...PLAN.ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1, m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    PLAN.cx -= (m.x - D.m.x) / PLAN.k; PLAN.cz -= (m.y - D.m.y) / PLAN.k; D.m = m; planZoom(m, (D.k0 * d / D.d0) / PLAN.k); return;
  }
  if (Math.abs(p.x - D.x) + Math.abs(p.y - D.y) > 6) { D.moved = true; if (D.lp) { clearTimeout(D.lp); D.lp = null; } }
  if (!D.moved) return;
  const w = s2w(p.x, p.y);
  switch (D.type) {
    case 'pan': PLAN.cx = D.cx - (p.x - D.x) / PLAN.k; PLAN.cz = D.cz - (p.y - D.y) / PLAN.k; break;
    case 'item': D.s.x = +(w.x + D.ox).toFixed(2); D.s.z = +(w.z + D.oz).toFixed(2); break;
    case 'rot': { const q = posOf(D.s), ang = Math.atan2(w.x - q.x, w.z - q.z), d = (ang - q.rot) / D2R; D.s.rot = Math.round(((((D.s.rot || 0) + d) % 360) + 540) % 360 - 180); break; }
    case 'knob': { const a = D.s.actions[D.ai]; if (a) { a.tx = +w.x.toFixed(2); a.tz = +w.z.toFixed(2); const s0 = evalItem(D.s, a.t), dist = Math.hypot(a.tx - s0.x, a.tz - s0.z); a.dur = +Math.max(.4, dist / (a.type === 'run' ? 3.4 : 1.3)).toFixed(2); } break; }
    case 'cam': {
      const c = D.c;
      if (c.mode === 'free') { c.px = +w.x.toFixed(2); c.pz = +w.z.toFixed(2); }
      else if (c.mode === 'single' || c.mode === 'pair' || !c.mode) {
        const T = lmOf(c.target, RT.t); if (!T) break; const st = (OBJ[c.target] && OBJ[c.target].st) || { rot: 0 };
        const ang = Math.atan2(w.x - T.base.x, w.z - T.base.z), dist = Math.hypot(w.x - T.base.x, w.z - T.base.z), d0 = Math.hypot(D.base.x - T.base.x, D.base.z - T.base.z) / (D.dOff0 || (D.dOff0 = c.dOff || 1));
        c.side = Math.round(wrapA(ang - st.rot) / D2R); c.dOff = +clamp(dist / Math.max(.2, d0), .3, 3).toFixed(2);
      } else { if (!D.warned) { D.warned = 1; toast('هذه الكاميرا مرتبطة بكتف الشخصية أو عينيها: غيّر وضعها من قسم الكاميرات'); } }
      break;
    }
  }
  RT.dirty = true;
}
function planUp(e) {
  if (!PLAN.ptrs.has(e.pointerId)) return; PLAN.ptrs.delete(e.pointerId);
  const D = PLAN.drag; if (!D) return;
  if (D.type === 'pinch') { if (PLAN.ptrs.size === 0) PLAN.drag = null; return; }
  if (D.lp) clearTimeout(D.lp);
  if (D.type === 'pip') { if (window.onSwapView) onSwapView(); }
  else if (D.moved && (D.type === 'item' || D.type === 'rot' || D.type === 'knob')) { if (window.onItemMoved) onItemMoved(); }
  else if (D.moved && D.type === 'cam') { if (window.onCamEdited) onCamEdited(); }
  else if (D.type === 'pan' && !D.moved) {
    const now = performance.now(), p = planLoc(e);
    if (now - PLAN.lastTap < 330) { const w = s2w(p.x, p.y); PLAN.cx = w.x; PLAN.cz = w.z; PLAN.k = clamp(PLAN.k * 1.6, 4, 260); PLAN.lastTap = 0; }
    else { PLAN.lastTap = now; if (window.onSelectItem) onSelectItem(null); }
  }
  PLAN.drag = null; RT.dirty = true;
}
