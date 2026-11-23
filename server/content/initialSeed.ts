import type {
  AdminQuiz,
  Course,
  LessonContentBlock,
  LessonItem,
  ModuleItem,
  PublicExercise,
} from '../../src/shared/types/domain';

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

// Deterministic UUIDs for consistent development testing and E2E reliability
export const SEED_IDS = {
  COURSE_PYTHON: '10000000-0000-4000-8000-000000000001',
  COURSE_SQL: '10000000-0000-4000-8000-000000000002',

  MOD_PY_1: '20000000-0000-4000-8000-000000000001',
  MOD_PY_2: '20000000-0000-4000-8000-000000000002',
  MOD_PY_3: '20000000-0000-4000-8000-000000000003',
  MOD_SQL_1: '20000000-0000-4000-8000-000000000004',

  LES_PY_1_1: '30000000-0000-4000-8000-000000000001',
  LES_PY_1_2: '30000000-0000-4000-8000-000000000002',
  LES_PY_2_1: '30000000-0000-4000-8000-000000000005',
  LES_PY_3_1: '30000000-0000-4000-8000-000000000009',
  LES_SQL_1_1: '30000000-0000-4000-8000-000000000010',

  EX_PY_1_2: '40000000-0000-4000-8000-000000000001',
  QUIZ_PY_1_2: '50000000-0000-4000-8000-000000000001',
  Q_PY_1_2_1: '51000000-0000-4000-8000-000000000001',
  OPT_PY_1_2_1A: '52000000-0000-4000-8000-000000000001',
  OPT_PY_1_2_1B: '52000000-0000-4000-8000-000000000002',
} as const;

const NOW = '2026-11-23T12:00:00.000Z';

