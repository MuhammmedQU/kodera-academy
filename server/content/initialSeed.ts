import type {
  AdminQuiz,
  Course,
  LessonContentBlock,
  LessonItem,
  ModuleItem,
  PublicExercise,
} from '../../src/shared/types/domain.js';
import { buildPythonModule1, PY_M1_IDS } from './pythonModule1.js';
import { buildPythonModule2, PY_M2_IDS } from './pythonModule2.js';

export interface SeedExercise extends PublicExercise {
  solution_code: string;
}

export interface InitialSeedContent {
  courses: Course[];
  modules: ModuleItem[];
  lessons: LessonItem[];
  blocks: LessonContentBlock[];
  exercises: SeedExercise[];
  quizzes: AdminQuiz[];
}

export const SEED_IDS = {
  COURSE_PYTHON: '10000000-0000-4000-8000-000000000001',
  COURSE_SQL: '10000000-0000-4000-8000-000000000002',

  MOD_PY_1: PY_M1_IDS.MOD_1,
  MOD_PY_2: PY_M2_IDS.MOD_2,
  MOD_PY_3: '20000000-0000-4000-8000-000000000003',
  MOD_SQL_1: '20000000-0000-4000-8000-000000000004',

  LES_PY_1_1: PY_M1_IDS.LES_1_1,
  LES_PY_1_2: PY_M1_IDS.LES_1_2,
  LES_PY_2_1: PY_M2_IDS.LES_2_1,
  LES_PY_2_4: PY_M2_IDS.LES_2_4,
  LES_PY_3_1: '30000000-0000-4000-8000-000000000009',
  LES_SQL_1_1: '30000000-0000-4000-8000-000000000010',

  EX_PY_1_2: PY_M1_IDS.EX_1_2,
  QUIZ_PY_1_2: PY_M1_IDS.QUIZ_1_2,
  Q_PY_1_2_1: PY_M1_IDS.Q_1_2_1,
  OPT_PY_1_2_1A: PY_M1_IDS.OPT_1_2_1A,
  OPT_PY_1_2_1B: PY_M1_IDS.OPT_1_2_1B,
} as const;

const NOW = '2026-11-24T00:00:00.000Z';

