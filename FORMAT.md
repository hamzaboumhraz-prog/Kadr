# صيغة ملف السيناريو في كادر (`.kadr`)

ملف نصي بصيغة JSON. يفتحه كادر من الشاشة الرئيسية ← «افتح ملف سيناريو»، فيبني المشروع كاملًا: المشاهد، الأماكن، الشخصيات، الحركات، الكاميرات واللقطات. بعدها يُعدَّل كل شيء داخل التطبيق.

مثال كامل: [`examples/hura-munammaq.kadr`](examples/hura-munammaq.kadr) (ديكوباج «هراء منمق»).

## البنية

```json
{
  "kadr": "script", "v": 1,
  "title": "اسم الفيلم", "aspect": "16:9",
  "cast": { "hero": { "type": "youngman", "name": "الشاب" } },
  "scenes": [
    {
      "title": "داخل المنزل", "place": "house", "light": "warm", "weather": "clear",
      "items": [
        { "id": "hero", "at": [0.4, -2.3], "face": 0, "pose": "sit" },
        { "id": "tv", "type": "tv", "at": [0.4, 2.7], "face": "hero" }
      ],
      "shots": [
        { "title": "مشاهدة التلفاز", "action": "نص الحدث كما في الديكوباج",
          "size": "MLS", "angle": "eye", "side": 160, "on": "hero", "dur": 4,
          "do": [ { "who": "hero", "act": "browse", "at": 3.1 } ] }
      ]
    }
  ]
}
```

- **كل مشهد له مكان واحد.** إذا تغيّر المكان داخل مشهد في الديكوباج، يُقسَّم إلى مشاهد (أ، ب، ج).
- الزمن متصل داخل المشهد: اللقطة الأولى من 0 إلى مدتها، والثانية تبدأ حيث انتهت الأولى. `at` في الحركات **نسبةً إلى بداية اللقطة**.

## الأماكن (`place`) والإحداثيات

الوحدة متر. `at: [x, z]`. الاتجاه `face` بالدرجات: 0 نحو +z، 90 نحو +x، 180 نحو −z. يمكن أن يكون `face` اسم عنصر أو نقطة `[x, z]`.

| المكان | المفتاح | الفضاء |
|---|---|---|
| استوديو | `studio` | أرض مفتوحة |
| غرفة | `room` | x ±3، z ±2.5 |
| منزل (صالون) | `house` | x ±4، z ±3. أرائك على الجدار الخلفي z≈−2.4 (جلوس)، باب x=4 z=1.2 |
| قسم | `classroom` | x ±4.5، z ±3.5 |
| شارع | `street` | الطريق على x، عرضه z ±4. الرصيف z ±4…±7، واجهات المباني z=±7 |
| سور المدينة | `medina` | السور z=−9، الباب في x=0 |
| حديقة | `park` | ممر z≈1.3 |
| صحراء | `desert` | مفتوح |
| مقهى | `cafe` | الطاولات z −1.6…0.9، الطريق z=8.5 |
| درب | `alley` | ضيق: x ±1.8، يمتد على z، قوسان z=−9 و z=7 |
| شاطئ | `beach` | البحر z<−9 |
| سطح | `rooftop` | x ±6، z ±5 |
| أطراف قرية | `village` | طريق ترابي على z (x ±2.2)، بيوت x ±8…12 |
| سوق أسبوعي | `souk` | ممر على x في z≈0، صفّا خيام z=±5.2 |
| طريق هادئ | `road` | الطريق على z (x ±3)، الحافة الترابية x 3…6 |

`light`: `day` `sunset` `night` `warm` · `weather`: `clear` `fog` `rain`

## العناصر (`items`)

`type`:
- أشخاص: `man` `woman` `hijabi` `youngman` `youngwoman` `business` `doctor` `athlete` `farmer` `boy` `girl` `pupil` `oldman` `oldwoman`
- حيوانات: `dog` `shaggy` `cat` `horse` `sheep` `bird` `camel` `donkey` `chicken`
- أشياء: `tv` `sofa` `door` `table` `chair` `bed` `desk` `lamp` `shelf` `board` `box` `plant` `car` `suv` `stall` `fence` `hay` `tree` `palm` `rock` `bench` `streetlight` `wall` `ctable` `counter` `lantern` `parasol`

خصائص اختيارية: `name`، `pose` (`stand` `sit` `lie` `text` `phone` `cross` `read` يمسك كتابًا مفتوحًا ويقرأ، `lean` متّكئ…؛ للحيوانات `sit` و `lie`)، `color`، `scale`، ومظهر الأشخاص: `h` `hair` `hairC` `skin` `top` `bot` `btype` `outer` `outerC` `acc` (`["glasses","cap","backpack"]`) و`bagC` لون الحقيبة.

أضواء التصوير `spot` `softbox` `bulb` تقبل: `power` (0…3)، `lc` لون الضوء، `angle` اتساع الحزمة بالدرجات، `tilt`، و`aim` اسم العنصر الذي يُوجَّه إليه الضوء.

