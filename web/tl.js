/* كادر — timeline (tracks, trimming, popovers) and the floating selection toolbar */
RT.zoom = 1; RT.selAct = null; RT.popFor = null; RT.ctxCam = null;
const LABW = () => innerWidth < 700 ? 80 : 108;
function tlRows() { return ST.items.filter(s => s.kind !== 'prop' || (s.actions && s.actions.length)); }
function itemColor(s) { return s.kind === 'human' ? (s.top || '#ccc') : (s.color || '#aaa'); }
function actTypesFor(s) { return Object.entries(ACTS).filter(([k, a]) => a.who === 'all' || (a.who === 'living' && s.kind !== 'prop') || (a.who === 'human' && s.kind === 'human')); }
function flagStyle(f) {
  if (!f) return ['', ''];
  const L = f.list; if (L.includes('cross')) return ['bad', '×']; if (L.includes('jump') || L.includes('late')) return ['warn', '!']; if (L.includes('on')) return ['ok', '✓']; if (L.includes('same')) return ['', '='];
  return ['', '·'];
}
function tickStep() { return PPS >= 90 ? [.5, 1] : PPS >= 40 ? [1, 1] : PPS >= 20 ? [1, 2] : [2.5, 5]; }

function renderTL() {
  const tl = $('#tl'), lw = LABW(), len = tlLen() + 2, avail = Math.max(200, tl.clientWidth - lw - 28);
  PPS = clamp(avail / len * RT.zoom, 10, 700);
  const X = t => lw + t * PPS, st = shotStarts(), n = ST.shots.length, W = Math.ceil(X(len)) + 30;
  const [mi, ma] = tickStep(); let ticks = '';
  for (let k = 0; k * mi <= len + 1e-6; k++) { const t = k * mi, maj = Math.abs(t / ma - Math.round(t / ma)) < 1e-6; ticks += `<i class="${maj ? '' : 'h'}" style="left:${X(t)}px">${maj ? `<b>${+t.toFixed(1)}</b>` : ''}</i>`; }
  const clips = ST.shots.map((sh, i) => { const c = camById(sh.cam), ci = ST.cams.indexOf(c); return `<div class="clip c${sizeCat(c)}${RT.selShot === sh.id ? ' sel' : ''}" data-shot="${i}" style="left:${X(st[i])}px;width:${sh.dur * PPS}px"><span class="cd" style="background:${CAM_COLORS[ci % 8]}"></span><b>${c ? esc(c.name) : '?'}</b><bdi>${sizeK(c)}</bdi><span>${sizeAr(c)}</span></div>`; }).join('');
  let cuts = '';
  for (let j = 1; j < n; j++) { const f = RT.flags[j - 1], [cls, lab] = flagStyle(f), tt = f ? (f.list.length ? f.list : ['plain']).map(k => FLAG_INFO[k].t).join('، ') : ''; cuts += `<div class="cut ${cls}" data-cut="${j}" style="left:${X(st[j])}px" title="${tt}"><span class="fl">${lab}</span></div>`; }
  const end = n ? `<div class="endh" style="left:${X(totalDur())}px" title="مدة اللقطة الأخيرة"></div>` : '';
  const rows = tlRows().map(s => `<div class="trow trk${RT.sel === s.id ? ' on' : ''}" data-item="${s.id}"><div class="lab" data-lab="${s.id}"><i style="background:${itemColor(s)}"></i><span>${esc(s.name)}</span><button class="add" data-add="${s.id}" aria-label="أضف حركة">+</button></div>${(s.actions || []).map((a, i) => { const sel = RT.selAct && RT.selAct.id === s.id && RT.selAct.ai === i; return `<div class="act${sel ? ' sel' : ''}" data-item="${s.id}" data-ai="${i}" style="left:${X(a.t)}px;width:${Math.max(a.dur * PPS, 16)}px"><span>${actLabel(a, s)}</span><i class="th l" data-trim="l"></i><i class="th r" data-trim="r"></i></div>`; }).join('')}</div>`).join('');
  const sa = shotAt(RT.t), canSplit = sa && RT.t - sa.start > .15 && sa.start + sa.s.dur - RT.t > .15;
  tl.style.setProperty('--lw', lw + 'px');
  tl.innerHTML = `<div class="tlbar" dir="rtl"><button class="tb" data-tb="split"${canSplit ? '' : ' disabled'}>${IC.scissors}<span>قصّ عند المؤشر</span></button><button class="tb" data-tb="addShot">${IC.plus}<span>لقطة</span></button><button class="tb" data-tb="addAct">${IC.walk}<span>حركة</span></button><div class="grow"></div><button class="tb sq" data-tb="zout" aria-label="تصغير الزمن">${IC.zout}</button><button class="tb sq" data-tb="zin" aria-label="تكبير الزمن">${IC.zin}</button><button class="tb" data-tb="fit"><span>ملاءمة</span></button></div>
  <div class="tsc" id="tsc"><div class="tin" id="tin" style="width:${W}px"><div class="trow ruler"><div class="lab"></div>${ticks}</div><div class="trow v1"><div class="lab"><i style="background:var(--amb)"></i><span>اللقطات</span></div>${clips}${cuts}${end}</div>${rows}${tlRows().length ? '' : '<div class="trow trk"><div class="lab"><span style="color:var(--dim)">لا شخصيات بعد</span></div></div>'}<div class="ph" id="ph"></div></div></div>`;
  updPH(true); reopenPop();
  $('#tsc').addEventListener('scroll', () => { if (RT.popFor) reopenPop(); }, { passive: true });
}
function renderTLLight() {
  const st = shotStarts(), lw = LABW(), X = t => lw + t * PPS;
  document.querySelectorAll('#tin .clip').forEach(el => { const i = +el.dataset.shot, sh = ST.shots[i]; if (sh) { el.style.left = X(st[i]) + 'px'; el.style.width = sh.dur * PPS + 'px'; } });
  document.querySelectorAll('#tin .cut').forEach(el => { const j = +el.dataset.cut; el.style.left = X(st[j]) + 'px'; const [cls, lab] = flagStyle(RT.flags[j - 1]); el.className = 'cut ' + cls; el.querySelector('.fl').textContent = lab; });
  const eh = document.querySelector('#tin .endh'); if (eh) eh.style.left = X(totalDur()) + 'px';
  updTransport(); updPH(true);
}
let lastPH = -1;
function updPH(force) {
  const ph = $('#ph'); if (!ph) return; const x = LABW() + RT.t * PPS; if (!force && Math.abs(x - lastPH) < .3) return; lastPH = x;
  ph.style.transform = `translateX(${x}px)`;
  const sc = $('#tsc'); if (sc && RT.playing) { const lw = LABW(); if (x < sc.scrollLeft + lw + 10 || x > sc.scrollLeft + sc.clientWidth - 30) sc.scrollLeft = x - lw - 30; }
  $('#tcBig').textContent = fmt(RT.t);
  if (stageOn()) { const r = $('#suiT'), c = $('#suiTc'); if (r && document.activeElement !== r) r.value = RT.t; if (c) c.textContent = fmt(RT.t) + 's'; }
  const sp = document.querySelector('[data-tb="split"]'); if (sp) { const sa = shotAt(RT.t); sp.disabled = !(sa && RT.t - sa.start > .15 && sa.start + sa.s.dur - RT.t > .15); }
}
function snapT(t, skip, len) {
  const cand = [0, RT.t].concat(shotStarts().slice(1), [totalDur()]);
  ST.items.forEach(s => (s.actions || []).forEach((a, i) => { if (skip !== s.id + ':' + i) cand.push(a.t, a.t + a.dur); }));
  const th = 9 / PPS; let best = t, bd = th;
  cand.forEach(c => { if (Math.abs(c - t) < bd) { bd = Math.abs(c - t); best = c; } if (len && Math.abs(c - (t + len)) < bd) { bd = Math.abs(c - (t + len)); best = c - len; } });
  return Math.round(best * 100) / 100;
}
function dragEl(e, el, move, end) {
  let moved = false, lx = e.clientX; const x0 = e.clientX, y0 = e.clientY;
  try { el.setPointerCapture(e.pointerId); } catch (_) { }
  const mm = ev => { if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return; moved = true; lx = ev.clientX; move(ev.clientX); };
  const uu = ev => { el.removeEventListener('pointermove', mm); el.removeEventListener('pointerup', uu); el.removeEventListener('pointercancel', uu); end && end(moved, ev.clientX == null ? lx : ev.clientX); };
  el.addEventListener('pointermove', mm); el.addEventListener('pointerup', uu); el.addEventListener('pointercancel', uu);
}
function splitShot(t) {
  const sa = shotAt(t); if (!sa) return; const off = t - sa.start;
  if (off < .15 || sa.s.dur - off < .15) return toast('ضع مؤشر الزمن داخل لقطة لقصّها');
  const n = Object.assign({}, sa.s, { id: nid('s'), dur: +(sa.s.dur - off).toFixed(2), trans: 'cut' }); sa.s.dur = +off.toFixed(2);
  ST.shots.splice(sa.i + 1, 0, n); RT.selShot = n.id; RT.selAct = null; RT.popFor = { kind: 'shot', id: n.id }; RT.src = 'edit'; commit();
  toast('قُصّت اللقطة: اختر كاميرا للجزء الثاني');
}
function zoomTL(k) {
  const sc = $('#tsc'), lw = LABW(), tc = sc ? (sc.scrollLeft + sc.clientWidth / 2 - lw) / PPS : RT.t;
  RT.zoom = k === 0 ? 1 : clamp(RT.zoom * k, .4, 12); renderTL();
  const s2 = $('#tsc'); if (s2) s2.scrollLeft = lw + tc * PPS - s2.clientWidth / 2;
}
function tlTool(k) {
  switch (k) {
    case 'split': splitShot(RT.t); break;
    case 'addShot': { const cam = camById(RT.cam) || ST.cams[0]; if (!cam) return toast('أضف كاميرا أولًا من تبويب الكاميرات'); const sh = { id: nid('s'), cam: cam.id, dur: 2, trans: 'cut' }; ST.shots.push(sh); RT.selShot = sh.id; RT.popFor = { kind: 'shot', id: sh.id }; commit(); break; }
    case 'addAct': { const s = (RT.sel && itemById(RT.sel)) || tlRows()[0]; if (!s) return toast('أضف شخصية أولًا'); RT.popFor = { kind: 'type', id: s.id, t: +RT.t.toFixed(1) }; reopenPop(); break; }
    case 'zin': zoomTL(1.5); break; case 'zout': zoomTL(1 / 1.5); break; case 'fit': zoomTL(0); break;
  }
}
function bindTL() {
  const tl = $('#tl');
  tl.addEventListener('click', e => { const b = e.target.closest('[data-tb]'); if (b && !b.disabled) tlTool(b.dataset.tb); });
  tl.addEventListener('pointerdown', e => {
    if (e.button > 0 || e.target.closest('.tlbar')) return;
    const tin = $('#tin'); if (!tin) return;
    const lw = LABW(), tAt = x => clamp((x - tin.getBoundingClientRect().left - lw) / PPS, 0, tlLen() + 2);
    const add = e.target.closest('[data-add]');
    if (add) { e.preventDefault(); RT.sel = add.dataset.add; RT.popFor = { kind: 'type', id: add.dataset.add, t: +RT.t.toFixed(1) }; reopenPop(); return; }
    const lab = e.target.closest('[data-lab]'); if (lab) { onSelectItem(lab.dataset.lab); return; }
    const cut = e.target.closest('.cut'), end = e.target.closest('.endh'), act = e.target.closest('.act'), clip = e.target.closest('.clip');
    if (cut) {
      e.preventDefault(); closePop(); const j = +cut.dataset.cut;
      dragEl(e, cut, x => { const st = shotStarts(), a = ST.shots[j - 1], b = ST.shots[j], tot = a.dur + b.dur; const C = clamp(snapT(tAt(x)), st[j - 1] + .2, st[j - 1] + tot - .2); a.dur = +(C - st[j - 1]).toFixed(2); b.dur = +(tot - a.dur).toFixed(2); RT.t = C; RT.src = 'edit'; analyze(); renderTLLight(); RT.dirty = true; }, m => { if (m) commit(); });
      return;
    }
    if (end) {
      e.preventDefault(); closePop();
      dragEl(e, end, x => { const st = shotStarts(), k = ST.shots.length - 1; ST.shots[k].dur = +Math.max(.2, snapT(tAt(x)) - st[k]).toFixed(2); renderTLLight(); RT.dirty = true; }, m => { if (m) commit(); });
      return;
    }
    if (act) {
      e.preventDefault(); const s = itemById(act.dataset.item), ai = +act.dataset.ai, a = s && s.actions[ai]; if (!a) return;
      const trim = e.target.closest('[data-trim]'), side = trim && trim.dataset.trim, t0 = a.t, d0 = a.dur, x0 = e.clientX, key = s.id + ':' + ai;
      dragEl(e, act, x => {
        const dt = (x - x0) / PPS;
        if (side === 'r') a.dur = +Math.max(.1, snapT(t0 + d0 + dt, key) - t0).toFixed(2);
        else if (side === 'l') { const e2 = t0 + d0, nt = clamp(snapT(t0 + dt, key), 0, e2 - .1); a.t = +nt.toFixed(2); a.dur = +(e2 - nt).toFixed(2); }
        else a.t = +Math.max(0, snapT(t0 + dt, key, d0)).toFixed(2);
        act.style.left = (lw + a.t * PPS) + 'px'; act.style.width = Math.max(a.dur * PPS, 16) + 'px'; closePop(); RT.dirty = true;
      }, moved => {
        RT.sel = s.id; RT.selAct = { id: s.id, ai }; RT.selShot = null; RT.ctxCam = null;
        if (moved) { RT.popFor = null; commit(); }
        else { RT.popFor = { kind: 'act', id: s.id, ai }; renderTL(); renderCtx(); if (TAB === 'cast' || TAB === 'props') renderPanel(); RT.dirty = true; }
      });
      return;
    }
    if (clip) {
      e.preventDefault(); const i = +clip.dataset.shot, sh = ST.shots[i], x0 = e.clientX; let ghost = false;
      dragEl(e, clip, x => { if (Math.abs(x - x0) > 10 || ghost) { ghost = true; closePop(); clip.classList.add('drag'); clip.style.transform = `translateX(${x - x0}px)`; } }, (moved, x) => {
        if (ghost) {
          const st = shotStarts(), tc = tAt(x); let j = 0; ST.shots.forEach((o, k) => { if (k !== i && st[k] + o.dur / 2 < tc) j++; });
          ST.shots.splice(i, 1); ST.shots.splice(j, 0, sh); RT.selShot = sh.id; RT.popFor = null; commit(); if (j !== i) toast(`نُقلت اللقطة إلى الموضع ${j + 1}`);
        } else {
          RT.selShot = sh.id; RT.selAct = null; RT.src = 'edit'; RT.quiz = null; RT.t = clamp(tAt(x), shotStarts()[i], shotStarts()[i] + sh.dur - .001); RT.cam = sh.cam;
          RT.popFor = { kind: 'shot', id: sh.id }; renderTL(); if (TAB === 'edit' || TAB === 'cams') renderPanel(); RT.dirty = true;
        }
      });
      return;
    }
    closePop();
    const row = e.target.closest('.trow.trk');
    if (e.target.closest('.ruler') || e.pointerType === 'mouse') {
      e.preventDefault(); RT.t = tAt(e.clientX); RT.dirty = true; updPH(true);
      dragEl(e, tin, x => { RT.t = tAt(x); RT.dirty = true; updPH(true); }, () => { if (row && row.dataset.item && RT.sel !== row.dataset.item) onSelectItem(row.dataset.item); else if (TAB === 'cast' || TAB === 'props') renderPanel(); });
    } else {
      const x0 = e.clientX, y0 = e.clientY;
      const up = ev => { tl.removeEventListener('pointercancel', cancel); if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) { RT.t = tAt(ev.clientX); RT.dirty = true; updPH(true); if (row && row.dataset.item && RT.sel !== row.dataset.item) onSelectItem(row.dataset.item); } };
      const cancel = () => tl.removeEventListener('pointerup', up);
      tl.addEventListener('pointerup', up, { once: true }); tl.addEventListener('pointercancel', cancel, { once: true });
    }
  });
  tl.addEventListener('wheel', e => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); zoomTL(e.deltaY < 0 ? 1.2 : 1 / 1.2); }, { passive: false });
  bindPop();
}

