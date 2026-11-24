/* كادر — data: vocabulary of film language + presets */
const D2R = Math.PI / 180, TAU = Math.PI * 2;

const SIZES = [
  { k: 'ELS', ar: 'عامة جدًا', en: 'Extreme Long Shot', cat: 0, d: 'المكان هو البطل، والشخصية نقطة صغيرة داخله.', u: 'للتأسيس في بداية المشهد، وللإحساس بالعزلة أو بضآلة الإنسان أمام العالم.' },
  { k: 'LS', ar: 'عامة', en: 'Long / Wide Shot', cat: 0, d: 'الشخصية كاملة مع مساحة واسعة حولها.', u: 'تحدد علاقة الشخصية بالمكان، وتُظهر حركتها في الفضاء.' },
  { k: 'FS', ar: 'كاملة', en: 'Full Shot', cat: 0, d: 'الجسد كاملًا من الرأس إلى القدمين.', u: 'للغة الجسد والمشية والملابس؛ الممثل يمثّل بجسده كله.' },
  { k: 'MLS', ar: 'أمريكية', en: 'Medium Long (¾)', cat: 1, d: 'من الركبتين إلى الرأس.', u: 'وُلدت في أفلام الويسترن لتُظهر المسدس على الخصر؛ تجمع الحركة والتعبير.' },
  { k: 'MS', ar: 'متوسطة', en: 'Medium Shot', cat: 1, d: 'من الخصر إلى الرأس.', u: 'لقطة الحوار والإيماءات؛ تشبه المسافة الاجتماعية بين شخصين.' },
  { k: 'MCU', ar: 'متوسطة قريبة', en: 'Medium Close-Up', cat: 1, d: 'من الصدر إلى الرأس.', u: 'الأكثر استعمالًا في الحوار: الوجه واضح مع شيء من الجسد.' },
  { k: 'CU', ar: 'قريبة', en: 'Close-Up', cat: 2, d: 'الوجه وأعلى الكتفين.', u: 'للمشاعر: المشاهد يقرأ ما تفكر فيه الشخصية.' },
  { k: 'BCU', ar: 'قريبة جدًا', en: 'Big Close-Up', cat: 2, d: 'الوجه يملأ الكادر والجبهة مقطوعة.', u: 'للحظة الحاسمة والضغط النفسي؛ لا مهرب للمشاهد.' },
  { k: 'ECU', ar: 'تفصيلية', en: 'Extreme Close-Up', cat: 2, d: 'العينان أو جزء صغير جدًا.', u: 'لأقصى درجات التوتر، ولتوجيه الانتباه إلى تفصيل واحد.' },
  { k: 'INS', ar: 'إدراج', en: 'Insert', cat: 2, d: 'تفصيل اليد أو ما تمسكه.', u: 'لمعلومة سردية: رسالة، مفتاح، ساعة… تقول للمشاهد: انظر هنا.' }
];

const ANGLES = [
  { k: 'eye', ar: 'مستوى العين', en: 'Eye Level', e: 0, roll: 0, d: 'الكاميرا في مستوى عيني الشخصية.', u: 'محايدة: نرى الشخصية كندٍّ لنا.' },
  { k: 'high', ar: 'مرتفعة', en: 'High Angle', e: 30, roll: 0, d: 'الكاميرا فوق الشخصية وتنظر إليها من الأعلى.', u: 'تُصغّر الشخصية: ضعف أو هشاشة أو إحساس بأنها مراقَبة.' },
  { k: 'low', ar: 'منخفضة', en: 'Low Angle', e: -22, roll: 0, d: 'الكاميرا تحت مستوى العين وتنظر إلى الأعلى.', u: 'تُضخّم الشخصية: قوة، هيمنة، تهديد أو بطولة.' },
  { k: 'bird', ar: 'عين الطائر', en: "Bird's Eye", e: 88, roll: 0, d: 'عمودية من الأعلى تمامًا.', u: 'نظرة القدر أو الإله؛ تكشف التصميم والمسافات بين الأشخاص.' },
  { k: 'worm', ar: 'عين الدودة', en: "Worm's Eye", e: -60, roll: 0, d: 'من مستوى الأرض تقريبًا نحو الأعلى.', u: 'ضخامة مبالغ فيها وغرابة؛ العالم من منظور طفل أو حشرة.' },
  { k: 'dutch', ar: 'مائلة', en: 'Dutch Angle', e: 0, roll: 18, d: 'الأفق مائل داخل الكادر.', u: 'قلق واضطراب؛ عالم فقد توازنه.' }
];

