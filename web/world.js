/* كادر — world builders: materials, textures, environments, props, people, animals, gizmos */
const MC = new Map();
function mat(c, o) {
  const k = c + '|' + (o ? JSON.stringify(o) : '');
  let m = MC.get(k);
  if (!m) { m = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .84, metalness: 0 }, o || {})); MC.set(k, m); }
  return m;
}
function msh(g, c, o) { const m = new THREE.Mesh(g, c && c.isMaterial ? c : mat(c, o)); m.castShadow = true; m.receiveShadow = true; return m; }
function at(o, x, y, z) { o.position.set(x || 0, y || 0, z || 0); return o; }
function bx(w, h, d, c, x, y, z, o) { return at(msh(new THREE.BoxGeometry(w, h, d), c, o), x, y, z); }
function cy(rt, rb, h, c, x, y, z, seg, o) { return at(msh(new THREE.CylinderGeometry(rt, rb, h, seg || 14), c, o), x, y, z); }
function sp(r, c, x, y, z, o) { return at(msh(new THREE.SphereGeometry(r, 18, 14), c, o), x, y, z); }
function G() { return new THREE.Group(); }
function plane(w, h, m, x, y, z, rx, ry) {
  const me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m && m.isMaterial ? m : mat(m));
  me.position.set(x || 0, y || 0, z || 0); me.rotation.set(rx || 0, ry || 0, 0); me.receiveShadow = true; return me;
}
function shade(hex, f) { const c = new THREE.Color(hex); c.multiplyScalar(f); return '#' + c.getHexString(); }

/* ---------- canvas textures ---------- */
let SEED = 11;
function rnd() { SEED = (SEED * 16807) % 2147483647; return (SEED - 1) / 2147483646; }
function ctex(w, h, fn, rx, ry) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); t.anisotropy = 4; return t;
}
function speckle(g, w, h, n, cols, a) {
  for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.globalAlpha = a * (.4 + rnd() * .6); const s = 1 + rnd() * 2.5; g.fillRect(rnd() * w, rnd() * h, s, s); }
  g.globalAlpha = 1;
}
function star8(g, cx, cy, r, c) { g.fillStyle = c; for (let k = 0; k < 2; k++) { g.save(); g.translate(cx, cy); g.rotate(k * Math.PI / 4); g.fillRect(-r * .7, -r * .7, r * 1.4, r * 1.4); g.restore(); } }
const TX = {
  wood: (rx, ry) => ctex(512, 512, (g, w, h) => {
    const n = 8;
    for (let i = 0; i < n; i++) {
      g.fillStyle = `hsl(25,40%,${36 + rnd() * 10}%)`; g.fillRect(0, i * h / n, w, h / n);
      g.fillStyle = 'rgba(35,18,8,.55)'; g.fillRect(0, i * h / n, w, 2); g.fillRect(rnd() * w, i * h / n, 2, h / n);
      for (let k = 0; k < 5; k++) { g.strokeStyle = 'rgba(60,30,12,.16)'; g.beginPath(); const y = i * h / n + rnd() * h / n; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + 5, w * .6, y - 5, w, y + 2); g.stroke(); }
    }
  }, rx, ry),
  tile: (rx, ry) => ctex(256, 256, (g, w, h) => {
    g.fillStyle = '#efe6d4'; g.fillRect(0, 0, w, h); const s = w / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const cx = i * s + s / 2, cyy = j * s + s / 2;
      star8(g, cx, cyy, s * .4, (i + j) % 2 ? '#2f7a64' : '#2b4f8a');
      g.fillStyle = '#efe6d4'; g.beginPath(); g.arc(cx, cyy, s * .17, 0, TAU); g.fill();
      g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(cx, cyy, s * .08, 0, TAU); g.fill();
    }
    g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
  }, rx, ry),
  carpet: () => ctex(512, 512, (g, w, h) => {
    g.fillStyle = '#8e2b25'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#e9d6a8'; g.lineWidth = 10; g.strokeRect(20, 20, w - 40, h - 40);
    g.strokeStyle = '#22325a'; g.lineWidth = 18; g.strokeRect(46, 46, w - 92, h - 92);
    const dia = (m, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(w / 2, m); g.lineTo(w - m - 20, h / 2); g.lineTo(w / 2, h - m); g.lineTo(m + 20, h / 2); g.closePath(); g.fill(); };
    dia(92, '#22325a'); dia(160, '#e9d6a8'); dia(205, '#8e2b25');
    g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(w / 2, h / 2, 26, 0, TAU); g.fill();
  }),
  facade: (col, rx, ry) => ctex(256, 256, (g, w, h) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h); speckle(g, w, h, 900, ['#000', '#fff'], .05);
    g.fillStyle = '#2f6f5f'; g.fillRect(58, 62, 30, 110); g.fillRect(168, 62, 30, 110);
    g.fillStyle = '#33404e'; g.fillRect(92, 62, 72, 110);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(96, 66, 30, 102);
    g.fillStyle = shade(col, .82); g.fillRect(84, 176, 88, 10);
  }, rx, ry),
  noise: (base, cols, a, rx, ry, n) => ctex(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); speckle(g, w, h, n || 2600, cols, a); }, rx, ry),
  stone: (rx, ry) => ctex(256, 256, (g, w, h) => {
    g.fillStyle = '#c47f4b'; g.fillRect(0, 0, w, h); speckle(g, w, h, 2200, ['#8f5a33', '#e2a876'], .25);
    g.strokeStyle = 'rgba(110,60,30,.45)'; g.lineWidth = 2;
    for (let r = 0; r < 6; r++) { const y = r * h / 6; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let c = 0; c < 4; c++) { const x = (c + (r % 2) * .5) * w / 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h / 6); g.stroke(); } }
  }, rx, ry),
  lino: (rx, ry) => ctex(256, 256, (g, w, h) => {
    g.fillStyle = '#cfc6b2'; g.fillRect(0, 0, w, h); speckle(g, w, h, 1500, ['#a89f8b', '#e8e1d0'], .25);
    g.strokeStyle = 'rgba(80,70,55,.25)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
  }, rx, ry)
};
function tmat(tex, o) { return new THREE.MeshStandardMaterial(Object.assign({ map: tex, roughness: .9 }, o || {})); }

