// ============================================================
// Master Exercise Database - Editable & Expandable
// All exercises can be modified by user at runtime
// ============================================================

export type SessionType =
  | 'lower_body'
  | 'upper_arms'
  | 'core_cardio'
  | 'full_body'
  | 'chest_shoulders'
  | 'aqua'
  | 'sauna'
  | 'active_rest'
  | 'warm_up'
  | 'stretching'
  | 'home_workouts'
  | 'pilates'
  | 'mobility'
  | 'quick_workouts';

export interface ExerciseTemplate {
  id: string;
  nameAr: string;
  nameEn: string;
  muscleGroup: string;
  defaultSets: number;
  defaultReps: string;
  defaultWeight: string;
  restSeconds: number;
  image: string;
  tip: string;
  tipEn: string;
  youtubeUrl: string;
  category: 'weights' | 'cardio' | 'core' | 'aqua' | 'sauna';
  sessionTypes: SessionType[];
}

export interface CardioTemplate {
  id: string;
  nameAr: string;
  nameEn: string;
  machine: string;
  defaultDuration: number; // minutes
  defaultSpeed: string;
  defaultIncline: string;
  speedLabel?: string;
  inclineLabel?: string;
  showCalories?: boolean;
  showDistance?: boolean;
  image: string;
  tip: string;
  tipEn?: string;
  sessionTypes: SessionType[];
}

// ===== IMAGES (manus-storage) =====
const IMG = {
  warmup: '/manus-storage/warmup_f8a00b2a.png',
  treadmill: '/manus-storage/treadmill_039009ca.jpg',
  rower: '/manus-storage/machine-rower_003165e0.jpg',
  elliptical: '/manus-storage/elliptical_25526689.jpg',
  cardio: '/manus-storage/cardio_machines_6b910eda.jpg',
  glutes: '/manus-storage/glutes_5f977189.jpg',
  lunges: '/manus-storage/lunges_squats_536a67c0.jpg',
  deadlift: '/manus-storage/deadlift_squat_0f651346.jpg',
  arms: '/manus-storage/arm_exercises_2b6ba203.jpg',
  lat: '/manus-storage/lat_pulldown_fd6f2005.jpg',
  plank: '/manus-storage/plank_b44f6d96.jpg',
  abs: '/manus-storage/ab_exercises_5c818dad.jpg',
  chest: '/manus-storage/chest_shoulder_f2f90ec8.jpg',
  shoulder: '/manus-storage/shoulder_exercises_72e2de89.jpg',
  absGlutes: '/manus-storage/abs_glutes_eb1890bb.jpg',
  glute2: '/manus-storage/glute_exercises_6dfafade.jpg',
  sauna: '/manus-storage/sauna_b9935cdb.jpg',
  aqua: '/manus-storage/aqua_690009c3.jpg',
  aqua2: '/manus-storage/aqua2_34967505.jpg',
};