const MODES = [
  { k: 'single', ar: 'فردية', en: 'Single' },
  { k: 'pair', ar: 'ثنائية', en: 'Two-Shot' },
  { k: 'ots', ar: 'فوق الكتف', en: 'OTS' },
  { k: 'pov', ar: 'ذاتية', en: 'POV' },
  { k: 'free', ar: 'حرة', en: 'Free' }
];
const MODE_INFO = {
  single: 'شخصية واحدة أو عنصر واحد في مركز الاهتمام.',
  pair: 'شخصيتان في كادر واحد: تُظهر العلاقة والمسافة بينهما.',
  ots: 'من خلف كتف شخصية نحو الأخرى: أساس لقطة/لقطة معاكسة في الحوار.',
  pov: 'نرى بعيني الشخصية: المشاهد يصبح هي.',
  free: 'كاميرا مستقلة مثبتة في مكانها: لا تتبع أحدًا، والشخصيات تدخل الكادر وتخرج منه. اسحبها في عين المخرج لتحريكها، واسحب داخل الكادر لتوجيهها.'
};

const SIDES = [
  { v: 0, ar: 'أمامية' }, { v: -40, ar: '¾ يمين' }, { v: -90, ar: 'جانبية يمين' },
  { v: 180, ar: 'خلفية' }, { v: 90, ar: 'جانبية يسار' }, { v: 40, ar: '¾ يسار' }
];

const LENSES = [14, 18, 24, 35, 50, 85, 135, 200];
function lensNote(f) {
  if (f <= 18) return 'زاوية واسعة جدًا: تشوّه الوجوه القريبة وتضخّم المسافات والعمق.';
  if (f <= 28) return 'واسعة: تُظهر المكان وتعطي إحساسًا بالحركة والعمق.';
  if (f <= 40) return 'طبيعية واسعة قليلًا: عدسة القصص اليومية.';
  if (f <= 60) return 'عادية: قريبة من نظرة العين البشرية.';
  if (f <= 100) return 'بورتريه: تُجمّل الوجه وتفصل الشخصية عن الخلفية.';
  return 'مقرّبة: تضغط المسافات فتبدو الخلفية ملتصقة بالشخصية، وتعزلها.';
}