/* ---------- shapes ---------- */
function archPath(s, r, h, rev) {
  if (!rev) { s.moveTo(-r, 0); s.lineTo(-r, h - r); s.absarc(0, h - r, r, Math.PI, 0, true); s.lineTo(r, 0); }
  else { s.lineTo(r, 0); s.lineTo(r, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.lineTo(-r, 0); }
}
function archMesh(w, h, c, o) { const s = new THREE.Shape(); archPath(s, w / 2, h); s.lineTo(-w / 2, 0); const m = new THREE.Mesh(new THREE.ShapeGeometry(s, 16), c && c.isMaterial ? c : mat(c, o)); m.receiveShadow = true; return m; }
function gateMesh(W, H, D, r, h, m) {
  const s = new THREE.Shape(); s.moveTo(-W / 2, 0); s.lineTo(-W / 2, H); s.lineTo(W / 2, H); s.lineTo(W / 2, 0); s.lineTo(r, 0); s.lineTo(r, h - r);
  s.absarc(0, h - r, r, 0, Math.PI, false); s.lineTo(-r, 0); s.lineTo(-W / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: false, curveSegments: 20 }); g.translate(0, 0, -D / 2);
  const me = new THREE.Mesh(g, m); me.castShadow = true; me.receiveShadow = true; return me;
}
function bandMesh(R, r, h, c) {
  const s = new THREE.Shape(); s.moveTo(-R, 0); s.lineTo(-R, h - r); s.absarc(0, h - r, R, Math.PI, 0, true); s.lineTo(R, 0); s.lineTo(r, 0); s.lineTo(r, h - r);
  s.absarc(0, h - r, r, 0, Math.PI, false); s.lineTo(-r, 0); s.lineTo(-R, 0);
  return new THREE.Mesh(new THREE.ShapeGeometry(s, 16), mat(c));
}

