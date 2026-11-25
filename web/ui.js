/* كادر — interface: panels, timeline, transport, storyboard, lessons, quiz, history */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (v, d = 1) => (+v || 0).toFixed(d);
const sv = (d, f) => `<svg viewBox="0 0 24 24" fill="${f ? 'currentColor' : 'none'}" stroke="${f ? 'none' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC = {
  play: sv('<path d="M7 4.5v15l12.5-7.5z"/>', 1), pause: sv('<rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/>', 1),
  start: sv('<path d="M6 5v14"/><path d="M18 5.5v13L9 12z"/>'), prev: sv('<path d="M15 6l-6 6 6 6"/>'), next: sv('<path d="M9 6l6 6-6 6"/>'),
  loop: sv('<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>'),
  undo: sv('<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'), redo: sv('<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'),
  dir: sv('<path d="M3 8l9-5 9 5-9 5z"/><path d="M3 13l9 5 9-5"/>'), cam: sv('<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3z"/>'),
  cine: sv('<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>'),
  board: sv('<rect x="3" y="4" width="8" height="7" rx="1"/><rect x="13" y="4" width="8" height="7" rx="1"/><rect x="3" y="13" width="8" height="7" rx="1"/><rect x="13" y="13" width="8" height="7" rx="1"/>'),
  plus: sv('<path d="M12 5v14M5 12h14"/>'), copy: sv('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>'),
  trash: sv('<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>'), up: sv('<path d="M6 15l6-6 6 6"/>'), home: sv('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'), file: sv('<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/><path d="M8 13h8M8 17h5"/>'), more: sv('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>', 1), scenes: sv('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5M14 4v5"/>'), down: sv('<path d="M6 9l6 6 6-6"/>'),
  pin: sv('<path d="M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/>'),
  img: sv('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>'),
  tScene: sv('<path d="M3 20l6-9 4 6 3-4 5 7z"/><circle cx="17" cy="6" r="2"/>'),
  tCast: sv('<circle cx="9" cy="6" r="3"/><path d="M4 21v-5a5 5 0 0 1 10 0v5"/><circle cx="18" cy="9" r="2"/><path d="M15 21v-3a3 3 0 0 1 6 0v3"/>'),
  tProps: sv('<path d="M12 3l4 6h-2.5l3.5 5h-2.5l3.5 5H6l3.5-5H7l3.5-5H8z"/><path d="M12 19v3"/>'),
  tEdit: sv('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.1 8.1L20 20M8.1 15.9L20 4"/>'),
  film: sv('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>'),
  scissors: sv('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.1 8.1L20 20M8.1 15.9L20 4"/>'),
  zin: sv('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/>'), zout: sv('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/>'),
  rotL: sv('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'), rotR: sv('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
  minus: sv('<path d="M5 12h14"/>'), edit: sv('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'), x: sv('<path d="M18 6L6 18M6 6l12 12"/>'),
  walk: sv('<circle cx="13" cy="4" r="2"/><path d="M10 22l2-7-3-3 1-5 4 3h4M9 12l-3 2-2 5"/>'), android: sv('<path d="M7 9h10v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"/><path d="M7 9a5 5 0 0 1 10 0M9 18v3M15 18v3M4 10v5M20 10v5M9 6l-1-2M15 6l1-2"/>'), dl: sv('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
  tLearn: sv('<path d="M2 7l10-4 10 4-10 4z"/><path d="M6 9v5c0 1.5 3 3 6 3s6-1.5 6-3V9"/>')
};
function tabsNow() { const t = [['scene', 'المشهد', 'tScene'], ['items', 'العناصر', 'tCast'], ['cams', 'الكاميرات', 'cam'], ['edit', 'المونتاج', 'tEdit']]; if (PRJ && PRJ.lessons) t.push(['learn', 'تعلّم', 'tLearn']); return t; }
const FLAG_INFO = {
  on: { c: 'ok', i: '✓', s: 'قطع نظيف', t: 'قطع على الحركة', d: 'القطع يقع أثناء حركة الشخصية، فتتبع العين الحركة ويختفي القطع.' },
  late: { c: 'warn', i: '!', s: 'قطع متأخر', t: 'قطع بعد انتهاء الحركة', d: 'الحركة انتهت قبل القطع بقليل فيبدو القطع مكشوفًا. اسحب نقطة القطع لتقع أثناء الحركة.' },
  cross: { c: 'bad', i: '×', s: 'عبور المحور!', t: 'عبور محور 180°', d: 'الكاميرا انتقلت إلى الجهة الأخرى من الخط الوهمي بين الشخصيتين، فتنقلب الاتجاهات على الشاشة ويرتبك المشاهد.' },
  jump: { c: 'warn', i: '!', s: 'قفزة!', t: 'قفزة (قاعدة 30°)', d: 'اللقطتان متقاربتان جدًا في الحجم والزاوية فيبدو القطع كقفزة. غيّر الزاوية 30° على الأقل أو غيّر الحجم بوضوح.' },
  same: { c: 'info', i: '=', s: '', t: 'الكاميرا نفسها', d: 'لا يوجد قطع حقيقي: اللقطتان من الكاميرا نفسها.' },
  plain: { c: 'info', i: '·', s: '', t: 'قطع عادي', d: 'لا مشكلة واضحة. اسأل نفسك: ما الذي يجب أن يراه المشاهد الآن؟' }
};
const ENV_SW = { studio: 'linear-gradient(#a3a09c,#6e6b68)', room: 'linear-gradient(#d9c6aa 58%,#8f6541 58%)', house: 'linear-gradient(#efe7da 52%,#2f7a64 52% 68%,#2b4f8a 68%)', classroom: 'linear-gradient(#efe6cf 40%,#2e4a3c 40% 72%,#cfc6b2 72%)', street: 'linear-gradient(#c9dced 36%,#e2c9a0 36% 74%,#4a4b4f 74%)', medina: 'linear-gradient(#e8a578 40%,#c47f4b 40% 80%,#d2ae80 80%)', park: 'linear-gradient(#c9dced 42%,#5f8a3a 42%)', desert: 'linear-gradient(#e8a578 48%,#ddb27a 48%)', cafe: 'linear-gradient(#efe7da 45%,#b5523b 45% 58%,#cbbfa9 58%)', alley: 'linear-gradient(90deg,#6f9fd6 30%,#cfc6b2 30% 70%,#8fb5e4 70%)', beach: 'linear-gradient(#c9dced 30%,#2f7fa8 30% 55%,#e3c999 55%)', rooftop: 'linear-gradient(#e8a578 50%,#c97a52 50%)', village: 'linear-gradient(#c9dced 40%,#c9a46b 40% 62%,#b48d5c 62%)', souk: 'linear-gradient(#c9dced 34%,#b5523b 34% 50%,#d2b385 50%)', road: 'linear-gradient(#c9dced 38%,#8fae5a 38% 56%,#4a4b4f 56%)' };
const KEY = 'kadr-project-v1';
const HIST = { s: [], i: -1 };
let TAB = 'scene', PPS = 50, ITEMCAT = 'people';

/* ---------- small builders ---------- */
const chip = (label, on, attrs) => `<button class="chip${on ? ' on' : ''}" ${attrs || ''}>${label}</button>`;
function outFmt(f, v) {
  switch (f) {
    case 'h': return v + ' سم'; case 'build': return Math.round(v * 100) + '%'; case 'scale': return '×' + fmt(v, 2);
    case 'rot': case 'side': case 'eAdj': case 'roll': case 'yaw': case 'pitch': case 'az': case 'angle': case 'tilt': return v + '°';
    case 'tod': { const hh = Math.floor(v), mm = Math.round((v - hh) * 60); return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); }
    case 'si': case 'amb': case 'exp': case 'power': return '×' + fmt(v, 2); case 'py': return fmt(v, 2) + ' م'; case 'dOff': case 'amt': return '×' + fmt(v, 2);
    case 'shake': return Math.round(v * 100) + '%'; case 'dist': case 'size': return v + ' م'; default: return v;
  }
}
const rng = (label, f, min, max, step, val, scope) => `<label class="rng"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" data-f="${f}" data-s="${scope}"><output>${outFmt(f, val)}</output></label>`;
const sws = (f, list, cur, scope) => `<div class="swatches">${list.map(c => `<button class="swatch${c === cur ? ' on' : ''}" style="background:${c}" data-act="set" data-f="${f}" data-v="${c}" data-s="${scope}" aria-label="لون"></button>`).join('')}<input type="color" value="${esc(cur)}" data-f="${f}" data-s="${scope}" aria-label="لون مخصص"></div>`;
const infoCard = x => x ? `<div class="card"><b>${x.ar} <bdi>${x.en}</bdi></b><p>${x.d}</p><p class="use">${x.u}</p></div>` : '';
const selOpts = (list, cur) => { const has = list.some(([v]) => +v === +cur); return (has ? '' : `<option value="${cur}" selected>${cur}°</option>`) + list.map(([v, t]) => `<option value="${v}"${+v === +cur ? ' selected' : ''}>${t}</option>`).join(''); };
function personIcon(c) {
  const ch = c.age === 'child', hy = ch ? 15 : 10, hr = ch ? 5.5 : 5, by = hy + hr + 1, bh = ch ? 14 : 20;
  const hair = c.hair === 'hijab' ? `<circle cx="20" cy="${hy}" r="${hr + 2}" fill="${c.hairC}"/>` : c.hair === 'bald' ? '' : `<path d="M${20 - hr} ${hy}a${hr} ${hr} 0 0 1 ${hr * 2} 0z" fill="${c.hairC}"/>`;
  return `<svg viewBox="0 0 40 40" width="32" height="32" aria-hidden="true"><rect x="${20 - 6}" y="${by}" width="12" height="${bh}" rx="5" fill="${c.top}"/>${hair}<circle cx="20" cy="${hy + .5}" r="${hr - .3}" fill="${c.skin}"/>${c.hair !== 'hijab' && c.hair !== 'bald' ? `<path d="M${20 - hr} ${hy}a${hr} ${hr} 0 0 1 ${hr * 2} 0z" fill="${c.hairC}"/>` : ''}</svg>`;
}
function angIcon(k) {
  const fig = '<circle cx="24" cy="9" r="3" fill="currentColor"/><path d="M24 13v9M24 22l-3 6M24 22l3 6M20 16h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  const cam = { eye: [5, 9], high: [5, 2], low: [5, 25], bird: [24, 1], worm: [9, 29], dutch: [5, 12] }[k];
  const look = { eye: [19, 9], high: [20, 8], low: [20, 12], bird: [24, 5], worm: [21, 14], dutch: [19, 12] }[k];
  const fr = k === 'dutch' ? '<rect x="13" y="3" width="22" height="26" rx="2" fill="none" stroke="currentColor" stroke-dasharray="3 2" transform="rotate(14 24 16)"/>' : '';
  return `<svg viewBox="0 0 40 32" width="40" height="30" aria-hidden="true">${fr}${fig}<circle cx="${cam[0]}" cy="${cam[1]}" r="3" fill="#f2a23a"/><path d="M${cam[0]} ${cam[1]}L${look[0]} ${look[1]}" stroke="#f2a23a" stroke-width="1.5" stroke-dasharray="2 2"/></svg>`;
}
function actLabel(a, s) { if (a.type === 'walk' && s && s.kind === 'prop') return 'يتحرك إلى'; return (ACTS[a.type] && ACTS[a.type].ar) || a.type; }
function tc(t) { const f = Math.max(0, Math.floor(t * 24 + 1e-6)), ss = Math.floor(f / 24), m = Math.floor(ss / 60), p = n => String(n).padStart(2, '0'); return `00:${p(m)}:${p(ss % 60)}:${p(f % 24)}`; }
function nid(p) { ST.seq = (ST.seq || 1) + 1; return p + ST.seq; }
function camName(i) { return String.fromCharCode(65 + i % 26) + (i >= 26 ? Math.floor(i / 26) + 1 : ''); }
function newCam(o, i) { return Object.assign({ id: nid('c'), name: camName(i == null ? ST.cams.length : i), mode: 'single', target: null, other: null, size: 'MS', angle: 'eye', side: 0, lens: 35, place: 'auto', move: 'static', dir: 1, amt: 1, shake: 0, eAdj: 0, dOff: 1, roll: 0 }, o); }
function newItemSpec(type, x, z, rot) {
  if (CAST[type]) { const c = JSON.parse(JSON.stringify(CAST[type])); return Object.assign({ kind: 'human', type, name: c.ar, x, z, rot, pose: 'stand', actions: [] }, c); }
  if (ANIMALS[type]) return { kind: 'animal', type, name: ANIMALS[type].ar, color: ANIMALS[type].color, x, z, rot, scale: 1, actions: [] };
  return { kind: 'prop', type, name: PROPS[type].ar, color: PROPS[type].color, x, z, rot, scale: 1, actions: [] };
}
function lessonState(k) {
  const L = LESSONS.find(l => l.k === k) || LESSONS[0];
  const S = { v: 1, seq: 1, env: L.env, light: L.light, aspect: L.aspect, items: [], cams: [], shots: [], bd: null, ov: { thirds: 1, safe: 0, lbl: 1 }, lesson: L.k };
  const prev = ST; ST = S; const idx = [];
  L.items.forEach(([type, x, z, rot, ex]) => { const s = newItemSpec(type, x, z, rot); Object.assign(s, JSON.parse(JSON.stringify(ex || {}))); s.id = nid('i'); s.actions = (s.actions || []).map(a => Object.assign({}, a)); S.items.push(s); idx.push(s.id); });
  L.cams.forEach((c, i) => S.cams.push(newCam(Object.assign({ follow: 'off' }, c, { target: idx[c.target], other: c.other != null ? idx[c.other] : null }), i)));
  L.shots.forEach(([ci, d]) => S.shots.push({ id: nid('s'), cam: S.cams[ci].id, dur: d, trans: 'cut' }));
  ST = prev; return S;
}
function emptyState() {
  const S = { v: 1, seq: 1, env: 'studio', light: 'day', aspect: '16:9', items: [], cams: [], shots: [], bd: null, ov: { thirds: 1, safe: 0, lbl: 1 }, lesson: null };
  const prev = ST; ST = S; const m = newItemSpec('man', 0, 0, 0); m.id = nid('i'); S.items.push(m);
  const c = newCam({ target: m.id, size: 'MS' }, 0); S.cams.push(c); S.shots.push({ id: nid('s'), cam: c.id, dur: 3, trans: 'cut' });
  ST = prev; return S;
}
function normalize(S) {
  S.ov = S.ov || { thirds: 1, safe: 0, lbl: 1 }; S.items = S.items || []; S.cams = S.cams || []; S.shots = S.shots || []; S.seq = S.seq || 100;
  S.items.forEach(s => { s.actions = s.actions || []; if (s.kind === 'human') s.acc = s.acc || {}; });
  S.shots = S.shots.filter(sh => S.cams.some(c => c.id === sh.cam));
  if (!ENVS[S.env]) S.env = 'studio'; if (!LIGHTS[S.light]) S.light = 'day';
  return S;
}