/* ---------- popovers ---------- */
function closePop() { const p = $('#pop'); if (!p || p.hidden) { RT.popFor = null; return false; } p.hidden = true; RT.popFor = null; return true; }
function placePop(anchor) {
  const p = $('#pop'), r = anchor.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight;
  const x = clamp(r.left + r.width / 2 - pw / 2, 8, innerWidth - pw - 8); let y = r.top - ph - 10; if (y < 8) y = Math.min(r.bottom + 10, innerHeight - ph - 8);
  p.style.left = x + 'px'; p.style.top = y + 'px';
}
function popAnchor(f) {
  if (f.anchor === 'ctx') return document.querySelector('#ctx [data-cx="act"]');
  if (f.kind === 'add') return document.querySelector('#sui [data-sui="add"]');
  if (f.kind === 'shot') { const i = ST.shots.findIndex(s => s.id === f.id); return i >= 0 ? document.querySelector(`#tin .clip[data-shot="${i}"]`) : null; }
  if (f.kind === 'act' || (f.kind === 'type' && f.ai != null)) return document.querySelector(`#tin .act[data-item="${f.id}"][data-ai="${f.ai}"]`);
  if (f.kind === 'type' && f.after != null) return document.querySelector(`#tin .act[data-item="${f.id}"][data-ai="${f.after}"]`);
  return document.querySelector(`#tin [data-add="${f.id}"]`) || document.querySelector('[data-tb="addAct"]');
}
function reopenPop() {
  const f = RT.popFor, p = $('#pop'); if (!f) { p.hidden = true; return; }
  const el = popAnchor(f), html = f.kind === 'act' ? actPop(f) : f.kind === 'shot' ? shotPop(f) : f.kind === 'add' ? addPop() : typePop(f);
  if (!el || !html) { p.hidden = true; RT.popFor = null; return; }
  p.innerHTML = html; p.hidden = false; placePop(el);
}
const PX = '<button class="px" data-pa="close" aria-label="إغلاق">×</button>';
function addPop() {
  const g = (t, list) => `<div class="pgh">${t}</div><div class="pg">${list}</div>`;
  return `<div class="pt">أضف إلى المشهد${PX}</div>` + g('شخصيات', Object.entries(CAST).map(([k, c]) => `<button class="pb" data-pa="addItem" data-v="${k}">${c.ar}</button>`).join('')) + g('حيوانات', Object.entries(ANIMALS).map(([k, c]) => `<button class="pb" data-pa="addItem" data-v="${k}">${c.ar}</button>`).join('')) + g('عناصر', Object.entries(PROPS).map(([k, c]) => `<button class="pb" data-pa="addItem" data-v="${k}">${c.ar}</button>`).join(''));
}
function actPop(f) {
  const s = itemById(f.id), a = s && s.actions[f.ai]; if (!a) return '';
  let extra = '';
  if (a.type === 'walk' || a.type === 'run') extra = `<button class="pb" data-pa="aPick">${IC.pin}<span>عدّل الوجهة</span></button>`;
  if (a.type === 'eyes') extra = `<select data-ps="v" aria-label="الاتجاه">${selOpts([[0, 'إلى الأمام'], [-1, 'يمينًا'], [1, 'يسارًا'], [2, 'إلى الأعلى'], [-2, 'إلى الأسفل']], a.v == null ? 1 : a.v)}</select>`;
  if (a.type === 'turn') extra = `<select data-ps="v" aria-label="الاتجاه">${selOpts([[-180, 'استدارة كاملة'], [-90, 'يمينًا 90°'], [-45, 'يمينًا 45°'], [45, 'يسارًا 45°'], [90, 'يسارًا 90°']], a.v == null ? 90 : a.v)}</select>`;
  if (a.type === 'look') extra = `<select data-ps="v" aria-label="الاتجاه">${selOpts([[-70, 'إلى اليمين'], [-30, 'قليلًا يمينًا'], [0, 'إلى الأمام'], [30, 'قليلًا يسارًا'], [70, 'إلى اليسار']], a.v == null ? 60 : a.v)}</select>`;
  return `<div class="pt"><b>${esc(s.name)}</b> · ${actLabel(a, s)} <bdi dir="ltr">${fmt(a.t)}s</bdi>${PX}</div>
  <div class="pr"><button class="pb sq" data-pa="aDur" data-v="-0.2" aria-label="أقصر">${IC.minus}</button><bdi dir="ltr" class="pv">${fmt(a.dur)}s</bdi><button class="pb sq" data-pa="aDur" data-v="0.2" aria-label="أطول">${IC.plus}</button>${extra}</div>
  <div class="pr"><button class="pb" data-pa="aType">${IC.edit}<span>النوع</span></button><button class="pb" data-pa="aAfter">${IC.plus}<span>بعدها</span></button><button class="pb" data-pa="aDup">${IC.copy}<span>نسخ</span></button><button class="pb danger" data-pa="aDel">${IC.trash}<span>حذف</span></button></div>`;
}
function typePop(f) {
  const s = itemById(f.id); if (!s) return '';
  const cur = f.ai != null && s.actions[f.ai] ? s.actions[f.ai].type : null;
  const types = actTypesFor(s), groups = ACT_GROUPS.map(([g, ar]) => [ar, types.filter(([, a]) => a.g === g)]).filter(([, l]) => l.length);
  return `<div class="pt">${f.ai != null ? 'غيّر الحركة' : `حركة جديدة لـ<b>${esc(s.name)}</b>`} <bdi dir="ltr">${fmt(f.t)}s</bdi>${PX}</div>${groups.map(([ar, l]) => `<div class="pgh">${ar}</div><div class="pg">${l.map(([k]) => `<button class="pb${k === cur ? ' on' : ''}" data-pa="pickType" data-v="${k}">${actLabel({ type: k }, s)}</button>`).join('')}</div>`).join('')}`;
}
function shotPop(f) {
  const i = ST.shots.findIndex(s => s.id === f.id), sh = ST.shots[i]; if (!sh) return ''; const st = shotStarts()[i];
  return `<div class="pt">لقطة ${i + 1} <bdi dir="ltr">${fmt(st)}–${fmt(st + sh.dur)}s</bdi>${PX}</div>
  <div class="pr wrap">${ST.cams.map((c, k) => `<button class="pb cam${c.id === sh.cam ? ' on' : ''}" data-pa="sCam" data-v="${c.id}"><i style="background:${CAM_COLORS[k % 8]}"></i><b>${esc(c.name)}</b><small>${sizeAr(c)}</small></button>`).join('')}</div>
  <div class="pr"><button class="pb sq" data-pa="sDur" data-v="-0.2" aria-label="أقصر">${IC.minus}</button><bdi dir="ltr" class="pv">${fmt(sh.dur)}s</bdi><button class="pb sq" data-pa="sDur" data-v="0.2" aria-label="أطول">${IC.plus}</button><select data-ps="trans" aria-label="الانتقال">${[['cut', 'قطع'], ['dissolve', 'مزج'], ['fade', 'تلاشٍ']].map(([k, v]) => `<option value="${k}"${(sh.trans || 'cut') === k ? ' selected' : ''}>${i === 0 && k !== 'cut' ? 'ظهور من الأسود' : v}</option>`).join('')}</select></div>
  <div class="pr"><button class="pb" data-pa="sSplit">${IC.scissors}<span>قصّ</span></button><button class="pb" data-pa="sEdit">${IC.cam}<span>الكاميرا</span></button><button class="pb" data-pa="sDup">${IC.copy}<span>نسخ</span></button><button class="pb danger" data-pa="sDel">${IC.trash}<span>حذف</span></button></div>`;
}
function bindPop() {
  const p = $('#pop');
  p.addEventListener('click', e => {
    const b = e.target.closest('[data-pa]'); if (!b) return; const f = RT.popFor; if (!f) return;
    const s = itemById(f.id), A = b.dataset.pa, v = b.dataset.v;
    const a = s && f.ai != null ? s.actions[f.ai] : null;
    const shI = f.kind === 'shot' ? ST.shots.findIndex(x => x.id === f.id) : -1, sh = ST.shots[shI];
    switch (A) {
      case 'aDur': if (a) { a.dur = +Math.max(.1, a.dur + +v).toFixed(2); commit(); } break;
      case 'close': closePop(); break;
      case 'addItem': closePop(); addItem(v); break;
      case 'aPick': if (a) { showPath(s.id, f.ai); closePop(); } break;
      case 'aType': RT.popFor = { kind: 'type', id: f.id, ai: f.ai, t: a.t }; reopenPop(); break;
      case 'aAfter': RT.popFor = { kind: 'type', id: f.id, t: +(a.t + a.dur).toFixed(2), after: f.ai }; reopenPop(); break;
      case 'aDup': if (a) { const c = Object.assign({}, a, { t: +(a.t + a.dur).toFixed(2) }); s.actions.push(c); RT.selAct = { id: s.id, ai: s.actions.length - 1 }; RT.popFor = { kind: 'act', id: s.id, ai: s.actions.length - 1 }; commit(); } break;
      case 'aDel': if (a) { s.actions.splice(f.ai, 1); RT.selAct = null; closePop(); commit(); } break;
      case 'pickType': {
        if (f.ai != null && a) { a.type = v; a.dur = ACT_DUR[v] || a.dur; if (v === 'turn') a.v = 90; if (v === 'look') a.v = 60; if (v === 'eyes') a.v = 1; if ((v === 'walk' || v === 'run') && a.tx == null) { const st0 = evalItem(s, a.t); a.tx = +(st0.x + Math.sin(st0.rot) * 2.5).toFixed(2); a.tz = +(st0.z + Math.cos(st0.rot) * 2.5).toFixed(2); } RT.popFor = { kind: 'act', id: s.id, ai: f.ai }; commit(); }
        else if (s) { RT.popFor = null; closePop(); const ai = addAction(s, v, f.t); if (ai != null && v !== 'walk' && v !== 'run') { RT.selAct = { id: s.id, ai }; RT.popFor = { kind: 'act', id: s.id, ai }; reopenPop(); } }
        break;
      }
      case 'sCam': if (sh) { sh.cam = v; RT.cam = v; commit(); } break;
      case 'sDur': if (sh) { sh.dur = +clamp(sh.dur + +v, .2, 60).toFixed(2); commit(); } break;
      case 'sSplit': if (sh) { const st = shotStarts()[shI]; splitShot(RT.t > st + .15 && RT.t < st + sh.dur - .15 ? RT.t : st + sh.dur / 2); } break;
      case 'sEdit': if (sh) { RT.cam = sh.cam; RT.src = sh.cam; closePop(); switchTab('cams'); if (innerWidth < 900) $('#tabs').scrollIntoView({ behavior: 'smooth' }); RT.dirty = true; } break;
      case 'sDup': if (sh) { const c = Object.assign({}, sh, { id: nid('s') }); ST.shots.splice(shI + 1, 0, c); RT.selShot = c.id; RT.popFor = { kind: 'shot', id: c.id }; commit(); } break;
      case 'sDel': if (sh) { ST.shots.splice(shI, 1); RT.selShot = null; closePop(); commit(); } break;
    }
  });
  p.addEventListener('change', e => {
    const el = e.target, f = RT.popFor; if (!f) return;
    if (el.dataset.ps === 'trans') { const sh = ST.shots.find(x => x.id === f.id); if (sh) { sh.trans = el.value; commit(); } }
    if (el.dataset.ps === 'v') { const s = itemById(f.id), a = s && s.actions[f.ai]; if (a) { a.v = +el.value; commit(); } }
  });
  document.addEventListener('pointerdown', e => { if (!p.hidden && !e.target.closest('#pop,#tin .act,#tin .clip,[data-add],[data-tb="addAct"],#ctx,[data-sui="add"]')) closePop(); }, true);
  addEventListener('resize', () => { if (RT.popFor) reopenPop(); });
  addEventListener('scroll', () => { if (RT.popFor) reopenPop(); }, { passive: true });
}

