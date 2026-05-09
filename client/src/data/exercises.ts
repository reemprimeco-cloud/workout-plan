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
  | 'active_rest';

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
    youtubeUrl: 'https://www.youtube.com/watch?v=qJwFMBFDFSg',
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
    youtubeUrl: 'https://www.youtube.com/watch?v=-M4-G8p1fCI',
    category: 'weights', sessionTypes: ['lower_body', 'full_body'],
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
    youtubeUrl: 'https://www.youtube.com/watch?v=_6vjo5yFo1U',
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
    sessionTypes: ['lower_body', 'upper_arms', 'chest_shoulders', 'full_body', 'core_cardio'],
  },
];

// ===== SESSION TYPE DEFINITIONS =====
export const sessionTypes: Record<SessionType, {
  nameAr: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  defaultExercises: string[];
  defaultCardio?: string;
}> = {
  lower_body: {
    nameAr: 'الجزء السفلي - الأرداف والفخذين',
    icon: '🦵', color: '#E05A00', bgColor: '#FFF0E8',
    description: 'تركيز على الأرداف والفخذين وحرق دهون الأرداف',
    defaultExercises: ['squat_db', 'lunge_db', 'hip_thrust', 'rdl', 'leg_press', 'donkey_kicks', 'calf_raises'],
    defaultCardio: 'treadmill',
  },
  upper_arms: {
    nameAr: 'الجزء العلوي - الذراعان والظهر',
    icon: '💪', color: '#7C3AED', bgColor: '#F0E8FF',
    description: 'تركيز على الذراعين والظهر وحرق دهون اليدين',
    defaultExercises: ['bicep_curl', 'tricep_ext', 'lat_pulldown', 'db_row', 'hammer_curl', 'tricep_pushdown'],
    defaultCardio: 'elliptical',
  },
  core_cardio: {
    nameAr: 'البطن والكور + كارديو مكثف',
    icon: '🔥', color: '#DC2626', bgColor: '#FFE8E8',
    description: 'تركيز على حرق دهون البطن وتقوية عضلات الكور',
    defaultExercises: ['plank', 'crunches', 'bicycle_crunches', 'leg_raises', 'russian_twist', 'mountain_climbers'],
    defaultCardio: 'bike',
  },
  chest_shoulders: {
    nameAr: 'الصدر والأكتاف',
    icon: '🏅', color: '#2563EB', bgColor: '#E8F0FF',
    description: 'تقوية الصدر والأكتاف وتحسين القوام',
    defaultExercises: ['chest_press', 'shoulder_press', 'lateral_raise', 'chest_fly', 'tricep_kickback', 'side_plank'],
    defaultCardio: 'elliptical',
  },
  full_body: {
    nameAr: 'الجسم الكامل',
    icon: '⚡', color: '#059669', bgColor: '#E8F5EE',
    description: 'تمارين مركبة تعمل على الجسم كاملاً',
    defaultExercises: ['squat_db', 'chest_press', 'lat_pulldown', 'hip_thrust', 'plank', 'bicep_curl', 'tricep_ext'],
    defaultCardio: 'treadmill',
  },
  aqua: {
    nameAr: 'كلاس الأكوا (Aqua Aerobics)',
    icon: '🏊‍♀️', color: '#0891B2', bgColor: '#E0F7FA',
    description: 'تمارين مائية لحرق الدهون بدون ضغط على المفاصل',
    defaultExercises: [],
    defaultCardio: undefined,
  },
  sauna: {
    nameAr: 'جلسة السونا',
    icon: '🧖‍♀️', color: '#B45309', bgColor: '#FEF3C7',
    description: 'جلسة سونا للتعافي وحرق السعرات وإزالة السموم',
    defaultExercises: [],
    defaultCardio: undefined,
  },
  active_rest: {
    nameAr: 'راحة نشطة - مشي خفيف',
    icon: '🚶‍♀️', color: '#1A7A4A', bgColor: '#E8F5EE',
    description: 'مشي خفيف أو يوجا للتعافي',
    defaultExercises: [],
    defaultCardio: 'treadmill',
  },
};

// ===== AQUA CLASS EXERCISES =====
export const aquaExercises = [
  { nameAr: 'المشي في الماء', duration: '5 دقائق', tip: 'ابدئي بالمشي للإحماء' },
  { nameAr: 'القفز في الماء (Aqua Jumping Jacks)', duration: '3 × دقيقة', tip: 'افتحي ذراعيك وساقيك معاً' },
  { nameAr: 'ركل الماء للأمام (Flutter Kicks)', duration: '3 × دقيقة', tip: 'أمسكي حافة المسبح وركلي بسرعة' },
  { nameAr: 'تمرين الدمبل المائي (Water Dumbbell Curls)', duration: '3 × 15 تكرار', tip: 'استخدمي الدمبل المائي لمقاومة الماء' },
  { nameAr: 'الركض في الماء (Aqua Jogging)', duration: '5 دقائق', tip: 'الماء يقاوم حركتك ويزيد من حرق السعرات' },
  { nameAr: 'تمرين الأرداف في الماء (Aqua Squats)', duration: '3 × 15 تكرار', tip: 'السكوات في الماء أقل ضغطاً على الركبتين' },
  { nameAr: 'تمرين الجانبين (Side Kicks)', duration: '3 × 12 لكل جهة', tip: 'ارفعي ساقك للجانب ضد مقاومة الماء' },
  { nameAr: 'التمدد والإطالة المائية', duration: '5 دقائق', tip: 'الماء يساعد على مرونة أفضل' },
];

// ===== SAUNA PROTOCOL =====
export const saunaProtocol = [
  { phase: 'الجلسة الأولى', duration: '10 دقائق', temp: '70-80°C', tip: 'ادخلي وأنتِ مرتاحة، لا تدخلي مباشرة بعد تمرين مكثف' },
  { phase: 'استراحة خارجية', duration: '5 دقائق', temp: 'درجة حرارة الغرفة', tip: 'اشربي ماءً واستريحي خارج السونا' },
  { phase: 'الجلسة الثانية', duration: '10 دقائق', temp: '75-85°C', tip: 'يمكنك رفع الحرارة قليلاً في الجلسة الثانية' },
  { phase: 'تبريد', duration: '3-5 دقائق', temp: 'ماء بارد أو درجة حرارة معتدلة', tip: 'دش بارد أو بارد معتدل لإغلاق المسام' },
  { phase: 'راحة نهائية', duration: '10 دقائق', temp: 'درجة حرارة الغرفة', tip: 'اشربي 500 مل ماء على الأقل واستريحي' },
];
