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

خصائص اختيارية: `name`، `pose` (`stand` `sit` `lie` `text` `phone` `cross`…؛ للحيوانات `sit` و `lie`)، `color`، `scale`، ومظهر الأشخاص: `h` `hair` `hairC` `skin` `top` `bot` `btype` `outer` `outerC` `acc` (`["glasses","cap"]`).

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
| `free` | `{ "pos": [x,y,z], "look": [x,y,z] أو اسم عنصر, "lens": 35 }` |
| `dur` | المدة بالثواني |
| `trans` | `cut` · `dissolve` · `fade` (الأولى: ظهور من السواد) |
| `end` | `fade` = اختفاء تدريجي نحو السواد في آخر اللقطة |
| `cam` | اسم كاميرا لإعادة استعمالها (لقطة / لقطة معاكسة) |

`side` يُحسب من اتجاه الشخصية في **بداية اللقطة**. إذا كانت الشخصية تمشي نحو الكاميرا استعمل `follow: "move"` أو كاميرا `free`.

## الحركات (`do`)

`{ "who": "hero", "act": "walk", "to": [x, z] أو اسم عنصر, "at": 0.5, "dur": 2 }`

- التنقّل: `walk` `run` (`to`، `stop` مسافة التوقف قبل العنصر، `speed`: `slow`/`fast`، `back`: يمشي إلى الخلف)، `retreat` (يتراجع، `dist`)، `jump`، `turn` (`to` أو `v` بالدرجات)
- الرأس والوجه: `look` (`v` بالدرجات، أو `to` عنصر فيصبح `watch`)، `watch` (يتابع عنصرًا بنظره طوال `dur`)، `eyes` (`left` `right` `up` `down` `center`)، `talk` `laugh` `nod` `shake`
- اليدان والجسد: `browse` (يتصفح الهاتف) `phone` `dress` `wave` `gesture` `point` `clap` `cross` `shock` `armsup` `dance` `raise`
- الوضعيات: `sit` `stand` `lie` (والحيوانات أيضًا) `bend`

إذا غابت `dur` تُحسب تلقائيًا (المشي من المسافة).