/* ---------- floating toolbar on the monitor ---------- */
let ctxT = null;
function armCtx() { clearTimeout(ctxT); ctxT = setTimeout(() => { const el = $('#ctx'); if (el && !(RT.popFor && RT.popFor.anchor === 'ctx')) el.classList.add('gone'); }, 4500); }
function hideCtx() { clearTimeout(ctxT); const el = $('#ctx'); if (el) el.classList.add('gone'); }
function renderCtx(show) {
  const el = $('#ctx'), s = RT.sel && itemById(RT.sel), c = !s && RT.ctxCam && camById(RT.ctxCam);
  if (!s && !c) { el.hidden = true; clearTimeout(ctxT); return; }
  const b = (k, ic, t, cls) => `<button data-cx="${k}" class="${cls || ''}" title="${t}" aria-label="${t}">${ic}<span>${t}</span></button>`;
  el.innerHTML = s
    ? `<b class="cn">${esc(s.name)}</b>${b('smaller', IC.minus, 'أصغر')}${b('bigger', IC.plus, 'أكبر')}${b('rot', IC.rotR, 'تدوير')}${b('act', IC.walk, 'حركة')}${b('dup', IC.copy, 'نسخ')}${b('del', IC.trash, 'حذف', 'danger')}`
    : `<b class="cn">الكاميرا ${esc(c.name)}</b>${b('cView', IC.cam, 'عرض')}${b('cShot', IC.plus, 'لقطة')}${b('cDup', IC.copy, 'نسخ')}${b('cDel', IC.trash, 'حذف', 'danger')}`;
  if (show) { el.classList.remove('gone'); armCtx(); } else if (el.hidden) el.classList.add('gone');
  el.hidden = false; posCtx();
}
const _pv = new THREE.Vector3();
function posCtx() {
  const el = $('#ctx'); if (!el || el.hidden) return;
  if (document.body.classList.contains('cine') || RT.quiz) { el.style.visibility = 'hidden'; return; } el.style.visibility = '';
  const W = monEl.clientWidth, H = monEl.clientHeight, s = RT.sel && itemById(RT.sel), ew = el.offsetWidth, eh = el.offsetHeight;
  let sx = null, sy = null;
  if (s && OBJ[s.id]) { const o = OBJ[s.id]; _pv.copy(o.root.position); _pv.y += s.kind === 'human' ? s.h / 100 + .12 : Math.max(.5, (o.lastR || .5) * 1.3); }
  else if (RT.ctxCam && GIZ[RT.ctxCam] && GIZ[RT.ctxCam].visible) { _pv.copy(GIZ[RT.ctxCam].position); _pv.y += .45; }
  else _pv.set(NaN, 0, 0);
  if (!isNaN(_pv.x)) {
    if (RT.view === 'dir') { _pv.project(dirCam); if (_pv.z < 1) { sx = (_pv.x + 1) / 2 * W; sy = (1 - _pv.y) / 2 * H; } }
    else if (RT.R) { _pv.project(shotCam); const fr = RT.frameRect; if (_pv.z < 1) { sx = fr.x + (_pv.x + 1) / 2 * fr.w; sy = fr.y + (1 - _pv.y) / 2 * fr.h; } }
  }
  let x, y;
  if (sx != null && sx > 0 && sx < W && sy > 0 && sy < H) { x = clamp(sx - ew / 2, 6, W - ew - 6); y = clamp(sy - eh - 14, 6, H - eh - 6); }
  else { x = (W - ew) / 2; y = 8; }
  el.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
}
function bindCtx() {
  $('#ctx').addEventListener('click', e => {
    const b = e.target.closest('[data-cx]'); if (!b) return; e.stopPropagation(); armCtx();
    const s = itemById(RT.sel), c = camById(RT.ctxCam), k = b.dataset.cx;
    if (s) switch (k) {
      case 'rot': s.rot = Math.round(((s.rot || 0) - 45 + 540) % 360 - 180); commit(); break;
      case 'smaller': if (s.kind === 'human') s.h = clamp(s.h - 5, 50, 215); else s.scale = +clamp((s.scale || 1) / 1.12, .2, 6).toFixed(2); commit(); break;
      case 'bigger': if (s.kind === 'human') s.h = clamp(s.h + 5, 50, 215); else s.scale = +clamp((s.scale || 1) * 1.12, .2, 6).toFixed(2); commit(); break;
      case 'act': RT.popFor = { kind: 'type', id: s.id, t: +RT.t.toFixed(1), anchor: 'ctx' }; reopenPop(); break;
      case 'dup': { const d = JSON.parse(JSON.stringify(s)); d.id = nid('i'); d.x += .9; d.name += ' 2'; d.actions = (d.actions || []).map(a => (a.tx != null ? Object.assign(a, { tx: a.tx + .9 }) : a)); ST.items.push(d); RT.sel = d.id; commit(); toast('نُسخ العنصر'); break; }
      case 'edit': switchTab(s.kind === 'prop' ? 'props' : 'cast'); if (innerWidth < 900) $('#tabs').scrollIntoView({ behavior: 'smooth' }); break;
      case 'del': delItem(s.id); break;
      case 'close': RT.sel = null; renderCtx(); renderTL(); if (TAB === 'cast' || TAB === 'props') renderPanel(); RT.dirty = true; break;
    }
    else if (c) switch (k) {
      case 'cView': RT.src = c.id; RT.cam = c.id; setView('cam'); RT.dirty = true; break;
      case 'cShot': ST.shots.push({ id: nid('s'), cam: c.id, dur: 2.5, trans: 'cut' }); commit(); toast(`أُضيفت لقطة بالكاميرا ${c.name}`); break;
      case 'cEdit': RT.cam = c.id; switchTab('cams'); if (innerWidth < 900) $('#tabs').scrollIntoView({ behavior: 'smooth' }); break;
      case 'cDup': { const d = JSON.parse(JSON.stringify(c)); d.id = nid('c'); d.name = camName(ST.cams.length); if (d.mode === 'free') d.px = (d.px || 0) + .6; ST.cams.push(d); RT.cam = d.id; RT.ctxCam = d.id; commit(); break; }
      case 'cDel': ST.cams = ST.cams.filter(x => x.id !== c.id); ST.shots = ST.shots.filter(x => x.cam !== c.id); RT.ctxCam = null; RT.src = 'edit'; RT.cam = ST.cams[0] ? ST.cams[0].id : null; commit(); break;
      case 'close': RT.ctxCam = null; renderCtx(); break;
    }
    else if (k === 'close') { RT.ctxCam = null; renderCtx(); }
  });
}