export function buildInitialSeedContent(): InitialSeedContent {
  const courses: Course[] = [
    {
      id: SEED_IDS.COURSE_PYTHON,
      slug: 'python-esaslari',
      locale: 'az',
      title: 'Python Proqramlaşdırma — Sıfırdan Başlanğıc',
      subtitle: 'Proqramlaşdırmaya heç vaxt başlamayanlar üçün sadə, praktik və ardıcıl Python kursu',
      description:
        'Bu kurs proqramlaşdırma təcrübəsi olmayan tələbələr üçün hazırlanıb. İlk iki modul tamamilə pulsuzdur: əsas anlayışları, dəyişənləri, şərtləri və ilk işlək Python proqramlarını özünüz yazaraq öyrənəcəksiniz.',
      learning_objectives: [
        'Proqramlaşdırma düşüncə tərzini sıfırdan qazanmaq',
        'Python sintaksisi, dəyişənlər, məlumat növləri və şərtlərlə sərbəst işləmək',
        'Brauzerdə real kod yazmaq və xətaları oxuyub düzəltmək',
        'Dövrlər, funksiyalar və məlumat strukturları ilə kiçik layihələr qurmaq',
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
      description: 'Kompüterin təlimatları necə başa düşdüyü, ilk Python kodu, dəyişənlər və əsas məlumat növləri.',
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
      description: 'İstifadəçidən məlumat almaq, hesablamalar aparmaq və if/else şərtləri ilə qərar vermək.',
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
      description: 'Kod təkrarından qurtulmaq, for və while dövrləri ilə real məsələlər həll etmək.',
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

  const lessons: LessonItem[] = [
    {
      id: SEED_IDS.LES_PY_1_1,
      module_id: SEED_IDS.MOD_PY_1,
      slug: 'proqramlasdirma-nedir',
      title: '1.1 Proqramlaşdırma nədir və kompüter bizi necə başa düşür?',
      summary: 'Proqramlaşdırmanın gündəlik həyatdakı mənası və niyə Python öyrənməyə dəyər.',
      estimated_minutes: 8,
      sort_order: 1,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: SEED_IDS.LES_PY_1_2,
      module_id: SEED_IDS.MOD_PY_1,
      slug: 'ilk-python-kodu-print',
      title: '1.2 İlk Python proqramın: print() əmri',
      summary: 'Ekrana mətn çıxarmaq, dırnaq işarələri və ən çox edilən başlanğıc xətaları.',
      estimated_minutes: 10,
      sort_order: 2,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: SEED_IDS.LES_PY_2_1,
      module_id: SEED_IDS.MOD_PY_2,
      slug: 'istifadeciden-melumat-almaq-input',
      title: '2.1 İstifadəçidən məlumat almaq: input()',
      summary: 'Proqramın istifadəçi ilə dialoq qurması.',
      estimated_minutes: 12,
      sort_order: 1,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
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

  const exercises: SeedExercise[] = [
    {
      id: SEED_IDS.EX_PY_1_2,
      lesson_id: SEED_IDS.LES_PY_1_2,
      locale: 'az',
      title: 'İlk salamlaşma proqramını yaz',
      instructions:
        'print() funksiyasından istifadə edərək ekrana dəqiq olaraq `Salam, Kodera!` yazısını çıxarın.',
      programming_language: 'python',
      starter_code: '# Aşağıdakı sətri tamamlayın\nprint("")\n',
      solution_code: 'print("Salam, Kodera!")\n',
      hints: ['Mətn dırnaq işarələri ("...") içində yazılmalıdır.', 'Böyük və kiçik hərflərə diqqət edin: Salam, Kodera!'],
      execution_mode: 'pyodide_worker',
      time_limit_ms: 3000,
      max_output_chars: 10000,
      test_cases: [
        {
          id: '41000000-0000-4000-8000-000000000001',
          exercise_id: SEED_IDS.EX_PY_1_2,
          label: 'Ekrana "Salam, Kodera!" çıxmalıdır',
          stdin_input: '',
          expected_stdout: 'Salam, Kodera!',
          assertion_code: null,
          is_hidden: false,
          sort_order: 1,
        },
      ],
    },
  ];

  const quizzes: AdminQuiz[] = [
    {
      id: SEED_IDS.QUIZ_PY_1_2,
      lesson_id: SEED_IDS.LES_PY_1_2,
      locale: 'az',
      title: 'print() Yoxlama Testi',
      description: 'Dərsdə öyrəndiyiniz əsas qaydanı yoxlayın.',
      passing_score_percent: 70,
      max_attempts: null,
      status: 'published',
      questions: [
        {
          id: SEED_IDS.Q_PY_1_2_1,
          quiz_id: SEED_IDS.QUIZ_PY_1_2,
          question_type: 'single_choice',
          prompt: 'Python-da ekrana "Salam" mətnini düzgün çıxaran kod hansıdır?',
          code_snippet: null,
          code_language: null,
          explanation: 'Mətn (string) dəyərləri print() daxilində dırnaq işarələri arasında yazılmalıdır.',
          points: 1,
          sort_order: 1,
          options: [
            {
              id: SEED_IDS.OPT_PY_1_2_1A,
              question_id: SEED_IDS.Q_PY_1_2_1,
              option_text: 'print("Salam")',
              is_correct: true,
              sort_order: 1,
            },
            {
              id: SEED_IDS.OPT_PY_1_2_1B,
              question_id: SEED_IDS.Q_PY_1_2_1,
              option_text: 'print(Salam)',
              is_correct: false,
              sort_order: 2,
            },
          ],
        },
      ],
    },
  ];

  const blocks: LessonContentBlock[] = [
    {
      id: '60000000-0000-4000-8000-000000000001',
      lesson_id: SEED_IDS.LES_PY_1_1,
      locale: 'az',
      block_type: 'heading',
      sort_order: 1,
      title: null,
      content: { level: 2, text: 'Kompüterə addım-addım təlimat vermək' },
      exercise_id: null,
      quiz_id: null,
      is_published: true,
    },
    {
      id: '60000000-0000-4000-8000-000000000002',
      lesson_id: SEED_IDS.LES_PY_1_1,
      locale: 'az',
      block_type: 'paragraph',
      sort_order: 2,
      title: null,
      content: {
        text: 'Proqramlaşdırma kompüterə hansı işi hansı ardıcıllıqla görməli olduğunu aydın dildə izah etməkdir.',
      },
      exercise_id: null,
      quiz_id: null,
      is_published: true,
    },
    {
      id: '60000000-0000-4000-8000-000000000003',
      lesson_id: SEED_IDS.LES_PY_1_2,
      locale: 'az',
      block_type: 'code',
      sort_order: 1,
      title: 'İlk Python sətri',
      content: {
        language: 'python',
        filename: 'salam.py',
        code: 'print("Salam, Kodera!")',
        expected_output: 'Salam, Kodera!',
      },
      exercise_id: null,
      quiz_id: null,
      is_published: true,
    },
    {
      id: '60000000-0000-4000-8000-000000000004',
      lesson_id: SEED_IDS.LES_PY_1_2,
      locale: 'az',
      block_type: 'exercise',
      sort_order: 2,
      title: 'Özün sına',
      content: { display_mode: 'inline' },
      exercise_id: SEED_IDS.EX_PY_1_2,
      quiz_id: null,
      is_published: true,
    },
    {
      id: '60000000-0000-4000-8000-000000000005',
      lesson_id: SEED_IDS.LES_PY_1_2,
      locale: 'az',
      block_type: 'quiz',
      sort_order: 3,
      title: 'Bilik yoxlaması',
      content: { display_mode: 'inline' },
      exercise_id: null,
      quiz_id: SEED_IDS.QUIZ_PY_1_2,
      is_published: true,
    },
    {
      id: '60000000-0000-4000-8000-000000000006',
      lesson_id: SEED_IDS.LES_PY_2_1,
      locale: 'az',
      block_type: 'paragraph',
      sort_order: 1,
      title: null,
      content: {
        text: 'input() funksiyası istifadəçidən məlumat almağa imkan verir.',
      },
      exercise_id: null,
      quiz_id: null,
      is_published: true,
    },
    {
      id: '60000000-0000-4000-8000-000000000007',
      lesson_id: SEED_IDS.LES_PY_3_1,
      locale: 'az',
      block_type: 'paragraph',
      sort_order: 1,
      title: 'Məhdud Dərs Kontenti',
      content: {
        text: 'Bu dərs yalnız Python kursuna təyin olunmuş aktiv tələbələr üçün açıqdır: for i in range(5): print(i)',
      },
      exercise_id: null,
      quiz_id: null,
      is_published: true,
    },
    {
      id: '60000000-0000-4000-8000-000000000008',
      lesson_id: SEED_IDS.LES_SQL_1_1,
      locale: 'az',
      block_type: 'paragraph',
      sort_order: 1,
      title: 'Məhdud SQL Kontenti',
      content: {
        text: 'Bu dərs yalnız SQL kursuna təyin olunmuş aktiv tələbələr üçün açıqdır: SELECT * FROM students;',
      },
      exercise_id: null,
      quiz_id: null,
      is_published: true,
    },
  ];

  return { courses, modules, lessons, blocks, exercises, quizzes };
}