/* ---------- history & persistence ---------- */
let lastLight = null;
function refreshWorld() {
  syncEnv(); syncItems(); const lk = ST.light + ST.env + (ST.weather || '') + JSON.stringify(ST.lt || {}); if (lastLight !== lk) { applyLight(); lastLight = lk; }
  if (RT.sel && !itemById(RT.sel)) RT.sel = null;
  if (RT.cam && !camById(RT.cam)) RT.cam = ST.cams[0] ? ST.cams[0].id : null;
  if (RT.src !== 'edit' && !camById(RT.src)) RT.src = 'edit';
  if (RT.t > tlLen()) RT.t = 0;
  analyze(); RT.dirty = true;
}
function commit() {
  const s = JSON.stringify(ST);
  if (HIST.s[HIST.i] !== s) { HIST.s = HIST.s.slice(0, HIST.i + 1); HIST.s.push(s); if (HIST.s.length > 80) HIST.s.shift(); HIST.i = HIST.s.length - 1; }
  save(); refreshWorld(); renderAll();
}
function undo() { if (HIST.i > 0) { HIST.i--; ST = JSON.parse(HIST.s[HIST.i]); save(); refreshWorld(); renderAll(); toast('تراجع'); } }
function redo() { if (HIST.i < HIST.s.length - 1) { HIST.i++; ST = JSON.parse(HIST.s[HIST.i]); save(); refreshWorld(); renderAll(); } }
function setState(S, msg) { ST = normalize(S); RT.t = 0; RT.src = 'edit'; RT.sel = null; RT.selShot = null; RT.cam = ST.cams[0] ? ST.cams[0].id : null; RT.quiz = null; RT.camPrevOn = false; RT.view = 'cam'; fitOrbit(); commit(); if (msg) toast(msg); }
function fitOrbit() { const e = ENVS[ST.env] || ENVS.studio; ORB.r = e.r; ORB.tx = 0; ORB.tz = 0; ORB.ty = .9; ORB.th = .75; ORB.ph = e.ph || .55; RT.dirty = true; }

/* ---------- toast, modal, hint ---------- */
let toastT = null;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
function openModal(title, html) { $('#mt').textContent = title; $('#mb').innerHTML = html; $('#modal').hidden = false; }
function closeModal() { $('#modal').hidden = true; $('#mb').innerHTML = ''; }
let hintT = null;
function hint(m, ms, key) {
  if (key) { let c = {}; try { c = JSON.parse(localStorage.getItem('kadr-hints') || '{}'); } catch (e) { } if ((c[key] || 0) >= 2) return; c[key] = (c[key] || 0) + 1; try { localStorage.setItem('kadr-hints', JSON.stringify(c)); } catch (e) { } }
  const h = $('#hint'); h.textContent = m; h.classList.add('show'); clearTimeout(hintT); if (ms !== 0) hintT = setTimeout(() => h.classList.remove('show'), ms || 3200); }
function hideHint() { $('#hint').classList.remove('show'); }
async function copyText(t) { try { await navigator.clipboard.writeText(t); toast('تم النسخ'); } catch (e) { openModal('انسخ النص', `<p class="note">حدّد النص وانسخه يدويًا.</p><textarea readonly>${esc(t)}</textarea>`); } }