export function buildInitialSeedContent(): InitialSeedContent {
  const m1 = buildPythonModule1();
  const m2 = buildPythonModule2();

  const courses: Course[] = [
    {
      id: SEED_IDS.COURSE_PYTHON,
      slug: 'python-esaslari',
      locale: 'az',
      title: 'Python Proqramlaşdırma — Sıfırdan Başlanğıc',
      subtitle: 'Proqramlaşdırmaya heç vaxt başlamayanlar üçün sadə, praktik və ardıcıl Python kursu',
      description:
        'Bu kurs proqramlaşdırma təcrübəsi olmayan tələbələr üçün hazırlanıb. İlk iki modul tamamilə pulsuzdur: əsas anlayışları, dəyişənləri, məlumat növlərini, istifadəçi ilə dialoqu və şərtləri real məşqlərlə özünüz yazaraq öyrənəcəksiniz.',
      learning_objectives: [
        'Proqramlaşdırma düşüncə tərzini sıfırdan, heç bir texniki jarqona boğulmadan qazanmaq',
        'Python sintaksisi, dəyişənlər, məlumat növləri, input() və if/elif/else şərtləri ilə sərbəst işləmək',
        'Brauzerdə izolyasiya olunmuş mühitdə real kod yazıb avtomatik testlərlə yoxlamaq',
        'Dövrlər, siyahılar, funksiyalar və praktiki mini-layihələrlə möhkəm təməl qurmaq',
      ],
      target_audience: 'Məktəblilər, tələbələr və proqramlaşdırmaya sıfırdan başlamaq istəyən hər kəs.',
      programming_language: 'python',
      difficulty: 'beginner',
      estimated_duration_minutes: 600,
      cover_image_path: null,
      sort_order: 1,
      status: 'published',
      is_published: true,
      published_at: NOW,
      archived_at: null,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: SEED_IDS.COURSE_SQL,
      slug: 'sql-verilenler-bazasi',
      locale: 'az',
      title: 'SQL və Verilənlər Bazası Əsasları',
      subtitle: 'Real layihələrdə məlumatları sorğulamaq, filtrləmək və analiz etmək',
      description:
        'SQL vasitəsilə cədvəllər, əlaqələr, SELECT/JOIN/GROUP BY sorğuları və verilənlər bazası məntiqini praktik tapşırıqlarla öyrənin.',
      learning_objectives: [
        'Relasiyalı verilənlər bazalarının necə işlədiyini anlamaq',
        'SELECT, WHERE, ORDER BY, JOIN və aqreqat sorğular yazmaq',
      ],
      target_audience: 'Backend, Data Analytics və proqramlaşdırma öyrənənlər.',
      programming_language: 'sql',
      difficulty: 'beginner',
      estimated_duration_minutes: 420,
      cover_image_path: null,
      sort_order: 2,
      status: 'published',
      is_published: true,
      published_at: NOW,
      archived_at: null,
      created_at: NOW,
      updated_at: NOW,
    },
  ];

  const modules: ModuleItem[] = [
    {
      id: SEED_IDS.MOD_PY_1,
      course_id: SEED_IDS.COURSE_PYTHON,
      slug: 'modul-1-proqramlasdirmaya-ilk-addim',
      title: 'Modul 1: Proqramlaşdırmaya İlk Addım',
      description:
        'Kompüterin təlimatları necə başa düşdüyü, ilk Python kodu (print), dəyişənlər və əsas məlumat növləri (str, int, float).',
      sort_order: 1,
      is_public: true,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: SEED_IDS.MOD_PY_2,
      course_id: SEED_IDS.COURSE_PYTHON,
      slug: 'modul-2-proqramin-dusunmesi-ve-unsiyyet',
      title: 'Modul 2: Proqramın Düşünməsi və İstifadəçi ilə Ünsiyyət',
      description:
        'İstifadəçidən məlumat almaq (input), hesablamalar, if/elif/else şərtləri və ilk tam mini-layihə.',
      sort_order: 2,
      is_public: true,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: SEED_IDS.MOD_PY_3,
      course_id: SEED_IDS.COURSE_PYTHON,
      slug: 'modul-3-dovrler-ve-tekrarlanan-emeliyyatlar',
      title: 'Modul 3: Dövrlər (for və while) ilə Təkrarlanan Əməliyyatlar',
      description:
        'Kod təkrarından qurtulmaq, for və while dövrləri ilə real məsələləri avtomatlaşdırmaq.',
      sort_order: 3,
      is_public: false,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: SEED_IDS.MOD_SQL_1,
      course_id: SEED_IDS.COURSE_SQL,
      slug: 'modul-1-sql-giris',
      title: 'Modul 1: SQL-ə Giriş və İlk Sorğular',
      description: 'Cədvəllər, sətirlər, sütunlar və ilk SELECT sorğusu.',
      sort_order: 1,
      is_public: false,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
  ];

  const restrictedLessons: LessonItem[] = [
    {
      id: SEED_IDS.LES_PY_3_1,
      module_id: SEED_IDS.MOD_PY_3,
      slug: 'for-dovru-giris',
      title: '3.1 for dövrü ilə təkrarlanan işləri avtomatlaşdırmaq',
      summary: 'Yalnız təsdiqlənmiş və Python kursu təyin olunmuş tələbələr üçün məhdud dərs.',
      estimated_minutes: 15,
      sort_order: 1,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: SEED_IDS.LES_SQL_1_1,
      module_id: SEED_IDS.MOD_SQL_1,
      slug: 'select-sorgusu',
      title: '1.1 SELECT sorğusu ilə məlumat oxumaq',
      summary: 'Yalnız SQL kursu təyin olunmuş tələbələr üçün məhdud dərs.',
      estimated_minutes: 12,
      sort_order: 1,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
  ];

  const restrictedBlocks: LessonContentBlock[] = [
    {
      id: '63000000-0000-4000-8000-000000000001',
      lesson_id: SEED_IDS.LES_PY_3_1,
      locale: 'az',
      block_type: 'heading',
      sort_order: 1,
      title: null,
      content: { level: 2, text: 'for dövrü niyə lazımdır?' },
      exercise_id: null,
      quiz_id: null,
      is_published: true,
    },
    {
      id: '63000000-0000-4000-8000-000000000002',
      lesson_id: SEED_IDS.LES_PY_3_1,
      locale: 'az',
      block_type: 'code',
      sort_order: 2,
      title: 'Təkrarlanan əməliyyat',
      content: {
        language: 'python',
        filename: 'for_loop.py',
        code: 'for i in range(1, 6):\n    print("Addım:", i)',
        expected_output: 'Addım: 1\nAddım: 2\nAddım: 3\nAddım: 4\nAddım: 5',
      },
      exercise_id: null,
      quiz_id: null,
      is_published: true,
    },
    {
      id: '63000000-0000-4000-8000-000000000003',
      lesson_id: SEED_IDS.LES_SQL_1_1,
      locale: 'az',
      block_type: 'code',
      sort_order: 1,
      title: 'İlk SELECT sorğusu',
      content: {
        language: 'sql',
        filename: 'query.sql',
        code: 'SELECT full_name, email\nFROM profiles\nWHERE account_status = \'active\';',
      },
      exercise_id: null,
      quiz_id: null,
      is_published: true,
    },
  ];

  return {
    courses,
    modules,
    lessons: [...m1.lessons, ...m2.lessons, ...restrictedLessons],
    blocks: [...m1.blocks, ...m2.blocks, ...restrictedBlocks],
    exercises: [...m1.exercises, ...m2.exercises],
    quizzes: [...m1.quizzes, ...m2.quizzes],
  };
}