const MOVES = [
  { k: 'static', ar: 'ثابتة', en: 'Static', dirs: null, d: 'الكاميرا لا تتحرك.', u: 'الهدوء والملاحظة؛ تترك الأداء يتكلم.' },
  { k: 'pan', ar: 'بانورامية أفقية', en: 'Pan', dirs: ['نحو اليمين', 'نحو اليسار'], d: 'تدور الكاميرا على محورها أفقيًا وتنتهي على الهدف.', u: 'كشف المكان، أو ربط عنصرين في الفضاء نفسه.' },
  { k: 'tilt', ar: 'بانورامية عمودية', en: 'Tilt', dirs: ['من الأسفل', 'من الأعلى'], d: 'تميل الكاميرا عموديًا على محورها وتنتهي على الهدف.', u: 'كشف الطول والضخامة، أو النزول من السماء إلى الشخصية.' },
  { k: 'dolly', ar: 'ترافلينغ أمامي', en: 'Dolly In / Out', dirs: ['اقتراب', 'ابتعاد'], d: 'الكاميرا كلها تتقدم نحو الهدف أو تبتعد عنه.', u: 'الاقتراب يُدخلنا إلى داخل الشخصية؛ الابتعاد يتركها وحيدة.' },
  { k: 'truck', ar: 'ترافلينغ جانبي', en: 'Truck', dirs: ['نحو اليمين', 'نحو اليسار'], d: 'الكاميرا تنزلق جانبيًا بموازاة المشهد.', u: 'مرافقة موازية؛ اختلاف سرعة الطبقات (Parallax) يمنح العمق.' },
  { k: 'ped', ar: 'رفع وخفض', en: 'Pedestal', dirs: ['صعود', 'نزول'], d: 'الكاميرا ترتفع أو تنخفض عموديًا دون أن تميل.', u: 'كشف ما فوق الشخصية أو تحتها مع الحفاظ على نظرة محايدة.' },
  { k: 'crane', ar: 'رافعة', en: 'Crane / Jib', dirs: ['صعود وابتعاد', 'نزول إلى المشهد'], d: 'حركة كبرى في الارتفاع والمسافة معًا.', u: 'تفتح المشهد بنزول مهيب أو تختمه بالابتعاد عن الشخصيات.' },
  { k: 'arc', ar: 'دائرية', en: 'Arc', dirs: ['مع عقارب الساعة', 'عكس عقارب الساعة'], d: 'الكاميرا تدور حول الشخصية.', u: 'لحظة تحوّل أو رومانسية أو دوار؛ الزمن يتوقف حول البطل.' },
  { k: 'zoom', ar: 'زووم', en: 'Zoom In / Out', dirs: ['تقريب', 'تبعيد'], d: 'العدسة تغيّر بُعدها البؤري والكاميرا في مكانها.', u: 'إحساس مصطنع ومباشر؛ صدمة أو سخرية (أسلوب السبعينيات).' },
  { k: 'vertigo', ar: 'دولي زووم', en: 'Dolly Zoom (Vertigo)', dirs: ['الخلفية تبتعد', 'الخلفية تقترب'], d: 'ترافلينغ وزووم متعاكسان: الشخصية بالحجم نفسه والعالم يتمدد حولها.', u: 'صدمة، دوار، إدراك مفاجئ (هيتشكوك، سبيلبرغ).' },
  { k: 'track', ar: 'تتبّع', en: 'Tracking / Follow', dirs: null, d: 'الكاميرا تلحق بالشخصية أينما ذهبت.', u: 'نعيش الرحلة معها؛ مناسبة للمشي والجري والمطاردة.' },
  { k: 'hand', ar: 'محمولة باليد', en: 'Handheld', dirs: null, d: 'ارتجاج خفيف كأن مصوّرًا يحمل الكاميرا.', u: 'واقعية وثائقية، توتر، فوضى، قرب من الحدث.' },
  { k: 'whip', ar: 'خاطفة', en: 'Whip Pan', dirs: ['نحو اليمين', 'نحو اليسار'], d: 'بانورامية سريعة جدًا في نهاية اللقطة.', u: 'انتقال طاقي إلى لقطة أخرى؛ كوميديا أو إيقاع لاهث.' },
  { k: 'roll', ar: 'دوران', en: 'Roll', dirs: ['مع عقارب الساعة', 'عكسها'], d: 'الكاميرا تدور حول محور العدسة.', u: 'اختلال، حلم، سُكر، عالم ينقلب.' }
];

const POSE0 = { hipY: 0, hipZ: 0, spine: 0, neckX: 0, neckY: 0, lShX: 0, lShZ: .07, lEl: .12, rShX: 0, rShZ: .07, rEl: .12, lHipX: 0, lKnee: 0, rHipX: 0, rKnee: 0, lie: 0 };
const POSES = {
  stand: {},
  sit: { hipY: -.92, hipZ: -.28, spine: -.06, lHipX: 1.5, rHipX: 1.5, lKnee: 1.5, rKnee: 1.5, lShX: .5, rShX: .5, lEl: .75, rEl: .75 },
  lie: { lie: 1, lShZ: .15, rShZ: .15 },
  binoc: { lShX: 1.25, lShZ: -.38, lEl: 1.95, rShX: 1.25, rShZ: -.38, rEl: 1.95 },
  phone: { rShX: .8, rShZ: .3, rEl: 2.7, neckX: .05 },
  point: { rShX: 1.45, rShZ: .05, rEl: .05 },
  cross: { lShX: .5, lShZ: -.3, lEl: 1.75, rShX: .5, rShZ: -.3, rEl: 1.8 },
  shock: { lShX: 2.25, lShZ: .55, lEl: 2.05, rShX: 2.25, rShZ: .55, rEl: 2.05, neckX: .08 },
  armsup: { lShX: .25, lShZ: 2.75, lEl: .2, rShX: .25, rShZ: 2.75, rEl: .2, neckX: -.12 },
  bend: { spine: 1.05, lHipX: .35, rHipX: .35, lKnee: .6, rKnee: .6, hipY: -.15, lShX: 1.0, rShX: 1.0, lEl: .2, rEl: .2, neckX: -.35 }
};
for (const k in POSES) POSES[k] = Object.assign({}, POSE0, POSES[k]);
const POSE_AR = { stand: 'واقف', sit: 'جالس', lie: 'مستلقٍ', binoc: 'يمسك منظارًا', phone: 'على الهاتف', point: 'يشير', cross: 'مكتوف اليدين', shock: 'يداه على رأسه', armsup: 'يرفع يديه' };
const POSE_HOLD = { binoc: 'binoc', phone: 'phone' };