/* ---------- tabs & panels ---------- */
function renderTabs() { const T = tabsNow(); if (!T.some(t => t[0] === TAB)) TAB = 'scene'; $('#tabs').innerHTML = T.map(([k, t, ic]) => `<button data-tab="${k}" class="${TAB === k ? 'on' : ''}">${IC[ic]}<span>${t}</span></button>`).join(''); }
function switchTab(k) { TAB = k; renderTabs(); renderPanel(); if (k !== 'cams' && RT.camPrevOn) RT.camPrevOn = false; }
function renderAll() { renderPanel(); renderTL(); updTransport(); renderCtx(); renderSUI(); }
function renderPanel() {
  const p = $('#panel');
  const f = { scene: pScene, items: pItems, cast: pItems, props: pItems, cams: pCams, edit: pEdit, learn: pLearn }[TAB] || pScene;
  p.innerHTML = f();
}
function pScene() {
  return `<section><h3>المكان</h3><div class="grid2">${Object.entries(ENVS).map(([k, e]) => `<button class="tile${ST.env === k ? ' on' : ''}" data-act="env" data-v="${k}"><span class="sw" style="background:${ENV_SW[k]}"></span><span>${e.ar}</span></button>`).join('')}</div></section>
  ${lightSection()}
  <h3 style="margin-top:14px">الطقس</h3><div class="chips">${Object.entries(WEATHER).map(([k, v]) => chip(v, (ST.weather || 'clear') === k, `data-act="weather" data-v="${k}"`)).join('')}</div></section>
  <section><h3>نسبة العرض <small>Aspect ratio</small></h3><div class="chips">${ASPECTS.map(a => chip(`<bdi dir="ltr">${a.k}</bdi> <small>${a.ar}</small>`, ST.aspect === a.k, `data-act="aspect" data-v="${a.k}"`)).join('')}</div></section>
  <section><h3>خلفية من صورة</h3><p class="note">صوّر مكانًا حقيقيًا بهاتفك وضعه خلف المشهد كخلفية مسطّحة، مثل الخلفيات المرسومة في الاستوديوهات. المكان لا يتحول إلى مجسّم، لكنك ترى شخصياتك وكادراتك أمامه. تعمل أفضل مع «استوديو فارغ» أو الأماكن المفتوحة.</p>
  <div class="btns"><label class="btn">${IC.img} اختر صورة<input type="file" id="bdFile" accept="image/*" hidden></label>${RT.bdImg ? `<button class="btn danger" data-act="bdDel">إزالة الخلفية</button>` : ''}</div>
  ${RT.bdImg && ST.bd ? `<div class="row"><span>الوضع</span><div class="chips">${chip('خلف الهدف دائمًا', ST.bd.follow, 'data-act="bdMode" data-v="1"')}${chip('ثابتة في المكان', !ST.bd.follow, 'data-act="bdMode" data-v="0"')}</div></div>${rng('المسافة', 'dist', 2, 60, 1, ST.bd.dist, 'bd')}${!ST.bd.follow ? rng('الارتفاع', 'size', 3, 40, 1, ST.bd.size, 'bd') : ''}` : ''}</section>
  <section><h3>أدوات الكادر</h3><div class="chips">${chip('شبكة الأثلاث', ST.ov.thirds, 'data-act="ov" data-v="thirds"')}${chip('الهامش الآمن', ST.ov.safe, 'data-act="ov" data-v="safe"')}${chip('بطاقة اللقطة', ST.ov.lbl, 'data-act="ov" data-v="lbl"')}</div></section>
  <section><h3>المشروع</h3><p class="note">${PRJ ? `«${esc(PRJ.name)}»، المشهد ${PRJ.cur + 1} من ${PRJ.scenes.length}. ` : ''}كل مشهد له مكانه وشخصياته ولقطاته، ويُحفظ كل شيء تلقائيًا في هذا الجهاز. احفظه كملف لتنقله إلى جهاز آخر أو ترسله لتلامذتك.</p><div class="btns"><button class="btn" data-act="scenes">${IC.scenes} المشاهد</button><button class="btn" data-act="saveFile">${IC.dl} احفظ المشروع كملف</button><button class="btn" data-act="home">${IC.home} كل المشاريع</button></div></section>${appSection()}`;
}
function lightSection() {
  const L = lightOf(), o = ST.lt || {}, h = s => itemById(RT.sel) && itemById(RT.sel).kind !== 'prop';
  return `<section><h3>الإضاءة والوقت</h3><div class="chips">${Object.entries(LIGHTS).map(([k, l]) => chip(l.ar, ST.light === k && o.tod == null, `data-act="light" data-v="${k}"`)).join('')}</div>
  ${rng('الساعة', 'tod', 5, 23.5, .25, o.tod != null ? o.tod : L.tod, 'lt')}
  <details class="more"${o.az != null || o.si != null || o.amb != null || o.exp != null ? ' open' : ''}><summary>تحكم دقيق في الضوء</summary>
  ${rng('اتجاه الشمس', 'az', -180, 180, 5, Math.round(o.az != null ? o.az : L.az), 'lt')}${rng('قوة الشمس', 'si', 0, 2, .05, o.si != null ? o.si : 1, 'lt')}${rng('الضوء المحيط', 'amb', 0, 2, .05, o.amb != null ? o.amb : 1, 'lt')}${rng('التعريض', 'exp', .4, 2.5, .05, o.exp || 1, 'lt')}
  <div class="btns"><button class="btn" data-act="ltReset">${IC.undo} إعادة الضبط</button></div></details>
  <h4 class="sub">أضواء التصوير</h4><div class="btns"><button class="btn" data-act="add" data-v="spot">${IC.plus} كشاف</button><button class="btn" data-act="add" data-v="softbox">${IC.plus} ضوء ناعم</button><button class="btn" data-act="add" data-v="bulb">${IC.plus} لمبة</button><button class="btn pri" data-act="threePt">إضاءة ثلاثية</button></div>
  <p class="note">«الإضاءة الثلاثية» تضع ضوءًا رئيسيًا وضوء تعبئة وضوءًا خلفيًا موجّهة نحو الشخصية المختارة.</p></section>`;
}
const ICATS = [['people', 'أشخاص'], ['animals', 'حيوانات'], ['things', 'أشياء'], ['lights', 'أضواء']];
function pItems() {
  const s = itemById(RT.sel); let gal;
  if (ITEMCAT === 'people') gal = `<div class="grid3">${Object.entries(CAST).map(([k, c]) => `<button class="tile" data-act="add" data-v="${k}">${personIcon(c)}<span>${c.ar}</span></button>`).join('')}</div>`;
  else if (ITEMCAT === 'animals') gal = `<div class="grid5">${Object.entries(ANIMALS).map(([k, a]) => `<button class="tile" data-act="add" data-v="${k}"><span class="sw" style="background:${a.color};border-radius:50%"></span><span>${a.ar}</span></button>`).join('')}</div>`;
  else if (ITEMCAT === 'lights') gal = `<div class="grid3">${Object.entries(PROPS).filter(([k, p]) => p.light).map(([k, p]) => `<button class="tile" data-act="add" data-v="${k}"><span class="sw" style="background:radial-gradient(#fff3d6,#f2a23a 60%,#3a2a20)"></span><span>${p.ar}</span></button>`).join('')}<button class="tile" data-act="threePt"><span class="sw" style="background:conic-gradient(#ffcf9a 0 33%,#fff1dc 0 66%,#dce9ff 0)"></span><span>إضاءة ثلاثية</span></button></div>`;
  else if (ITEMCAT === 'mine') gal = typeof libGallery === 'function' ? libGallery() : '';
  else gal = `<div class="grid3">${Object.entries(PROPS).filter(([k, p]) => !p.light).map(([k, p]) => `<button class="tile" data-act="add" data-v="${k}"><span class="sw" style="background:${p.color}"></span><span>${p.ar}</span></button>`).join('')}</div>`;
  const cats = ICATS.concat(typeof libGallery === 'function' ? [['mine', 'مكتبتي']] : []);
  return `<section><h3>أضف إلى المشهد</h3><div class="chips seg1">${cats.map(([k, t]) => chip(t, ITEMCAT === k, `data-act="icat" data-v="${k}"`)).join('')}</div><div style="margin-top:10px">${gal}</div></section>
  <section><h3>في المشهد <small>${ST.items.length}</small></h3>${listChips(ST.items)}</section>
  ${s ? (s.kind === 'human' ? edHuman(s) : s.kind === 'animal' ? edAnimal(s) : PROPS[s.type] && PROPS[s.type].light ? edLight(s) : edProp(s)) + edActs(s) : `<section><p class="note">اضغط على أي عنصر في الكادر أو في «عين المخرج» لتعديله وتحريكه.</p></section>`}`;
}
function edLight(s) {
  const opts = ST.items.filter(x => x.id !== s.id && !(PROPS[x.type] && PROPS[x.type].light)).map(x => `<option value="${x.id}"${x.id === s.aim ? ' selected' : ''}>${esc(x.name)}</option>`).join('');
  return `<section>${edHead(s)}${rng('القوة', 'power', 0, 3, .05, s.power != null ? s.power : 1, 'item')}
  ${s.type !== 'bulb' ? rng('اتساع الحزمة', 'angle', 8, 85, 1, s.angle || (s.type === 'spot' ? 30 : 60), 'item') : ''}
  <div class="row"><span>لون الضوء</span><div class="swatches">${LIGHT_COLORS.map(([c, t]) => `<button class="swatch${(s.lc || '#fff1dc') === c ? ' on' : ''}" style="background:${c}" data-act="set" data-s="item" data-f="lc" data-v="${c}" aria-label="${t}" title="${t}"></button>`).join('')}</div></div>
  ${s.type !== 'bulb' ? `<div class="row"><span>موجّه نحو</span><select data-f="aim" data-s="item"><option value="">اتجاه ثابت</option>${opts}</select></div>${s.aim ? '' : rng('الميل', 'tilt', -80, 40, 1, s.tilt != null ? s.tilt : -15, 'item')}` : ''}
  ${rng('الاتجاه', 'rot', -180, 180, 1, s.rot || 0, 'item')}</section>`;
}
function listChips(arr) { return arr.length ? `<div class="chips">${arr.map(h => chip(esc(h.name), h.id === RT.sel, `data-act="sel" data-v="${h.id}"`)).join('')}</div>` : '<p class="note">لا يوجد شيء بعد.</p>'; }
function pCast() {
  const hs = ST.items.filter(s => s.kind !== 'prop'), s = itemById(RT.sel), live = s && s.kind !== 'prop';
  return `<section><h3>أضف شخصية</h3><div class="grid3">${Object.entries(CAST).map(([k, c]) => `<button class="tile" data-act="add" data-v="${k}">${personIcon(c)}<span>${c.ar}</span></button>`).join('')}</div>
  <h3 style="margin-top:14px">أضف حيوانًا</h3><div class="grid5">${Object.entries(ANIMALS).map(([k, a]) => `<button class="tile" data-act="add" data-v="${k}"><span class="sw" style="background:${a.color};border-radius:50%"></span><span>${a.ar}</span></button>`).join('')}</div></section>
  <section><h3>في المشهد</h3>${listChips(hs)}</section>
  ${live ? (s.kind === 'human' ? edHuman(s) : edAnimal(s)) + edActs(s) : `<section><p class="note">اختر شخصية لتعديل شكلها وحركتها، أو انقر عليها في «عين المخرج» واسحبها لتغيير مكانها.</p></section>`}`;
}
function edHead(s) { return `<div class="edh"><input type="text" value="${esc(s.name)}" data-f="name" data-s="item" aria-label="الاسم"><button class="mini" data-act="dup" aria-label="نسخ">${IC.copy}</button><button class="mini" data-act="del" aria-label="حذف">${IC.trash}</button></div>`; }
function edHuman(s) {
  return `<section>${edHead(s)}
  ${rng('الطول', 'h', 50, 215, 1, s.h, 'item')}${rng('البنية', 'build', .75, 1.45, .01, s.build || 1, 'item')}${rng('الاتجاه', 'rot', -180, 180, 1, s.rot || 0, 'item')}
  <div class="row"><span>الوضعية</span><div class="chips">${Object.entries(POSE_AR).map(([k, v]) => chip(v, (s.pose || 'stand') === k, `data-act="set" data-f="pose" data-v="${k}" data-s="item"`)).join('')}</div></div>
  <div class="row"><span>العمر</span><div class="chips">${[['child', 'طفل'], ['adult', 'بالغ'], ['elder', 'مسنّ']].map(([k, v]) => chip(v, s.age === k, `data-act="set" data-f="age" data-v="${k}" data-s="item"`)).join('')}</div></div>
  <div class="row"><span>البشرة</span>${sws('skin', SKINS, s.skin, 'item')}</div>
  <div class="row"><span>الشعر</span><div class="chips">${Object.entries(HAIRS).map(([k, v]) => chip(v, s.hair === k, `data-act="set" data-f="hair" data-v="${k}" data-s="item"`)).join('')}</div></div>
  <div class="row"><span>${s.hair === 'hijab' ? 'لون الحجاب' : 'لون الشعر'}</span>${sws('hairC', s.hair === 'hijab' ? CLOTH : HAIRC, s.hairC, 'item')}</div>
  <div class="row"><span>اللباس العلوي</span>${sws('top', CLOTH, s.top, 'item')}</div>
  <div class="row"><span>فوقه</span><div><div class="chips">${Object.entries(OUTERS).map(([k, v]) => chip(v, (s.outer || 'none') === k, `data-act="set" data-f="outer" data-v="${k}" data-s="item"`)).join('')}</div>${s.outer && s.outer !== 'none' ? `<div style="margin-top:8px">${sws('outerC', ['#f4f4f0'].concat(CLOTH), s.outerC || '#2f3b52', 'item')}</div>` : ''}</div></div>
  <div class="row"><span>اللباس السفلي</span><div><div class="chips">${Object.entries(BTYPES).map(([k, v]) => chip(v, s.btype === k, `data-act="set" data-f="btype" data-v="${k}" data-s="item"`)).join('')}</div><div style="margin-top:8px">${sws('bot', CLOTH, s.bot, 'item')}</div></div></div>
  <div class="row"><span>الأكمام</span><div class="chips">${chip('طويلة', !!s.sleeves, 'data-act="set" data-f="sleeves" data-v="1" data-n="1" data-s="item"')}${chip('قصيرة', !s.sleeves, 'data-act="set" data-f="sleeves" data-v="0" data-n="1" data-s="item"')}</div></div>
  <div class="row"><span>إكسسوارات</span><div class="chips">${Object.entries(ACCS).map(([k, v]) => chip(v, s.acc && s.acc[k], `data-act="acc" data-v="${k}"`)).join('')}</div></div></section>`;
}
function edAnimal(s) {
  return `<section>${edHead(s)}${rng('الحجم', 'scale', .4, 2, .05, s.scale || 1, 'item')}${rng('الاتجاه', 'rot', -180, 180, 1, s.rot || 0, 'item')}
  <div class="row"><span>اللون</span>${sws('color', ['#d58b45', '#9b6a43', '#6b3f26', '#f1ece0', '#8a93a3', '#2b2b2b', '#e8e2d6', '#b8b0a2'], s.color, 'item')}</div></section>`;
}
function edProp(s) {
  return `<section>${edHead(s)}${rng('الحجم', 'scale', .3, 3, .05, s.scale || 1, 'item')}${rng('الاتجاه', 'rot', -180, 180, 1, s.rot || 0, 'item')}
  <div class="row"><span>اللون</span>${sws('color', [PROPS[s.type].color].concat(CLOTH.slice(0, 9)), s.color, 'item')}</div></section>`;
}
function edActs(s) {
  const types = Object.entries(ACTS).filter(([k, a]) => a.who === 'all' || (a.who === 'living' && s.kind !== 'prop') || (a.who === 'human' && s.kind === 'human'));
  const rows = (s.actions || []).map((a, i) => {
    const picking = RT.pick && RT.pick.id === s.id && RT.pick.ai === i;
    let extra = '';
    if (a.type === 'walk' || a.type === 'run') extra = `<button class="mini" data-act="showPath" data-ai="${i}">${IC.pin} عدّل الوجهة</button>`;
    if (a.type === 'eyes') extra = `<select data-ai="${i}" data-af="v" aria-label="الاتجاه">${selOpts([[0, 'إلى الأمام'], [-1, 'يمينًا'], [1, 'يسارًا'], [2, 'إلى الأعلى'], [-2, 'إلى الأسفل']], a.v == null ? 1 : a.v)}</select>`;
    if (a.type === 'turn') extra = `<select data-ai="${i}" data-af="v" aria-label="الاتجاه">${selOpts([[-180, 'استدارة كاملة'], [-90, 'يمينًا 90°'], [-45, 'يمينًا 45°'], [45, 'يسارًا 45°'], [90, 'يسارًا 90°']], a.v == null ? 90 : a.v)}</select>`;
    if (a.type === 'watch') extra = `<select data-ai="${i}" data-af="to" aria-label="يتابع من">${ST.items.filter(x => x.id !== s.id).map(x => `<option value="${x.id}"${x.id === a.to ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`;
    if (a.type === 'look') extra = `<select data-ai="${i}" data-af="v" aria-label="الاتجاه">${selOpts([[-70, 'إلى اليمين'], [-30, 'قليلًا يمينًا'], [0, 'إلى الأمام'], [30, 'قليلًا يسارًا'], [70, 'إلى اليسار']], a.v == null ? 60 : a.v)}</select>`;
    return `<div class="actrow"><div class="at">${actLabel(a, s)}</div><button class="mini" data-act="delAct" data-ai="${i}" aria-label="حذف الحركة">${IC.trash}</button>
    <div class="ap"><label>من <input type="number" step=".1" min="0" value="${fmt(a.t)}" data-ai="${i}" data-af="t"></label><label>المدة <input type="number" step=".1" min=".1" value="${fmt(a.dur)}" data-ai="${i}" data-af="dur"></label>${extra}</div></div>`;
  }).join('');
  return `<section><h3>الحركة في الزمن</h3><p class="note">كل حركة تبدأ في ثانية محددة وتظهر في التايم لاين باسم الشخصية. للمشي: اضغط مطولًا على الأرض في «عين المخرج»، أو اسحب الدائرة الزرقاء لتغيير الوجهة.</p>${rows}
  <div class="addact"><select id="actType" aria-label="نوع الحركة">${ACT_GROUPS.map(([g, ar]) => { const l = types.filter(([, a]) => a.g === g); return l.length ? `<optgroup label="${ar}">${l.map(([k]) => `<option value="${k}">${actLabel({ type: k }, s)}</option>`).join('')}</optgroup>` : ''; }).join('')}</select><button class="btn pri" data-act="addAct">${IC.plus} عند <bdi dir="ltr">${fmt(RT.t)}s</bdi></button></div></section>`;
}
function pProps() {
  const ps = ST.items.filter(s => s.kind === 'prop'), s = itemById(RT.sel), isP = s && s.kind === 'prop';
  return `<section><h3>أضف عنصرًا</h3><div class="grid3">${Object.entries(PROPS).map(([k, p]) => `<button class="tile" data-act="add" data-v="${k}"><span class="sw" style="background:${p.color}"></span><span>${p.ar}</span></button>`).join('')}</div></section>
  <section><h3>العناصر المضافة</h3>${listChips(ps)}</section>
  ${isP ? edProp(s) + edActs(s) : `<section><p class="note">العناصر الثابتة في المكان (الجدران والأثاث الأصلي) جزء من الديكور. العناصر التي تضيفها هنا يمكنك تحريكها وتدويرها وتغيير لونها، بل وتحريكها في الزمن (سيارة تمر مثلًا).</p></section>`}`;
}
function sizeAr(c) { return !c ? '' : c.mode === 'free' ? 'حرة' : SZ[c.size].ar; }
function sizeK(c) { return !c ? '' : c.mode === 'free' ? 'FREE' : c.size; }
function sizeCat(c) { return !c ? 0 : c.mode === 'free' ? 1 : SZ[c.size].cat; }
function pCams() {
  let c = camById(RT.cam) || ST.cams[0]; if (c) RT.cam = c.id;
  const head = `<section><h3>الكاميرات</h3><div class="chips">${ST.cams.map((k, i) => chip(`<span class="dot" style="background:${CAM_COLORS[i % 8]}"></span><b>${k.name}</b> <small>${sizeAr(k)}</small>`, c && k.id === c.id, `data-act="selCam" data-v="${k.id}"`)).join('')}</div>
  <div class="btns" style="margin-top:10px"><button class="btn" data-act="newCam">${IC.plus} كاميرا على شخصية</button><button class="btn" data-act="newFree">${IC.plus} كاميرا حرة</button></div></section>`;
  if (!c) return head + `<section><p class="note">الكاميرا على شخصية تتبع حجمها وزاويتها تلقائيًا. الكاميرا الحرة تضعها أنت في أي مكان، وتدخل الشخصيات إلى كادرها.</p></section>`;
  const mode = c.mode || 'single', free = mode === 'free', ofs = mode === 'ots' || mode === 'pov', mv = MV[c.move];
  const opts = (sel, ex) => ST.items.filter(s => s.id !== ex).map(s => `<option value="${s.id}"${s.id === sel ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
  const f = RT.R && RT.pc && RT.pc.cfg === c ? Math.round(RT.R.f) : null;
  let h = head + `<section>
  <div class="btns"><button class="btn pri" data-act="addShot">${IC.plus} أضف لقطة للمونتاج</button><button class="btn${RT.camPrevOn ? ' pri' : ''}" data-act="prevMove">${RT.camPrevOn ? IC.pause : IC.play} معاينة الحركة</button><button class="mini" data-act="dupCam" aria-label="نسخ الكاميرا">${IC.copy}</button><button class="mini" data-act="delCam" aria-label="حذف الكاميرا">${IC.trash}</button></div>
  <div class="row"><span>النوع</span><div class="chips">${MODES.map(m => chip(`${m.ar} <small><bdi>${m.en}</bdi></small>`, mode === m.k, `data-act="setMode" data-v="${m.k}"`)).join('')}</div></div>
  ${!free ? `<div class="row"><span>الهدف</span><select data-f="target" data-s="cam">${opts(c.target)}</select></div>` : ''}
  ${mode === 'pair' || ofs ? `<div class="row"><span>${mode === 'pair' ? 'مع' : mode === 'ots' ? 'فوق كتف' : 'بعيني'}</span><select data-f="other" data-s="cam"><option value="">—</option>${opts(c.other, c.target)}</select></div>` : ''}
  <p class="note">${MODE_INFO[mode]}${(mode === 'pair' || ofs) && !c.other ? ' <b>اختر الشخصية الثانية.</b>' : ''}</p>
  ${!free ? `<div class="row"><span>مع الهدف</span><div class="chips">${[['pan', 'تلتفت معه'], ['move', 'تتحرك معه'], ['off', 'لا تتبعه']].map(([k, t]) => chip(t, camFollow(c) === k, `data-act="set" data-f="follow" data-v="${k}" data-s="cam"`)).join('')}</div></div>
  <p class="note">${camFollow(c) === 'pan' ? 'الكاميرا تبقى في مكانها وتدور لتُبقي الهدف في الكادر وهو يتحرك.' : camFollow(c) === 'move' ? 'الكاميرا تتنقل مع الهدف وتحافظ على الحجم والزاوية نفسيهما.' : 'الكادر يُضبط في بداية اللقطة فقط، والهدف يستطيع الخروج منه.'}</p>
  <button class="btn" data-act="freeze">${IC.pin} ثبّت الكاميرا في مكانها الحالي</button><p class="note" style="margin-top:6px">تتحول إلى كاميرا حرة بالكادر نفسه.</p>` : ''}</section>`;
  if (free) {
    h += `<section><h3>مكان الكاميرا</h3>${rng('الارتفاع', 'py', .1, 12, .05, c.py == null ? 1.5 : c.py, 'cam')}${rng('الاتجاه', 'yaw', -180, 180, 1, c.yaw || 0, 'cam')}${rng('الإمالة', 'pitch', -89, 60, 1, c.pitch || 0, 'cam')}
    <div class="row"><span>تنظر دائمًا إلى</span><select data-f="look" data-s="cam"><option value="">لا أحد (اتجاه ثابت)</option>${ST.items.map(s => `<option value="${s.id}"${s.id === c.look ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
    <p class="note">إن اخترت شخصًا، تبقى الكاميرا في مكانها وتدور لتتبعه أينما ذهب.</p>
    <div class="addact"><select id="aimSel" aria-label="وجّهها نحو">${ST.items.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select><button class="btn" data-act="aimAt">وجّهها نحوه</button></div>
    <div class="btns" style="margin-top:8px"><button class="btn${RT.pick && RT.pick.kind === 'aim' ? ' pri' : ''}" data-act="aimPick">${IC.pin} انقر على الأرض لتوجيهها</button></div>
    <p class="note" style="margin-top:8px">اسحب الكاميرا في «عين المخرج» لتحريكها، واسحب داخل الكادر لتدويرها، والعجلة أو إصبعان لتقديمها وإرجاعها.</p></section>
    <section><h3>زاوية جاهزة</h3><div class="grid3">${ANGLES.map(a => `<button class="tile" data-act="freeAngle" data-v="${a.k}">${angIcon(a.k)}<span>${a.ar}</span></button>`).join('')}</div></section>`;
  } else {
    h += `<section><h3>حجم اللقطة <small>Shot size</small></h3><div class="grid5">${SIZES.map(s => `<button class="tile${c.size === s.k ? ' on' : ''}" data-act="set" data-f="size" data-v="${s.k}" data-s="cam"><span class="ab"><bdi>${s.k}</bdi></span><span>${s.ar}</span></button>`).join('')}</div>${infoCard(SZ[c.size])}</section>
    <section><h3>الزاوية <small>Angle</small></h3><div class="grid3">${ANGLES.map(a => `<button class="tile${c.angle === a.k ? ' on' : ''}" data-act="set" data-f="angle" data-v="${a.k}" data-s="cam">${angIcon(a.k)}<span>${a.ar}</span></button>`).join('')}</div>${infoCard(ANG[c.angle])}</section>
    <section><h3>موقع الكاميرا</h3>
    ${mode === 'ots' ? `<div class="chips">${chip('الكتف الأيسر', (c.side || 0) >= 0, 'data-act="set" data-f="side" data-v="10" data-n="1" data-s="cam"')}${chip('الكتف الأيمن', (c.side || 0) < 0, 'data-act="set" data-f="side" data-v="-10" data-n="1" data-s="cam"')}</div>`
      : mode === 'pov' ? `<p class="note">الكاميرا مكان عيني الشخصية الثانية، تنظر إلى الهدف.</p>`
        : `<div class="chips">${SIDES.map(sd => chip(sd.ar, (c.side || 0) === sd.v, `data-act="set" data-f="side" data-v="${sd.v}" data-n="1" data-s="cam"`)).join('')}</div>${rng('حول الهدف', 'side', -180, 180, 1, c.side || 0, 'cam')}`}
    <p class="note">اسحب داخل الكادر لتدوير الكاميرا حول الهدف، واستعمل العجلة أو إصبعين للاقتراب والابتعاد.</p></section>`;
  }
  h += `<section><h3>العدسة <small>Focal length</small></h3>
  ${ofs ? `<p class="note">هنا تُحسب العدسة تلقائيًا من حجم اللقطة${f ? `: ≈ <bdi dir="ltr">${f}mm</bdi>` : ''}.</p>` : `<div class="chips">${LENSES.map(x => chip(`<bdi dir="ltr">${x}mm</bdi>`, c.lens === x, `data-act="set" data-f="lens" data-v="${x}" data-n="1" data-s="cam"`)).join('')}</div><p class="note" style="margin-top:8px">${lensNote(c.lens)}${free ? '' : ' الحجم يبقى نفسه، والكاميرا تقترب أو تبتعد لتعوّض.'}</p>`}</section>`;
  if (!free && mode !== 'pair' && mode !== 'pov') h += `<section><h3>التكوين <small>Rule of thirds</small></h3><div class="chips">${[['auto', 'تلقائي'], ['l', 'الثلث الأيسر'], ['c', 'الوسط'], ['r', 'الثلث الأيمن']].map(([k, v]) => chip(v, (c.place || 'auto') === k, `data-act="set" data-f="place" data-v="${k}" data-s="cam"`)).join('')}</div><p class="note" style="margin-top:8px">«تلقائي» يترك مساحة أمام وجه الشخصية في اتجاه نظرها، وتُسمّى <bdi>Lead room</bdi>.</p></section>`;
  h += `<section><h3>حركة الكاميرا <small>Movement</small></h3><div class="grid3">${MOVES.filter(m => !(free && m.k === 'track')).map(m => `<button class="tile${c.move === m.k ? ' on' : ''}" data-act="set" data-f="move" data-v="${m.k}" data-s="cam"><span>${m.ar}</span><small><bdi>${m.en}</bdi></small></button>`).join('')}</div>
  ${mv && mv.dirs ? `<div class="chips" style="margin-top:10px">${mv.dirs.map((d, i) => chip(d, (c.dir || 1) === (i ? -1 : 1), `data-act="set" data-f="dir" data-v="${i ? -1 : 1}" data-n="1" data-s="cam"`)).join('')}</div>` : ''}
  ${c.move !== 'static' && c.move !== 'track' ? rng('المقدار', 'amt', .2, 2.5, .05, c.amt == null ? 1 : c.amt, 'cam') : ''}
  ${c.move !== 'hand' ? rng('اهتزاز اليد', 'shake', 0, 1.5, .05, c.shake || 0, 'cam') : ''}${infoCard(mv)}</section>
  <section><h3>ضبط دقيق</h3>${free ? '' : rng('ارتفاع الزاوية', 'eAdj', -40, 40, 1, c.eAdj || 0, 'cam') + rng('المسافة', 'dOff', .3, 3, .01, c.dOff || 1, 'cam')}${rng('إمالة الأفق', 'roll', -45, 45, 1, c.roll || 0, 'cam')}<button class="btn" data-act="resetFine">إعادة الضبط</button></section>`;
  return h;
}
function camSummary(c) { if (!c) return ''; if (c.mode === 'free') return `حرة · ${MV[c.move].ar} · <bdi dir="ltr">${c.lens}mm</bdi>`; const t = itemById(c.target), o = c.other && itemById(c.other); const md = c.mode && c.mode !== 'single' ? MODES.find(m => m.k === c.mode).ar + ' · ' : ''; return `${ANG[c.angle].ar} · ${MV[c.move].ar} · ${md}${esc(t ? t.name : '')}${o ? ' / ' + esc(o.name) : ''}`; }
function pEdit() {
  const st = shotStarts();
  const camOpts = cur => ST.cams.map(c => `<option value="${c.id}"${c.id === cur ? ' selected' : ''}>الكاميرا ${c.name} — ${sizeAr(c)}</option>`).join('');
  const rows = ST.shots.map((sh, i) => {
    const c = camById(sh.cam), ci = ST.cams.indexOf(c);
    return `<div class="shotrow${RT.selShot === sh.id ? ' sel' : ''}" data-act="selShot" data-v="${sh.id}"><div class="n">${i + 1}</div><div>
    <div class="meta"><b><span class="dot" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${CAM_COLORS[ci % 8]}"></span> ${c ? c.name : '?'} · ${sizeAr(c)} <bdi>${c && c.mode !== 'free' ? c.size : ''}</bdi></b><br><span style="color:var(--mut)">${camSummary(c)} · <bdi dir="ltr">${fmt(st[i])}s</bdi></span></div>
    <div class="ctr"><button class="mini" data-act="dur" data-v="-0.2" data-i="${i}" aria-label="أقصر">−</button><bdi dir="ltr" style="min-width:44px;text-align:center">${fmt(sh.dur)}s</bdi><button class="mini" data-act="dur" data-v="0.2" data-i="${i}" aria-label="أطول">+</button>
    <select data-shot="${i}" data-sf="trans" aria-label="الانتقال" style="width:auto;min-height:34px;padding:2px 8px">${[['cut', 'قطع'], ['dissolve', 'مزج'], ['fade', 'تلاشٍ للأسود']].map(([k, v]) => `<option value="${k}"${(sh.trans || 'cut') === k ? ' selected' : ''}>${i === 0 && k !== 'cut' ? 'ظهور من الأسود' : v}</option>`).join('')}</select>
    <select data-shot="${i}" data-sf="cam" aria-label="الكاميرا" style="width:auto;min-height:34px;padding:2px 8px">${camOpts(sh.cam)}</select>
    <button class="mini" data-act="mvShot" data-v="-1" data-i="${i}" aria-label="إلى الأعلى">${IC.up}</button><button class="mini" data-act="mvShot" data-v="1" data-i="${i}" aria-label="إلى الأسفل">${IC.down}</button><button class="mini" data-act="dupShot" data-i="${i}" aria-label="نسخ">${IC.copy}</button><button class="mini" data-act="delShot" data-i="${i}" aria-label="حذف">${IC.trash}</button></div></div></div>`;
  }).join('');
  return `<section><div class="btns"><button class="btn pri" data-act="playEdit">${IC.play} شغّل المونتاج</button><button class="btn" data-act="cine">${IC.cine} عرض سينمائي</button><button class="btn" data-act="export">${IC.film} تصدير فيديو</button><button class="btn" data-act="board">${IC.board} لوحة القصة</button><button class="btn" data-act="copyList">${IC.copy} نسخ قائمة اللقطات</button></div></section>
  <section><h3>اللقطات <small>${ST.shots.length} · <bdi dir="ltr">${fmt(totalDur())}s</bdi></small></h3>${rows || '<p class="note">لا توجد لقطات بعد.</p>'}
  ${ST.cams.length ? `<div class="addact"><select id="shotCam" aria-label="الكاميرا">${camOpts(RT.cam)}</select><button class="btn pri" data-act="addShotSel">${IC.plus} أضف</button></div>` : ''}</section>
  <section><h3>ملاحظات المونتاج</h3>${flagsHtml()}</section>`;
}
function flagsHtml() {
  if (!RT.flags.length) return '<p class="note">أضف لقطتين على الأقل لترى ملاحظات القطع.</p>';
  return RT.flags.map(f => (f.list.length ? f.list : ['plain']).map(k => { const F = FLAG_INFO[k]; return `<div class="flag"><i class="${F.c}">${F.i}</i><div><b>القطع ${f.j} <bdi dir="ltr">(${fmt(f.C)}s)</bdi>: ${F.t}</b><br><span style="color:var(--mut)">${F.d}</span></div></div>`; }).join('')).join('');
}
function quizHtml() {
  const q = RT.quiz;
  if (!q) return `<p class="note">تعرض الشاشة لقطة عشوائية دون بطاقتها، وعليك أن تتعرف على حجمها أو زاويتها.</p><button class="btn pri" data-act="quiz">ابدأ الاختبار</button>${RT.qLast ? `<p class="note" style="margin-top:8px">آخر نتيجة: ${RT.qLast}</p>` : ''}`;
  const L = k => q.kind === 'size' ? SZ[k] : ANG[k];
  return `<div class="quiz"><div class="q">${q.kind === 'size' ? 'ما حجم هذه اللقطة؟' : 'ما زاوية هذه اللقطة؟'}</div><div class="opts">${q.opts.map(k => `<button class="chip${q.picked ? (k === q.ans ? ' right' : k === q.picked ? ' wrong' : '') : ''}" data-act="qAns" data-v="${k}"${q.picked ? ' disabled' : ''}>${L(k).ar}</button>`).join('')}</div>
  ${q.picked ? `<div class="fb"><b>${q.picked === q.ans ? 'صحيح!' : 'الجواب: ' + L(q.ans).ar}</b> — ${L(q.ans).d}</div>` : ''}
  <div class="btns" style="margin-top:10px;align-items:center"><span class="note" style="margin:0">النتيجة: ${q.right} من ${q.n}</span><div class="grow"></div>${q.picked ? '<button class="btn pri" data-act="qNext">التالي</button>' : ''}<button class="btn" data-act="qEnd">إنهاء</button></div></div>`;
}
function tourTarget() { const s = itemById(RT.sel); return (s && s.kind !== 'prop' ? s : null) || ST.items.find(x => x.kind === 'human') || ST.items[0]; }
function pLearn() {
  const tg = tourTarget();
  return `<section><h3>دروس جاهزة</h3><p class="note">كل درس يفتح مشهدًا كاملًا بشخصياته وكاميراته ومونتاجه. شغّله، ثم غيّر شيئًا واحدًا وقارن.</p>
  ${LESSONS.map(l => `<div class="lesson${ST.lesson === l.k ? ' on' : ''}"><h4>${l.t}</h4><p>${l.d}</p><div class="meta">${ENVS[l.env].ar} · ${l.shots.length} لقطات · <bdi dir="ltr">${l.aspect}</bdi></div>${ST.lesson === l.k ? `<p class="note"><b style="color:var(--amb)">جرّب الآن:</b> ${l.tip}</p>` : ''}<button class="btn${ST.lesson === l.k ? '' : ' pri'}" data-act="lesson" data-v="${l.k}">${ST.lesson === l.k ? 'أعد فتح الدرس' : 'افتح الدرس'}</button></div>`).join('')}</section>
  <section><h3>جولات سريعة</h3><p class="note">تنشئ كاميرات ومونتاجًا تلقائيًا على ${tg ? '«' + esc(tg.name) + '»' : 'الشخصية المختارة'}، ثم تشغّله. يمكنك التراجع دائمًا.</p><div class="btns"><button class="btn" data-act="tour" data-v="sizes">سلّم أحجام اللقطات</button><button class="btn" data-act="tour" data-v="angles">جولة الزوايا</button><button class="btn" data-act="tour" data-v="moves">جولة الحركات</button></div></section>
  <section><h3>اختبر عينك</h3>${quizHtml()}</section>
  <section><h3>قواعد ذهبية</h3><ul class="rules">
  <li><b>محور 180°:</b> ارسم خطًا وهميًا بين شخصيتين وابقَ في جهة واحدة منه، فتحافظ نظراتهما على اتجاهها.</li>
  <li><b>قاعدة 30°:</b> بين لقطتين متتاليتين للشخصية نفسها، غيّر الزاوية 30° على الأقل أو غيّر الحجم بوضوح، وإلا بدا القطع قفزة.</li>
  <li><b>القطع على الحركة:</b> اقطع والشخصية في منتصف حركتها: العين تتبع الحركة فلا تلاحظ القطع.</li>
  <li><b>مساحة النظر:</b> اترك فراغًا أمام وجه الشخصية في اتجاه نظرها.</li>
  <li><b>الحجم = المسافة العاطفية:</b> كلما اقتربت الكاميرا اقترب المشاهد من مشاعر الشخصية.</li>
  <li><b>كل حركة تحتاج سببًا:</b> تحرّك الكاميرا لتكشف أو تتبع أو تعبّر، لا لمجرد الحركة.</li></ul></section>`;
}

/* ---------- transport ---------- */
function updTransport() {
  $('#bPlay').innerHTML = RT.playing ? IC.pause : IC.play; $('#bPlay').setAttribute('aria-label', RT.playing ? 'إيقاف' : 'تشغيل');
  $('#bLoop').classList.toggle('on', RT.loop);
  $('#bView').innerHTML = RT.view === 'cam' ? `${IC.dir}<span class="lt">عين المخرج</span>` : `${IC.cam}<span class="lt">عين الكاميرا</span>`;
  $('#tcTot').textContent = fmt(totalDur()); $('#tcBig').textContent = fmt(RT.t);
  $('#bUndo').disabled = HIST.i <= 0; $('#bRedo').disabled = HIST.i >= HIST.s.length - 1;
}
function play(from0) { if (!ST.shots.length) return toast('أضف لقطة أولًا'); closePop(); hideCtx(); RT.src = 'edit'; RT.quiz = null; RT.camPrevOn = false; if (from0 || RT.t >= totalDur() - .02) RT.t = 0; RT.playing = true; RT.view = 'cam'; RT.lastShot = -1; updTransport(); renderSUI(); RT.dirty = true; }
function pause() { RT.playing = false; RT.film = false; updTransport(); renderSUI(); if (TAB === 'items') renderPanel(); }
function jumpCut(d) { const st = shotStarts().concat([totalDur()]); RT.src = 'edit'; let t = RT.t; if (d > 0) t = st.find(x => x > RT.t + .01) ?? totalDur(); else t = [...st].reverse().find(x => x < RT.t - .05) ?? 0; RT.t = Math.min(t, Math.max(0, totalDur() - .001)); RT.dirty = true; updPH(true); }
function setView(v) { RT.view = v; updTransport(); renderSUI(); RT.dirty = true; hint(v === 'dir' ? 'عين المخرج: انقر على عنصر لتحديده، اسحب السهم البرتقالي لتدويره، واضغط مطولًا على الأرض ليمشي إليها.' : 'عين الكاميرا: انقر على عنصر لتحديده، واسحب داخل الكادر لتدوير الكاميرا.', 4200, 'view-' + v); }
function cine(on) { document.body.classList.toggle('cine', on); if (on) { RT.prevView = RT.view; RT.view = 'cam'; play(true); hint('اضغط زر الرجوع أو Esc للخروج', 2500, 'cine'); } else { RT.view = RT.prevView || 'cam'; renderSUI(); } updTransport(); setTimeout(onResize, 30); }

/* ---------- monitor overlays (called after each draw) ---------- */
window.onDrawn = (R, pc) => {
  const fr = RT.frameRect, F = $('#frame');
  F.style.cssText = `left:${fr.x}px;top:${fr.y}px;width:${fr.w}px;height:${fr.h}px;visibility:${RT.view === 'cam' && pc ? 'visible' : 'hidden'}`;
  $('#thirds').style.display = ST.ov.thirds ? '' : 'none'; $('#safe').hidden = !ST.ov.safe;
  $('#tc').textContent = tc(RT.t);
  const q = RT.quiz, lbl = $('#shotlbl'), no = $('#shotno');
  if (pc && R && !q && ST.ov.lbl) { const c = pc.cfg; lbl.innerHTML = `<span class="k">${esc(c.name)}</span><span>${c.mode === 'free' ? 'كاميرا حرة' : SZ[c.size].ar + ' · <bdi>' + c.size + '</bdi>'}</span><span class="x">${ANG[c.angle].ar}</span>${c.mode && c.mode !== 'single' ? `<span class="x">${MODES.find(m => m.k === c.mode).ar}</span>` : ''}${c.move !== 'static' ? `<span>${MV[c.move].ar}</span>` : ''}<span class="x"><bdi dir="ltr">${Math.round(R.f)}mm</bdi></span>`; }
  else lbl.innerHTML = q ? '<span>؟</span>' : '';
  no.textContent = q ? 'اختبار' : pc && pc.shot ? `لقطة ${pc.shot.i + 1} / ${ST.shots.length}` : pc ? 'معاينة' : '';
  const pip = $('#pip'), pr = RT.pipR;
  if (pr && !document.body.classList.contains('cine')) { pip.style.cssText = `display:block;left:${pr.x - 2}px;top:${pr.y - 2}px;width:${pr.w + 4}px;height:${pr.h + 4}px`; $('#pipl').textContent = RT.view === 'cam' ? 'عين المخرج' : 'الكاميرا'; } else pip.style.display = 'none';
  const sb = $('#srcbar'), cam = RT.src !== 'edit' && camById(RT.src);
  sb.classList.toggle('show', !!cam && !q && !document.body.classList.contains('cine')); if (cam) $('#srct').textContent = `معاينة الكاميرا ${cam.name}`;
  const em = $('#empty');
  if (!pc && RT.view === 'cam') { em.style.display = 'flex'; em.textContent = !ST.items.length ? 'المشهد فارغ: أضف شخصية من تبويب «الشخصيات».' : !ST.cams.length ? 'أضف كاميرا من تبويب «الكاميرات» لترى الكادر.' : 'أضف لقطة إلى المونتاج، أو اختر كاميرا لمعاينتها.'; } else em.style.display = 'none';
  updPH(); if (window.posCtx) posCtx();
};
window.onSwapView = () => setView(RT.view === 'cam' ? 'dir' : 'cam');
window.onSelectItem = id => { RT.sel = id; RT.ctxCam = null; if (!id) RT.selAct = null; renderCtx(true); if (id) { const s = itemById(id); if (TAB !== 'items') switchTab('items'); else renderPanel(); } else if (TAB === 'items') renderPanel(); renderTL(); RT.dirty = true; };
window.onSelectCam = id => { RT.cam = id; RT.src = id; RT.playing = false; RT.sel = null; RT.ctxCam = id; if (!stageOn()) switchTab('cams'); updTransport(); renderCtx(true); RT.dirty = true; };
window.onItemMoved = () => commit();
window.onLongPressGround = g => {
  const s = itemById(RT.sel); if (!s) return;
  const t0 = +RT.t.toFixed(2), st = evalItem(s, t0), dist = Math.hypot(g.x - st.x, g.z - st.z); if (dist < .25) return;
  const run = dist > 7, a = { type: run ? 'run' : 'walk', t: t0, dur: +Math.max(.5, dist / (run ? 3.4 : 1.3)).toFixed(2), tx: +g.x.toFixed(2), tz: +g.z.toFixed(2) };
  s.actions.push(a); RT.selAct = { id: s.id, ai: s.actions.length - 1 }; commit();
  toast(`${s.name} ${run ? 'سيركض' : 'سيمشي'} إلى هنا ابتداءً من الثانية ${fmt(t0)}`); try { navigator.vibrate && navigator.vibrate(20); } catch (e) { }
};
window.onHandleTap = d => { if (d.type === 'tgtH') { RT.selAct = { id: d.id, ai: d.ai }; RT.dirty = true; renderTL(); toast('اسحب الدائرة لتغيير الوجهة'); } else toast('اسحب السهم لتدوير الاتجاه'); };
window.onCamEdited = () => commit();
window.onPickGround = g => {
  if (RT.pick && RT.pick.kind === 'aim') { const c = camById(RT.pick.cam); RT.pick = null; hideHint(); if (c) { aimCam(c, V3(g.x, 1.1, g.z)); RT.src = c.id; setView('cam'); commit(); toast('وُجّهت الكاميرا'); } return; }
  const s = itemById(RT.pick.id), a = s && s.actions[RT.pick.ai]; RT.pick = null; hideHint();
  if (!a) return; const st = evalItem(s, a.t), dist = Math.hypot(g.x - st.x, g.z - st.z);
  a.tx = +g.x.toFixed(2); a.tz = +g.z.toFixed(2); a.dur = +Math.max(.5, dist / (a.type === 'run' ? 3.4 : 1.3)).toFixed(1);
  commit(); toast('تم تحديد الوجهة');
};
window.onMonResize = () => { renderTL(); };

/* ---------- actions ---------- */
function freeSpot() {
  for (let r = 0; r < 8; r++) for (let k = 0; k < Math.max(1, r * 6); k++) {
    const a = k / Math.max(1, r * 6) * TAU, x = +(ORB.tx + Math.cos(a) * r * .9).toFixed(2), z = +(ORB.tz + Math.sin(a) * r * .9).toFixed(2);
    if (!ST.items.some(s => Math.hypot(s.x - x, s.z - z) < .85)) return [x, z];
  }
  return [0, 0];
}
function addItem(type) {
  const [x, z] = freeSpot(), s = newItemSpec(type, x, z, 0); s.id = nid('i');
  const same = ST.items.filter(i => i.type === type).length; if (same) s.name += ' ' + (same + 1);
  ST.items.push(s); RT.sel = s.id;
  if (s.kind !== 'prop' && !ST.cams.length) { const c = newCam({ target: s.id, size: 'MS' }, 0); ST.cams.push(c); ST.shots.push({ id: nid('s'), cam: c.id, dur: 3, trans: 'cut' }); RT.cam = c.id; }
  commit(); renderCtx(true); toast(`أُضيف «${s.name}»: اسحبه في عين المخرج لتغيير مكانه`);
}
function addAction(s, type, tAt) {
  const t0 = +(tAt == null ? RT.t : tAt).toFixed(2), st = evalItem(s, t0), a = { type, t: t0, dur: ACT_DUR[type] || 1 };
  if (type === 'walk' || type === 'run') { const d = type === 'run' ? 5 : 2.5; a.tx = +(st.x + Math.sin(st.rot) * d).toFixed(2); a.tz = +(st.z + Math.cos(st.rot) * d).toFixed(2); }
  if (type === 'turn') a.v = 90; if (type === 'look') a.v = 60; if (type === 'eyes') a.v = 1;
  if (type === 'watch') { const o = ST.items.find(x => x.id !== s.id && x.kind !== 'prop') || ST.items.find(x => x.id !== s.id); if (!o) { toast('أضف شخصًا أو شيئًا آخر ليتابعه بنظره'); return -1; } a.to = o.id; }
  s.actions.push(a); const ai = s.actions.length - 1; RT.sel = s.id; RT.selAct = { id: s.id, ai }; commit();
  if (type === 'walk' || type === 'run') showPath(s.id, ai);
  return ai;
}
function showPath(id, ai) { RT.sel = id; RT.selAct = { id, ai }; if (RT.view !== 'dir') setView('dir'); RT.dirty = true; renderTL(); toast('اسحب الدائرة الزرقاء على الأرض لتحديد إلى أين يذهب'); }
function delItem(id) {
  let fz = 0; ST.cams.forEach(c => { if (c.mode !== 'free' && c.target === id) { if (freezeCam(c)) fz++; } if (c.other === id) { c.other = null; if (c.mode !== 'free') c.mode = 'single'; } });
  ST.items = ST.items.filter(s => s.id !== id); RT.sel = null; commit(); if (window.renderCtx) renderCtx();
  if (fz) toast(`حُذف العنصر، وتحولت ${fz} كاميرا كانت تتبعه إلى كاميرا حرة في مكانها`);
}
function tour(kind) {
  const tg = tourTarget(); if (!tg) return toast('أضف شخصية أولًا');
  let cs = [];
  if (kind === 'sizes') cs = SIZES.map(s => ({ size: s.k, lens: s.cat === 2 ? 50 : 35 }));
  if (kind === 'angles') cs = ANGLES.map(a => ({ angle: a.k, size: a.k === 'bird' || a.k === 'worm' ? 'FS' : 'MS' }));
  if (kind === 'moves') cs = MOVES.map(m => ({ move: m.k, size: ['crane', 'pan', 'tilt', 'truck', 'whip'].includes(m.k) ? 'LS' : 'MS', side: m.k === 'truck' ? 0 : 20 }));
  ST.cams = cs.map((c, i) => newCam(Object.assign({ target: tg.id }, c), i));
  ST.shots = ST.cams.map(c => ({ id: nid('s'), cam: c.id, dur: kind === 'moves' ? 2.8 : kind === 'angles' ? 2 : 1.5, trans: 'cut' }));
  RT.cam = ST.cams[0].id; ST.lesson = null; commit(); play(true);
  toast(kind === 'sizes' ? 'سلّم الأحجام: من العامة جدًا إلى الإدراج' : kind === 'angles' ? 'جولة الزوايا الست' : 'جولة الحركات الأربع عشرة');
}
function newQuiz() {
  const tg = ST.items.find(s => s.kind === 'human') || ST.items.find(s => s.kind === 'animal'); if (!tg) return toast('أضف شخصية أولًا');
  const q = RT.quiz || { right: 0, n: 0 }, kind = Math.random() < .6 ? 'size' : 'angle';
  const pool = kind === 'size' ? SIZES.filter(s => tg.kind === 'human' || s.k !== 'INS').map(s => s.k) : ANGLES.map(a => a.k);
  const ans = pool[(Math.random() * pool.length) | 0], opts = [ans];
  while (opts.length < 4) { const k = pool[(Math.random() * pool.length) | 0]; if (!opts.includes(k)) opts.push(k); }
  opts.sort(() => Math.random() - .5);
  const cfg = newCam({ id: 'quiz', name: '?', target: tg.id, side: Math.round(Math.random() * 80 - 40), lens: [24, 35, 50][(Math.random() * 3) | 0], size: kind === 'size' ? ans : ['MS', 'FS', 'MCU'][(Math.random() * 3) | 0], angle: kind === 'angle' ? ans : 'eye' });
  RT.quiz = { kind, ans, opts, picked: null, cfg, right: q.right, n: q.n }; RT.playing = false; RT.view = 'cam'; RT.dirty = true; updTransport(); if (TAB !== 'learn') switchTab('learn'); else renderPanel();
}

/* ---------- storyboard ---------- */
function storyboard() {
  if (!ST.shots.length) return toast('لا توجد لقطات بعد');
  const W = monEl.clientWidth, H = monEl.clientHeight, asp = aspV(); let tw = Math.min(360, W), th = tw / asp; if (th > H) { th = H; tw = th * asp; } tw = Math.floor(tw); th = Math.floor(th);
  const pr = renderer.getPixelRatio(), c2 = document.createElement('canvas'); c2.width = Math.round(tw * pr); c2.height = Math.round(th * pr); const x2 = c2.getContext('2d');
  const st = shotStarts(), cards = [];
  renderer.setScissorTest(true);
  ST.shots.forEach((sh, i) => {
    const c = camById(sh.cam); if (!c) return; const tm = st[i] + sh.dur * .4, R = computeCam(c, .4, st[i], tm); if (!R) return;
    placeBackdrop(R); applyAll(tm); composeCam(shotCam, R);
    renderer.setViewport(0, H - th, tw, th); renderer.setScissor(0, H - th, tw, th); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, shotCam);
    x2.clearRect(0, 0, c2.width, c2.height); x2.drawImage(renderer.domElement, 0, 0, c2.width, c2.height, 0, 0, c2.width, c2.height);
    const acts = []; ST.items.forEach(s => (s.actions || []).forEach(a => { if (a.t < st[i] + sh.dur && a.t + a.dur > st[i]) acts.push(`${s.name} ${actLabel(a, s)}`); }));
    cards.push({ i, c, sh, img: c2.toDataURL('image/jpeg', .86), acts, R });
  });
  renderer.setScissorTest(false); RT.dirty = true;
  openModal('لوحة القصة', `<div class="btns" style="margin-bottom:12px"><button class="btn" data-act="sketch">أسلوب الرسم</button><button class="btn" data-act="copyList">${IC.copy} نسخ قائمة اللقطات</button></div><div class="sb" id="sbg">${cards.map(k => `<div class="sbc"><img src="${k.img}" alt="لقطة ${k.i + 1}"><h4><span>لقطة ${k.i + 1}${k.sh.title ? ': ' + esc(k.sh.title) : ' — ' + esc(k.c.name)}</span><bdi dir="ltr">${fmt(k.sh.dur)}s</bdi></h4><p><b>${sizeAr(k.c)}</b> · ${k.c.mode === 'free' ? '' : ANG[k.c.angle].ar + ' · '}${MV[k.c.move].ar} · <bdi dir="ltr">${Math.round(k.R.f)}mm</bdi></p><p>${k.sh.note ? esc(k.sh.note) : k.acts.length ? esc(k.acts.join('، ')) : esc((itemById(k.c.target) || {}).name || '')}</p></div>`).join('')}</div>`);
}
function shotListText() {
  return ST.shots.map((sh, i) => { const c = camById(sh.cam); if (!c) return ''; const t = itemById(c.target); return `لقطة ${i + 1} | الكاميرا ${c.name} | ${c.mode === 'free' ? 'حرة' : SZ[c.size].ar + ' (' + c.size + ') | ' + ANG[c.angle].ar} | ${MV[c.move].ar}${c.mode && c.mode !== 'single' ? ' | ' + MODES.find(m => m.k === c.mode).ar : ''} | ${t ? t.name : ''} | ${c.lens}mm | ${fmt(sh.dur)} ث`; }).join('\n');
}

/* ---------- backdrop ---------- */
function handleBd(input) {
  const f = input.files && input.files[0]; if (!f) return;
  const rd = new FileReader(); rd.onload = () => { const img = new Image(); img.onload = () => { const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); RT.bdImg = c.toDataURL('image/jpeg', .85); try { localStorage.setItem(bdKey(), RT.bdImg); } catch (e) { } ST.bd = ST.bd || { follow: 1, dist: 12, size: 10 }; setBackdrop(c); commit(); toast('أُضيفت الخلفية'); }; img.src = rd.result; }; rd.readAsDataURL(f);
}
function loadBd() { if (!ST.bd) return; let u = null; try { u = localStorage.getItem(bdKey()); } catch (e) { } if (!u) return; const img = new Image(); img.onload = () => { RT.bdImg = u; setBackdrop(img); if (TAB === 'scene') renderPanel(); }; img.src = u; }

/* ---------- event wiring ---------- */
function scopeObj(s) { return s === 'item' ? itemById(RT.sel) : s === 'cam' ? camById(RT.cam) : s === 'bd' ? ST.bd : s === 'st' ? ST : s === 'lt' ? (ST.lt = ST.lt || {}) : null; }
function onPanelClick(e) {
  const b = e.target.closest('[data-act]'); if (!b) return;
  if (e.target.closest('select,input,textarea') && b.dataset.act === 'selShot') return;
  const A = b.dataset.act, v = b.dataset.v, sel = itemById(RT.sel), cam = camById(RT.cam);
  switch (A) {
    case 'env': ST.env = v; ST.light = ENVS[v].light; fitOrbit(); commit(); break;
    case 'light': ST.light = v; ST.lt = {}; commit(); break;
    case 'ltReset': ST.lt = {}; commit(); break;
    case 'icat': ITEMCAT = v; renderPanel(); break;
    case 'threePt': {
      const cur = itemById(RT.sel), h = cur && cur.kind !== 'prop' ? cur : ST.items.find(x => x.kind === 'human');
      if (!h) { toast('أضف شخصية أولًا'); break; }
      const f = (h.rot || 0) * D2R, put = (type, ang, dist, power, lc, name) => { const a = f + ang * D2R, x = +(h.x + Math.sin(a) * dist).toFixed(2), z = +(h.z + Math.cos(a) * dist).toFixed(2), s2 = newItemSpec(type, x, z, Math.round(Math.atan2(h.x - x, h.z - z) / D2R)); s2.id = nid('i'); s2.name = name; s2.power = power; s2.lc = lc; s2.aim = h.id; ST.items.push(s2); };
      put('spot', -40, 2.8, 1.3, '#ffcf9a', 'الضوء الرئيسي'); put('softbox', 50, 2.4, .55, '#fff1dc', 'ضوء التعبئة'); put('spot', 165, 2.4, 1.1, '#dce9ff', 'الضوء الخلفي');
      commit(); toast(`إضاءة ثلاثية حول «${h.name}»`); break;
    }
    case 'weather': ST.weather = v; commit(); break;
    case 'showPath': if (sel) showPath(sel.id, +b.dataset.ai); break;
    case 'aspect': ST.aspect = v; commit(); break;
    case 'ov': ST.ov[v] = ST.ov[v] ? 0 : 1; commit(); break;
    case 'bdDel': RT.bdImg = null; ST.bd = null; setBackdrop(null); try { localStorage.removeItem(bdKey()); } catch (e) { } commit(); break;
    case 'bdMode': ST.bd.follow = +v; commit(); break;
    case 'scenes': SHEET.add = false; SHEET.del = null; openScenes(); break;
    case 'saveFile': exportProjectFile(PRJ); break;
    case 'home': showHome(); break;
    case 'json': openModal('المشروع كنص', `<p class="note">انسخ هذا النص لحفظ المشروع أو نقله، أو الصق نص مشروع آخر ثم اضغط «تحميل».</p><textarea id="pj">${esc(JSON.stringify(ST))}</textarea><div class="btns" style="margin-top:10px"><button class="btn" data-act="pjCopy">${IC.copy} نسخ</button><button class="btn pri" data-act="pjLoad">تحميل</button></div>`); break;
    case 'pjCopy': copyText($('#pj').value); break;
    case 'pjLoad': try { const S = JSON.parse($('#pj').value); if (!S || !Array.isArray(S.items)) throw 0; closeModal(); setState(S, 'تم تحميل المشروع'); } catch (err) { toast('النص ليس مشروعًا صالحًا'); } break;
    case 'add': addItem(v); break;
    case 'sel': RT.sel = v; const s0 = itemById(v); if (s0) { ORB.tx = s0.x; ORB.tz = s0.z; } renderPanel(); renderTL(); RT.dirty = true; break;
    case 'set': { const o = scopeObj(b.dataset.s); if (!o) break; o[b.dataset.f] = b.dataset.n != null ? +v : v; if (b.dataset.s === 'cam' && b.dataset.f === 'move' && v === 'hand' && o.amt == null) o.amt = 1; if (b.dataset.s === 'cam') { RT.src = o.id; RT.quiz = null; RT.playing = false; } commit(); break; }
    case 'acc': if (sel) { sel.acc = sel.acc || {}; sel.acc[v] = sel.acc[v] ? 0 : 1; if (v === 'cap' && sel.acc.cap) sel.acc.fez = 0; if (v === 'fez' && sel.acc.fez) sel.acc.cap = 0; commit(); } break;
    case 'dup': if (sel) { const c = JSON.parse(JSON.stringify(sel)); c.id = nid('i'); c.x += .9; c.name += ' (نسخة)'; ST.items.push(c); RT.sel = c.id; commit(); } break;
    case 'del': if (sel) delItem(sel.id); break;
    case 'addAct': if (sel) addAction(sel, $('#actType').value); break;
    case 'delAct': if (sel) { sel.actions.splice(+b.dataset.ai, 1); RT.pick = null; commit(); } break;
    case 'pickAct': if (sel) showPath(sel.id, +b.dataset.ai); break;
    case 'selCam': RT.cam = v; RT.src = v; RT.playing = false; RT.quiz = null; updTransport(); renderPanel(); RT.dirty = true; break;
    case 'newCam': { const tg = sel && sel.kind !== 'prop' ? sel : (cam ? itemById(cam.target) : ST.items.find(s => s.kind === 'human') || ST.items[0]); if (!tg) { toast('أضف شخصية أولًا'); break; } const c = newCam({ target: tg.id, size: 'MCU', side: 30 }); ST.cams.push(c); RT.cam = c.id; RT.src = c.id; commit(); break; }
    case 'dupCam': if (cam) { const c = JSON.parse(JSON.stringify(cam)); c.id = nid('c'); c.name = camName(ST.cams.length); ST.cams.push(c); RT.cam = c.id; RT.src = c.id; commit(); } break;
    case 'delCam': if (cam) { ST.cams = ST.cams.filter(c => c.id !== cam.id); ST.shots = ST.shots.filter(s => s.cam !== cam.id); RT.src = 'edit'; RT.cam = ST.cams[0] ? ST.cams[0].id : null; commit(); } break;
    case 'addShot': if (cam) { ST.shots.push({ id: nid('s'), cam: cam.id, dur: 2.5, trans: 'cut' }); commit(); toast(`أُضيفت لقطة بالكاميرا ${cam.name} — المجموع ${ST.shots.length}`); } break;
    case 'prevMove': RT.camPrevOn = !RT.camPrevOn; RT.camPrev = 0; if (cam) RT.src = cam.id; RT.playing = false; updTransport(); renderPanel(); RT.dirty = true; break;
    case 'setMode': if (cam) {
      if (v === 'free') { if (cam.mode !== 'free') freezeCam(cam); }
      else { if (!itemById(cam.target)) { const tg = (sel && sel.kind !== 'prop' && sel) || ST.items.find(s => s.kind === 'human') || ST.items[0]; if (!tg) { toast('أضف شخصية أولًا'); break; } cam.target = tg.id; }
        cam.mode = v; if (v !== 'single' && (!cam.other || cam.other === cam.target)) { const o = ST.items.find(s => s.kind === 'human' && s.id !== cam.target) || ST.items.find(s => s.id !== cam.target); cam.other = o ? o.id : null; } }
      RT.src = cam.id; RT.quiz = null; commit(); } break;
    case 'newFree': { const c = newCam({ mode: 'free', target: null, lens: 24 }), th = ORB.th; c.px = +(ORB.tx + Math.sin(th) * 3.5).toFixed(2); c.pz = +(ORB.tz + Math.cos(th) * 3.5).toFixed(2); c.py = 1.5; aimCam(c, V3(ORB.tx, 1.1, ORB.tz)); ST.cams.push(c); RT.cam = c.id; RT.src = c.id; RT.ctxCam = c.id; commit(); toast(`كاميرا حرة ${c.name} — اسحبها في عين المخرج`); break; }
    case 'freeze': if (cam && freezeCam(cam)) { RT.src = cam.id; commit(); toast('ثُبّتت الكاميرا في مكانها: لم تعد تتبع أحدًا'); } break;
    case 'aimAt': if (cam) { const P = aimPoint($('#aimSel').value); if (P) { aimCam(cam, P); RT.src = cam.id; commit(); } } break;
    case 'aimPick': if (cam) { RT.pick = { kind: 'aim', cam: cam.id }; setView('dir'); hint('انقر على الأرض حيث تريد أن تنظر الكاميرا', 0); renderPanel(); } break;
    case 'freeAngle': if (cam) { const P = { eye: [0, 1.55], high: [-28, 3.2], low: [14, .6], bird: [-89, 7], worm: [35, .12] }[v]; if (P) { cam.pitch = P[0]; cam.py = P[1]; cam.roll = 0; } else cam.roll = cam.roll ? 0 : 18; RT.src = cam.id; commit(); } break;
    case 'export': openExport(); break;
    case 'install': doInstall(); break;
    case 'resetFine': if (cam) { cam.eAdj = 0; cam.dOff = 1; cam.roll = 0; commit(); } break;
    case 'playEdit': play(true); break;
    case 'cine': cine(true); break;
    case 'board': storyboard(); break;
    case 'copyList': copyText(shotListText()); break;
    case 'sketch': $('#sbg').classList.toggle('sketch'); break;
    case 'selShot': { const i = ST.shots.findIndex(s => s.id === v); RT.selShot = v; RT.src = 'edit'; RT.t = shotStarts()[i] + .001; RT.cam = ST.shots[i].cam; renderPanel(); renderTL(); RT.dirty = true; break; }
    case 'dur': { const sh = ST.shots[+b.dataset.i]; sh.dur = +clamp(sh.dur + +v, .2, 60).toFixed(2); commit(); break; }
    case 'mvShot': { const i = +b.dataset.i, j = i + +v; if (j >= 0 && j < ST.shots.length) { const t = ST.shots[i]; ST.shots[i] = ST.shots[j]; ST.shots[j] = t; commit(); } break; }
    case 'dupShot': { const i = +b.dataset.i, c = Object.assign({}, ST.shots[i], { id: nid('s') }); ST.shots.splice(i + 1, 0, c); commit(); break; }
    case 'delShot': ST.shots.splice(+b.dataset.i, 1); commit(); break;
    case 'addShotSel': { const id = $('#shotCam').value; if (camById(id)) { ST.shots.push({ id: nid('s'), cam: id, dur: 2.5, trans: 'cut' }); commit(); } break; }
    case 'lesson': TAB = 'learn'; renderTabs(); openLesson(v); break;
    case 'tour': tour(v); break;
    case 'quiz': RT.quiz = null; newQuiz(); break;
    case 'qAns': if (RT.quiz && !RT.quiz.picked) { RT.quiz.picked = v; RT.quiz.n++; if (v === RT.quiz.ans) RT.quiz.right++; renderPanel(); } break;
    case 'qNext': newQuiz(); break;
    case 'expRes': case 'expFps': case 'expOv': case 'expFilm': case 'expGo': case 'expCancel': case 'expSave': case 'expShare': expAct(A, v); break;
    case 'qEnd': if (RT.quiz) RT.qLast = `${RT.quiz.right} من ${RT.quiz.n}`; RT.quiz = null; RT.dirty = true; renderPanel(); break;
  }
}
function onPanelInput(e) {
  const el = e.target;
  if (el.dataset.f && el.dataset.s && el.type !== 'text' && el.tagName !== 'SELECT') {
    const o = scopeObj(el.dataset.s); if (!o) return; let v = el.value; if (el.type === 'range') v = +v; o[el.dataset.f] = v;
    const out = el.parentElement.querySelector('output'); if (out) out.textContent = outFmt(el.dataset.f, v);
    if (el.dataset.s === 'item') syncItems(); if (el.dataset.s === 'cam') RT.src = o.id; if (el.dataset.s === 'lt') applyLight(); RT.dirty = true;
  }
}
function onPanelChange(e) {
  const el = e.target;
  if (el.id === 'bdFile') return handleBd(el);
  if (el.dataset.f && el.dataset.s) { const o = scopeObj(el.dataset.s); if (!o) return; let v = el.value; if (el.type === 'range') v = +v; if (el.tagName === 'SELECT' && el.dataset.f === 'other' && !v) v = null; o[el.dataset.f] = v; if (el.dataset.s === 'cam') RT.src = o.id; commit(); return; }
  if (el.dataset.ai != null && el.dataset.af) { const s = itemById(RT.sel), a = s && s.actions[+el.dataset.ai]; if (!a) return; if (el.dataset.af === 'to') { a.to = el.value; commit(); return; } let v = +el.value; if (el.dataset.af === 'dur') v = Math.max(.1, v); if (el.dataset.af === 't') v = Math.max(0, v); a[el.dataset.af] = v; commit(); return; }
  if (el.dataset.shot != null) { const sh = ST.shots[+el.dataset.shot]; if (sh) { sh[el.dataset.sf] = el.value; commit(); } }
}
function bindAll() {
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) switchTab(b.dataset.tab); });
  const pn = $('#panel'); pn.addEventListener('click', onPanelClick); pn.addEventListener('input', onPanelInput); pn.addEventListener('change', onPanelChange);
  $('#mb').addEventListener('click', onPanelClick);
  $('#mx').addEventListener('click', closeModal); $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  $('#bUndo').innerHTML = IC.undo; $('#bRedo').innerHTML = IC.redo; $('#bBoard').innerHTML = `${IC.board}<span class="lt">لوحة القصة</span>`;
  $('#bStart').innerHTML = IC.start; $('#bPrev').innerHTML = IC.prev; $('#bNext').innerHTML = IC.next; $('#bLoop').innerHTML = IC.loop; $('#bCine').innerHTML = `${IC.cine}<span class="lt">تكبير</span>`; $('#bCine').setAttribute('aria-label', 'الشاشة الكاملة للتحكم');
  $('#bUndo').onclick = undo; $('#bRedo').onclick = redo; $('#bBoard').onclick = storyboard; $('#bExport').innerHTML = `${IC.film}<span class="lt">تصدير فيديو</span>`; $('#bExport').onclick = () => openExport();
  $('#bPlay').onclick = () => RT.playing ? pause() : play();
  $('#bStart').onclick = () => { RT.t = 0; RT.src = 'edit'; RT.dirty = true; updPH(true); };
  $('#bPrev').onclick = () => jumpCut(-1); $('#bNext').onclick = () => jumpCut(1);
  $('#bLoop').onclick = () => { RT.loop = !RT.loop; updTransport(); };
  $('#bView').onclick = () => setView(RT.view === 'cam' ? 'dir' : 'cam');
  $('#bCine').onclick = () => stageOn() ? exitStage() : enterStage(); bindSUI();
  $('#srcBack').onclick = () => { RT.src = 'edit'; RT.camPrevOn = false; RT.dirty = true; if (TAB === 'cams') renderPanel(); };
  bindTL(); if (window.bindCtx) bindCtx();
  window.kadrBack = () => { if (!$('#modal').hidden) { closeModal(); return true; } if (window.closePop && closePop()) return true; if (document.body.classList.contains('cine')) { cine(false); return true; } if (stageOn()) { exitStage(); return true; } if (RT.pick) { RT.pick = null; hideHint(); renderPanel(); return true; } if (homeOn()) { if (HOME.step || HOME.menu) { HOME.step = null; HOME.menu = null; renderHome(); return true; } return false; } showHome(); return true; };
  document.addEventListener('keydown', e => {
    if (e.target.closest('input,select,textarea')) return;
    if (e.key === 'Escape') { if (window.closePop && closePop()) return; if (!$('#modal').hidden) closeModal(); else if (document.body.classList.contains('cine')) cine(false); else if (stageOn()) exitStage(); else if (RT.pick) { RT.pick = null; hideHint(); renderPanel(); } }
    else if (e.key === ' ') { e.preventDefault(); RT.playing ? pause() : play(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { RT.t = clamp(RT.t + (e.key === 'ArrowRight' ? 1 : -1) / 24, 0, tlLen()); RT.dirty = true; updPH(true); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && RT.sel) delItem(RT.sel);
  });
  const stg = document.querySelector('.stage');
  new ResizeObserver(() => document.documentElement.style.setProperty('--stk', stg.offsetHeight + 'px')).observe(stg);
}

/* ---------- loop & boot ---------- */
let lastNow = performance.now();
function loop(now) {
  const dt = Math.min(.1, (now - lastNow) / 1000); lastNow = now;
  if (RT.playing) {
    RT.t += dt; const end = totalDur();
    if (RT.t >= end) { const film = RT.film; if (film && filmNext()) { } else if (RT.loop && !film) { RT.t = 0; RT.lastShot = -1; } else { RT.t = Math.max(0, end - .001); RT.playing = false; updTransport(); if (document.body.classList.contains('cine')) setTimeout(() => cine(false), 600); } }
    RT.dirty = true;
  }
  if (RT.camPrevOn) { RT.camPrev += dt / 3; if (RT.camPrev > 1.25) RT.camPrev = 0; RT.dirty = true; }
  if (RT.dirty && !document.body.classList.contains('homeon')) { RT.dirty = false; try { draw(); } catch (err) { console.error(err); } }
  requestAnimationFrame(loop);
}
function boot() {
  bindAll();
  if (!window.THREE) { $('#empty').style.display = 'flex'; $('#empty').textContent = 'تعذّر تحميل محرك العرض ثلاثي الأبعاد. تحقق من الاتصال ثم أعد تحميل الصفحة.'; return; }
  migrateOld();
  ST = normalize(blankScene('studio')); RT.cam = ST.cams[0] ? ST.cams[0].id : null;
  init3D(); fitOrbit(); refreshWorld();
  HIST.s = [JSON.stringify(ST)]; HIST.i = 0;
  renderTabs(); renderAll(); registerSW(); bindProject();
  requestAnimationFrame(loop);
  showHome();
}