// ===== MASTER EXERCISE LIST =====
export const masterExercises: ExerciseTemplate[] = [
  // ── LOWER BODY ──
  {
    id: 'squat_bw', nameAr: 'سكوات بوزن الجسم', nameEn: 'Bodyweight Squat',
    muscleGroup: 'الأرداف والفخذين', defaultSets: 3, defaultReps: '15', defaultWeight: 'وزن الجسم',
    restSeconds: 60, image: IMG.lunges, tip: 'ظهرك مستقيم، ركبتيك لا تتجاوزان أصابع القدم، انزلي حتى تصبح الفخذان موازيتين للأرض.',
    tipEn: 'Keep back straight, knees behind toes, lower until thighs are parallel to floor.',
    youtubeUrl: 'https://www.youtube.com/watch?v=aclHkVaku9U',
    category: 'weights', sessionTypes: ['lower_body', 'full_body'],
  },
  {
    id: 'squat_db', nameAr: 'سكوات بالدمبلز', nameEn: 'Dumbbell Squat',
    muscleGroup: 'الأرداف والفخذين', defaultSets: 3, defaultReps: '12', defaultWeight: '5 كجم لكل يد',
    restSeconds: 60, image: IMG.deadlift, tip: 'أمسكي دمبلاً في كل يد، الظهر مستقيم، انزلي ببطء وارتفعي بقوة.',
    tipEn: 'Hold a dumbbell in each hand, keep back straight, lower slowly and drive up powerfully.',
    youtubeUrl: 'https://www.youtube.com/watch?v=Dy28eq2PjcM',
    category: 'weights', sessionTypes: ['lower_body', 'full_body'],
  },
  {
    id: 'lunge_db', nameAr: 'الطعنات بالدمبلز', nameEn: 'Dumbbell Lunge',
    muscleGroup: 'الأرداف والفخذين', defaultSets: 3, defaultReps: '12 لكل رجل', defaultWeight: '3 كجم لكل يد',
    restSeconds: 60, image: IMG.lunges, tip: 'خطوي للأمام، انزلي حتى تلمس الركبة الخلفية الأرض تقريباً.',
    tipEn: 'Step forward, lower until back knee nearly touches the floor, keep torso upright.',
    youtubeUrl: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
    category: 'weights', sessionTypes: ['lower_body', 'full_body'],
  },
  {
    id: 'hip_thrust', nameAr: 'دفع الورك (Hip Thrust)', nameEn: 'Hip Thrust',
    muscleGroup: 'الأرداف', defaultSets: 4, defaultReps: '15', defaultWeight: '10 كجم',
    restSeconds: 60, image: IMG.glute2, tip: 'كتفاك على مقعد، ارفعي الأرداف وضغطيها في الأعلى لمدة ثانيتين.',
    tipEn: 'Shoulders on bench, drive hips up and squeeze glutes at the top for 2 seconds.',
    youtubeUrl: 'https://www.youtube.com/watch?v=xDmFkJxPzeM',
    category: 'weights', sessionTypes: ['lower_body', 'full_body'],
  },
  {
    id: 'rdl', nameAr: 'الرفعة الرومانية', nameEn: 'Romanian Deadlift',
    muscleGroup: 'الفخذ الخلفي والأرداف', defaultSets: 3, defaultReps: '12', defaultWeight: '8 كجم لكل يد',
    restSeconds: 75, image: IMG.deadlift, tip: 'انحني للأمام مع ثني خفيف في الركبة، ظهرك مستقيم، حتى تشعري بشد في الفخذ الخلفي.',
    tipEn: 'Hinge forward with slight knee bend, keep back flat until you feel hamstring stretch.',
    youtubeUrl: 'https://www.youtube.com/watch?v=JCXUYuzwNrM',
    category: 'weights', sessionTypes: ['lower_body'],
  },
  {
    id: 'sumo_squat', nameAr: 'سكوات السومو', nameEn: 'Sumo Squat',
    muscleGroup: 'داخل الفخذ والأرداف', defaultSets: 3, defaultReps: '15', defaultWeight: '8 كجم',
    restSeconds: 60, image: IMG.glutes, tip: 'قدماك متباعدتان وأصابعهما للخارج، أمسكي دمبلاً واحداً بكلتي يديك.',
    tipEn: 'Feet wide apart, toes pointing out, hold one dumbbell with both hands.',
    youtubeUrl: 'https://www.youtube.com/watch?v=kjlfpqXnyL8',
    category: 'weights', sessionTypes: ['lower_body'],
  },
  {
    id: 'donkey_kicks', nameAr: 'ركلات الحمار (Donkey Kicks)', nameEn: 'Donkey Kicks',
    muscleGroup: 'الأرداف', defaultSets: 3, defaultReps: '15 لكل رجل', defaultWeight: 'وزن الجسم',
    restSeconds: 45, image: IMG.glute2, tip: 'على الأربع، ارفعي ساقك للخلف وللأعلى مع ضغط الأرداف.',
    tipEn: 'On all fours, kick one leg back and up, squeezing glutes at the top.',
    youtubeUrl: 'https://www.youtube.com/watch?v=SJ1Xuz9D-ZQ',
    category: 'weights', sessionTypes: ['lower_body'],
  },
  {
    id: 'leg_press', nameAr: 'ضغط الساقين (Leg Press)', nameEn: 'Leg Press',
    muscleGroup: 'الفخذين والأرداف', defaultSets: 3, defaultReps: '15', defaultWeight: '30 كجم',
    restSeconds: 75, image: IMG.deadlift, tip: 'قدماك على اللوحة بعرض الكتفين، ادفعي ببطء دون قفل الركبتين.',
    tipEn: 'Feet shoulder-width on platform, push slowly without locking knees.',
    youtubeUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
    category: 'weights', sessionTypes: ['lower_body'],
  },
  {
    id: 'leg_curl', nameAr: 'ثني الساقين (Leg Curl)', nameEn: 'Leg Curl',
    muscleGroup: 'الفخذ الخلفي', defaultSets: 3, defaultReps: '15', defaultWeight: '15 كجم',
    restSeconds: 60, image: IMG.deadlift, tip: 'ابطئي حركة العودة، لا تتركي الوزن يسقط بسرعة.',
    tipEn: 'Slow the return movement, do not let the weight drop quickly.',
    youtubeUrl: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs',
    category: 'weights', sessionTypes: ['lower_body'],
  },
  {
    id: 'leg_ext', nameAr: 'تمديد الساقين (Leg Extension)', nameEn: 'Leg Extension',
    muscleGroup: 'عضلة الفخذ الأمامية', defaultSets: 3, defaultReps: '15', defaultWeight: '15 كجم',
    restSeconds: 60, image: IMG.deadlift, tip: 'مدي الساقين بالكامل واثبتي ثانية في الأعلى.',
    tipEn: 'Extend legs fully and hold for one second at the top.',
    youtubeUrl: 'https://www.youtube.com/watch?v=YyvSfVjQeL0',
    category: 'weights', sessionTypes: ['lower_body'],
  },
  {
    id: 'calf_raises', nameAr: 'رفع السمانة', nameEn: 'Calf Raises',
    muscleGroup: 'عضلة السمانة', defaultSets: 3, defaultReps: '20', defaultWeight: 'وزن الجسم',
    restSeconds: 30, image: IMG.lunges, tip: 'ارتفعي على أصابع قدميك، اثبتي ثانية، انزلي ببطء.',
    tipEn: 'Rise on toes, hold for one second, lower slowly.',
    youtubeUrl: 'https://www.youtube.com/watch?v=baEXLy09Ncc',
    category: 'weights', sessionTypes: ['lower_body', 'full_body'],
  },

  // ── WARM-UP ──
  {
    id: 'warmup_neck_rolls', nameAr: 'دوران الرقبة', nameEn: 'Neck Rolls',
    muscleGroup: 'الرقبة', defaultSets: 1, defaultReps: '10 لكل اتجاه', defaultWeight: 'وزن الجسم',
    restSeconds: 0, image: IMG.warmup, tip: 'ببطء وتحكم، لإرخاء عضلات الرقبة.',
    tipEn: 'Slow and controlled, loosen neck muscles.',
    youtubeUrl: 'https://www.youtube.com/watch?v=2M80Mn0VBPw',
    category: 'cardio', sessionTypes: ['warm_up'],
  },
  {
    id: 'warmup_arm_circles', nameAr: 'دوران الذراعين', nameEn: 'Arm Circles',
    muscleGroup: 'الكتف', defaultSets: 1, defaultReps: '15 للأمام + 15 للخلف', defaultWeight: 'وزن الجسم',
    restSeconds: 0, image: IMG.warmup, tip: 'لتدفئة مفاصل الكتف.',
    tipEn: 'Warm up shoulder joints.',
    youtubeUrl: 'https://www.youtube.com/watch?v=140RTNMciH8',
    category: 'cardio', sessionTypes: ['warm_up'],
  },
  {
    id: 'warmup_hip_circles', nameAr: 'دوران الورك', nameEn: 'Hip Circles',
    muscleGroup: 'الورك', defaultSets: 1, defaultReps: '10 لكل اتجاه', defaultWeight: 'وزن الجسم',
    restSeconds: 0, image: IMG.warmup, tip: 'لإرخاء مفاصل الورك قبل التمرين.',
    tipEn: 'Loosen hip joints before workout.',
    youtubeUrl: 'https://www.youtube.com/watch?v=JYqLwajOGjI',
    category: 'cardio', sessionTypes: ['warm_up'],
  },
  {
    id: 'warmup_leg_swings', nameAr: 'تأرجح الساق', nameEn: 'Leg Swings',
    muscleGroup: 'الورك والفخذ', defaultSets: 1, defaultReps: '15 لكل ساق', defaultWeight: 'وزن الجسم',
    restSeconds: 0, image: IMG.warmup, tip: 'أمسكي الحائط للتوازن، أرجحي الساق للأمام والخلف.',
    tipEn: 'Hold a wall for balance, swing leg forward and back.',
    youtubeUrl: 'https://www.youtube.com/watch?v=naW8u72lOzI',
    category: 'cardio', sessionTypes: ['warm_up'],
  },
  {
    id: 'warmup_jumping_jacks', nameAr: 'القفز النجمي', nameEn: 'Jumping Jacks',
    muscleGroup: 'الجسم كله', defaultSets: 2, defaultReps: '30 ثانية', defaultWeight: 'وزن الجسم',
    restSeconds: 15, image: IMG.warmup, tip: 'لرفع معدل ضربات القلب وتدفئة الجسم كله.',
    tipEn: 'Get heart rate up and warm the whole body.',
    youtubeUrl: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8',
    category: 'cardio', sessionTypes: ['warm_up', 'quick_workouts'],
  },
  {
    id: 'warmup_high_knees', nameAr: 'رفع الركبتين', nameEn: 'High Knees',
    muscleGroup: 'الجسم كله', defaultSets: 2, defaultReps: '30 ثانية', defaultWeight: 'وزن الجسم',
    restSeconds: 15, image: IMG.warmup, tip: 'ارفعي الركبتين إلى مستوى الورك، ابقي خفيفة على قدميك.',
    tipEn: 'Drive knees up to hip height, stay light on feet.',
    youtubeUrl: 'https://www.youtube.com/watch?v=QgClj9UxWcQ',
    category: 'cardio', sessionTypes: ['warm_up', 'quick_workouts'],
  },

  // ── STRETCHING & RECOVERY ──
  {
    id: 'stretch_quad', nameAr: 'إطالة الفخذ الأمامي', nameEn: 'Standing Quad Stretch',
    muscleGroup: 'الفخذ الأمامي', defaultSets: 1, defaultReps: '30 ثانية لكل ساق', defaultWeight: 'وزن الجسم',
    restSeconds: 0, image: IMG.lunges, tip: 'أمسكي الكاحل، قفي منتصبة، أحسي بالشد في مقدمة الفخذ.',
    tipEn: 'Hold ankle, stand tall, feel stretch in front of thigh.',
    youtubeUrl: 'https://www.youtube.com/watch?v=2hKbghN2fUE',
    category: 'cardio', sessionTypes: ['stretching'],
  },
  {
    id: 'stretch_hamstring', nameAr: 'إطالة الفخذ الخلفي', nameEn: 'Seated Hamstring Stretch',
    muscleGroup: 'الفخذ الخلفي', defaultSets: 1, defaultReps: '30 ثانية لكل ساق', defaultWeight: 'وزن الجسم',
    restSeconds: 0, image: IMG.deadlift, tip: 'اجلسي على الأرض، مدي ساقاً واحدة، امتدي نحو القدم.',
    tipEn: 'Sit on floor, extend one leg, reach toward foot.',
    youtubeUrl: 'https://www.youtube.com/watch?v=wr_8aak4Wbc',
    category: 'cardio', sessionTypes: ['stretching'],
  },
  {
    id: 'stretch_hip_flexor', nameAr: 'إطالة عضلة الورك الأمامية', nameEn: 'Hip Flexor Stretch',
    muscleGroup: 'الورك الأمامي', defaultSets: 1, defaultReps: '30 ثانية لكل جهة', defaultWeight: 'وزن الجسم',
    restSeconds: 0, image: IMG.lunges, tip: 'وضعية الطعنة، ادفعي الورك للأمام بلطف.',
    tipEn: 'Lunge position, push hips forward gently.',
    youtubeUrl: 'https://www.youtube.com/watch?v=iZ1eZBY4fwM',
    category: 'cardio', sessionTypes: ['stretching'],
  },
  {
    id: 'stretch_chest', nameAr: 'إطالة الصدر', nameEn: 'Chest Opener Stretch',
    muscleGroup: 'الصدر والكتف', defaultSets: 1, defaultReps: '30 ثانية', defaultWeight: 'وزن الجسم',
    restSeconds: 0, image: IMG.chest, tip: 'شبكي يديك خلف ظهرك، افتحي الصدر للأعلى.',
    tipEn: 'Clasp hands behind back, open chest upward.',
    youtubeUrl: 'https://www.youtube.com/watch?v=M850sCj9LHQ',
    category: 'cardio', sessionTypes: ['stretching'],
  },
  {
    id: 'stretch_shoulder', nameAr: 'إطالة الكتف', nameEn: 'Cross-Body Shoulder Stretch',
    muscleGroup: 'الكتف', defaultSets: 1, defaultReps: '30 ثانية لكل ذراع', defaultWeight: 'وزن الجسم',
    restSeconds: 0, image: IMG.shoulder, tip: 'اسحبي الذراع عبر الصدر، أحسي بالشد في الكتف.',
    tipEn: 'Pull arm across chest, feel stretch in shoulder.',
    youtubeUrl: 'https://www.youtube.com/watch?v=-1K0m5ywRcY',
    category: 'cardio', sessionTypes: ['stretching'],
  },
  {
    id: 'stretch_child_pose', nameAr: 'وضعية الطفل', nameEn: "Child's Pose",
    muscleGroup: 'الظهر والورك', defaultSets: 1, defaultReps: '60 ثانية', defaultWeight: 'وزن الجسم',
    restSeconds: 0, image: IMG.plank, tip: 'اركعي ومدي ذراعيك للأمام، تنفسي بعمق.',
    tipEn: 'Kneel and reach arms forward, breathe deeply.',
    youtubeUrl: 'https://www.youtube.com/watch?v=eqVMAPM00DM',
    category: 'cardio', sessionTypes: ['stretching'],
  },

  // ── HOME WORKOUTS ──
  {
    id: 'home_pushup', nameAr: 'تمرين الضغط', nameEn: 'Push-Up',
    muscleGroup: 'الصدر والترايسبس', defaultSets: 3, defaultReps: '12', defaultWeight: 'وزن الجسم',
    restSeconds: 60, image: IMG.chest, tip: 'أبقي جسمك مستقيماً، انزلي حتى يلمس الصدر الأرض.',
    tipEn: 'Keep body straight, lower chest to floor.',
    youtubeUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    category: 'weights', sessionTypes: ['home_workouts', 'quick_workouts'],
  },
  {
    id: 'home_squat', nameAr: 'سكوات بوزن الجسم', nameEn: 'Bodyweight Squat',
    muscleGroup: 'الأرداف والفخذين', defaultSets: 3, defaultReps: '15', defaultWeight: 'وزن الجسم',
    restSeconds: 45, image: IMG.lunges, tip: 'قدماك بعرض الكتفين، انزلي حتى تتوازى الفخذان.',
    tipEn: 'Feet shoulder-width, lower until thighs parallel.',
    youtubeUrl: 'https://www.youtube.com/watch?v=aclHkVaku9U',
    category: 'weights', sessionTypes: ['home_workouts'],
  },
  {
    id: 'home_lunge', nameAr: 'الطعنة العكسية', nameEn: 'Reverse Lunge',
    muscleGroup: 'الأرداف والفخذين', defaultSets: 3, defaultReps: '12 لكل ساق', defaultWeight: 'وزن الجسم',
    restSeconds: 45, image: IMG.lunges, tip: 'خطوي للخلف، انزلي الركبة نحو الأرض، أبقي الجذع منتصباً.',
    tipEn: 'Step back, lower knee toward floor, keep torso upright.',
    youtubeUrl: 'https://www.youtube.com/watch?v=R-g5yPNYv2k',
    category: 'weights', sessionTypes: ['home_workouts'],
  },
  {
    id: 'home_glute_bridge', nameAr: 'جسر الأرداف', nameEn: 'Glute Bridge',
    muscleGroup: 'الأرداف', defaultSets: 3, defaultReps: '20', defaultWeight: 'وزن الجسم',
    restSeconds: 30, image: IMG.glute2, tip: 'استلقي على ظهرك، ارفعي الورك، اضغطي الأرداف في الأعلى.',
    tipEn: 'Lie on back, drive hips up, squeeze glutes at top.',
    youtubeUrl: 'https://www.youtube.com/watch?v=OUgsJ8-Vi0E',
    category: 'weights', sessionTypes: ['home_workouts'],
  },
  {
    id: 'home_plank', nameAr: 'تمرين البلانك', nameEn: 'Plank Hold',
    muscleGroup: 'الكور', defaultSets: 3, defaultReps: '30 ثانية', defaultWeight: 'وزن الجسم',
    restSeconds: 30, image: IMG.plank, tip: 'خط مستقيم من الرأس إلى الكعب، شدي عضلات الكور.',
    tipEn: 'Straight line from head to heels, engage core.',
    youtubeUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
    category: 'core', sessionTypes: ['home_workouts', 'quick_workouts'],
  },
  {
    id: 'home_mountain_climbers', nameAr: 'تسلق الجبل', nameEn: 'Mountain Climbers',
    muscleGroup: 'الكور والكارديو', defaultSets: 3, defaultReps: '30 ثانية', defaultWeight: 'وزن الجسم',
    restSeconds: 30, image: IMG.abs, tip: 'أحضري الركبتين بالتناوب نحو الصدر، أبقي الورك مستوياً.',
    tipEn: 'Drive knees to chest alternately, keep hips level.',
    youtubeUrl: 'https://www.youtube.com/watch?v=nmwgirgXLYM',
    category: 'core', sessionTypes: ['home_workouts'],
  },

  // ── PILATES ──
  {
    id: 'pilates_hundred', nameAr: 'تمرين المئة (Hundred)', nameEn: 'Pilates Hundred',
    muscleGroup: 'الكور', defaultSets: 1, defaultReps: '100 ضربة', defaultWeight: 'وزن الجسم',
    restSeconds: 30, image: IMG.abs, tip: 'الساقان بزاوية 45°، حركات الذراعين 5 داخل + 5 خارج، تنفس إيقاعي.',
    tipEn: 'Legs at 45°, pump arms 5 in + 5 out, breathe rhythmically.',
    youtubeUrl: 'https://www.youtube.com/watch?v=9mlone4NObI',
    category: 'core', sessionTypes: ['pilates'],
  },
  {
    id: 'pilates_roll_up', nameAr: 'الطرح للأمام (Roll Up)', nameEn: 'Pilates Roll Up',
    muscleGroup: 'الكور والعمود الفقري', defaultSets: 3, defaultReps: '8', defaultWeight: 'وزن الجسم',
    restSeconds: 30, image: IMG.abs, tip: 'قشري العمود الفقري عن الأرض ببطء، تحكمي في النزول.',
    tipEn: 'Peel spine off floor slowly, control the descent.',
    youtubeUrl: 'https://www.youtube.com/watch?v=PGnibcCcAUE',
    category: 'core', sessionTypes: ['pilates'],
  },
  {
    id: 'pilates_single_leg_stretch', nameAr: 'إطالة ساق واحدة', nameEn: 'Single Leg Stretch',
    muscleGroup: 'الكور والفخذ', defaultSets: 3, defaultReps: '10 لكل ساق', defaultWeight: 'وزن الجسم',
    restSeconds: 20, image: IMG.abs, tip: 'بدّلي الساقين، أبقي الكتفين مرفوعتين عن الحصيرة.',
    tipEn: 'Alternate legs, keep shoulders off mat.',
    youtubeUrl: 'https://www.youtube.com/watch?v=Ad4lgW4ieAM',
    category: 'core', sessionTypes: ['pilates'],
  },
  {
    id: 'pilates_double_leg_stretch', nameAr: 'إطالة الساقين معاً', nameEn: 'Double Leg Stretch',
    muscleGroup: 'الكور', defaultSets: 3, defaultReps: '10', defaultWeight: 'وزن الجسم',
    restSeconds: 20, image: IMG.abs, tip: 'شهيق مع المد، زفير مع السحب، أبقي أسفل الظهر مسطحاً.',
    tipEn: 'Inhale extend, exhale pull in, keep lower back flat.',
    youtubeUrl: 'https://www.youtube.com/watch?v=fuwzt4d7FuY',
    category: 'core', sessionTypes: ['pilates'],
  },
  {
    id: 'pilates_spine_stretch', nameAr: 'إطالة العمود الفقري للأمام', nameEn: 'Spine Stretch Forward',
    muscleGroup: 'العمود الفقري والكور', defaultSets: 3, defaultReps: '8', defaultWeight: 'وزن الجسم',
    restSeconds: 20, image: IMG.plank, tip: 'اجلسي منتصبة، امتدي للأمام، اسحبي البطن للداخل.',
    tipEn: 'Sit tall, reach forward, scoop belly in.',
    youtubeUrl: 'https://www.youtube.com/watch?v=140RTNMciH8',
    category: 'core', sessionTypes: ['pilates'],
  },
  {
    id: 'pilates_swan', nameAr: 'وضعية البجعة', nameEn: 'Swan Dive',
    muscleGroup: 'الظهر والكور', defaultSets: 3, defaultReps: '8', defaultWeight: 'وزن الجسم',
    restSeconds: 20, image: IMG.plank, tip: 'استلقي على بطنك، ارفعي الصدر باستخدام عضلات الظهر.',
    tipEn: 'Lie face down, lift chest using back muscles.',
    youtubeUrl: 'https://www.youtube.com/watch?v=lslSedpC23Y',
    category: 'core', sessionTypes: ['pilates'],
  },

  // ── MOBILITY & FLEXIBILITY ──
  {
    id: 'mob_thoracic_rotation', nameAr: 'دوران الصدر', nameEn: 'Thoracic Rotation',
    muscleGroup: 'العمود الفقري الصدري', defaultSets: 2, defaultReps: '10 لكل جهة', defaultWeight: 'وزن الجسم',
    restSeconds: 20, image: IMG.plank, tip: 'على الأربع، أدوري العمود الفقري العلوي، تابعي اليد بعينيك.',
    tipEn: 'On all fours, rotate upper spine, follow hand with eyes.',
    youtubeUrl: 'https://www.youtube.com/watch?v=hhvHpsxKjXw',
    category: 'cardio', sessionTypes: ['mobility'],
  },
  {
    id: 'mob_hip_90_90', nameAr: 'إطالة الورك 90/90', nameEn: 'Hip 90/90 Stretch',
    muscleGroup: 'الورك', defaultSets: 2, defaultReps: '60 ثانية لكل جهة', defaultWeight: 'وزن الجسم',
    restSeconds: 20, image: IMG.glutes, tip: 'اجلسي مع كلتا الساقين بزاوية 90°، انحني فوق الساق الأمامية.',
    tipEn: 'Sit with both legs at 90°, lean over front leg.',
    youtubeUrl: 'https://www.youtube.com/watch?v=t4Zz6-aG8Iw',
    category: 'cardio', sessionTypes: ['mobility'],
  },
  {
    id: 'mob_ankle_circles', nameAr: 'دوران الكاحل', nameEn: 'Ankle Circles',
    muscleGroup: 'الكاحل', defaultSets: 2, defaultReps: '10 لكل اتجاه', defaultWeight: 'وزن الجسم',
    restSeconds: 0, image: IMG.lunges, tip: 'لتحسين مرونة الكاحل والوقاية من الإصابات.',
    tipEn: 'Improve ankle mobility and prevent injury.',
    youtubeUrl: 'https://www.youtube.com/watch?v=mzTQGYGI0Ng',
    category: 'cardio', sessionTypes: ['mobility'],
  },
  {
    id: 'mob_cat_cow', nameAr: 'تمرين القطة والبقرة', nameEn: 'Cat-Cow Stretch',
    muscleGroup: 'العمود الفقري', defaultSets: 2, defaultReps: '10 دورات', defaultWeight: 'وزن الجسم',
    restSeconds: 20, image: IMG.plank, tip: 'شهيق في وضعية البقرة، زفير في وضعية القطة.',
    tipEn: 'Breathe in on cow, breathe out on cat.',
    youtubeUrl: 'https://www.youtube.com/watch?v=kqnua4rHVVA',
    category: 'cardio', sessionTypes: ['mobility'],
  },
  {
    id: 'mob_world_greatest', nameAr: 'أعظم إطالة في العالم', nameEn: "World's Greatest Stretch",
    muscleGroup: 'الجسم كله', defaultSets: 2, defaultReps: '5 لكل جهة', defaultWeight: 'وزن الجسم',
    restSeconds: 20, image: IMG.lunges, tip: 'يجمع إطالة الورك والصدر والفخذ الخلفي.',
    tipEn: 'Combines hip flexor, thoracic, and hamstring stretch.',
    youtubeUrl: 'https://www.youtube.com/watch?v=-CiWQ2IvY34',
    category: 'cardio', sessionTypes: ['mobility'],
  },
  {
    id: 'mob_pigeon_pose', nameAr: 'وضعية الحمامة', nameEn: 'Pigeon Pose',
    muscleGroup: 'الورك والأرداف', defaultSets: 1, defaultReps: '60 ثانية لكل جهة', defaultWeight: 'وزن الجسم',
    restSeconds: 10, image: IMG.glute2, tip: 'فتح عميق للورك، تنفسي واسترخي في الإطالة.',
    tipEn: 'Deep hip opener, breathe and relax into the stretch.',
    youtubeUrl: 'https://www.youtube.com/watch?v=0_zPqA65Nok',
    category: 'cardio', sessionTypes: ['mobility'],
  },

  // ── QUICK WORKOUTS ──
  {
    id: 'quick_burpees', nameAr: 'تمرين البيربي', nameEn: 'Burpees',
    muscleGroup: 'الجسم كله', defaultSets: 3, defaultReps: '10', defaultWeight: 'وزن الجسم',
    restSeconds: 30, image: IMG.warmup, tip: 'حركة انفجارية لكامل الجسم، يمكن التعديل بالخطو بدلاً من القفز.',
    tipEn: 'Full body explosive movement, modify by stepping instead of jumping.',
    youtubeUrl: 'https://www.youtube.com/watch?v=BqWQkblauo8',
    category: 'cardio', sessionTypes: ['quick_workouts'],
  },
  {
    id: 'quick_squat_jumps', nameAr: 'سكوات القفز', nameEn: 'Jump Squats',
    muscleGroup: 'الأرداف والفخذين', defaultSets: 3, defaultReps: '12', defaultWeight: 'وزن الجسم',
    restSeconds: 30, image: IMG.lunges, tip: 'انزلي عميقاً ثم اقفزي للأعلى بقوة، اهبطي بلطف.',
    tipEn: 'Squat deep then explode upward, land softly.',
    youtubeUrl: 'https://www.youtube.com/watch?v=CVaEhXotL7M',
    category: 'cardio', sessionTypes: ['quick_workouts'],
  },
  {
    id: 'quick_pushup', nameAr: 'تمرين الضغط السريع', nameEn: 'Push-Up',
    muscleGroup: 'الصدر والترايسبس', defaultSets: 3, defaultReps: '12', defaultWeight: 'وزن الجسم',
    restSeconds: 30, image: IMG.chest, tip: 'أبقي الكور مشدوداً، نطاق حركة كامل.',
    tipEn: 'Keep core tight, full range of motion.',
    youtubeUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    category: 'weights', sessionTypes: ['quick_workouts'],
  },
  {
    id: 'quick_plank', nameAr: 'بلانك سريع', nameEn: 'Plank Hold',
    muscleGroup: 'الكور', defaultSets: 3, defaultReps: '30 ثانية', defaultWeight: 'وزن الجسم',
    restSeconds: 20, image: IMG.plank, tip: 'خط جسم مستقيم، تنفسي بانتظام.',
    tipEn: 'Straight body line, breathe steadily.',
    youtubeUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
    category: 'core', sessionTypes: ['quick_workouts'],
  },
];
// ── UPPER ARMS & BACK ──
export const upperBodyExercises = [
  {
    id: 'bicep_curl', nameAr: 'ثني البايسبس', nameEn: 'Bicep Curl',
    muscleGroup: 'البايسبس', defaultSets: 3, defaultReps: '12', defaultWeight: '4 كجم لكل يد',
    restSeconds: 45, image: IMG.arms, tip: 'مرفقاك ثابتان بجانب جسمك، لا تتأرجحي.',
    tipEn: 'Keep elbows fixed at your sides, do not swing.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
    category: 'weights', sessionTypes: ['upper_arms', 'full_body'],
  },
  {
    id: 'hammer_curl', nameAr: 'ثني المطرقة (Hammer Curl)', nameEn: 'Hammer Curl',
    muscleGroup: 'البايسبس والساعد', defaultSets: 3, defaultReps: '12', defaultWeight: '4 كجم لكل يد',
    restSeconds: 45, image: IMG.arms, tip: 'الإبهام للأعلى، ارفعي الدمبل بحركة متحكمة.',
    tipEn: 'Thumbs up position, lift dumbbell in a controlled motion.',
    youtubeUrl: 'https://www.youtube.com/watch?v=zC3nLlEvin4',
    category: 'weights', sessionTypes: ['upper_arms'],
  },
  {
      id: 'tricep_ext', nameAr: 'تمديد الترايسبس فوق الرأس', nameEn: 'Tricep Overhead Extension',
    muscleGroup: 'الترايسبس', defaultSets: 3, defaultReps: '12', defaultWeight: '5 كجم',
    restSeconds: 45, image: IMG.arms, tip: 'مرفقاك بجانب رأسك، مدي ذراعيك للأعلى دون تحريك المرفقين.',
    tipEn: 'Elbows beside head, extend arms upward without moving elbows.',
    youtubeUrl: 'https://www.youtube.com/watch?v=YbX7Wd8jQ-Q',
    category: 'weights', sessionTypes: ['upper_arms', 'full_body'],
  },
  {
    id: 'tricep_pushdown', nameAr: 'دفع الترايسبس بالكابل', nameEn: 'Tricep Pushdown',
    muscleGroup: 'الترايسبس', defaultSets: 3, defaultReps: '15', defaultWeight: '10 كجم',
    restSeconds: 45, image: IMG.arms, tip: 'مرفقاك ثابتان، ادفعي للأسفل واثبتي ثانية.',
    tipEn: 'Keep elbows fixed, push down and hold for one second.',
    youtubeUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU',
    category: 'weights', sessionTypes: ['upper_arms'],
  },
  {
    id: 'lat_pulldown', nameAr: 'سحب الكابل للأسفل (Lat Pulldown)', nameEn: 'Lat Pulldown',
    muscleGroup: 'عضلة الظهر العريضة', defaultSets: 3, defaultReps: '12', defaultWeight: '20 كجم',
    restSeconds: 60, image: IMG.lat, tip: 'اسحبي الكابل نحو صدرك، مرفقاك للخارج.',
    tipEn: 'Pull bar to chest, elbows pointing outward and downward.',
    youtubeUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
    category: 'weights', sessionTypes: ['upper_arms', 'full_body'],
  },
  {
    id: 'db_row', nameAr: 'تجديف الدمبل أحادي الذراع', nameEn: 'Dumbbell Row',
    muscleGroup: 'عضلة الظهر', defaultSets: 3, defaultReps: '12 لكل يد', defaultWeight: '8 كجم',
    restSeconds: 60, image: IMG.lat, tip: 'ظهرك موازي للأرض، اسحبي الدمبل نحو خصرك مع ثني المرفق.',
    tipEn: 'Back parallel to floor, pull dumbbell toward hip with elbow bent.',
    youtubeUrl: 'https://www.youtube.com/watch?v=roCP6wCXPqo',
    category: 'weights', sessionTypes: ['upper_arms'],
  },
  {
    id: 'cable_row', nameAr: 'تجديف الكابل الجالس', nameEn: 'Seated Cable Row',
    muscleGroup: 'عضلة الظهر', defaultSets: 3, defaultReps: '12', defaultWeight: '20 كجم',
    restSeconds: 60, image: IMG.lat, tip: 'اسحبي الكابل نحو بطنك مع ثني المرفقين للخلف.',
    tipEn: 'Pull cable toward your abdomen, elbows bending backward.',
    youtubeUrl: 'https://www.youtube.com/watch?v=GZbfZ033f74',
    category: 'weights', sessionTypes: ['upper_arms'],
  },
  {
    id: 'lateral_raise', nameAr: 'الرفرفة الجانبية للأكتاف', nameEn: 'Lateral Raises',
    muscleGroup: 'الأكتاف', defaultSets: 3, defaultReps: '15', defaultWeight: '2 كجم لكل يد',
    restSeconds: 45, image: IMG.shoulder, tip: 'ارفعي ذراعيك للجانب حتى مستوى الكتف فقط.',
    tipEn: 'Raise arms to the side until shoulder height only, slight bend in elbows.',
    youtubeUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
    category: 'weights', sessionTypes: ['upper_arms', 'chest_shoulders'],
  },
  // ── CHEST & SHOULDERS ──
  {
    id: 'chest_press', nameAr: 'ضغط الصدر بالدمبلز', nameEn: 'Dumbbell Chest Press',
    muscleGroup: 'عضلات الصدر', defaultSets: 3, defaultReps: '12', defaultWeight: '5 كجم لكل يد',
    restSeconds: 60, image: IMG.chest, tip: 'استلقي على مقعد، ادفعي الدمبلز للأعلى وأنزليهما ببطء.',
    tipEn: 'Lie on bench, press dumbbells upward and lower them slowly.',
    youtubeUrl: 'https://www.youtube.com/watch?v=VmB1G1K7v94',
    category: 'weights', sessionTypes: ['chest_shoulders', 'full_body'],
  },
  {
    id: 'shoulder_press', nameAr: 'ضغط الأكتاف بالدمبلز', nameEn: 'Dumbbell Shoulder Press',
    muscleGroup: 'الأكتاف', defaultSets: 3, defaultReps: '12', defaultWeight: '4 كجم لكل يد',
    restSeconds: 60, image: IMG.shoulder, tip: 'اجلسي مستقيمة، ارفعي الدمبلز فوق رأسك.',
    tipEn: 'Sit upright, press dumbbells overhead until arms are fully extended.',
    youtubeUrl: 'https://www.youtube.com/watch?v=qEwKCR5JCog',
    category: 'weights', sessionTypes: ['chest_shoulders'],
  },
  {
    id: 'chest_fly', nameAr: 'فتح الصدر بالدمبلز (Flyes)', nameEn: 'Dumbbell Flyes',
    muscleGroup: 'عضلات الصدر', defaultSets: 3, defaultReps: '12', defaultWeight: '4 كجم لكل يد',
    restSeconds: 60, image: IMG.chest, tip: 'ذراعاك ممدودتان للجانب مع ثني خفيف في المرفق، أغلقيهما فوق الصدر.',
    tipEn: 'Arms wide with slight elbow bend, close them above chest in an arc motion.',
    youtubeUrl: 'https://www.youtube.com/watch?v=eozdVDA78K0',
    category: 'weights', sessionTypes: ['chest_shoulders'],
  },
  {
    id: 'tricep_kickback', nameAr: 'ركلة الترايسبس للخلف', nameEn: 'Tricep Kickback',
    muscleGroup: 'الترايسبس', defaultSets: 3, defaultReps: '15 لكل يد', defaultWeight: '3 كجم',
    restSeconds: 45, image: IMG.arms, tip: 'انحني للأمام، مرفقك ثابت، مدي ذراعك للخلف حتى تستقيم.',
    tipEn: 'Lean forward, elbow fixed, extend arm backward until straight.',
    youtubeUrl: 'https://www.youtube.com/watch?v=6SS6K3lAwZ8',
    category: 'weights', sessionTypes: ['chest_shoulders', 'upper_arms'],
  },
  {
    id: 'pushup', nameAr: 'الضغط (على الركبتين)', nameEn: 'Modified Push Up',
    muscleGroup: 'الصدر والترايسبس', defaultSets: 3, defaultReps: '12', defaultWeight: 'وزن الجسم',
    restSeconds: 60, image: IMG.chest, tip: 'على الركبتين، جسمك خط مستقيم، انزلي ببطء وارتفعي ببطء.',
    tipEn: 'On knees, body in straight line, lower slowly and push back up.',
    youtubeUrl: 'https://www.youtube.com/watch?v=jWxvty2KROs',
    category: 'weights', sessionTypes: ['chest_shoulders', 'full_body'],
  },
  // ── CORE ──
  {
    id: 'plank', nameAr: 'البلانك (Plank)', nameEn: 'Plank',
    muscleGroup: 'عضلات البطن الكاملة', defaultSets: 3, defaultReps: '30 ثانية', defaultWeight: 'وزن الجسم',
    restSeconds: 45, image: IMG.plank, tip: 'جسمك خط مستقيم من الرأس للكعب، شدي عضلات البطن طوال الوقت.',
    tipEn: 'Body in straight line from head to heel, engage core throughout.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
    category: 'core', sessionTypes: ['core_cardio', 'full_body'],
  },
  {
    id: 'side_plank', nameAr: 'البلانك الجانبي', nameEn: 'Side Plank',
    muscleGroup: 'عضلات البطن الجانبية', defaultSets: 3, defaultReps: '25 ثانية لكل جهة', defaultWeight: 'وزن الجسم',
    restSeconds: 30, image: IMG.plank, tip: 'جسمك خط مستقيم من الرأس للقدمين، ركزي على شد الخصر.',
    tipEn: 'Body in straight line from head to feet, focus on squeezing the waist.',
    youtubeUrl: 'https://www.youtube.com/watch?v=iNbH7_edNI8',
    category: 'core', sessionTypes: ['core_cardio', 'chest_shoulders'],
  },
  {
    id: 'crunches', nameAr: 'الكرنشز (Crunches)', nameEn: 'Crunches',
    muscleGroup: 'عضلة البطن المستقيمة', defaultSets: 3, defaultReps: '20', defaultWeight: 'وزن الجسم',
    restSeconds: 45, image: IMG.abs, tip: 'ارفعي الكتفين فقط عن الأرض، لا ترفعي الظهر بالكامل.',
    tipEn: 'Lift shoulders only off the ground, do not pull on your neck.',
    youtubeUrl: 'https://www.youtube.com/watch?v=Xyd_fa5zoEU',
    category: 'core', sessionTypes: ['core_cardio'],
  },
  {
    id: 'bicycle_crunches', nameAr: 'كرنشز الدراجة', nameEn: 'Bicycle Crunches',
    muscleGroup: 'عضلات البطن الجانبية', defaultSets: 3, defaultReps: '20 لكل جهة', defaultWeight: 'وزن الجسم',
    restSeconds: 45, image: IMG.abs, tip: 'دوري الجذع العلوي فقط، مرفقك الأيمن نحو ركبتك اليسرى والعكس.',
    tipEn: 'Rotate upper torso only, right elbow toward left knee and vice versa.',
    youtubeUrl: 'https://www.youtube.com/watch?v=9FGilxCbdz8',
    category: 'core', sessionTypes: ['core_cardio'],
  },
  {
    id: 'leg_raises', nameAr: 'رفع الساقين', nameEn: 'Leg Raises',
    muscleGroup: 'عضلات البطن السفلية', defaultSets: 3, defaultReps: '15', defaultWeight: 'وزن الجسم',
    restSeconds: 45, image: IMG.abs, tip: 'ارفعي الساقين المستقيمتين للأعلى ببطء، انزليهما ببطء دون أن تلمسا الأرض.',
    tipEn: 'Raise straight legs slowly upward, lower slowly without touching the floor.',
    youtubeUrl: 'https://www.youtube.com/watch?v=l4kQd9eWclE',
    category: 'core', sessionTypes: ['core_cardio'],
  },
  {
    id: 'russian_twist', nameAr: 'الدوران الروسي', nameEn: 'Russian Twists',
    muscleGroup: 'عضلات البطن الجانبية', defaultSets: 3, defaultReps: '20 لكل جهة', defaultWeight: '2 كجم',
    restSeconds: 45, image: IMG.absGlutes, tip: 'اجلسي بزاوية 45 درجة، ارفعي قدميك قليلاً، دوري الجذع يميناً ويساراً.',
    tipEn: 'Sit at 45 degrees, lift feet slightly, rotate torso side to side.',
    youtubeUrl: 'https://www.youtube.com/watch?v=wkD8rjkodUI',
    category: 'core', sessionTypes: ['core_cardio'],
  },
  {
    id: 'mountain_climbers', nameAr: 'تسلق الجبل (Mountain Climbers)', nameEn: 'Mountain Climbers',
    muscleGroup: 'البطن والكور والكارديو', defaultSets: 3, defaultReps: '30 ثانية', defaultWeight: 'وزن الجسم',
    restSeconds: 45, image: IMG.plank, tip: 'في وضع البلانك، جيبي ركبتيك نحو صدرك بالتناوب بسرعة.',
    tipEn: 'In plank position, drive knees toward chest alternately at speed.',
    youtubeUrl: 'https://www.youtube.com/watch?v=nmwgirgXLYM',
    category: 'core', sessionTypes: ['core_cardio'],
  },
  {
    id: 'flutter_kicks', nameAr: 'الركلات الرفرفة (Flutter Kicks)', nameEn: 'Flutter Kicks',
    muscleGroup: 'البطن السفلي', defaultSets: 3, defaultReps: '30 ثانية', defaultWeight: 'وزن الجسم',
    restSeconds: 45, image: IMG.abs, tip: 'استلقي على ظهرك، ارفعي ساقيك قليلاً وحركيهما للأعلى والأسفل بالتناوب.',
    tipEn: 'Lie on back, lift legs slightly and move them up and down alternately.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ZB1SwBRVLCc',
    category: 'core', sessionTypes: ['core_cardio'],
  },
  // ── CARDIO MACHINES ──
  {
    id: 'rowing_machine', nameAr: 'جهاز التجديف (Rower)', nameEn: 'Rowing Machine',
    muscleGroup: 'الجسم كله — ظهر، أكتاف، ذراعين، أرداف', defaultSets: 1, defaultReps: '15 دقيقة', defaultWeight: '—',
    restSeconds: 0, image: IMG.rower,
    tip: 'التجديف يعمل على 86% من عضلات الجسم — مثالي للإحماء الشامل. ابدئي بـ 10–15 دقيقة بإيقاع منتظم.',
    tipEn: 'Rowing engages 86% of body muscles — ideal for full warm-up. Start with 10–15 min at steady pace.',
    youtubeUrl: 'https://www.youtube.com/watch?v=J1nf2Zfbazs',
    category: 'cardio', sessionTypes: ['active_rest', 'core_cardio', 'full_body', 'lower_body', 'upper_arms', 'chest_shoulders'],
  },
];