const ACT_GROUPS = [['move', 'التنقّل'], ['face', 'الرأس والوجه'], ['body', 'اليدان والجسد'], ['pose', 'الوضعيات']];
const ACTS = {
  walk: { ar: 'يمشي إلى', who: 'all', g: 'move' },
  run: { ar: 'يركض إلى', who: 'living', g: 'move' },
  jump: { ar: 'يقفز', who: 'living', g: 'move' },
  turn: { ar: 'يستدير', who: 'all', g: 'move' },
  look: { ar: 'يلتفت برأسه', who: 'living', g: 'face' },
  eyes: { ar: 'يحرّك عينيه', who: 'human', g: 'face' },
  talk: { ar: 'يتكلم', who: 'human', g: 'face' },
  laugh: { ar: 'يضحك', who: 'human', g: 'face' },
  nod: { ar: 'يومئ بنعم', who: 'human', g: 'face' },
  shake: { ar: 'يهزّ رأسه بلا', who: 'human', g: 'face' },
  wave: { ar: 'يلوّح بيده', who: 'human', g: 'body' },
  gesture: { ar: 'يشرح بيديه', who: 'human', g: 'body' },
  point: { ar: 'يشير', who: 'human', g: 'body', pose: 'point' },
  clap: { ar: 'يصفّق', who: 'human', g: 'body' },
  raise: { ar: 'يرفع المنظار', who: 'human', g: 'body', pose: 'binoc' },
  phone: { ar: 'يردّ على الهاتف', who: 'human', g: 'body', pose: 'phone' },
  cross: { ar: 'يكتف يديه', who: 'human', g: 'body', pose: 'cross' },
  shock: { ar: 'يضع يديه على رأسه', who: 'human', g: 'body', pose: 'shock' },
  armsup: { ar: 'يرفع يديه', who: 'human', g: 'body', pose: 'armsup' },
  dance: { ar: 'يرقص', who: 'human', g: 'body' },
  sit: { ar: 'يجلس', who: 'human', g: 'pose', pose: 'sit' },
  bend: { ar: 'ينحني ليلتقط', who: 'human', g: 'pose' },
  lie: { ar: 'يستلقي', who: 'human', g: 'pose', pose: 'lie' },
  stand: { ar: 'يقف / يعود', who: 'human', g: 'pose', pose: 'stand' }
};
const ACT_DUR = { walk: 2, run: 1.5, jump: .8, turn: .8, look: .6, eyes: .4, talk: 2.4, laugh: 1.6, nod: 1, shake: 1, wave: 1.6, gesture: 2.4, point: .8, clap: 1.6, raise: 1.2, phone: 1, cross: .8, shock: .7, armsup: .7, dance: 3, sit: 1.2, bend: 1.6, lie: 1.4, stand: 1 };