العنصر في `cast` يُستعمل في أي مشهد بـ `"id"` نفسه، ويمكن تغيير ملابسه في مشهد بعينه.

## اللقطات (`shots`)

| المفتاح | القيم |
|---|---|
| `size` | `ELS`/`XLS`/`EWS` · `LS`/`WS` · `FS`/`MWS` · `MLS` · `MS` · `MCU` · `CU` · `BCU` · `ECU`/`XCU` · `INS` |
| `angle` | `eye` · `high` (plongée) · `slight high` · `low` (contre-plongée) · `slight low` · `bird` · `worm` · `dutch` |
| `side` | `front` · `back` · `profile`/`left` · `right` · `3/4` · `3/4 right` · أو درجات (0 أمام، 90 يسار الشخصية، −90 يمينها، 180 خلفها) |
| `view` | `single` · `pair` (مع `with`) · `ots` (`on` = من ننظر إليه، `with` = صاحب الكتف) · `pov` (`with` = صاحب العينين) · `free` |
| `on` / `with` | أسماء العناصر |
| `move` | `static` `pan` `tilt` `dolly` `truck` `ped` `crane` `arc` `zoom` `vertigo` `track` `hand` `whip` `roll`، و `dir`: `in`/`out`/`left`/`right`/`up`/`down`، و `amt` |
| `follow` | `pan` (تلتفت مع الهدف، الافتراضي) · `move` (تتحرك معه) · `off` |
| `lens` | بالمليمتر (اختياري) |
| `dist` | مضاعف المسافة (1 عادي، أكبر = أوسع) |
| `tilt` | تعديل ارتفاع الزاوية بالدرجات |
| `free` | `{ "pos": [x,y,z], "look": [x,y,z] أو اسم عنصر, "lens": 35 }` (وجوده يجعل الكاميرا حرة تلقائيًا) |
| `dur` | المدة بالثواني |
| `trans` | `cut` · `dissolve` · `fade` (الأولى: ظهور من السواد) |
| `end` | `fade` = اختفاء تدريجي نحو السواد في آخر اللقطة |
| `cam` | اسم كاميرا لإعادة استعمالها (لقطة / لقطة معاكسة) |

`side` يُحسب من اتجاه الشخصية في **بداية اللقطة**. إذا كانت الشخصية تمشي نحو الكاميرا استعمل `follow: "move"` أو كاميرا `free`.

## الحركات (`do`)

`{ "who": "hero", "act": "walk", "to": [x, z] أو اسم عنصر, "at": 0.5, "dur": 2 }`

- التنقّل: `walk` `run` (`to`، `stop` مسافة التوقف قبل العنصر، `speed`: `slow`/`fast`، `back`: يمشي إلى الخلف)، `retreat` (يتراجع، `dist`)، `jump`، `turn` (`to` أو `v` بالدرجات)
- الرأس والوجه: `look` (`v` بالدرجات، أو `to` عنصر فيصبح `watch`)، `watch` (يتابع عنصرًا بنظره طوال `dur`)، `eyes` (`left` `right` `up` `down` `center`)، `talk` `laugh` `nod` `shake`
- اليدان والجسد: `browse` (يتصفح الهاتف) `read` (يقرأ كتابًا) `phone` `dress` `wave` `gesture` `point` `clap` `cross` `shock` `armsup` `dance` `raise`
- الوضعيات: `sit` `stand` `lie` (والحيوانات أيضًا) `bend` `lean`

إذا غابت `dur` تُحسب تلقائيًا (المشي من المسافة).

---

# ملف العناصر والديكورات (`"kadr": "asset"`)

ملف ثانٍ يضيف إلى «مكتبتي» ديكورات كاملة وأشياء وحيوانات وأشخاصًا. يُستورد من «المشهد» ← «استيراد ديكور أو عناصر»، أو من «العناصر» ← «مكتبتي»، أو من زر فتح الملفات في الصفحة الرئيسية. يبقى على الجهاز، ويُحمل داخل ملف المشروع عند تصديره (فيفتح المشروع على جهاز آخر بديكوراته).

```json
{ "kadr": "asset", "v": 1, "assets": [ { "id": "riad", "name": "رياض مغربي", "kind": "set", ... } ] }
```

| المفتاح | المعنى |
|---|---|
| `id` | معرّف لاتيني قصير، يُستعمل في السيناريو: `"place": "riad"` أو `"type": "goat"` |
| `name` | الاسم الظاهر |
| `kind` | `set` ديكور كامل · `prop` شيء · `animal` حيوان · `person` شخص |
| `parts` | قائمة الأشكال (للديكور والشيء) |