/* ---------- props ---------- */
function lampLight(g, color, dist, x, y, z, emis, lamps) {
  const L = new THREE.PointLight(color, 0, dist, 2); L.position.set(x, y, z); g.add(L);
  lamps.push({ light: L, mats: emis });
}
function makeProp(type, c, lamps) {
  const g = G(), C = c || (PROPS[type] && PROPS[type].color) || '#999';
  lamps = lamps || [];
  switch (type) {
    case 'tree': {
      g.add(cy(.12, .18, 1.8, '#6b4a33', 0, .9, 0, 8));
      const fm = mat(C, { flatShading: true });
      [[0, 2.2, 0, .95], [.4, 2.8, .1, .7], [-.35, 2.7, -.2, .68], [0, 3.35, 0, .55]].forEach(a => { const m = msh(new THREE.IcosahedronGeometry(a[3], 0), fm); at(m, a[0], a[1], a[2]); g.add(m); });
      break;
    }
    case 'palm': {
      let x = 0, y = 0;
      for (let i = 0; i < 7; i++) { const s = cy(.12 - i * .006, .15 - i * .006, .68, '#8a6a48', x, y + .34, 0, 8); s.rotation.z = -i * .03; g.add(s); y += .64; x += i * .022; }
      const top = at(G(), x, y, 0); g.add(top);
      for (let i = 0; i < 9; i++) {
        const p1 = G(); p1.rotation.order = 'YXZ'; p1.rotation.y = i / 9 * TAU; p1.rotation.x = -.25; top.add(p1);
        p1.add(bx(.24, .03, 1.5, C, 0, 0, .75));
        const p2 = at(G(), 0, 0, 1.45); p2.rotation.x = .75; p1.add(p2); p2.add(bx(.18, .03, 1.1, C, 0, 0, .55));
      }
      for (let i = 0; i < 6; i++) top.add(sp(.07, '#c7782f', Math.cos(i) * .14, -.14, Math.sin(i) * .14));
      break;
    }
    case 'rock': { const m = msh(new THREE.DodecahedronGeometry(.55, 0), mat(C, { flatShading: true })); m.scale.set(1.3, .7, 1); m.position.y = .3; g.add(m); break; }
    case 'table': g.add(bx(1.3, .06, .8, C, 0, .74, 0)); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.add(bx(.06, .71, .06, C, a * .58, .355, b * .33))); break;
    case 'chair': g.add(bx(.46, .05, .46, C, 0, .45, 0)); g.add(bx(.46, .5, .05, C, 0, .72, -.21)); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.add(bx(.04, .45, .04, C, a * .2, .225, b * .2))); break;
    case 'sofa': g.add(bx(2, .4, .85, C, 0, .2, 0)); g.add(bx(1.9, .14, .74, shade(C, 1.2), 0, .47, .04)); g.add(bx(2, .55, .22, C, 0, .66, -.32)); [-1, 1].forEach(k => g.add(bx(.2, .56, .85, C, k * .95, .42, 0))); break;
    case 'bed':
      g.add(bx(1.5, .32, 2.1, '#6e4a31', 0, .16, 0)); g.add(bx(1.42, .18, 2, '#f1ece2', 0, .41, 0)); g.add(bx(1.46, .07, 1.3, C, 0, .53, .32));
      g.add(bx(.62, .11, .36, '#ffffff', 0, .56, -.74)); g.add(bx(1.5, .75, .08, '#6e4a31', 0, .55, -1.03)); break;
    case 'desk': g.add(bx(1.4, .05, .7, C, 0, .76, 0)); g.add(bx(.45, .73, .66, shade(C, .9), .45, .365, 0)); g.add(bx(.05, .73, .66, C, -.66, .365, 0));
      [.15, .45].forEach(y => g.add(bx(.36, .01, .02, '#d4b26a', .45, y + .1, .335))); break;
    case 'lamp': {
      g.add(cy(.18, .2, .04, '#2f2a26', 0, .02, 0)); g.add(cy(.015, .015, 1.5, '#2f2a26', 0, .77, 0));
      const sm = new THREE.MeshStandardMaterial({ color: C, roughness: .7, emissive: new THREE.Color('#ffcc88'), emissiveIntensity: 0, side: THREE.DoubleSide });
      const s = new THREE.Mesh(new THREE.CylinderGeometry(.14, .24, .3, 18, 1, true), sm); s.position.y = 1.55; s.castShadow = true; g.add(s);
      lampLight(g, 0xffc98a, 8, 0, 1.4, 0, [sm], lamps); break;
    }
    case 'door':
      g.add(bx(1.08, .1, .14, '#e9dfcc', 0, 2.12, 0)); [-1, 1].forEach(k => g.add(bx(.09, 2.15, .14, '#e9dfcc', k * .5, 1.075, 0)));
      g.add(bx(.9, 2.05, .05, C, 0, 1.025, 0)); g.add(sp(.035, '#d4b26a', .34, 1, .05)); break;
    case 'shelf': {
      g.add(bx(1, 1.9, .05, shade(C, .85), 0, .95, -.15)); [-1, 1].forEach(k => g.add(bx(.04, 1.9, .35, C, k * .48, .95, 0)));
      const bc = ['#b5523b', '#2f3b52', '#e7a83a', '#2f6f5f', '#ece5d6', '#7a3b5a'];
      for (let i = 0; i < 5; i++) { g.add(bx(.96, .03, .33, C, 0, .05 + i * .45, 0)); if (i < 4) { let x = -.42; while (x < .38) { const w = .04 + rnd() * .05, hh = .25 + rnd() * .12; g.add(bx(w, hh, .24, bc[(rnd() * bc.length) | 0], x + w / 2, .065 + i * .45 + hh / 2, .02)); x += w + .006; } } }
      break;
    }
    case 'tv': {
      g.add(bx(1.4, .45, .4, '#6e4a31', 0, .225, 0)); g.add(bx(1.2, .7, .06, C, 0, .85, 0)); g.add(bx(.3, .05, .2, C, 0, .47, 0));
      const sc = plane(1.12, .62, new THREE.MeshStandardMaterial({ color: '#1d2b3c', emissive: new THREE.Color('#3a5f8a'), emissiveIntensity: .35 }), 0, .85, .031); g.add(sc); break;
    }
    case 'board': g.add(bx(2.4, 1.2, .05, C, 0, 1.5, 0)); g.add(bx(2.5, .06, .1, '#8a6a48', 0, .88, .04)); [-1, 1].forEach(k => g.add(bx(.06, 2.1, .06, '#8a6a48', k * 1.18, 1.05, -.04))); break;
    case 'box': g.add(bx(.55, .45, .55, C, 0, .225, 0)); g.add(bx(.56, .012, .09, '#e3c999', 0, .456, 0)); break;
    case 'plant': {
      g.add(cy(.18, .13, .32, '#b8643a', 0, .16, 0)); const fm = mat(C, { flatShading: true });
      [[0, .62, 0, .32], [.14, .5, .08, .2], [-.12, .52, -.06, .2]].forEach(a => { const m = msh(new THREE.IcosahedronGeometry(a[3], 0), fm); at(m, a[0], a[1], a[2]); g.add(m); }); break;
    }
    case 'car': {
      g.add(bx(1.8, .55, 4.2, C, 0, .58, 0)); g.add(bx(1.58, .46, 2.1, '#26313b', 0, 1.08, -.25)); g.add(bx(1.62, .07, 2.0, C, 0, 1.34, -.28));
      g.add(bx(1.82, .1, 4.22, '#2a2a2a', 0, .34, 0));
      const wheels = [];
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const wg = at(G(), a * .86, .34, b * 1.35); const w = cy(.34, .34, .24, '#191919', 0, 0, 0, 16); w.rotation.z = Math.PI / 2; wg.add(w); wg.add(at(cy(.15, .15, .25, '#b9b9b9', 0, 0, 0, 10), 0, 0, 0)); wg.children[1].rotation.z = Math.PI / 2; g.add(wg); wheels.push(wg); });
      [-1, 1].forEach(k => { g.add(bx(.34, .12, .04, '#fff3c4', k * .6, .66, 2.1, { emissive: '#fff3c4', emissiveIntensity: .4 })); g.add(bx(.3, .1, .04, '#d1271f', k * .65, .68, -2.1)); });
      g.userData.wheels = wheels; break;
    }
    case 'streetlight': {
      g.add(cy(.07, .1, 4.2, C, 0, 2.1, 0, 10)); g.add(bx(.06, .06, 1, C, 0, 4.15, .45)); g.add(bx(.32, .1, .5, C, 0, 4.1, .92));
      const bm = new THREE.MeshStandardMaterial({ color: '#fff1d2', emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 0 });
      const b = plane(.26, .4, bm, 0, 4.04, .92, Math.PI / 2, 0); g.add(b);
      lampLight(g, 0xffd59a, 16, 0, 3.8, .92, [bm], lamps); break;
    }
    case 'bench': g.add(bx(1.6, .05, .45, C, 0, .45, 0)); g.add(bx(1.6, .32, .05, C, 0, .75, -.22)); [-1, 1].forEach(k => g.add(bx(.06, .45, .5, '#2a2a2a', k * .7, .225, 0))); break;
    case 'wall': g.add(bx(3, 2.6, .15, C, 0, 1.3, 0)); break;
    default: g.add(bx(.5, .5, .5, C, 0, .25, 0));
  }
  return g;
}