// ===== CARDIO TEMPLATES =====
export const cardioTemplates: CardioTemplate[] = [
  {
    id: 'treadmill', nameAr: 'جهاز المشي (Treadmill)', nameEn: 'Treadmill', machine: 'Treadmill',
    defaultDuration: 20, defaultSpeed: '5.5', defaultIncline: '3',
    speedLabel: 'السرعة (كم/ساعة)', inclineLabel: 'الانحدار (%)',
    showCalories: true, showDistance: true,
    image: IMG.treadmill, tip: 'المشي بانحدار يزيد من حرق الدهون في الأرداف والفخذين.',
    tipEn: 'Walking on incline burns more fat in glutes and thighs.',
    sessionTypes: ['lower_body', 'full_body', 'core_cardio'],
  },
  {
    id: 'elliptical', nameAr: 'جهاز الأوربتراك (Elliptical)', nameEn: 'Elliptical', machine: 'Elliptical',
    defaultDuration: 20, defaultSpeed: '5', defaultIncline: '3',
    speedLabel: 'المقاومة (Level)', inclineLabel: 'الانحدار (Level)',
    showCalories: true, showDistance: false,
    image: IMG.elliptical, tip: 'يعمل على الجسم بالكامل بدون ضغط على المفاصل.',
    tipEn: 'Works the whole body without joint stress.',
    sessionTypes: ['upper_arms', 'chest_shoulders', 'full_body'],
  },
  {
    id: 'bike', nameAr: 'الدراجة الثابتة (Stationary Bike)', nameEn: 'Stationary Bike', machine: 'Stationary Bike',
    defaultDuration: 30, defaultSpeed: '8', defaultIncline: '4',
    speedLabel: 'المقاومة (Level)', inclineLabel: 'Level متقطع',
    showCalories: true, showDistance: false,
    image: IMG.cardio, tip: 'الكارديو المتقطع يحرق دهون البطن أسرع بكثير.',
    tipEn: 'Interval cardio burns belly fat much faster.',
    sessionTypes: ['core_cardio'],
  },
  {
    id: 'rower', nameAr: 'جهاز التجديف (Rower)', nameEn: 'Rowing Machine', machine: 'Rowing Machine',
    defaultDuration: 15, defaultSpeed: '24', defaultIncline: '5',
    speedLabel: 'سرعة الجذب (SPM)', inclineLabel: 'مستوى المقاومة',
    showCalories: true, showDistance: true,
    image: IMG.rower, tip: 'التجديف يعمل على 86% من عضلات الجسم — مثالي للإحماء الشامل.',
    tipEn: 'Rowing engages 86% of body muscles — ideal for full-body warm-up.',
    sessionTypes: ['active_rest', 'lower_body', 'upper_arms', 'chest_shoulders', 'full_body', 'core_cardio'],
  },
  {
    id: 'precor_bike', nameAr: 'دراجة Precor (Precor Bike)', nameEn: 'Precor Bike', machine: 'Precor Bike',
    defaultDuration: 20, defaultSpeed: '80', defaultIncline: '8',
    speedLabel: 'السرعة (RPM)', inclineLabel: 'مستوى المقاومة',
    showCalories: true, showDistance: false,
    image: IMG.elliptical, tip: 'الدراجة الثابتة تحرق دهون الفخذين والأرداف بدون ضغط على الركبتين.',
    tipEn: 'Stationary bike burns thigh and glute fat without knee stress.',
    sessionTypes: ['active_rest', 'lower_body', 'core_cardio'],
  },
  {
    id: 'climbmill', nameAr: 'جهاز الدرج (Climbmill)', nameEn: 'Climbmill / StairMaster', machine: 'Climbmill',
    defaultDuration: 20, defaultSpeed: '60', defaultIncline: '0',
    speedLabel: 'السرعة (خطوة/دقيقة)', inclineLabel: 'المستوى',
    showCalories: true, showDistance: false,
    image: IMG.glutes, tip: 'جهاز الدرج يستهدف الأرداف والفخذين بشكل مكثف — من أفضل أجهزة حرق الدهون.',
    tipEn: 'Climbmill intensely targets glutes and thighs — one of the best fat-burning machines.',
    sessionTypes: ['active_rest', 'lower_body', 'full_body'],
  },
];

