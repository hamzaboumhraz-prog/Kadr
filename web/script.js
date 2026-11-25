/* كادر — reads a scenario file (.kadr, "kadr":"script") and builds a whole project:
   scenes (each with its own place), people, animals, objects, actions, cameras and shots. */
const nk = v => String(v == null ? '' : v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[إأآ]/g, 'ا').replace(/ى/g, 'ي').replace(/[\s_\-()'’.]+/g, ' ').trim();
function aliasMap(o) { const m = {}; for (const k in o) o[k].forEach(a => { m[nk(a)] = k; }); return m; }
const AL = {
  size: aliasMap({
    ELS: ['els', 'xls', 'ews', 'xws', 'exls', 'extreme long shot', 'extreme wide shot', 'extreme long', 'extreme wide', 'very long shot', 'very wide', 'establishing', 'عامة جدا', 'plan general', 'tres grand plan'],
    LS: ['ls', 'ws', 'long shot', 'wide shot', 'long', 'wide', 'عامة', 'plan large', 'plan d ensemble'],
    FS: ['fs', 'mws', 'medium wide shot', 'medium wide', 'full shot', 'full', 'full body', 'كاملة', 'plan pied', 'plan en pied'],
    MLS: ['mls', 'medium long shot', 'medium long', 'american', 'american shot', 'cowboy', 'plan americain', 'امريكية', 'ثلاثة ارباع'],
    MS: ['ms', 'medium shot', 'medium', 'mid shot', 'waist', 'plan moyen', 'plan taille', 'متوسطة'],
    MCU: ['mcu', 'medium close up', 'medium close', 'chest', 'plan poitrine', 'متوسطة قريبة'],
    CU: ['cu', 'close up', 'close', 'closeup', 'gros plan', 'قريبة'],
    BCU: ['bcu', 'big close up', 'very close up', 'vcu', 'tres gros plan', 'قريبة جدا'],
    ECU: ['ecu', 'xcu', 'extreme close up', 'extreme close', 'macro', 'تفصيلية', 'تفصيل'],
    INS: ['ins', 'insert', 'detail', 'insert shot', 'ادراج']
  }),
  angle: aliasMap({
    eye: ['eye', 'eye level', 'normal', 'neutral', 'level', 'مستوى العين', 'عادية'],
    high: ['high', 'high angle', 'plongee', 'plunge', 'from above', 'مرتفعة', 'من الاعلى'],
    hi1: ['slight high', 'high slight', 'plongee legere', 'slightly high', 'مرتفعة قليلا'],
    low: ['low', 'low angle', 'contre plongee', 'contreplongee', 'from below', 'منخفضة', 'من الاسفل'],
    lo1: ['slight low', 'low slight', 'contre plongee legere', 'slightly low', 'منخفضة قليلا'],
    bird: ['bird', 'birds eye', 'bird eye', 'top', 'top down', 'zenith', 'overhead', 'plongee totale', 'عين الطائر', 'عمودية'],
    worm: ['worm', 'worms eye', 'worm eye', 'ground', 'ground level', 'عين الدودة'],
    dutch: ['dutch', 'dutch angle', 'canted', 'tilted', 'oblique horizon', 'مائلة']
  }),
  side: aliasMap({
    0: ['front', 'face', 'frontal', 'facing', 'avant', 'de face', 'امامية', 'من الامام'],
    180: ['back', 'behind', 'rear', 'from behind', 'dos', 'de dos', 'خلفية', 'من الخلف'],
    90: ['left', 'side', 'profile', 'profil', 'side left', 'profile left', 'profil gauche', 'جانبية', 'جانبية يسار', 'يسار'],
    '-90': ['right', 'side right', 'profile right', 'profil droit', 'جانبية يمين', 'يمين'],
    40: ['3/4', '34', 'three quarter', 'three quarters', '3/4 left', 'trois quart', 'ثلاثة ارباع يسار'],
    '-40': ['3/4 right', 'three quarter right', 'ثلاثة ارباع يمين'],
    45: ['oblique', 'oblique front', 'front oblique', 'امامية مائلة', 'مائلة'],
    140: ['3/4 back', 'back oblique', 'oblique back', 'خلفية مائلة']
  }),
  view: aliasMap({ single: ['single', 'solo', 'one', 'فردية'], pair: ['pair', 'two shot', 'two', '2 shot', 'twoshot', 'group', 'ثنائية'], ots: ['ots', 'over the shoulder', 'over shoulder', 'فوق الكتف', 'amorce'], pov: ['pov', 'point of view', 'subjective', 'subjective camera', 'ذاتية', 'وجهة نظر'], free: ['free', 'fixed', 'locked', 'حرة'] }),
  move: aliasMap({
    static: ['static', 'fixed', 'none', 'still', 'ثابتة', 'fixe'], pan: ['pan', 'panoramic', 'panoramique', 'بانورامية'], tilt: ['tilt'], dolly: ['dolly', 'push', 'push in', 'pull out', 'travelling', 'traveling', 'ترافلينغ'],
    truck: ['truck', 'lateral', 'travelling lateral', 'side track'], ped: ['ped', 'pedestal', 'boom'], crane: ['crane', 'jib', 'grue', 'رافعة'], arc: ['arc', 'orbit', 'circle', 'دائرية'],
    zoom: ['zoom', 'زووم'], vertigo: ['vertigo', 'dolly zoom', 'trombone'], track: ['track', 'tracking', 'follow', 'steadicam', 'تتبع'], hand: ['hand', 'handheld', 'camera a l epaule', 'shoulder', 'محمولة'],
    whip: ['whip', 'whip pan', 'swish'], roll: ['roll']
  }),
  dir: aliasMap({ 1: ['in', 'closer', 'forward', 'right', 'up', 'cw', 'clockwise', 'اقتراب', 'يمين', 'صعود'], '-1': ['out', 'away', 'backward', 'left', 'down', 'ccw', 'counterclockwise', 'ابتعاد', 'يسار', 'نزول'] }),
  env: aliasMap({
    house: ['house', 'home', 'living room', 'livingroom', 'salon', 'lounge', 'interior', 'منزل', 'صالون', 'غرفة الجلوس'], room: ['room', 'bedroom', 'chambre', 'غرفة', 'غرفة النوم'], studio: ['studio', 'empty', 'استوديو'],
    classroom: ['classroom', 'school', 'class', 'قسم', 'مدرسة'], street: ['street', 'rue', 'avenue', 'شارع'], medina: ['medina', 'ramparts', 'old walls', 'city walls', 'سور', 'سور المدينة'],
    park: ['park', 'garden', 'jardin', 'حديقة'], desert: ['desert', 'dunes', 'صحراء'], cafe: ['cafe', 'coffee shop', 'terrace', 'مقهى'], alley: ['alley', 'derb', 'lane', 'narrow street', 'ruelle', 'زنقة', 'درب', 'زقاق'],
    beach: ['beach', 'sea', 'plage', 'شاطئ'], rooftop: ['rooftop', 'roof', 'terrasse', 'سطح'], village: ['village', 'rural', 'semi rural', 'countryside', 'douar', 'قرية', 'منطقة شبه قروية', 'دوار'],
    souk: ['souk', 'market', 'weekly market', 'bazaar', 'سوق', 'سوق اسبوعي'], road: ['road', 'country road', 'highway', 'route', 'طريق']
  }),
  light: aliasMap({ day: ['day', 'noon', 'morning', 'afternoon', 'daylight', 'نهار', 'صباح'], sunset: ['sunset', 'dusk', 'golden hour', 'sunrise', 'dawn', 'غروب', 'فجر'], night: ['night', 'ليل'], warm: ['warm', 'interior', 'indoor', 'evening interior', 'lamp', 'داخلي', 'دافئ'] }),
  act: aliasMap({
    walk: ['walk', 'walks', 'go', 'goes', 'move', 'moves', 'enter', 'exit', 'approach', 'يمشي', 'يتحرك', 'يدخل', 'يخرج', 'يقترب'], run: ['run', 'runs', 'flee', 'يركض', 'يجري'], jump: ['jump', 'jumps', 'leap', 'startle jump', 'يقفز'],
    turn: ['turn', 'turns', 'rotate', 'face', 'turn to', 'يستدير', 'يلتفت بجسده'], look: ['look', 'glance', 'head', 'head turn', 'يلتفت', 'ينظر'], watch: ['watch', 'watches', 'gaze', 'follow gaze', 'stare', 'observe', 'track gaze', 'يتابع', 'يراقب', 'يتأمل'],
    eyes: ['eyes', 'eye', 'عيناه'], talk: ['talk', 'speak', 'say', 'says', 'يتكلم', 'يقول'], laugh: ['laugh', 'smile', 'يضحك'], nod: ['nod', 'yes', 'يومئ'], shake: ['shake', 'no', 'shake head'],
    wave: ['wave', 'يلوح'], gesture: ['gesture', 'explain', 'يشرح'], point: ['point', 'يشير'], clap: ['clap', 'يصفق'], raise: ['raise', 'binoculars', 'منظار'], phone: ['phone', 'call', 'answer phone', 'يرد'],
    browse: ['browse', 'text', 'scroll', 'phone browse', 'look at phone', 'use phone', 'يتصفح'], dress: ['dress', 'wear', 'put on', 'get dressed', 'يرتدي', 'يلبس'], cross: ['cross', 'cross arms', 'يكتف'],
    shock: ['shock', 'surprise', 'surprised', 'startle', 'يتفاجأ'], armsup: ['armsup', 'arms up', 'raise arms'], dance: ['dance', 'يرقص'], sit: ['sit', 'sits', 'sit down', 'يجلس'],
    bend: ['bend', 'pick up', 'crouch', 'ينحني'], lie: ['lie', 'lie down', 'sleep', 'sleeps', 'nap', 'ينام', 'يستلقي'], stand: ['stand', 'stand up', 'get up', 'rise', 'wake', 'ينهض', 'يقف'],
    retreat: ['retreat', 'step back', 'back off', 'recoil', 'back away', 'يتراجع']
  }),
  type: aliasMap({
    youngman: ['youngman', 'young man', 'young', 'shab', 'شاب'], youngwoman: ['youngwoman', 'young woman', 'شابة'], man: ['man', 'رجل'], woman: ['woman', 'امراة'], hijabi: ['hijabi', 'veiled woman', 'امراة بحجاب'],
    business: ['business', 'businessman', 'suit'], doctor: ['doctor', 'طبيبة'], athlete: ['athlete', 'رياضي'], farmer: ['farmer', 'peasant', 'فلاح'], boy: ['boy', 'child', 'kid', 'طفل'], girl: ['girl', 'طفلة'],
    pupil: ['pupil', 'student', 'تلميذ'], oldman: ['oldman', 'old man', 'elder', 'شيخ'], oldwoman: ['oldwoman', 'old woman', 'مسنة'],
    dog: ['dog', 'كلب'], shaggy: ['shaggy', 'shaggy dog', 'messy dog', 'hairy dog', 'كلب اشعث'], cat: ['cat', 'قط', 'قطة'], horse: ['horse', 'حصان'], sheep: ['sheep', 'خروف'], bird: ['bird', 'pigeon', 'حمامة'],
    camel: ['camel', 'جمل'], donkey: ['donkey', 'حمار'], chicken: ['chicken', 'hen', 'دجاجة'],
    car: ['car', 'sedan', 'سيارة'], suv: ['suv', '4x4', 'jeep', 'four by four', 'سيارة رباعية الدفع'], tv: ['tv', 'television', 'تلفاز'], sofa: ['sofa', 'couch', 'canape', 'اريكة'], door: ['door', 'باب'],
    stall: ['stall', 'market stall', 'tent', 'خيمة'], fence: ['fence', 'سياج'], hay: ['hay', 'haystack', 'تبن'], table: ['table', 'طاولة'], chair: ['chair', 'كرسي'], bed: ['bed', 'سرير'], lamp: ['lamp', 'مصباح'],
    tree: ['tree', 'شجرة'], palm: ['palm', 'نخلة'], rock: ['rock', 'صخرة'], box: ['box', 'crate', 'صندوق'], bench: ['bench'], plant: ['plant', 'نبتة'], streetlight: ['streetlight', 'lamp post'], wall: ['wall', 'جدار']
  })
};
const PROP_R = { suv: 1.25, car: 1.1, sofa: .65, tv: .45, stall: 1.2, door: .35, table: .55, bench: .55, bed: 1, desk: .6, counter: .7, fence: .3, hay: .9, tree: .6, palm: .5, box: .35 };
const CAM_SIZE_LENS = { ELS: 24, LS: 24, FS: 35, MLS: 35, MS: 35, MCU: 50, CU: 50, BCU: 85, ECU: 85, INS: 50 };

function buildFromScript(J) {
  if (!J || typeof J !== 'object') throw new Error('الملف فارغ');
  const scenesIn = J.scenes || J.scenario || J.sequences;
  if (!Array.isArray(scenesIn) || !scenesIn.length) throw new Error('لا توجد مشاهد في الملف (المفتاح scenes)');
  const warn = [], castDefs = J.cast || J.characters || {}, aspect = String(J.aspect || '16:9');
  const W = (m) => { if (warn.length < 60) warn.push(m); };
  const prev = ST, scenes = [];
  try {
    scenesIn.forEach((SC, si) => scenes.push(buildScene(SC, si)));
  } finally { ST = prev; }
  let shots = 0; scenes.forEach(S => shots += S.shots.length);
  const P = makeProject(J.title || J.name || 'سيناريو', scenes, { aspect, src: 'script', goal: J.goal || J.logline || '' });
  return { prj: P, rep: { scenes: scenes.length, shots, warn } };

  function buildScene(SC, si) {
    const tag = `المشهد ${si + 1}`;
    const pl = SC.place || SC.env || SC.location;
    let env = ENVS[pl] ? pl : (window.LIB && pl && LIB.items[libId(pl)] && LIB.items[libId(pl)].kind === 'set') ? 'lib:' + libId(pl) : AL.env[nk(pl)] || null;
    if (!env) { if (SC.place) W(`${tag}: مكان غير معروف «${SC.place}» فاستُعمل الاستوديو`); env = 'studio'; }
    const light = AL.light[nk(SC.light)] || (LIGHTS[SC.light] ? SC.light : ENVS[env].light);
    const S = { v: 1, seq: 1, env, light, weather: WEATHER[SC.weather] ? SC.weather : 'clear', aspect: String(SC.aspect || aspect), items: [], cams: [], shots: [], bd: null, ov: { thirds: 1, safe: 0, lbl: 1 }, lesson: null, goal: SC.goal || '' };
    sceneOf(S, SC.title || SC.name || tag);
    ST = S;
    const ids = {}, specs = {};
    const itemsIn = [].concat(SC.items || [], SC.set || [], SC.actors || [], SC.people || []);
    itemsIn.forEach((d, k) => {
      if (!d) return;
      const key = String(d.id || d.ref || d.type || 'item' + k), base = castDefs[d.ref || d.id] || {}, spec = Object.assign({}, base, d);
      let type = spec.type || spec.kind; type = (CAST[type] || ANIMALS[type] || PROPS[type]) ? type : (window.LIB && type && LIB.items[libId(type)]) ? 'lib:' + libId(type) : AL.type[nk(type)];
      if (!type) { W(`${tag}: نوع غير معروف «${spec.type || key}» فوُضع صندوق مكانه`); type = 'box'; }
      const at = Array.isArray(spec.at) ? spec.at : [0, 0];
      const it = newItemSpec(type, +at[0] || 0, +at[1] || 0, 0);
      it.id = nid('i'); if (spec.name) it.name = String(spec.name);
      if (it.kind === 'human') {
        ['h', 'build', 'skin', 'hair', 'hairC', 'top', 'bot', 'btype', 'sleeves', 'outer', 'outerC', 'age'].forEach(f => { if (spec[f] != null) it[f] = spec[f]; });
        if (spec.acc) { it.acc = Object.assign({}, it.acc || {}); if (Array.isArray(spec.acc)) spec.acc.forEach(a => { if (ACCS[a]) it.acc[a] = 1; }); else Object.keys(spec.acc).forEach(a => { if (ACCS[a]) it.acc[a] = spec.acc[a] ? 1 : 0; }); }
      } else { if (spec.color) it.color = spec.color; if (spec.scale) it.scale = clamp(+spec.scale || 1, .2, 6); }
      const pose = spec.pose && (POSES[spec.pose] ? spec.pose : AL.act[nk(spec.pose)]);
      if (pose === 'browse') it.pose = 'text'; else if (pose && (POSES[pose] || (it.kind === 'animal' && (pose === 'sit' || pose === 'lie')))) it.pose = pose === 'lie' && it.kind !== 'human' ? 'lie' : pose;
      S.items.push(it); ids[key] = it.id; specs[key] = spec;
    });
    const idOf = v => v == null ? null : ids[String(v)] || null;
    const ptOf = (v, t) => { if (Array.isArray(v)) return { x: +v[0] || 0, z: +v[1] || 0 }; const id = idOf(v), s = id && itemById(id); if (!s) return null; const e = evalItem(s, t || 0, true); return { x: e.x, z: e.z, s }; };
    const angTo = (from, P) => Math.atan2(P.x - from.x, P.z - from.z) / D2R;
    Object.keys(specs).forEach(key => {
      const f = specs[key].face, s = itemById(ids[key]); if (f == null || !s) return;
      if (typeof f === 'number' || (typeof f === 'string' && !isNaN(+f))) s.rot = +f;
      else { const P = ptOf(f); if (P) s.rot = Math.round(angTo(s, P)); else W(`${tag}: «${key}» يواجه شيئًا غير موجود: ${f}`); }
    });
    const firstHuman = () => S.items.find(s => s.kind === 'human') || S.items[0];
    // shots and their actions
    const shotsIn = SC.shots || SC.plans || [];
    const acts = []; let T = 0;
    const camByName = {};
    shotsIn.forEach((SH, k) => {
      const stag = `${tag}، اللقطة ${SH.n || k + 1}`;
      const dur = clamp(+SH.dur || +SH.duration || 3, .3, 120);
      let size = SZ[SH.size] ? SH.size : AL.size[nk(SH.size)]; if (!size) { if (SH.size) W(`${stag}: حجم غير معروف «${SH.size}» فاستُعملت المتوسطة`); size = 'MS'; }
      let ang = AL.angle[nk(SH.angle)] || (ANG[SH.angle] ? SH.angle : null), eAdj = +SH.tilt || 0;
      if (ang === 'hi1') { ang = 'high'; eAdj -= 14; } if (ang === 'lo1') { ang = 'low'; eAdj += 10; }
      if (!ang) { if (SH.angle) W(`${stag}: زاوية غير معروفة «${SH.angle}»`); ang = 'eye'; }
      let side = typeof SH.side === 'number' ? SH.side : SH.side != null && !isNaN(+SH.side) ? +SH.side : AL.side[nk(SH.side)]; side = side == null ? 0 : +side;
      let view = AL.view[nk(SH.view || SH.framing || SH.mode)] || 'single';
      const onId = idOf(SH.on || SH.subject || SH.target) || (view === 'free' ? null : (firstHuman() || {}).id), wId = idOf(SH.with || SH.other || SH.from);
      if ((SH.on || SH.subject) && !idOf(SH.on || SH.subject)) W(`${stag}: الهدف «${SH.on || SH.subject}» غير موجود`);
      if ((view === 'ots' || view === 'pov' || view === 'pair') && !wId) { W(`${stag}: «${view}» يحتاج شخصية ثانية (with) فصارت فردية`); view = 'single'; }
      const mv = AL.move[nk(SH.move)] || (MV[SH.move] ? SH.move : 'static');
      const dir = SH.dir == null ? 1 : typeof SH.dir === 'number' ? (SH.dir < 0 ? -1 : 1) : +(AL.dir[nk(SH.dir)] || 1);
      let cam = SH.cam && camByName[SH.cam];
      if (!cam) {
        const name = String(SH.cam || camName(S.cams.length));
        const o = { name, mode: view, target: onId, other: wId, size, angle: ang, side, lens: +SH.lens || CAM_SIZE_LENS[size] || 35, move: mv, dir, amt: SH.amt != null ? clamp(+SH.amt, .2, 2.5) : 1, follow: ['pan', 'move', 'off'].includes(SH.follow) ? SH.follow : SH.follow === false ? 'off' : 'pan', eAdj, dOff: SH.dist ? clamp(+SH.dist, .3, 3) : 1, roll: +SH.roll || 0, place: ['l', 'c', 'r', 'auto'].includes(SH.place) ? SH.place : 'auto', shake: SH.shake ? clamp(+SH.shake, 0, 1.5) : 0 };
        if (view === 'free') {
          const F = SH.free || {}, pos = F.pos || SH.pos || [0, 1.5, 4];
          Object.assign(o, { mode: 'free', target: null, other: null, px: +pos[0] || 0, py: pos[1] == null ? 1.5 : +pos[1], pz: +pos[2] || 0, lens: +F.lens || +SH.lens || 24 });
          const lk = F.look || SH.look;
          if (lk && !Array.isArray(lk) && idOf(lk)) o.look = idOf(lk);
          cam = newCam(o); if (Array.isArray(lk)) aimCam(cam, V3(+lk[0] || 0, lk.length > 2 ? +lk[1] : 1.2, lk.length > 2 ? +lk[2] : +lk[1] || 0));
          else if (o.look) { const P = ptOf(lk, T); if (P) aimCam(cam, V3(P.x, 1.2, P.z)); }
        } else cam = newCam(o);
        S.cams.push(cam); camByName[name] = cam;
      }
      const tr = ['cut', 'dissolve', 'fade'].includes(SH.trans) ? SH.trans : 'cut';
      const sh = { id: nid('s'), cam: cam.id, dur, trans: tr };
      if (SH.end === 'fade' || SH.fadeOut) sh.end = 'fade';
      if (SH.title) sh.title = String(SH.title); if (SH.action || SH.note) sh.note = String(SH.action || SH.note);
      S.shots.push(sh);
      (SH.do || SH.actions || SH.acts || []).forEach(a => acts.push(Object.assign({ _t: T + (+a.at || 0), _end: T + dur, _tag: stag }, a)));
      T += dur;
    });
    (SC.do || SC.actions || []).forEach(a => acts.push(Object.assign({ _t: +a.at || 0, _end: T, _tag: tag }, a)));
    acts.sort((a, b) => a._t - b._t).forEach(a => addAct(a));
    if (!S.cams.length && S.items.length) { const c = newCam({ target: firstHuman().id, size: 'LS', follow: 'pan' }, 0); S.cams.push(c); S.shots.push({ id: nid('s'), cam: c.id, dur: 3, trans: 'cut' }); W(`${tag}: لا لقطات فيه، فأُضيفت لقطة عامة`); }
    return S;

    function addAct(a) {
      const s = itemById(idOf(a.who || a.by || a.item)); if (!s) { W(`${a._tag}: «${a.who}» غير موجود في المشهد`); return; }
      let type = ACTS[a.act] ? a.act : AL.act[nk(a.act || a.type)];
      if (!type) { W(`${a._tag}: حركة غير معروفة «${a.act}»`); return; }
      const t = Math.max(0, +a._t.toFixed(2)), cur = evalItem(s, t, true);
      const ok = ACTS[type] ? ACTS[type].who : 'all';
      if (type !== 'retreat' && ((ok === 'human' && s.kind !== 'human') || (ok === 'living' && s.kind === 'prop'))) { W(`${a._tag}: «${s.name}» لا يستطيع «${ACTS[type].ar}»`); return; }
      const A = { type, t, dur: +a.dur || ACT_DUR[type] || 1 };
      switch (type) {
        case 'walk': case 'run': {
          let P = a.to != null ? ptOf(a.to, t) : null;
          if (!P && Array.isArray(a.by)) P = { x: cur.x + +a.by[0], z: cur.z + +a.by[1] };
          if (!P) { W(`${a._tag}: «${s.name}» يمشي إلى مكان غير محدد`); return; }
          let dx = P.x - cur.x, dz = P.z - cur.z, d = Math.hypot(dx, dz);
          if (P.s) { const stop = a.stop != null ? +a.stop : (P.s.kind === 'prop' ? (PROP_R[P.s.type] || .4) + .45 : .85); if (d > stop) { const k = (d - stop) / d; dx *= k; dz *= k; d -= stop; } else { dx = dz = 0; d = 0; } }
          else if (a.stop) { const k = Math.max(0, d - +a.stop) / (d || 1); dx *= k; dz *= k; d *= k; }
          A.tx = +(cur.x + dx).toFixed(2); A.tz = +(cur.z + dz).toFixed(2);
          const sp = type === 'run' ? (a.speed === 'slow' ? 2.4 : a.speed === 'fast' ? 4.5 : 3.3) : (a.speed === 'slow' ? .75 : a.speed === 'fast' ? 1.9 : 1.25);
          if (!a.dur) A.dur = +Math.max(.6, d / sp).toFixed(2);
          if (a.back) A.back = 1; break;
        }
        case 'retreat': {
          const dist = +a.dist || .8, f = cur.rot; A.type = 'walk'; A.back = 1;
          A.tx = +(cur.x - Math.sin(f) * dist).toFixed(2); A.tz = +(cur.z - Math.cos(f) * dist).toFixed(2); A.dur = +a.dur || +(dist / .9).toFixed(2); break;
        }
        case 'turn': {
          let v = a.v; if (v == null && a.to != null) { const P = ptOf(a.to, t); if (P) v = Math.round(wrapA(Math.atan2(P.x - cur.x, P.z - cur.z) - cur.rot) / D2R); }
          A.v = v == null ? 90 : +v; break;
        }
        case 'look': {
          if (a.to != null && !Array.isArray(a.to) && idOf(a.to)) { A.type = 'watch'; A.to = idOf(a.to); A.dur = +a.dur || Math.max(1, a._end - t); }
          else if (Array.isArray(a.to)) { A.v = Math.round(clamp(wrapA(Math.atan2(+a.to[0] - cur.x, +a.to[1] - cur.z) - cur.rot) / D2R, -80, 80)); }
          else A.v = a.v == null ? 60 : clamp(+a.v, -90, 90);
          break;
        }
        case 'watch': { A.to = idOf(a.to); if (!A.to) { W(`${a._tag}: «${s.name}» يتابع شيئًا غير موجود`); return; } A.dur = +a.dur || Math.max(1, a._end - t); break; }
        case 'eyes': { const m = { left: 1, right: -1, up: 2, down: -2, center: 0 }; A.v = typeof a.v === 'number' ? a.v : m[nk(a.v || a.to)] != null ? m[nk(a.v || a.to)] : 1; break; }
        default: if (a.v != null) A.v = +a.v;
      }
      if (a.line) { A.line = String(a.line); if (type === 'talk' && !a.dur) A.dur = lineDur(A.line); }
      s.actions.push(A);
    }
  }
}