const CAST = {
  man: { ar: 'رجل', age: 'adult', h: 176, build: 1, skin: '#c99a74', hair: 'short', hairC: '#2b1d14', top: '#ece5d6', bot: '#44502f', btype: 'pants', sleeves: 0, acc: {} },
  woman: { ar: 'امرأة', age: 'adult', h: 165, build: .92, skin: '#d9ab86', hair: 'long', hairC: '#3a2418', top: '#b5523b', bot: '#2f3b52', btype: 'skirt', sleeves: 1, acc: {} },
  hijabi: { ar: 'امرأة بحجاب', age: 'adult', h: 163, build: .95, skin: '#cf9f78', hair: 'hijab', hairC: '#5f4a7a', top: '#d8c3a5', bot: '#3b3a46', btype: 'pants', sleeves: 1, acc: {} },
  youngman: { ar: 'شاب', age: 'adult', h: 179, build: .95, skin: '#c08a62', hair: 'curly', hairC: '#1b1410', top: '#2f6f8a', bot: '#2f3b52', btype: 'pants', sleeves: 0, acc: {} },
  youngwoman: { ar: 'شابة', age: 'adult', h: 166, build: .9, skin: '#e0b18c', hair: 'ponytail', hairC: '#6b4226', top: '#ece5d6', bot: '#2f3b52', btype: 'pants', sleeves: 1, outer: 'jacket', outerC: '#b5523b', acc: {} },
  business: { ar: 'رجل ببذلة', age: 'adult', h: 180, build: 1.05, skin: '#d9ab86', hair: 'short', hairC: '#3a2418', top: '#f2efe8', bot: '#1f2433', btype: 'pants', sleeves: 1, outer: 'jacket', outerC: '#1f2433', acc: { tie: 1 } },
  doctor: { ar: 'طبيبة', age: 'adult', h: 167, build: .95, skin: '#c99a74', hair: 'hijab', hairC: '#2f6f8a', top: '#9fc3d6', bot: '#3b3a46', btype: 'pants', sleeves: 1, outer: 'coat', outerC: '#f4f4f0', acc: { glasses: 1 } },
  athlete: { ar: 'رياضي', age: 'adult', h: 182, build: 1.08, skin: '#8a5a3a', hair: 'short', hairC: '#1b1410', top: '#c23b2e', bot: '#1f2226', btype: 'shorts', sleeves: 0, acc: {} },
  farmer: { ar: 'فلاح', age: 'adult', h: 172, build: 1.05, skin: '#a87454', hair: 'short', hairC: '#2b1d14', top: '#8b7b5c', bot: '#5a4c38', btype: 'djellaba', sleeves: 1, acc: { strawhat: 1, mustache: 1 } },
  boy: { ar: 'طفل', age: 'child', h: 122, build: 1, skin: '#c48e66', hair: 'curly', hairC: '#1f1611', top: '#3d7bb8', bot: '#2c2c34', btype: 'pants', sleeves: 0, acc: {} },
  girl: { ar: 'طفلة', age: 'child', h: 116, build: .95, skin: '#dcb08b', hair: 'bun', hairC: '#4a2a18', top: '#e7a83a', bot: '#7a3b5a', btype: 'skirt', sleeves: 1, acc: {} },
  pupil: { ar: 'تلميذ بوزرة', age: 'child', h: 128, build: 1, skin: '#c48e66', hair: 'short', hairC: '#1f1611', top: '#3d7bb8', bot: '#2c2c34', btype: 'pants', sleeves: 1, outer: 'coat', outerC: '#f4f4f0', acc: { backpack: 1 } },
  oldman: { ar: 'شيخ', age: 'elder', h: 168, build: 1.05, skin: '#b98a66', hair: 'short', hairC: '#dcd7cd', top: '#8b7b5c', bot: '#5a4c38', btype: 'djellaba', sleeves: 1, acc: { beard: 1, cane: 1 } },
  oldwoman: { ar: 'مسنّة', age: 'elder', h: 154, build: 1.05, skin: '#c79c7a', hair: 'hijab', hairC: '#ece6d8', top: '#5d6f78', bot: '#3b3a46', btype: 'djellaba', sleeves: 1, acc: { cane: 1 } }
};
const ANIMALS = {
  cat: { ar: 'قط', color: '#d58b45' }, dog: { ar: 'كلب', color: '#9b6a43' }, horse: { ar: 'حصان', color: '#6b3f26' },
  sheep: { ar: 'خروف', color: '#f1ece0' }, bird: { ar: 'حمامة', color: '#8a93a3' },
  camel: { ar: 'جمل', color: '#c9a066' }, donkey: { ar: 'حمار', color: '#8d8a86' }, chicken: { ar: 'دجاجة', color: '#f0ead8' }
};
const PROPS = {
  tree: { ar: 'شجرة', color: '#4f7a3a' }, palm: { ar: 'نخلة', color: '#5c8a3c' }, rock: { ar: 'صخرة', color: '#9a8f84' },
  table: { ar: 'طاولة', color: '#8a5a3b' }, chair: { ar: 'كرسي', color: '#7a4e32' }, sofa: { ar: 'أريكة', color: '#7d2f2a' },
  bed: { ar: 'سرير', color: '#3f5f7a' }, desk: { ar: 'مكتب', color: '#6e4a31' }, lamp: { ar: 'مصباح', color: '#e9c98f' },
  door: { ar: 'باب', color: '#5b3a25' }, shelf: { ar: 'خزانة كتب', color: '#6e4a31' }, tv: { ar: 'تلفاز', color: '#222428' },
  board: { ar: 'سبورة', color: '#2e4a3c' }, box: { ar: 'صندوق', color: '#b98a55' }, plant: { ar: 'نبتة', color: '#4f8a46' },
  car: { ar: 'سيارة', color: '#c23b2e' }, streetlight: { ar: 'عمود إنارة', color: '#3a3d42' }, bench: { ar: 'كرسي حديقة', color: '#7a5434' },
  wall: { ar: 'جدار', color: '#e7dcc8' }, ctable: { ar: 'طاولة مقهى', color: '#d8d0c0' }, counter: { ar: 'كونتوار', color: '#6e4a31' },
  lantern: { ar: 'فانوس', color: '#c9a24a' }, parasol: { ar: 'مظلة شاطئ', color: '#e7a83a' }
};