/* ---------- full-screen editing (stage) ---------- */
function stageOn() { return document.body.classList.contains('stage'); }
function enterStage() {
  document.body.classList.add('stage'); closePop(); renderSUI(); setTimeout(onResize, 40);
  try { if (!window.AndroidBridge && !inFrame() && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().then(() => { try { screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } }).catch(() => { }); } catch (e) { }
  hint('كل التحكم هنا: اسحب العناصر والأسهم، واضغط مطولًا على الأرض لتمشي الشخصية المختارة إليها.', 4500, 'stage');
}
function exitStage() { document.body.classList.remove('stage'); closePop(); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { } setTimeout(onResize, 40); renderAll(); }
function renderSUI() {
  const el = $('#sui'); if (!el) return; if (!stageOn()) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="st-top"><button class="sbtn" data-sui="exit" aria-label="خروج من الشاشة الكاملة">${IC.x}</button>
  <div class="seg"><button data-sui="cam" class="${RT.view === 'cam' ? 'on' : ''}">${IC.cam}<span>الكاميرا</span></button><button data-sui="dir" class="${RT.view === 'dir' ? 'on' : ''}">${IC.dir}<span>المخرج</span></button></div>
  <div class="st-r"><button class="sbtn" data-sui="undo" aria-label="تراجع">${IC.undo}</button><button class="sbtn" data-sui="cine" aria-label="عرض سينمائي">${IC.film}</button></div></div>
  <div class="st-bot"><button class="sbtn pl" data-sui="play" aria-label="${RT.playing ? 'إيقاف' : 'تشغيل'}">${RT.playing ? IC.pause : IC.play}</button>
  <input type="range" id="suiT" min="0" max="${tlLen().toFixed(2)}" step="0.01" value="${RT.t}" aria-label="الزمن"><span class="stc" dir="ltr" id="suiTc">${fmt(RT.t)}s</span>
  <div class="scams"><button data-sui="src" data-v="edit" class="${RT.src === 'edit' ? 'on' : ''}">المونتاج</button>${ST.cams.map((c, i) => `<button data-sui="src" data-v="${c.id}" class="${RT.src === c.id ? 'on' : ''}"><i style="background:${CAM_COLORS[i % 8]}"></i>${esc(c.name)}</button>`).join('')}</div>
  <button class="sbtn add" data-sui="add">${IC.plus}<span>إضافة</span></button></div>${camStrip()}`;
}
function camStrip() {
  const c = RT.src !== 'edit' && camById(RT.src); document.body.classList.toggle('camstrip', !!c && stageOn()); if (!c) return '';
  const sel = (f, list, cur) => `<select data-sc="${f}" aria-label="${f}">${list.map(([k, v]) => `<option value="${k}"${String(k) === String(cur) ? ' selected' : ''}>${v}</option>`).join('')}</select>`;
  const free = c.mode === 'free';
  return `<div class="st-cam"><b>الكاميرا ${esc(c.name)}</b>${free ? '' : sel('size', SIZES.map(x => [x.k, x.ar]), c.size) + sel('angle', ANGLES.map(x => [x.k, x.ar]), c.angle)}${sel('lens', LENSES.map(x => [x, x + 'mm']), c.lens)}${sel('move', MOVES.filter(m => !(free && m.k === 'track')).map(x => [x.k, x.ar]), c.move)}<button class="sbtn" data-sui="shot">${IC.plus}<span>لقطة</span></button></div>`;
}
function bindSUI() {
  const el = $('#sui');
  el.addEventListener('pointerdown', e => e.stopPropagation());
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-sui]'); if (!b) return; e.stopPropagation();
    switch (b.dataset.sui) {
      case 'exit': exitStage(); break;
      case 'cam': setView('cam'); renderSUI(); break;
      case 'dir': setView('dir'); renderSUI(); break;
      case 'undo': undo(); break;
      case 'cine': cine(true); break;
      case 'play': RT.playing ? pause() : play(); renderSUI(); break;
      case 'src': RT.src = b.dataset.v; RT.quiz = null; RT.camPrevOn = false; if (RT.src !== 'edit') RT.cam = RT.src; setView('cam'); renderSUI(); RT.dirty = true; break;
      case 'add': RT.popFor = { kind: 'add' }; reopenPop(); break;
      case 'shot': { const c = camById(RT.src); if (c) { ST.shots.push({ id: nid('s'), cam: c.id, dur: 2.5, trans: 'cut' }); commit(); toast(`أُضيفت لقطة بالكاميرا ${c.name}`); } break; }
    }
  });
  el.addEventListener('change', e => { const f = e.target.dataset.sc, c = camById(RT.src); if (f && c) { c[f] = f === 'lens' ? +e.target.value : e.target.value; commit(); } });
  el.addEventListener('input', e => { if (e.target.id === 'suiT') { RT.t = +e.target.value; RT.playing = false; RT.dirty = true; updPH(true); } });
}