**الأشكال** (`parts`): كل شكل له `shape` و`at: [x, y, z]` بالأمتار (y = الارتفاع إلى مركز الشكل) و`rot: [x, y, z]` بالدرجات و`scale`، ومن المظهر: `color`، `tex` (`wood` `tile` `stone` `cobble` `terra` `carpet` `lino` `plaster`، و`books` رفوف مليئة بالكتب: كل تكرار عمودي = رفّان، مع `seed` لتنويع الكتب) مع `repeat: [x, y]`، `tint` لتلوين النسيج، `rough` (0 لامع ← 1 مطفأ)، `metal`، `glow` (يضيء ذاتيًا، مع `glowColor`)، `opacity`، `double`، `shadow: false`.

| `shape` | المقاسات |
|---|---|
| `box` | `size: [عرض, ارتفاع, عمق]` |
| `cyl` | `r` و`r2` (أعلى/أسفل) و`h` |
| `sphere` · `circle` | `r` |
| `cone` | `r` و`h` |
| `plane` | `size: [عرض, ارتفاع]` |
| `torus` | `r` و`tube` و`arc` |
| `capsule` | `r` و`r2` و`h` (يتدلى من `at` إلى الأسفل) |
| `lathe` | `profile: [[نصف القطر, الارتفاع], ...]` جسم دوراني (أوانٍ، نافورات، أعمدة) |
| `ext` | `points: [[x, y], ...]` و`depth` شكل مسطح مُبثق |
| `arch` | `w` و`h` قوس |

- `repeatAt: [[x,y,z], ...]` يكرر الشكل نفسه في عدة أماكن (أعمدة، أشجار، كراسٍ).
- `{ "light": true, "at": [x,y,z], "color": "#ffb15c", "dist": 7 }` مصباح حقيقي يضيء المحيط ليلًا ويخفت نهارًا.
- في الديكور: الجدران (صناديق عالية رقيقة، أو أي شكل عليه `"wall": true`) تُرفع تلقائيًا حين تكون الكاميرا خلفها، مثل الجدران المتحركة في استوديو التصوير، وتبقى ظلالها. `"wall": false` يمنع ذلك، و`"wall": "x"` أو `"z"` يحدد اتجاه وجه الجدار (للرفوف وقطعها الصغيرة كي تُرفع معًا).
- `"roof": true` سقف يختفي حين تكون الكاميرا فوقه وفي المخطط 2D، ويبقى ظله. `"plan": false` يُخفي القطعة في المخطط فقط (مصابيح معلقة، أسلاك).

**الديكور** (`set`) يضيف: `indoor: true` للأماكن المغلقة، `floor: { size: [w, d], color, tex, repeat, outerColor }`، `light` (الإضاءة الافتراضية: `day` `night` `golden` ...)، `sky` (لون مربعه في القائمة)، `r` (نصف قطر منطقة اللعب)، `start: [x, z]` (حيث يقف الممثلون في مشهد جديد).

**الحيوان** (`animal`): `animal: { "base": "dog" | "cat" | "horse" | "sheep" | "camel" | "donkey", ...تعديلات }` حيث `L` طول الجسم، `R` سُمكه، `leg` طول القوائم، `hr` حجم الرأس، `neck` طول الرقبة، `snout` الخطم، `tail` الذيل، `horns` (طول القرنين)، `hornC`، `beard`، `wool`، `hump`، `longEars`. اللون من `color`.

**الشخص** (`person`): `person: { "h": 174, "build": 1, "skin": "#b98a66", "hair": "short|long|curly|bun|ponytail|hijab|bald", "hairC", "top", "bot", "btype": "pants|skirt|shorts|djellaba", "sleeves": 0|1, "outer": "jacket|coat", "outerC", "acc": { "fez": 1, "beard": 1, "mustache": 1, "glasses": 1, "cap": 1, "strawhat": 1, "tie": 1, "cane": 1, "backpack": 1 } }`

## النماذج ثلاثية الأبعاد (`.glb`)

يقبل كادر أيضًا نماذج `.glb` (من Blender أو مواقع النماذج المجانية مثل Sketchfab وPoly Pizza وMixamo). عند الاستيراد تختار: الاسم، النوع (شيء، حيوان، شخص)، الارتفاع بالمتر، واتجاه الوجه. إذا كان في النموذج حركات مسماة `walk` أو `run` أو `idle` فكادر يشغلها تلقائيًا حين يمشي العنصر أو يركض أو يقف، بإيقاع خطواته.

ملف السيناريو نفسه يمكن أن يحمل `"assets": [...]` فيُثبَّت الديكور ثم يُبنى المشهد فيه بخطوة واحدة: [`examples/bookstore-scene.kadr`](examples/bookstore-scene.kadr) (مكتبة لبيع الكتب، شخصيتان، خمس لقطات).

مثال كامل: [`examples/riad-pack.kadr`](examples/riad-pack.kadr) (رياض مغربي بنافورة وأروقة وأشجار برتقال، صينية شاي، عربة خضر، ماعز، حارس الرياض).