const ENVS = {
  studio: { ar: 'استوديو فارغ', light: 'day', r: 11 },
  room: { ar: 'غرفة', light: 'warm', r: 10 },
  house: { ar: 'منزل (صالون)', light: 'day', r: 11 },
  classroom: { ar: 'مدرسة (قسم)', light: 'day', r: 12 },
  street: { ar: 'شارع', light: 'day', r: 20 },
  medina: { ar: 'سور المدينة', light: 'sunset', r: 22 },
  park: { ar: 'حديقة', light: 'day', r: 18 },
  desert: { ar: 'صحراء', light: 'sunset', r: 22 },
  cafe: { ar: 'مقهى (تراس)', light: 'day', r: 14 },
  alley: { ar: 'درب المدينة القديمة', light: 'day', r: 13, ph: 1.2 },
  beach: { ar: 'شاطئ', light: 'sunset', r: 22 },
  rooftop: { ar: 'سطح منزل', light: 'sunset', r: 15 }
};
const WEATHER = { clear: 'صافٍ', fog: 'ضباب', rain: 'مطر' };
const LIGHTS = {
  day: { ar: 'نهار', sky: '#c9dced', hs: '#eef4ff', hg: '#9a8a74', hi: .74, sc: '#fff4e2', si: .95, sp: [8, 14, 6], lamp: 0 },
  sunset: { ar: 'غروب', sky: '#e8a578', hs: '#ffd8b0', hg: '#5a3d33', hi: .6, sc: '#ff9c58', si: 1.1, sp: [-14, 5, 7], lamp: .5 },
  night: { ar: 'ليل', sky: '#0e1426', hs: '#40507e', hg: '#0c0c14', hi: .42, sc: '#a8b8ff', si: .3, sp: [-6, 12, -8], lamp: 1.6 },
  warm: { ar: 'داخلي دافئ', sky: '#2a1a14', hs: '#ffe4c4', hg: '#4a3428', hi: .6, sc: '#ffd8a6', si: .72, sp: [5, 9, 7], lamp: 1.1 }
};
const ASPECTS = [
  { k: '16:9', v: 16 / 9, ar: 'تلفزيون ويوتيوب' }, { k: '1.85', v: 1.85, ar: 'سينما' }, { k: '2.39', v: 2.39, ar: 'سينما سكوب' },
  { k: '4:3', v: 4 / 3, ar: 'كلاسيكي' }, { k: '1:1', v: 1, ar: 'مربع' }, { k: '9:16', v: 9 / 16, ar: 'عمودي (ريلز)' }
];

const SKINS = ['#f1cfb0', '#e0b18c', '#c99a74', '#b07a52', '#8a5a3a', '#5e3b26'];
const HAIRC = ['#1b1410', '#3a2418', '#6b4226', '#b07a3e', '#d9c08a', '#dcd7cd', '#7a2a1f'];
const CLOTH = ['#ece5d6', '#1f2226', '#44502f', '#2f3b52', '#3d7bb8', '#b5523b', '#e7a83a', '#7a3b5a', '#8b7b5c', '#5d6f78', '#2f6f5f', '#c23b2e'];
const HAIRS = { bald: 'أصلع', short: 'قصير', curly: 'مجعّد', long: 'طويل', ponytail: 'ذيل حصان', bun: 'كعكة', hijab: 'حجاب' };
const BTYPES = { pants: 'سروال', shorts: 'شورت', skirt: 'تنورة', djellaba: 'جلابة' };
const OUTERS = { none: 'بدون', jacket: 'سترة', coat: 'معطف أو وزرة' };
const ACCS = { glasses: 'نظارات', cap: 'قبعة', strawhat: 'قبعة قش', fez: 'طربوش', beard: 'لحية', mustache: 'شارب', tie: 'ربطة عنق', backpack: 'حقيبة ظهر', cane: 'عكاز' };
const CAM_COLORS = ['#f2a23a', '#79c4e6', '#ef7f37', '#b7e07a', '#e68ac4', '#efe3cf', '#9b8cff', '#5ad0b4'];