// ===== SESSION TYPE DEFINITIONS =====
export const sessionTypes: Record<SessionType, {
  nameAr: string;
  nameEn: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  descriptionEn?: string;
  defaultExercises: string[];
  defaultCardio?: string;
}> = {
  lower_body: {
    nameAr: 'الجزء السفلي - الأرداف والفخذين',
    nameEn: 'Lower Body — Glutes & Thighs',
    icon: '🦵', color: '#E05A00', bgColor: '#FFF0E8',
    description: 'تركيز على الأرداف والفخذين وحرق دهون الأرداف',
    descriptionEn: 'Focus on glutes, thighs, and lower body fat burn',
    defaultExercises: ['squat_db', 'lunge_db', 'hip_thrust', 'rdl', 'leg_press', 'donkey_kicks', 'calf_raises'],
    defaultCardio: 'treadmill',
  },
  upper_arms: {
    nameAr: 'الجزء العلوي - الذراعان والظهر',
    nameEn: 'Upper Body — Arms & Back',
    icon: '💪', color: '#7C3AED', bgColor: '#F0E8FF',
    description: 'تركيز على الذراعين والظهر وحرق دهون اليدين',
    descriptionEn: 'Focus on arms, back definition, and upper body strength',
    defaultExercises: ['bicep_curl', 'tricep_ext', 'lat_pulldown', 'db_row', 'hammer_curl', 'tricep_pushdown'],
    defaultCardio: 'elliptical',
  },
  core_cardio: {
    nameAr: 'البطن والكور + كارديو مكثف',
    nameEn: 'Core & Cardio',
    icon: '🔥', color: '#DC2626', bgColor: '#FFE8E8',
    description: 'تركيز على حرق دهون البطن وتقوية عضلات الكور',
    descriptionEn: 'Burn belly fat and strengthen core muscles',
    defaultExercises: ['plank', 'crunches', 'bicycle_crunches', 'leg_raises', 'russian_twist', 'mountain_climbers'],
    defaultCardio: 'bike',
  },
  chest_shoulders: {
    nameAr: 'الصدر والأكتاف',
    nameEn: 'Chest & Shoulders',
    icon: '🏅', color: '#2563EB', bgColor: '#E8F0FF',
    description: 'تقوية الصدر والأكتاف وتحسين القوام',
    descriptionEn: 'Strengthen chest and shoulders, improve posture',
    defaultExercises: ['chest_press', 'shoulder_press', 'lateral_raise', 'chest_fly', 'tricep_kickback', 'side_plank'],
    defaultCardio: 'elliptical',
  },
  full_body: {
    nameAr: 'الجسم الكامل',
    nameEn: 'Full Body',
    icon: '⚡', color: '#059669', bgColor: '#E8F5EE',
    description: 'تمارين مركبة تعمل على الجسم كاملاً',
    descriptionEn: 'Compound movements targeting the entire body',
    defaultExercises: ['squat_db', 'chest_press', 'lat_pulldown', 'hip_thrust', 'plank', 'bicep_curl', 'tricep_ext'],
    defaultCardio: 'treadmill',
  },
  aqua: {
    nameAr: 'كلاس الأكوا (Aqua Aerobics)',
    nameEn: 'Aqua Aerobics Class',
    icon: '🏊‍♀️', color: '#0891B2', bgColor: '#E0F7FA',
    description: 'تمارين مائية لحرق الدهون بدون ضغط على المفاصل',
    descriptionEn: 'Water-based exercises for fat burn without joint stress',
    defaultExercises: [],
    defaultCardio: undefined,
  },
  sauna: {
    nameAr: 'جلسة السونا',
    nameEn: 'Sauna Session',
    icon: '🧖‍♀️', color: '#B45309', bgColor: '#FEF3C7',
    description: 'جلسة سونا للتعافي وحرق السعرات وإزالة السموم',
    descriptionEn: 'Sauna session for recovery, calorie burn, and detox',
    defaultExercises: [],
    defaultCardio: undefined,
  },
  active_rest: {
    nameAr: "تمارين الكارديو",
    nameEn: 'Cardio',
    icon: '🏃', color: '#1B2E5E', bgColor: '#EEF4FF',
    description: 'تمارين الكارديو والإحماء',
    descriptionEn: 'Cardio and endurance training sessions',
    defaultExercises: [],
    defaultCardio: 'treadmill',
  },
  warm_up: {
    nameAr: 'الإحماء الديناميكي',
    nameEn: 'Warm-Up',
    icon: '🔥', color: '#EA580C', bgColor: '#FFF7ED',
    description: 'تمارين إحماء ديناميكية قبل التمرين',
    descriptionEn: 'Dynamic warm-up exercises before workouts',
    defaultExercises: ['warmup_neck_rolls', 'warmup_arm_circles', 'warmup_hip_circles', 'warmup_leg_swings', 'warmup_jumping_jacks', 'warmup_high_knees'],
    defaultCardio: undefined,
  },
  stretching: {
    nameAr: 'الإطالة والتعافي',
    nameEn: 'Stretching & Recovery',
    icon: '🧘', color: '#0D9488', bgColor: '#F0FDFA',
    description: 'تمارين إطالة وتعافي بعد التمرين',
    descriptionEn: 'Post-workout stretching and recovery sessions',
    defaultExercises: ['stretch_quad', 'stretch_hamstring', 'stretch_hip_flexor', 'stretch_chest', 'stretch_shoulder', 'stretch_child_pose'],
    defaultCardio: undefined,
  },
  home_workouts: {
    nameAr: 'تمارين المنزل',
    nameEn: 'Home Workouts',
    icon: '🏠', color: '#7C3AED', bgColor: '#F5F3FF',
    description: 'تمارين بدون معدات يمكن أداؤها في المنزل',
    descriptionEn: 'No-equipment workouts you can do at home',
    defaultExercises: ['home_pushup', 'home_squat', 'home_lunge', 'home_glute_bridge', 'home_plank', 'home_mountain_climbers'],
    defaultCardio: undefined,
  },
  pilates: {
    nameAr: 'البيلاتس',
    nameEn: 'Pilates',
    icon: '🤸', color: '#DB2777', bgColor: '#FDF2F8',
    description: 'تمارين البيلاتس للمرونة وقوة الكور',
    descriptionEn: 'Pilates exercises for flexibility and core strength',
    defaultExercises: ['pilates_hundred', 'pilates_roll_up', 'pilates_single_leg_stretch', 'pilates_double_leg_stretch', 'pilates_spine_stretch', 'pilates_swan'],
    defaultCardio: undefined,
  },
  mobility: {
    nameAr: 'الحركة والمرونة',
    nameEn: 'Mobility & Flexibility',
    icon: '🦵', color: '#2563EB', bgColor: '#EFF6FF',
    description: 'روتين الحركة وتحسين المرونة',
    descriptionEn: 'Mobility routines and flexibility improvement',
    defaultExercises: ['mob_thoracic_rotation', 'mob_hip_90_90', 'mob_ankle_circles', 'mob_cat_cow', 'mob_world_greatest', 'mob_pigeon_pose'],
    defaultCardio: undefined,
  },
  quick_workouts: {
    nameAr: 'تمارين سريعة',
    nameEn: 'Quick Workouts',
    icon: '⚡', color: '#CA8A04', bgColor: '#FEFCE8',
    description: 'جلسات تمرين سريعة من 5 إلى 10 دقائق',
    descriptionEn: 'Fast 5-10 minute workout sessions',
    defaultExercises: ['quick_burpees', 'quick_jumping_jacks', 'quick_high_knees', 'quick_squat_jumps', 'quick_pushup', 'quick_plank'],
    defaultCardio: undefined,
  },
};