/* ---------- people ---------- */
function makeHuman(s) {
  const ch = s.age === 'child';
  const P = ch ? { hr: .108, neck: .035, torso: .34, uLeg: .27, lLeg: .25, foot: .05, uArm: .19, fArm: .17, sh: .135, hipW: .075, lr: .04 }
    : { hr: .115, neck: .06, torso: .55, uLeg: .42, lLeg: .4, foot: .06, uArm: .3, fArm: .27, sh: .19, hipW: .095, lr: .052 };
  const hipH = P.uLeg + P.lLeg + P.foot, topH = hipH + P.torso * .86 + P.neck + P.hr * 2;
  const sc = (s.h / 100) / topH, bw = s.build || 1, r = P.hr, tl = P.torso;
  const legC = s.btype === 'pants' ? s.bot : (s.btype === 'djellaba' ? s.top : s.skin);
  const shinC = s.btype === 'skirt' ? s.skin : legC;
  const foreC = s.sleeves ? s.top : s.skin;
  const acc = s.acc || {};
  const root = G(), body = G(); root.add(body);
  const pelvis = at(G(), 0, hipH, 0); body.add(pelvis);
  const hipM = sp(P.hipW * 1.6, s.btype === 'skirt' ? s.bot : legC); hipM.scale.set(bw, .6, .75); pelvis.add(hipM);
  const spine = G(); pelvis.add(spine);
  const torso = cy(P.sh * .9, P.hipW * 1.5, tl * .82, s.top, 0, tl * .41 + .03, 0, 18); torso.scale.set(bw, 1, .64 * Math.max(1, bw)); spine.add(torso);
  const shM = sp(P.sh * .93, s.top, 0, tl * .82, 0); shM.scale.set(bw, .45, .64 * Math.max(1, bw * .95)); spine.add(shM);
  const neck = at(G(), 0, tl * .86, 0); spine.add(neck);
  neck.add(cy(r * .38, r * .44, P.neck + .05, s.skin, 0, P.neck / 2 - .01, 0, 10));
  const head = at(G(), 0, P.neck, 0); neck.add(head);
  const skull = sp(r, s.skin, 0, r, 0); skull.scale.set(.92, 1.02, 1); head.add(skull);
  [-1, 1].forEach(k => {
    head.add(sp(r * .1, '#1a1412', k * r * .34, r * 1.08, r * .9));
    head.add(bx(r * .32, r * .06, r * .08, s.hair === 'hijab' ? '#3a2a20' : s.hairC, k * r * .34, r * 1.3, r * .9));
    const e = sp(r * .2, s.skin, k * r * .9, r * .98, 0); e.scale.set(.5, 1, .8); head.add(e);
  });
  const nose = sp(r * .16, s.skin, 0, r * .92, r * .96); nose.scale.set(1, 1.15, 1); head.add(nose);
  head.add(bx(r * .3, r * .05, r * .07, '#7a3a32', 0, r * .62, r * .92));
  const hm = mat(s.hairC);
  const cap = (rr, th) => { const m = msh(new THREE.SphereGeometry(r * rr, 22, 14, 0, TAU, 0, th), hm); m.position.y = r; m.scale.set(.93, 1, 1); return m; };
  const back = () => { const m = msh(new THREE.SphereGeometry(r * 1.05, 18, 12, Math.PI, Math.PI, 0, 2.0), hm); m.position.y = r; m.scale.set(.93, 1, 1); return m; };
  switch (s.hair) {
    case 'short': head.add(cap(1.06, 1.25)); head.add(back()); break;
    case 'curly': {
      head.add(cap(1.1, 1.3)); head.add(back());
      const cm = mat(s.hairC, { flatShading: true });
      for (let i = 0; i < 11; i++) { const th = .25 + (i % 3) * .3, ph = i * 2.4; const m = msh(new THREE.IcosahedronGeometry(r * .33, 0), cm); m.position.set(Math.sin(th) * Math.cos(ph) * r * 1.05, r + Math.cos(th) * r * 1.05, Math.sin(th) * Math.sin(ph) * r * 1.05 - r * .1); head.add(m); }
      break;
    }
    case 'long': head.add(cap(1.06, 1.3)); head.add(back()); head.add(bx(r * 1.75, r * 2.5, r * .4, s.hairC, 0, r * .35, -r * .62));
      [-1, 1].forEach(k => head.add(bx(r * .3, r * 1.7, r * .7, s.hairC, k * r * .84, r * .55, -r * .05))); break;
    case 'bun': head.add(cap(1.06, 1.3)); head.add(back()); head.add(sp(r * .42, s.hairC, 0, r * 1.85, -r * .6)); break;
    case 'hijab': {
      const hjm = mat(s.hairC, { side: THREE.DoubleSide });
      const w = msh(new THREE.SphereGeometry(r * 1.14, 26, 16, Math.PI / 2 + .95, TAU - 1.9, 0, 2.55), hjm); w.position.y = r; w.scale.set(.96, 1.03, 1.03); head.add(w);
      const dr = msh(new THREE.CylinderGeometry(r * .9, r * 1.75, r * 1.4, 22, 1, true), hjm); dr.position.y = -r * .25; head.add(dr);
      break;
    }
  }
  if (acc.cap) { const cm = mat('#3c4a2e'); const crown = msh(new THREE.SphereGeometry(r * 1.11, 20, 10, 0, TAU, 0, 1.45), cm); crown.position.y = r; head.add(crown); const br = cy(r * .62, r * .62, r * .08, '#3c4a2e', 0, r * 1.46, r * .74, 16); br.scale.z = 1.3; head.add(br); }
  if (acc.fez) { head.add(cy(r * .62, r * .78, r * .95, '#a3242a', 0, r * 2.02, 0, 18)); head.add(cy(.006, .006, r * .7, '#111', r * .3, r * 2.15, -r * .35, 4)); }
  if (acc.beard) { const bd = sp(r * .78, s.hairC, 0, r * .52, r * .36); bd.scale.set(1.05, .85, .85); head.add(bd); }
  if (acc.mustache || acc.beard) head.add(bx(r * .52, r * .11, r * .1, s.hairC, 0, r * .74, r * .96));
  if (acc.glasses) {
    const gm = mat('#141414');
    [-1, 1].forEach(k => { const t = msh(new THREE.TorusGeometry(r * .24, r * .04, 6, 16), gm); t.position.set(k * r * .36, r * 1.06, r * 1.0); head.add(t); head.add(bx(r * .04, r * .04, r * .95, '#141414', k * r * .62, r * 1.1, r * .52)); });
    head.add(bx(r * .22, r * .04, r * .04, '#141414', 0, r * 1.1, r * 1.0));
  }
  const binoc = G(); [-1, 1].forEach(k => { const t = cy(r * .2, r * .24, r * 1.0, '#1c1c1c', k * r * .3, r * 1.08, r * 2.05, 12); t.rotation.x = Math.PI / 2; binoc.add(t); binoc.add(at(cy(r * .17, r * .17, r * .06, '#5a6a7a', k * r * .3, r * 1.08, r * 2.56, 12), 0, 0, 0)); binoc.children[binoc.children.length - 1].rotation.x = Math.PI / 2; binoc.children[binoc.children.length - 1].position.set(k * r * .3, r * 1.08, r * 2.56); }); binoc.add(bx(r * .36, r * .14, r * .4, '#1c1c1c', 0, r * 1.1, r * 2.0)); binoc.visible = false; head.add(binoc);
  const phone = bx(r * .1, r * .75, r * .38, '#141414', -r * .98, r * .95, r * .2); phone.visible = false; head.add(phone);
  // arms
  const arm = k => {
    const sh = at(G(), k * P.sh * .86 * bw, tl * .79, 0); spine.add(sh);
    sh.add(sp(P.lr * 1.15 * bw, s.top));
    sh.add(cy(P.lr * bw, P.lr * .9 * bw, P.uArm, s.top, 0, -P.uArm / 2, 0, 10));
    const el = at(G(), 0, -P.uArm, 0); sh.add(el);
    el.add(sp(P.lr * .9 * bw, foreC)); el.add(cy(P.lr * .88 * bw, P.lr * .75 * bw, P.fArm, foreC, 0, -P.fArm / 2, 0, 10));
    const hand = at(G(), 0, -P.fArm - P.lr * .6, 0); el.add(hand); hand.add(sp(P.lr * .82, s.skin));
    return { sh, el, hand };
  };
  const L = arm(1), R = arm(-1);
  if (acc.cane) { const cl = hipH + tl * .79 - P.uArm - P.fArm - P.lr * .6 + .02; R.hand.add(cy(.013, .013, cl, '#5a3a22', 0, -cl / 2, .03, 6)); R.hand.add(at(sp(.025, '#5a3a22'), 0, .02, .03)); }
  const leg = k => {
    const hp = at(G(), k * P.hipW * bw, 0, 0); pelvis.add(hp);
    hp.add(cy(P.lr * 1.35 * bw, P.lr * 1.05 * bw, P.uLeg, legC, 0, -P.uLeg / 2, 0, 10));
    const kn = at(G(), 0, -P.uLeg, 0); hp.add(kn);
    kn.add(sp(P.lr * 1.05 * bw, shinC)); kn.add(cy(P.lr * 1.05 * bw, P.lr * .85 * bw, P.lLeg, shinC, 0, -P.lLeg / 2, 0, 10));
    kn.add(bx(P.lr * 2.1, P.foot, P.lr * 4, '#2a211c', 0, -P.lLeg - P.foot / 2, P.lr * .9));
    return { hp, kn };
  };
  const LL = leg(1), RL = leg(-1);
  if (s.btype === 'skirt') { const sk = cy(P.hipW * 1.65 * bw, P.hipW * 2.7 * bw, P.uLeg * 1.1, s.bot, 0, -P.uLeg * .55 + .04, 0, 18); pelvis.add(sk); }
  if (s.btype === 'djellaba') {
    const top = tl * .5, bot = -(P.uLeg + P.lLeg) + .08;
    pelvis.add(cy(P.sh * .9 * bw, P.hipW * 3.3 * bw, top - bot, s.top, 0, (top + bot) / 2, 0, 20));
    const hood = msh(new THREE.ConeGeometry(P.sh * .42, P.sh * .95, 12), mat(s.top)); hood.position.set(0, tl * .74, -P.sh * .62); hood.rotation.x = -.5; spine.add(hood);
  }
  const mk = {};
  const mark = (par, n, x, y, z) => { const o = at(new THREE.Object3D(), x, y, z); par.add(o); mk[n] = o; };
  mark(head, 'top', 0, r * 2, 0); mark(head, 'eye', 0, r * 1.08, r * .9); mark(head, 'chin', 0, r * .1, r * .55);
  mark(spine, 'chest', 0, tl * .62, 0); mark(pelvis, 'hip', 0, 0, 0); mark(RL.kn, 'knee', 0, 0, 0); mark(R.hand, 'hand', 0, 0, 0);
  root.scale.setScalar(sc);
  return { root, kind: 'human', sc, elder: s.age === 'elder', rig: { body, pelvis, spine, neck, head, lSh: L.sh, rSh: R.sh, lEl: L.el, rEl: R.el, lHip: LL.hp, rHip: RL.hp, lKnee: LL.kn, rKnee: RL.kn, P, hipH }, mk, hold: { binoc, phone } };
}