/* ---------- lessons ---------- */
const LESSONS = [
  {
    k: 'cut', t: 'القطع على الحركة', env: 'room', light: 'warm', aspect: '16:9',
    d: 'نفس فكرة الفيديو: نقطع من العامة إلى القريبة والشخصية ما زالت ترفع المنظار، فتتبع العين الحركة ولا تلاحظ القطع.',
    tip: 'اسحب مقبض القطع بين اللقطتين إلى ما بعد الثانية 2.6 ثم شغّل: هذا هو القطع المتأخر الذي يبدو مرتبكًا.',
    items: [['man', 0, .3, 0, { name: 'سمير', acc: { cap: 1 }, actions: [{ type: 'raise', t: 1.3, dur: 1.2 }] }]],
    cams: [{ target: 0, size: 'LS', lens: 35 }, { target: 0, size: 'CU', side: -20, lens: 50 }],
    shots: [[0, 1.9], [1, 2.6]]
  },
  {
    k: 'dialog', t: 'الحوار وقاعدة 180°', env: 'house', light: 'day', aspect: '1.85',
    d: 'لقطة تأسيسية ثنائية، ثم لقطة ولقطة معاكسة فوق الكتف، ثم لقطات قريبة. كل الكاميرات على جهة واحدة من المحور.',
    tip: 'غيّر موقع الكاميرا E إلى «خلفية» ولاحظ تحذير عبور المحور: ستبدو سلمى وكأنها تنظر في الاتجاه الخطأ.',
    items: [
      ['man', -.75, .2, 90, { name: 'أحمد', actions: [{ type: 'talk', t: .3, dur: 2.1 }, { type: 'gesture', t: 2.5, dur: 1.8 }, { type: 'nod', t: 6.6, dur: 1 }] }],
      ['hijabi', .75, .2, -90, { name: 'سلمى', actions: [{ type: 'nod', t: 1.2, dur: .9 }, { type: 'talk', t: 4.5, dur: 1.9 }, { type: 'cross', t: 6.4, dur: .8 }, { type: 'laugh', t: 8.2, dur: 1.4 }] }]
    ],
    cams: [
      { target: 0, other: 1, mode: 'pair', size: 'MS', lens: 35 },
      { target: 0, other: 1, mode: 'ots', size: 'MCU', side: 10, lens: 50 },
      { target: 1, other: 0, mode: 'ots', size: 'MCU', side: -10, lens: 50 },
      { target: 0, size: 'CU', side: -35, lens: 85 },
      { target: 1, size: 'CU', side: 35, lens: 85 }
    ],
    shots: [[0, 2.4], [1, 2], [2, 2], [3, 1.6], [4, 1.8]]
  },
  {
    k: 'intro', t: 'تقديم الشخصية', env: 'medina', light: 'sunset', aspect: '2.39',
    d: 'من العامة جدًا إلى القريبة: نكتشف المكان أولًا ثم نقترب من الشخصية خطوة خطوة، مع رافعة تنزل إلى المشهد.',
    tip: 'جرّب تبديل ترتيب اللقطات: ابدأ بالقريبة ثم اكشف المكان. يتحول التقديم إلى مفاجأة.',
    items: [['woman', 0, -10.5, 0, { name: 'نور', actions: [{ type: 'walk', t: 0, dur: 7, tx: 0, tz: 0 }, { type: 'look', t: 7.5, dur: .7, v: 30 }] }], ['palm', -5, -3, 0, {}], ['palm', 6, -5, 40, {}]],
    cams: [
      { target: 0, size: 'ELS', lens: 24, move: 'crane', dir: -1, amt: 1 },
      { target: 0, size: 'FS', lens: 35, move: 'track', side: 15 },
      { target: 0, size: 'MS', lens: 50, move: 'track', side: -20 },
      { target: 0, size: 'CU', lens: 85, angle: 'low', side: 10 }
    ],
    shots: [[0, 3], [1, 2], [2, 1.8], [3, 2.6]]
  },
  {
    k: 'vertigo', t: 'لحظة الإدراك: دولي زووم', env: 'street', light: 'day', aspect: '16:9',
    d: 'الشخصية تبقى بالحجم نفسه بينما يتمدد الشارع خلفها. حركة هيتشكوك الشهيرة للتعبير عن صدمة داخلية.',
    tip: 'غيّر الاتجاه إلى «الخلفية تقترب» ولاحظ كيف يتحول الإحساس من الصدمة إلى الاختناق.',
    items: [['man', 0, 0, 90, { name: 'كريم', top: '#2f3b52', actions: [{ type: 'look', t: 1.2, dur: .5, v: -30 }, { type: 'look', t: 2.4, dur: .6, v: 0 }] }], ['car', -6, 2, 90, {}]],
    cams: [{ target: 0, size: 'LS', lens: 35 }, { target: 0, size: 'MCU', lens: 35, move: 'vertigo', dir: 1, amt: 1 }],
    shots: [[0, 2], [1, 4.5]]
  },
  {
    k: 'power', t: 'القوة والضعف بالزوايا', env: 'classroom', light: 'day', aspect: '16:9',
    d: 'زاوية منخفضة تُضخّم الأستاذ، وزاوية مرتفعة تُصغّر التلميذ. الكاميرا تحكي علاقة السلطة دون كلمة.',
    tip: 'اعكس الزاويتين: أستاذ من الأعلى وتلميذ من الأسفل. من صار صاحب القوة الآن؟',
    items: [
      ['oldman', 0, -1.7, 0, { name: 'الأستاذ', btype: 'pants', top: '#3b4a5e', bot: '#2a2c30', acc: { glasses: 1, mustache: 1 }, actions: [{ type: 'point', t: 2.4, dur: .6 }] }],
      ['boy', 0, 1.05, 180, { name: 'يوسف', pose: 'sit', actions: [{ type: 'look', t: 5.2, dur: .5, v: -25 }] }]
    ],
    cams: [
      { target: 0, size: 'LS', lens: 24, angle: 'high' },
      { target: 0, size: 'MS', lens: 35, angle: 'low' },
      { target: 1, size: 'MCU', lens: 50, angle: 'high' },
      { target: 0, other: 1, mode: 'ots', size: 'MS', side: 10, angle: 'low' }
    ],
    shots: [[0, 2.2], [1, 2], [2, 2], [3, 2]]
  },
  {
    k: 'chase', t: 'التتبع والكاميرا المحمولة', env: 'park', light: 'day', aspect: '2.39',
    d: 'طفلة تجري خلف كلبها. لقطات تتبع جانبية وأخرى محمولة باليد تنقل الطاقة والفوضى.',
    tip: 'اجعل كل اللقطات ثابتة ثم قارن: الحركة نفسها تفقد نصف طاقتها.',
    items: [
      ['girl', -7, 1, 90, { name: 'ليلى', actions: [{ type: 'run', t: 0, dur: 5.5, tx: 7, tz: 1 }] }],
      ['dog', -5.5, 1.7, 90, { name: 'ريكس', actions: [{ type: 'run', t: 0, dur: 5.3, tx: 8.5, tz: 1.7 }] }]
    ],
    cams: [
      { target: 0, size: 'LS', lens: 35, move: 'track', side: -90 },
      { target: 0, size: 'FS', lens: 24, move: 'track', side: -35, angle: 'low' },
      { target: 1, size: 'MS', lens: 35, move: 'track', side: -60 },
      { target: 0, size: 'MCU', lens: 50, move: 'track', side: -20, shake: 1 }
    ],
    shots: [[0, 1.8], [1, 1.4], [2, 1.2], [3, 1.6]]
  },
  {
    k: 'reveal', t: 'الكشف بالبانوراما', env: 'desert', light: 'sunset', aspect: '2.39',
    d: 'البانوراما تبدأ على الكثبان وتنتهي على المسافر: الكشف يؤخر المعلومة ليصنع ترقبًا.',
    tip: 'غيّر الحركة الأولى إلى «رافعة — نزول إلى المشهد» وقارن بين الكشفين.',
    items: [['oldman', 0, 0, 30, { name: 'المسافر', btype: 'djellaba', top: '#efe7d6', acc: { cane: 1 }, actions: [{ type: 'look', t: 4.6, dur: .8, v: 40 }] }], ['horse', 2.2, -1.2, -30, {}]],
    cams: [
      { target: 0, size: 'ELS', lens: 24, move: 'pan', dir: 1, amt: 2.2 },
      { target: 0, size: 'MS', lens: 50, move: 'arc', dir: 1, amt: .8, side: 20 },
      { target: 0, size: 'CU', lens: 85, side: 30 }
    ],
    shots: [[0, 4], [1, 3], [2, 2.2]]
  }
];