// ===== AQUA CLASS EXERCISES =====
export const aquaExercises = [
  { nameAr: 'المشي في الماء', nameEn: 'Water Walking', duration: '5 دقائق', tip: 'ابدئي بالمشي للإحماء' },
  { nameAr: 'القفز في الماء (Aqua Jumping Jacks)', nameEn: 'Aqua Jumping Jacks', duration: '3 × دقيقة', tip: 'افتحي ذراعيك وساقيك معاً' },
  { nameAr: 'ركل الماء للأمام (Flutter Kicks)', nameEn: 'Flutter Kicks', duration: '3 × دقيقة', tip: 'أمسكي حافة المسبح وركلي بسرعة' },
  { nameAr: 'تمرين الدمبل المائي (Water Dumbbell Curls)', nameEn: 'Water Dumbbell Curls', duration: '3 × 15 تكرار', tip: 'استخدمي الدمبل المائي لمقاومة الماء' },
  { nameAr: 'الركض في الماء (Aqua Jogging)', nameEn: 'Aqua Jogging', duration: '5 دقائق', tip: 'الماء يقاوم حركتك ويزيد من حرق السعرات' },
  { nameAr: 'تمرين الأرداف في الماء (Aqua Squats)', nameEn: 'Aqua Squats', duration: '3 × 15 تكرار', tip: 'السكوات في الماء أقل ضغطاً على الركبتين' },
  { nameAr: 'تمرين الجانبين (Side Kicks)', nameEn: 'Side Kicks', duration: '3 × 12 لكل جهة', tip: 'ارفعي ساقك للجانب ضد مقاومة الماء' },
  { nameAr: 'التمدد والإطالة المائية', nameEn: 'Aqua Stretching', duration: '5 دقائق', tip: 'الماء يساعد على مرونة أفضل' },
];

// ===== SAUNA PROTOCOL =====
export const saunaProtocol = [
  { phase: 'الجلسة الأولى', duration: '10 دقائق', temp: '70-80°C', tip: 'ادخلي وأنتِ مرتاحة، لا تدخلي مباشرة بعد تمرين مكثف' },
  { phase: 'استراحة خارجية', duration: '5 دقائق', temp: 'درجة حرارة الغرفة', tip: 'اشربي ماءً واستريحي خارج السونا' },
  { phase: 'الجلسة الثانية', duration: '10 دقائق', temp: '75-85°C', tip: 'يمكنك رفع الحرارة قليلاً في الجلسة الثانية' },
  { phase: 'تبريد', duration: '3-5 دقائق', temp: 'ماء بارد أو درجة حرارة معتدلة', tip: 'دش بارد أو بارد معتدل لإغلاق المسام' },
  { phase: 'راحة نهائية', duration: '10 دقائق', temp: 'درجة حرارة الغرفة', tip: 'اشربي 500 مل ماء على الأقل واستريحي' },
];