/* ---------- animals ---------- */
function makeAnimal(type, c) {
  const col = c || ANIMALS[type].color, mk = {}, root = G();
  const mark = (par, n, x, y, z) => { const o = at(new THREE.Object3D(), x, y, z); par.add(o); mk[n] = o; };
  if (type === 'bird') {
    const b = sp(.085, col, 0, .17, 0); b.scale.set(1, .85, 1.45); root.add(b);
    const head = at(G(), 0, .25, .1); root.add(head); head.add(sp(.055, col));
    const bk = msh(new THREE.ConeGeometry(.016, .05, 8), mat('#d99a3a')); bk.rotation.x = Math.PI / 2; bk.position.set(0, -.005, .07); head.add(bk);
    [-1, 1].forEach(k => { head.add(sp(.011, '#111', k * .033, .012, .038)); const w = sp(.07, shade(col, .8), k * .075, .18, -.01); w.scale.set(.25, .6, 1.3); root.add(w); });
    root.add(bx(.08, .015, .12, shade(col, .7), 0, .16, -.16));
    const legs = [-1, 1].map(k => { const l = at(G(), k * .03, .1, 0); l.add(cy(.006, .006, .1, '#c46a5a', 0, -.05, 0, 5)); root.add(l); return l; });
    mark(head, 'top', 0, .055, 0); mark(head, 'eye', 0, .012, .04); mark(head, 'chin', 0, -.04, .02); mark(root, 'chest', 0, .17, .04); mark(root, 'hip', 0, .1, 0); mark(root, 'knee', 0, .05, 0); mark(head, 'hand', 0, 0, .09);
    return { root, kind: 'animal', type, rig: { legs, neck: head, head, tail: null, body: b, A: { leg: .1 } }, mk };
  }
  const A = {
    cat: { L: .42, R: .1, leg: .19, hr: .085, neck: .07, nx: -.5, tail: .34, tx: -2.5 },
    dog: { L: .64, R: .15, leg: .32, hr: .115, neck: .12, nx: -.55, tail: .28, tx: -2.1, snout: .1 },
    horse: { L: 1.5, R: .33, leg: .95, hr: .15, neck: .7, nx: -.65, tail: .7, tx: -.45, snout: .3 },
    sheep: { L: .78, R: .26, leg: .3, hr: .11, neck: .08, nx: -.5, tail: .12, tx: -.6, wool: 1 }
  }[type];
  const bodyY = A.leg + A.R * .8;
  let body;
  if (A.wool) { body = msh(new THREE.IcosahedronGeometry(A.R * 1.15, 1), mat(col, { flatShading: true })); body.scale.set(1, 1, A.L / (2.3 * A.R)); body.position.y = bodyY; }
  else { body = sp(A.R, col, 0, bodyY, 0); body.scale.z = A.L / (2 * A.R); }
  root.add(body);
  const legC = A.wool ? '#3a3430' : col;
  const legs = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => {
    const p = at(G(), sx * A.R * .55, A.leg + .02, sz * A.L * .34); root.add(p);
    p.add(cy(A.R * .2, A.R * .15, A.leg, legC, 0, -A.leg / 2, 0, 8));
    if (type === 'horse') p.add(cy(A.R * .17, A.R * .19, .08, '#2b211b', 0, -A.leg + .04, 0, 8));
    return p;
  });
  const neck = at(G(), 0, bodyY + A.R * .45, A.L * .43); neck.rotation.order = 'YXZ'; neck.rotation.x = A.nx; root.add(neck);
  neck.add(cy(A.R * .38, A.R * .5, A.neck, col, 0, A.neck / 2, 0, 10));
  const head = at(G(), 0, A.neck, 0); head.rotation.x = -A.nx; neck.add(head);
  head.add(sp(A.hr, A.wool ? '#3a3430' : col));
  if (A.snout) { const sn = cy(A.hr * .5, A.hr * .62, A.snout, A.wool ? '#3a3430' : col, 0, -A.hr * .15, A.hr * .55 + A.snout / 2, 12); sn.rotation.x = Math.PI / 2; head.add(sn); head.add(sp(A.hr * .17, '#1a1412', 0, -A.hr * .05, A.hr * .55 + A.snout)); }
  else if (type === 'cat') head.add(sp(A.hr * .12, '#e08a8a', 0, -A.hr * .1, A.hr * .95));
  [-1, 1].forEach(k => {
    head.add(sp(A.hr * .13, '#141210', k * A.hr * .45, A.hr * .25, A.hr * .82));
    if (type === 'cat' || type === 'horse') { const e = msh(new THREE.ConeGeometry(A.hr * .3, A.hr * .6, 4), mat(col)); e.position.set(k * A.hr * .5, A.hr * .85, -A.hr * .1); head.add(e); }
    else if (type === 'dog') { const e = bx(A.hr * .3, A.hr * .8, A.hr * .5, shade(col, .7), k * A.hr * .85, A.hr * .1, -A.hr * .1); e.rotation.z = k * .25; head.add(e); }
    else { const e = bx(A.hr * .8, A.hr * .18, A.hr * .35, '#3a3430', k * A.hr * 1.0, A.hr * .2, 0); head.add(e); }
  });
  if (type === 'horse') for (let i = 0; i < 6; i++) neck.add(bx(.05, .14, .12, '#2b1a10', 0, .08 + i * .11, -A.R * .4));
  const tail = at(G(), 0, bodyY + A.R * .3, -A.L * .48); tail.rotation.x = A.tx; root.add(tail);
  tail.add(cy(A.R * (type === 'horse' ? .25 : .1), A.R * .06, A.tail, type === 'horse' ? '#2b1a10' : col, 0, -A.tail / 2, 0, 8));
  mark(head, 'top', 0, A.hr, 0); mark(head, 'eye', 0, A.hr * .2, A.hr * .9); mark(head, 'chin', 0, -A.hr * .8, A.hr * .3);
  mark(root, 'chest', 0, bodyY, A.L * .2); mark(root, 'hip', 0, bodyY - A.R * .6, 0); mark(legs[0], 'knee', 0, -A.leg / 2, 0);
  mark(head, 'hand', 0, -A.hr * .1, A.hr + (A.snout || 0));
  return { root, kind: 'animal', type, rig: { legs, neck, head, tail, body, A }, mk };
}

