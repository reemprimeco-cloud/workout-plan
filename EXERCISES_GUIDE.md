# Prime Fit — دليل إضافة التمارين والأجهزة
## Developer Guide: Adding Exercises & Machines

> **القاعدة الذهبية:** كل الإضافات تتم في ملفَّي البيانات فقط.  
> لا تلمس أي مكوّن React، ولا أي منطق في الـ hooks.

---

## 📁 الملفات التي تحتاجها فقط

| الملف | الغرض |
|---|---|
| `client/src/data/exercises.ts` | قاعدة بيانات التمارين الرئيسية + أجهزة الكارديو |
| `client/src/lib/exerciseData.ts` | برنامج النساء + برنامج الرجال (التمارين المخصصة لكل جنس) |

---

## 🏋️ النوع الأول: إضافة تمرين عادي (أوزان / كور)

### أين تُضاف؟
في `exercises.ts` داخل مصفوفة `masterExercises[]`.  
هذه التمارين تظهر في **تبويب "كل التمارين"** داخل الجلسة النشطة.

### القالب — انسخ والصق:

```typescript
{
  id: 'اختر_id_فريد',           // مثال: 'cable_fly' — لا مسافات، لا عربي
  nameAr: 'اسم التمرين بالعربي',
  nameEn: 'Exercise Name in English',
  muscleGroup: 'العضلة المستهدفة بالعربي',
  defaultSets: 3,               // عدد الجولات
  defaultReps: '12',            // عدد التكرارات (نص حر: '12' أو '30 ثانية')
  defaultWeight: '10 كجم',      // الوزن الافتراضي (أو 'وزن الجسم' أو '—')
  restSeconds: 60,              // الراحة بين الجولات بالثواني
  image: IMG.chest,             // اختر من قائمة IMG أدناه
  tip: 'نصيحة بالعربي',
  tipEn: 'Tip in English',
  youtubeUrl: 'https://www.youtube.com/watch?v=XXXXX',
  category: 'weights',          // 'weights' | 'cardio' | 'core' | 'aqua' | 'sauna'
  sessionTypes: ['chest_shoulders', 'full_body'], // اختر من القائمة أدناه
},
```

### قائمة الصور المتاحة (IMG):

| المفتاح | الوصف |
|---|---|
| `IMG.warmup` | إحماء عام |
| `IMG.treadmill` | جهاز المشي |
| `IMG.rower` | جهاز التجديف |
| `IMG.elliptical` | جهاز الإليبتيكال |
| `IMG.cardio` | أجهزة كارديو عامة |
| `IMG.glutes` | تمارين الأرداف |
| `IMG.lunges` | سكوات / طعنات |
| `IMG.deadlift` | رفعة ميتة / ساقين |
| `IMG.arms` | تمارين الذراعين |
| `IMG.lat` | سحب الظهر |
| `IMG.plank` | بلانك / كور |
| `IMG.abs` | تمارين البطن |
| `IMG.chest` | تمارين الصدر |
| `IMG.shoulder` | تمارين الأكتاف |
| `IMG.absGlutes` | بطن + أرداف |
| `IMG.glute2` | أرداف (بديل) |
| `IMG.sauna` | الساونا |
| `IMG.aqua` | الأكوا |

> **لإضافة صورة جديدة:**  
> 1. ارفع الصورة: `manus-upload-file --webdev path/to/image.jpg`  
> 2. أضف المسار المُعاد إلى كائن `IMG` في أعلى الملف:  
>    `myNewImage: '/manus-storage/filename_abc123.jpg',`  
> 3. استخدمه في التمرين: `image: IMG.myNewImage`

### قائمة sessionTypes المتاحة:

| القيمة | القسم |
|---|---|
| `'lower_body'` | الجزء السفلي |
| `'upper_arms'` | الجزء العلوي + الذراعين |
| `'core_cardio'` | البطن والكور |
| `'chest_shoulders'` | الصدر والأكتاف |
| `'full_body'` | الجسم كامل |
| `'active_rest'` | تمارين الكارديو |
| `'aqua'` | كلاس الأكوا |
| `'sauna'` | الساونا |

---

## 🚴 النوع الثاني: إضافة جهاز كارديو

### أين تُضاف؟
في `exercises.ts` داخل مصفوفة `cardioTemplates[]`.  
هذه الأجهزة تظهر داخل **قسم تمارين الكارديو** في الصفحة الرئيسية عند توسيعه.

### القالب — انسخ والصق:

```typescript
{
  id: 'اختر_id_فريد',           // مثال: 'bike' — لا مسافات، لا عربي
  nameAr: 'اسم الجهاز بالعربي',
  nameEn: 'Machine Name',
  machine: 'Machine Name',      // نفس nameEn عادةً
  defaultDuration: 20,          // المدة الافتراضية بالدقائق
  defaultSpeed: '60',           // القيمة الافتراضية للحقل الأول
  defaultIncline: '5',          // القيمة الافتراضية للحقل الثاني
  speedLabel: 'تسمية الحقل الأول (عربي)',
  inclineLabel: 'تسمية الحقل الثاني (عربي)',
  showCalories: true,           // إظهار حقل الكالوريز؟
  showDistance: true,           // إظهار حقل المسافة؟
  image: IMG.cardio,            // صورة الجهاز
  tip: 'نصيحة بالعربي',
  tipEn: 'Tip in English',
  sessionTypes: ['active_rest', 'core_cardio'],
},
```

---

## 👩 النوع الثالث: إضافة تمرين لبرنامج النساء أو الرجال

### أين تُضاف؟
في `exerciseData.ts` داخل `womenProgram.exercises[]` أو `menProgram.exercises[]`.  
هذه التمارين تظهر في:
- **تبويب "برنامجك"** داخل الجلسة النشطة
- **صفحة التمارين** (Exercise Library)
- **بطاقات الأقسام** في الصفحة الرئيسية عند توسيعها

### القالب — انسخ والصق:

```typescript
{
  id: "w-اختر_id_فريد",         // للنساء يبدأ بـ w- ، للرجال بـ m-
  name: "Exercise Name",
  nameAr: "اسم التمرين بالعربي",
  category: "Chest",            // اختر من قائمة الفئات أدناه
  categoryAr: "الصدر",
  sets: "3",
  reps: "12–15",
  rest: "60",                   // بالثواني
  restAr: "60 ثانية",
  youtubeUrl: "https://www.youtube.com/watch?v=XXXXX",
  imageUrl: "/manus-storage/filename_abc123.jpg",  // صورة الجهاز
  notes: "Tip in English",
  notesAr: "نصيحة بالعربي",
},
```

### فئات التمارين المتاحة (category):

| القيمة | العربي | يظهر في قسم |
|---|---|---|
| `"Shoulders"` | الأكتاف | chest_shoulders |
| `"Chest"` | الصدر | chest_shoulders |
| `"Arms"` | الذراعين | upper_arms |
| `"Back"` | الظهر | upper_arms |
| `"Legs"` | الساقين | lower_body |
| `"Glutes"` | الأرداف (نساء فقط) | lower_body |
| `"Core"` | البطن والكور | core_cardio |

---

## ✅ قائمة التحقق بعد كل إضافة

بعد إضافة أي تمرين أو جهاز، تحقق من هذه النقاط:

- [ ] الـ `id` فريد ولا يتكرر في أي مكان
- [ ] الـ `youtubeUrl` صحيح ويعمل
- [ ] الـ `imageUrl` أو `image` يشير لمسار موجود
- [ ] `sessionTypes` تحتوي على قسم واحد على الأقل
- [ ] لا توجد أخطاء TypeScript: `npx tsc --noEmit`

---

## 🗂️ ملخص: أين يظهر كل نوع في التطبيق؟

```
exercises.ts → masterExercises[]
    └─► تبويب "كل التمارين" في الجلسة النشطة (AddExercisePanel)

exercises.ts → cardioTemplates[]
    └─► قسم "تمارين الكارديو" في الصفحة الرئيسية (عند التوسيع)

exerciseData.ts → womenProgram.exercises[] / menProgram.exercises[]
    └─► تبويب "برنامجك" في الجلسة النشطة
    └─► صفحة التمارين (Exercise Library)
    └─► بطاقات الأقسام في الصفحة الرئيسية
```

---

## 🚫 لا تلمس هذه الملفات

هذه الملفات هي الهيكل الأساسي للتطبيق — أي تغيير فيها قد يكسر التطبيق:

| الملف | السبب |
|---|---|
| `hooks/useGymTracker.ts` | منطق الحالة والتخزين المحلي |
| `components/ActiveSession.tsx` | منطق الجلسة النشطة |
| `components/ExerciseLibrary.tsx` | منطق مكتبة التمارين |
| `pages/Home.tsx` | الصفحة الرئيسية والتنقل |
| `contexts/LanguageContext.tsx` | نظام الترجمة |
| `index.css` | متغيرات الألوان والتصميم |

---

*Prime Fit — Built with React 19 + TypeScript + Tailwind 4*