/* ---------- environments ---------- */
function roomShell(g, w, d, h, floorM, wallC, dado) {
  g.add(plane(w, d, floorM, 0, 0, 0, -Math.PI / 2, 0));
  const wm = mat(wallC);
  [[w, 0, -d / 2, 0], [w, 0, d / 2, Math.PI], [d, -w / 2, 0, Math.PI / 2], [d, w / 2, 0, -Math.PI / 2]].forEach(([len, x, z, ry]) => {
    g.add(plane(len, h, wm, x, h / 2, z, 0, ry));
    if (dado) { const dm = dado.isMaterial ? dado : mat(dado); const p = plane(len, 1, dm, x, .5, z, 0, ry); p.translateZ(.012); g.add(p); }
    const sk = plane(len, .1, mat(shade(wallC, .7)), x, .05, z, 0, ry); sk.translateZ(.02); g.add(sk);
  });
}
function windowOn(g, w, h, x, y, z, ry, arch) {
  const fr = G(); fr.position.set(x, y, z); fr.rotation.y = ry; g.add(fr);
  const gl = new THREE.MeshBasicMaterial({ color: '#cfe6f5' });
  if (arch) { const m = archMesh(w, h, gl); m.position.set(0, -h / 2, .015); fr.add(m); const b = archMesh(w + .16, h + .08, '#f2ece0'); b.position.set(0, -h / 2 - .04, .01); fr.add(b); }
  else { fr.add(plane(w, h, gl, 0, 0, .015)); [[w + .1, .07, 0, h / 2], [w + .1, .07, 0, -h / 2], [.07, h, -w / 2, 0], [.07, h, w / 2, 0], [.04, h, 0, 0], [w, .04, 0, 0]].forEach(([a, b, xx, yy]) => fr.add(bx(a, b, .05, '#f2ece0', xx, yy, .03))); }
  return fr;
}
function buildEnv(key, lamps) {
  const g = G(); SEED = 11;
  const add = (o, x, z, ry) => { o.position.x += x; o.position.z += z; o.rotation.y = (ry || 0) * D2R; g.add(o); return o; };
  const P = (t, x, z, ry, c) => add(makeProp(t, c, lamps), x, z, ry);
  const info = { fog: null, ground: '#777' };
  switch (key) {
    case 'studio': {
      g.add(plane(300, 300, mat('#8d8a86'), 0, 0, 0, -Math.PI / 2, 0));
      const grid = new THREE.GridHelper(20, 20, 0x6a6662, 0x7a7672); grid.position.y = .005; g.add(grid);
      info.fog = [22, 70]; break;
    }
    case 'room': {
      roomShell(g, 6, 5, 2.8, tmat(TX.wood(3, 2.5)), '#d9c6aa');
      windowOn(g, 1.3, 1.2, -1.2, 1.6, -2.5, 0);
      const rug = plane(2.4, 1.6, tmat(TX.carpet()), .2, .006, .4, -Math.PI / 2, 0); g.add(rug);
      P('bed', -1.95, -1.35, 0, '#3f5f7a'); P('desk', 1.9, -2.05, 0); P('chair', 1.85, -1.45, 180); P('lamp', 2.6, -2.15, 0);
      P('shelf', 2.78, .4, -90); P('plant', -2.6, 2.1, 0);
      g.add(bx(.5, .32, .02, '#efe3c0', 1.9, 1.75, -2.48)); break;
    }
    case 'house': {
      roomShell(g, 8, 6, 3.2, tmat(TX.tile(8, 6)), '#efe7da', tmat(TX.tile(8, 1)));
      windowOn(g, 1.2, 1.9, -1.6, 2.1, -3, 0, true); windowOn(g, 1.2, 1.9, 1.6, 2.1, -3, 0, true);
      const door = archMesh(1.3, 2.4, '#5b3a25'); door.position.set(3.985, 0, 1.2); door.rotation.y = -Math.PI / 2; g.add(door);
      g.add(plane(3.4, 2.4, tmat(TX.carpet()), 0, .006, .2, -Math.PI / 2, 0));
      const ban = (len, x, z, ry) => { const b = G(); b.add(bx(len, .38, .75, '#5a3a28', 0, .19, 0)); b.add(bx(len - .05, .14, .7, '#2f4f6f', 0, .45, .02)); for (let i = 0; i < Math.floor(len / .8); i++) b.add(bx(.7, .42, .16, '#c9a24a', -len / 2 + .45 + i * .8, .72, -.28)); add(b, x, z, ry); };
      ban(6.4, 0, -2.6, 0); ban(4.4, -3.6, .1, 90);
      g.add(cy(.55, .55, .06, '#b87333', -.1, .4, -1.2, 24, { metalness: .5, roughness: .4 })); g.add(cy(.08, .14, .37, '#5a3a28', -.1, .185, -1.2, 10));
      P('lamp', 3.4, -2.6, 0); P('plant', 3.4, 2.5, 0); break;
    }
    case 'classroom': {
      roomShell(g, 9, 7, 3, tmat(TX.lino(9, 7)), '#efe6cf', '#7d9a7a');
      const b = bx(3.2, 1.25, .05, '#2e4a3c', 0, 1.6, -3.47); g.add(b); g.add(bx(3.35, .08, .12, '#8a6a48', 0, .95, -3.42));
      for (let i = 0; i < 3; i++) windowOn(g, 1.3, 1.4, -4.5, 1.9, -2 + i * 2.2, Math.PI / 2);
      const door = makeProp('door', '#6a4a30', lamps); door.position.set(4.44, 0, 2.2); door.rotation.y = -Math.PI / 2; g.add(door);
      P('desk', 0, -2.75, 180, '#7a5434'); P('chair', .8, -3.1, 180);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const x = -2.4 + c * 2.4, z = -.3 + r * 1.65; P('table', x, z + .9, 0, '#c9a46b').scale.set(.6, .95, .55); P('chair', x, z + 1.35, 180, '#3f6f8a'); }
      P('shelf', 4.3, -2.6, -90); break;
    }
    case 'street': {
      g.add(plane(300, 300, tmat(TX.noise('#b8a78e', ['#8f806a', '#d5c6ad'], .3, 60, 60)), 0, -.01, 0, -Math.PI / 2, 0));
      g.add(plane(70, 8, tmat(TX.noise('#4a4b4f', ['#2e2f33', '#6a6b70'], .35, 14, 2)), 0, .005, 0, -Math.PI / 2, 0));
      for (let x = -34; x < 34; x += 3) g.add(plane(1.6, .15, mat('#efe9d8'), x, .012, 0, -Math.PI / 2, 0));
      [-1, 1].forEach(k => { const sw = bx(70, .16, 3, '#cdbfa8', 0, .08, k * 5.5); sw.castShadow = false; g.add(sw); g.add(bx(70, .17, .18, '#9c9282', 0, .085, k * 4.05)); });
      const cols = ['#ece0c8', '#d9b38c', '#f3efe6', '#c98a5a', '#e8cfa0', '#e5d7bd'];
      [-1, 1].forEach(k => { for (let x = -33; x < 33;) { const w = 5 + rnd() * 2.5, h = 6 + rnd() * 7, c = cols[(rnd() * cols.length) | 0]; const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 6), tmat(TX.facade(c, w / 2.6, h / 2.8))); m.position.set(x + w / 2, h / 2, k * 10); m.receiveShadow = true; m.castShadow = true; g.add(m); if (rnd() > .55) { const a = bx(w * .7, .08, 1.2, ['#2f6f5f', '#b5523b', '#e7a83a'][(rnd() * 3) | 0], x + w / 2, 3, k * 6.5); a.rotation.x = k * .25; g.add(a); } x += w + .05; } });
      [-18, -6, 6, 18].forEach(x => P('streetlight', x, 4.4, 0)); [-24, -12, 12, 24].forEach(x => P('streetlight', x, -4.4, 180));
      P('palm', -9, -5.6, 0); P('palm', 15, 5.6, 40); P('car', 8, 2, 90, '#2f6f8a'); info.fog = [30, 90]; break;
    }
    case 'medina': {
      g.add(plane(300, 300, tmat(TX.noise('#d2ae80', ['#b38c5e', '#e6c79c'], .35, 60, 60)), 0, 0, 0, -Math.PI / 2, 0));
      const sm = tmat(TX.stone(1, 1));
      const seg = (w, x) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 7, 1.8), tmat(TX.stone(w / 4, 2))); m.position.set(x, 3.5, -9); m.castShadow = m.receiveShadow = true; g.add(m); };
      seg(23, -14.5); seg(23, 14.5);
      const gate = gateMesh(6, 8.2, 2.2, 1.6, 5, tmat(TX.stone(1.5, 2))); gate.position.set(0, 0, -9); g.add(gate);
      [1.11, -1.11].forEach(z => { const b = bandMesh(2.15, 1.6, 5, '#e8c9a0'); b.position.set(0, 0, -9 + z); if (z < 0) b.rotation.y = Math.PI; g.add(b); });
      for (let x = -25.5; x <= 25.5; x += 1.5) { if (Math.abs(x) < 3.2) continue; g.add(bx(.8, .8, 1.8, '#c47f4b', x, 7.4, -9)); }
      for (let x = -2.6; x <= 2.6; x += 1.3) g.add(bx(.7, .8, 2.2, '#c47f4b', x, 8.6, -9));
      [-7.5, 7.5, -21, 21].forEach(x => { const t = new THREE.Mesh(new THREE.BoxGeometry(3.6, 9.5, 3.6), sm); t.position.set(x, 4.75, -9); t.castShadow = t.receiveShadow = true; g.add(t); for (let i = -1; i <= 1; i++) { g.add(bx(.8, .8, .8, '#c47f4b', x + i * 1.3, 9.9, -9 + 1.4)); g.add(bx(.8, .8, .8, '#c47f4b', x + i * 1.3, 9.9, -9 - 1.4)); } });
      P('palm', -10, -5, 0); P('palm', 12, -4, 60); P('palm', -16, 2, 120); P('rock', 5, 3, 20); info.fog = [35, 110]; break;
    }
    case 'park': {
      g.add(plane(300, 300, tmat(TX.noise('#6a9444', ['#4f7a34', '#86ad55'], .4, 50, 50)), 0, 0, 0, -Math.PI / 2, 0));
      g.add(plane(60, 3.2, tmat(TX.noise('#d8c3a0', ['#b9a37f', '#ead8b5'], .3, 15, 1)), 0, .006, 1.3, -Math.PI / 2, 0));
      for (let i = 0; i < 16; i++) { const x = -24 + i * 3.2 + rnd() * 1.5, z = (i % 2 ? -1 : 1) * (5 + rnd() * 8); P(rnd() > .3 ? 'tree' : 'palm', x, z, rnd() * 360, rnd() > .5 ? '#4f7a3a' : '#5f8a3a'); }
      P('bench', -3, -1.2, 0); P('bench', 4, -1.2, 0); P('streetlight', 0, -1.4, 180);
      const f = G(); f.add(cy(1.6, 1.7, .5, '#d8d0c0', 0, .25, 0, 28)); f.add(cy(1.45, 1.45, .02, '#5ea0c8', 0, .46, 0, 28, { roughness: .2 })); f.add(cy(.15, .2, 1.1, '#d8d0c0', 0, .55, 0, 12)); f.add(cy(.5, .3, .12, '#d8d0c0', 0, 1.1, 0, 16)); add(f, 0, -6);
      info.fog = [30, 90]; break;
    }
    case 'desert': {
      const geo = new THREE.PlaneGeometry(180, 180, 110, 110); geo.rotateX(-Math.PI / 2);
      const pa = geo.attributes.position;
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i), d = Math.hypot(x, z); const k = Math.min(1, Math.max(0, (d - 7) / 16)); pa.setY(i, k * k * (2.2 * Math.sin(x * .07 + 1) * Math.cos(z * .05) + 1.1 * Math.sin(x * .16 + z * .12) + 1.6)); }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, tmat(TX.noise('#ddb27a', ['#c4935c', '#efcb98'], .3, 40, 40))); m.receiveShadow = true; g.add(m);
      P('palm', -6, -6, 0); P('palm', -8, -4.5, 80); P('rock', 4, -5, 0); P('rock', 9, 3, 50); info.fog = [40, 120]; break;
    }
  }
  return { g, info };
}

/* ---------- gizmos ---------- */
function labelSprite(txt, col) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = col; x.beginPath(); x.arc(32, 32, 28, 0, TAU); x.fill(); x.fillStyle = '#1b0d0b'; x.font = 'bold 34px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 32, 34);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); s.scale.set(.32, .32, 1); s.renderOrder = 10; return s;
}
function camGizmo(txt, col) {
  const g = G(), m = new THREE.MeshBasicMaterial({ color: col });
  const b = new THREE.Mesh(new THREE.BoxGeometry(.16, .12, .24), m); g.add(b);
  const l = new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, .1, 12), new THREE.MeshBasicMaterial({ color: '#1b0d0b' })); l.rotation.x = Math.PI / 2; l.position.z = -.16; g.add(l);
  [-.05, .07].forEach(z => { const r = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .03, 14), m); r.rotation.z = Math.PI / 2; r.position.set(0, .1, z); g.add(r); });
  const s = labelSprite(txt, col); s.position.y = .3; g.add(s);
  g.traverse(o => o.layers.set(1)); return g;
}
function frustumLines(col) {
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(16 * 3), 3));
  const l = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: .9 })); l.layers.set(1); l.frustumCulled = false; return l;
}
