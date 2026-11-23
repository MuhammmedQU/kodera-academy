import type {
  AdminQuiz,
  LessonContentBlock,
  LessonItem,
} from '../../src/shared/types/domain.js';
import type { SeedExercise } from './initialSeed.js';

export interface ModuleContentBundle {
  lessons: LessonItem[];
  blocks: LessonContentBlock[];
  exercises: SeedExercise[];
  quizzes: AdminQuiz[];
}

const NOW = '2026-11-24T00:00:00.000Z';

export const PY_M1_IDS = {
  MOD_1: '20000000-0000-4000-8000-000000000001',
  LES_1_1: '30000000-0000-4000-8000-000000000001',
  LES_1_2: '30000000-0000-4000-8000-000000000002',
  LES_1_3: '30000000-0000-4000-8000-000000000003',
  LES_1_4: '30000000-0000-4000-8000-000000000004',

  EX_1_2: '40000000-0000-4000-8000-000000000001',
  EX_1_3: '40000000-0000-4000-8000-000000000002',
  EX_1_4: '40000000-0000-4000-8000-000000000003',

  QUIZ_1_1: '50000000-0000-4000-8000-000000000011',
  QUIZ_1_2: '50000000-0000-4000-8000-000000000001',
  QUIZ_1_3: '50000000-0000-4000-8000-000000000013',
  QUIZ_1_4: '50000000-0000-4000-8000-000000000014',

  Q_1_2_1: '51000000-0000-4000-8000-000000000001',
  OPT_1_2_1A: '52000000-0000-4000-8000-000000000001',
  OPT_1_2_1B: '52000000-0000-4000-8000-000000000002',
} as const;

export function buildPythonModule1(): ModuleContentBundle {
  const lessons: LessonItem[] = [
    {
      id: PY_M1_IDS.LES_1_1,
      module_id: PY_M1_IDS.MOD_1,
      slug: 'proqramlasdirma-nedir',
      title: '1.1 Proqramlaşdırma nədir və kompüter bizi necə başa düşür?',
      summary:
        'Heç bir texniki jarqon olmadan proqramlaşdırmanın mahiyyəti, resept analogiyası və niyə məhz Python-dan başlamağın ən rahat yol olduğu.',
      estimated_minutes: 8,
      sort_order: 1,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: PY_M1_IDS.LES_1_2,
      module_id: PY_M1_IDS.MOD_1,
      slug: 'ilk-python-kodu-print',
      title: '1.2 İlk Python proqramın: print() ilə ekrana yazmaq',
      summary:
        'Kompüterlə ilk ünsiyyət: print() funksiyası, dırnaq işarələri, ardıcıl sətirlər və başlanğıcda ən çox edilən xətalar.',
      estimated_minutes: 12,
      sort_order: 2,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: PY_M1_IDS.LES_1_3,
      module_id: PY_M1_IDS.MOD_1,
      slug: 'deyisenler-variables',
      title: '1.3 Məlumatı yadda saxlamaq: Dəyişənlər (Variables)',
      summary:
        'Dəyişənlər niyə lazımdır? Etiketli qutu analogiyası, dəyişən yaratmaq, dəyərini yeniləmək və düzgün adlandırma qaydaları.',
      estimated_minutes: 14,
      sort_order: 3,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: PY_M1_IDS.LES_1_4,
      module_id: PY_M1_IDS.MOD_1,
      slug: 'melumat-novleri-metn-ve-reqem',
      title: '1.4 Məlumat növləri: Mətn (str), Tam ədəd (int) və Kəsr (float)',
      summary:
        'Niyə "5" + "5" nəticəsi "55", amma 5 + 5 nəticəsi 10 olur? Əsas məlumat növləri və fərqli növləri təhlükəsiz birləşdirmək.',
      estimated_minutes: 15,
      sort_order: 4,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
  ];

  const exercises: SeedExercise[] = [
    {
      id: PY_M1_IDS.EX_1_2,
      lesson_id: PY_M1_IDS.LES_1_2,
      locale: 'az',
      title: 'İlk salamlaşma proqramını yaz',
      instructions:
        'print() əmrindən istifadə edərək ekrana dəqiq olaraq iki sətir çıxarın: 1-ci sətirdə "Salam, Kodera!", 2-ci sətirdə isə "Python öyrənirəm!" yazılsın.',
      programming_language: 'python',
      starter_code:
        '# 1-ci sətir: Salam, Kodera!\nprint("")\n\n# 2-ci sətir: Python öyrənirəm!\n',
      solution_code: 'print("Salam, Kodera!")\nprint("Python öyrənirəm!")\n',
      hints: [
        'Hər yeni sətir üçün ayrıca print("...") yazmaq kifayətdir.',
        'Böyük/kiçik hərflərə, vergülə və nida işarəsinə diqqət edin.',
      ],
      execution_mode: 'pyodide_worker',
      time_limit_ms: 3000,
      max_output_chars: 10000,
      test_cases: [
        {
          id: '41000000-0000-4000-8000-000000000001',
          exercise_id: PY_M1_IDS.EX_1_2,
          label: 'Hər iki salamlaşma sətri düzgün çap olunmalıdır',
          stdin_input: '',
          expected_stdout: 'Salam, Kodera!\nPython öyrənirəm!',
          assertion_code: null,
          is_hidden: false,
          sort_order: 1,
        },
      ],
    },
    {
      id: PY_M1_IDS.EX_1_3,
      lesson_id: PY_M1_IDS.LES_1_3,
      locale: 'az',
      title: 'Tələbə kartı dəyişənləri',
      instructions:
        'ad adlı dəyişənə "Murad", seher adlı dəyişənə "Bakı" yazın. Sonra print() ilə ekrana "Murad - Bakı" çıxarın.',
      programming_language: 'python',
      starter_code:
        '# Dəyişənləri yaradın\nad = ""\nseher = ""\n\n# Ekrana çıxarın\n',
      solution_code: 'ad = "Murad"\nseher = "Bakı"\nprint(ad, "-", seher)\n',
      hints: [
        'ad = "Murad" və seher = "Bakı" yazaraq iki dəyişən yaradın.',
        'print(ad, "-", seher) yazdıqda Python aralarına avtomatik boşluq qoyur.',
      ],
      execution_mode: 'pyodide_worker',
      time_limit_ms: 3000,
      max_output_chars: 10000,
      test_cases: [
        {
          id: '41000000-0000-4000-8000-000000000002',
          exercise_id: PY_M1_IDS.EX_1_3,
          label: 'ad və seher dəyişənləri düzgün təyin edilməli və "Murad - Bakı" çap olunmalıdır',
          stdin_input: '',
          expected_stdout: 'Murad - Bakı',
          assertion_code: 'assert ad == "Murad" and seher == "Bakı"',
          is_hidden: false,
          sort_order: 1,
        },
      ],
    },
    {
      id: PY_M1_IDS.EX_1_4,
      lesson_id: PY_M1_IDS.LES_1_4,
      locale: 'az',
      title: 'Alış-veriş hesabını hesabla',
      instructions:
        'defter_qiymeti dəyişəninə 2.5 (kəsr ədəd), say dəyişəninə 4 (tam ədəd) yazın. cemi dəyişənində onların hasilini hesablayın və ekrana "Cəmi: 10.0 AZN" çıxarın.',
      programming_language: 'python',
      starter_code:
        'defter_qiymeti = 2.5\nsay = 4\n# cemi dəyişənini hesablayın və çap edin\n',
      solution_code:
        'defter_qiymeti = 2.5\nsay = 4\ncemi = defter_qiymeti * say\nprint("Cəmi:", cemi, "AZN")\n',
      hints: [
        'Vurma əməliyyatı üçün * işarəsindən istifadə olunur: cemi = defter_qiymeti * say',
        'Mətnlə ədədi yan-yana çap etməyin ən sadə yolu vergüldür: print("Cəmi:", cemi, "AZN")',
      ],
      execution_mode: 'pyodide_worker',
      time_limit_ms: 3000,
      max_output_chars: 10000,
      test_cases: [
        {
          id: '41000000-0000-4000-8000-000000000003',
          exercise_id: PY_M1_IDS.EX_1_4,
          label: 'cemi 10.0 olmalı və ekrana "Cəmi: 10.0 AZN" çıxmalıdır',
          stdin_input: '',
          expected_stdout: 'Cəmi: 10.0 AZN',
          assertion_code: 'assert cemi == 10.0',
          is_hidden: false,
          sort_order: 1,
        },
      ],
    },
  ];

  const quizzes: AdminQuiz[] = [
    {
      id: PY_M1_IDS.QUIZ_1_1,
      lesson_id: PY_M1_IDS.LES_1_1,
      locale: 'az',
      title: '1.1 Anlayış Yoxlaması',
      description: 'Proqramlaşdırmanın təməl məntiqini necə qavradığınızı yoxlayın.',
      passing_score_percent: 70,
      max_attempts: null,
      status: 'published',
      questions: [
        {
          id: '51000000-0000-4000-8000-000000000111',
          quiz_id: PY_M1_IDS.QUIZ_1_1,
          question_type: 'single_choice',
          prompt: 'Proqramlaşdırmanı gündəlik həyatda ən yaxşı hansı anlayışa bənzətmək olar?',
          code_snippet: null,
          code_language: null,
          explanation:
            'Proqram kompüterə addım-addım, dəqiq ardıcıllıqla yerinə yetirməsi üçün verilən təlimatlar siyahısıdır — eynilə yemək resepti kimi.',
          points: 1,
          sort_order: 1,
          options: [
            {
              id: '52000000-0000-4000-8000-000000000111',
              question_id: '51000000-0000-4000-8000-000000000111',
              option_text: 'Addım-addım dəqiq yazılmış yemək reseptinə',
              is_correct: true,
              sort_order: 1,
            },
            {
              id: '52000000-0000-4000-8000-000000000112',
              question_id: '51000000-0000-4000-8000-000000000111',
              option_text: 'Kompüterin öz-özünə təxmin edib iş görməsinə',
              is_correct: false,
              sort_order: 2,
            },
            {
              id: '52000000-0000-4000-8000-000000000113',
              question_id: '51000000-0000-4000-8000-000000000111',
              option_text: 'Yalnız yüksək riyaziyyat düsturlarını əzbərləməyə',
              is_correct: false,
              sort_order: 3,
            },
          ],
        },
      ],
    },
    {
      id: PY_M1_IDS.QUIZ_1_2,
      lesson_id: PY_M1_IDS.LES_1_2,
      locale: 'az',
      title: '1.2 print() Yoxlama Testi',
      description: 'İlk Python əmrinin sintaksisini yoxlayın.',
      passing_score_percent: 70,
      max_attempts: null,
      status: 'published',
      questions: [
        {
          id: PY_M1_IDS.Q_1_2_1,
          quiz_id: PY_M1_IDS.QUIZ_1_2,
          question_type: 'single_choice',
          prompt: 'Python-da ekrana "Salam" mətnini düzgün çıxaran kod hansıdır?',
          code_snippet: null,
          code_language: null,
          explanation:
            'Python böyük/kiçik hərflərə həssasdır (kiçik hərflə print yazılır) və mətn mütləq dırnaq işarələri arasında olmalıdır.',
          points: 1,
          sort_order: 1,
          options: [
            {
              id: PY_M1_IDS.OPT_1_2_1A,
              question_id: PY_M1_IDS.Q_1_2_1,
              option_text: 'print("Salam")',
              is_correct: true,
              sort_order: 1,
            },
            {
              id: PY_M1_IDS.OPT_1_2_1B,
              question_id: PY_M1_IDS.Q_1_2_1,
              option_text: 'Print(Salam)',
              is_correct: false,
              sort_order: 2,
            },
            {
              id: '52000000-0000-4000-8000-000000000003',
              question_id: PY_M1_IDS.Q_1_2_1,
              option_text: 'print(Salam)',
              is_correct: false,
              sort_order: 3,
            },
          ],
        },
      ],
    },
    {
      id: PY_M1_IDS.QUIZ_1_3,
      lesson_id: PY_M1_IDS.LES_1_3,
      locale: 'az',
      title: '1.3 Dəyişənlər Yoxlama Testi',
      description: 'Dəyişən adlandırma və yeniləmə qaydalarını yoxlayın.',
      passing_score_percent: 70,
      max_attempts: null,
      status: 'published',
      questions: [
        {
          id: '51000000-0000-4000-8000-000000000131',
          quiz_id: PY_M1_IDS.QUIZ_1_3,
          question_type: 'single_choice',
          prompt: 'Aşağıdakı dəyişən adlarından hansı Python-da DÜZGÜNDÜR?',
          code_snippet: null,
          code_language: null,
          explanation:
            'Dəyişən adı rəqəmlə başlaya və içində boşluq daşıya bilməz. Alt xətt (_) ilə sözləri ayırmaq ən düzgün Python üslubudur.',
          points: 1,
          sort_order: 1,
          options: [
            {
              id: '52000000-0000-4000-8000-000000000131',
              question_id: '51000000-0000-4000-8000-000000000131',
              option_text: 'telebe_adi',
              is_correct: true,
              sort_order: 1,
            },
            {
              id: '52000000-0000-4000-8000-000000000132',
              question_id: '51000000-0000-4000-8000-000000000131',
              option_text: '1ci_telebe',
              is_correct: false,
              sort_order: 2,
            },
            {
              id: '52000000-0000-4000-8000-000000000133',
              question_id: '51000000-0000-4000-8000-000000000131',
              option_text: 'telebe adi',
              is_correct: false,
              sort_order: 3,
            },
          ],
        },
        {
          id: '51000000-0000-4000-8000-000000000132',
          quiz_id: PY_M1_IDS.QUIZ_1_3,
          question_type: 'single_choice',
          prompt: 'Bu kod ekrana nə çıxaracaq?',
          code_snippet: 'bal = 10\nbal = 25\nprint(bal)',
          code_language: 'python',
          explanation:
            'Eyni dəyişənə yeni dəyər yazdıqda köhnə dəyər silinir və yeni dəyər (25) yadda saxlanılır.',
          points: 1,
          sort_order: 2,
          options: [
            {
              id: '52000000-0000-4000-8000-000000000134',
              question_id: '51000000-0000-4000-8000-000000000132',
              option_text: '25',
              is_correct: true,
              sort_order: 1,
            },
            {
              id: '52000000-0000-4000-8000-000000000135',
              question_id: '51000000-0000-4000-8000-000000000132',
              option_text: '10',
              is_correct: false,
              sort_order: 2,
            },
            {
              id: '52000000-0000-4000-8000-000000000136',
              question_id: '51000000-0000-4000-8000-000000000132',
              option_text: '35',
              is_correct: false,
              sort_order: 3,
            },
          ],
        },
      ],
    },
    {
      id: PY_M1_IDS.QUIZ_1_4,
      lesson_id: PY_M1_IDS.LES_1_4,
      locale: 'az',
      title: '1.4 Modul 1 Yekun Testi',
      description: 'Məlumat növləri (str, int, float) arasındakı fərqi yoxlayın.',
      passing_score_percent: 70,
      max_attempts: null,
      status: 'published',
      questions: [
        {
          id: '51000000-0000-4000-8000-000000000141',
          quiz_id: PY_M1_IDS.QUIZ_1_4,
          question_type: 'single_choice',
          prompt: 'Aşağıdakı kodun çıxışı nə olacaq?',
          code_snippet: 'print("5" + "5")',
          code_language: 'python',
          explanation:
            '"5" dırnaq içində olduğu üçün rəqəm deyil, mətndir (str). İki mətni + ilə topladıqda Python onları yan-yana birləşdirir: "55".',
          points: 1,
          sort_order: 1,
          options: [
            {
              id: '52000000-0000-4000-8000-000000000141',
              question_id: '51000000-0000-4000-8000-000000000141',
              option_text: '55',
              is_correct: true,
              sort_order: 1,
            },
            {
              id: '52000000-0000-4000-8000-000000000142',
              question_id: '51000000-0000-4000-8000-000000000141',
              option_text: '10',
              is_correct: false,
              sort_order: 2,
            },
            {
              id: '52000000-0000-4000-8000-000000000143',
              question_id: '51000000-0000-4000-8000-000000000141',
              option_text: 'Xəta verər',
              is_correct: false,
              sort_order: 3,
            },
          ],
        },
        {
          id: '51000000-0000-4000-8000-000000000142',
          quiz_id: PY_M1_IDS.QUIZ_1_4,
          question_type: 'single_choice',
          prompt: 'qiymet = 4.99 dəyişəninin məlumat növü hansıdır?',
          code_snippet: null,
          code_language: null,
          explanation: 'Onluq nöqtəsi olan ədədlər Python-da float (kəsr ədəd) adlanır.',
          points: 1,
          sort_order: 2,
          options: [
            {
              id: '52000000-0000-4000-8000-000000000144',
              question_id: '51000000-0000-4000-8000-000000000142',
              option_text: 'float (kəsr ədəd)',
              is_correct: true,
              sort_order: 1,
            },
            {
              id: '52000000-0000-4000-8000-000000000145',
              question_id: '51000000-0000-4000-8000-000000000142',
              option_text: 'int (tam ədəd)',
              is_correct: false,
              sort_order: 2,
            },
            {
              id: '52000000-0000-4000-8000-000000000146',
              question_id: '51000000-0000-4000-8000-000000000142',
              option_text: 'str (mətn)',
              is_correct: false,
              sort_order: 3,
            },
          ],
        },
      ],
    },
  ];

  let blockSeq = 100;
  const blk = (
    lesson_id: string,
    sort_order: number,
    block_type: LessonContentBlock['block_type'],
    title: string | null,
    content: Record<string, unknown>,
    refs?: { exercise_id?: string; quiz_id?: string },
  ): LessonContentBlock => {
    blockSeq += 1;
    const suffix = String(blockSeq).padStart(12, '0');
    return {
      id: `61000000-0000-4000-8000-${suffix}`,
      lesson_id,
      locale: 'az',
      block_type,
      sort_order,
      title,
      content,
      exercise_id: refs?.exercise_id ?? null,
      quiz_id: refs?.quiz_id ?? null,
      is_published: true,
    };
  };

  const blocks: LessonContentBlock[] = [
    // ================= DƏRS 1.1 =================
    blk(PY_M1_IDS.LES_1_1, 1, 'heading', null, {
      level: 2,
      text: 'Proqramlaşdırma əslində nə deməkdir?',
    }),
    blk(PY_M1_IDS.LES_1_1, 2, 'paragraph', null, {
      text: 'Çox insan proqramlaşdırmanı ekran boyu sürətlə axan qəribə yaşıl rəqəmlər kimi təsəvvür edir. Əslində isə proqramlaşdırma çox sadə bir bacarıqdır: kompüterə bir işi hansı ardıcıllıqla görməli olduğunu aydın dildə izah etmək.',
    }),
    blk(PY_M1_IDS.LES_1_1, 3, 'example', 'Gündəlik Həyatdan Analogiya: Çay Dəmləmək', {
      scenario:
        'Təsəvvür edin ki, heç vaxt çay dəmləməmiş bir robot dostunuz var. Ona sadəcə "çay gətir" desəniz, nə edəcəyini bilməyəcək. Amma addımları sırayla yazsanız: 1) Çaydana su tök. 2) Suyu qaynat. 3) Dəmliyə çay əlavə et. 4) 5 dəqiqə gözlə. 5) Stəkana süz. Bax bu ardıcıl təlimat siyahısı proqramdır!',
      walkthrough:
        'Kompüter çox sürətlidir — saniyədə milyardlarla əməliyyat edə bilir. Amma özü təxmin etmir; yalnız sizin yazdığınız addımları dəqiqliklə icra edir.',
    }),
    blk(PY_M1_IDS.LES_1_1, 4, 'heading', null, {
      level: 2,
      text: 'Niyə məhz Python dilindən başlayırıq?',
    }),
    blk(PY_M1_IDS.LES_1_1, 5, 'paragraph', null, {
      text: 'Kompüterlə danışmaq üçün xüsusi dillər — proqramlaşdırma dilləri yaradılıb. Python dünyada yeni başlayanların ən çox sevdiyi dildir, çünki yazısı insan dilinə çox yaxındır. Eyni zamanda Python sadəcə "öyrənmə dili" deyil: veb saytlar, məlumat analitikası, avtomatlaşdırma və süni intellekt sistemləri bu dillə qurulur.',
    }),
    blk(PY_M1_IDS.LES_1_1, 6, 'code', 'İlk Python nümunəsinə baxaq', {
      language: 'python',
      filename: 'tanisliq.py',
      code: 'print("Xoş gəldin!")\nprint("Bu mənim ilk Python dərsimdir.")',
      expected_output: 'Xoş gəldin!\nBu mənim ilk Python dərsimdir.',
    }),
    blk(PY_M1_IDS.LES_1_1, 7, 'explanation', 'Bu 2 sətir necə oxunur?', {
      text: 'Python kodu həmişə yuxarıdan aşağıya doğru, sətirbəsətir icra edir:',
      steps: [
        { line: 1, note: '1-ci sətirdə `print` əmri ekrana "Xoş gəldin!" yazısını çıxarır.' },
        {
          line: 2,
          note: '1-ci sətir bitdikdən sonra 2-ci sətir işləyir və növbəti cümləni aşağı sətirdə göstərir.',
        },
      ],
    }),
    blk(PY_M1_IDS.LES_1_1, 8, 'warning', 'Yanlış təsəvvürdən uzaq olun', {
      text: 'Proqramlaşdırmanı öyrənmək üçün riyaziyyat dahisi olmaq və ya bütün əmrləri əzbərləmək lazım deyil. Əsas məqsəd məntiqi addım-addım qurmaq və praktika etməkdir. Peşəkar proqramçılar belə tez-tez xəta edir və oxuyaraq düzəldirlər.',
    }),
    blk(PY_M1_IDS.LES_1_1, 9, 'quiz', 'Anlayış yoxlaması', { display_mode: 'inline' }, {
      quiz_id: PY_M1_IDS.QUIZ_1_1,
    }),
    blk(PY_M1_IDS.LES_1_1, 10, 'summary', 'Dərs 1.1 Xülasəsi', {
      key_takeaways: [
        'Proqram kompüterə verilən addım-addım dəqiq təlimatlar siyahısıdır.',
        'Python həm sıfırdan öyrənmək üçün ən sadə, həm də real layihələrdə ən güclü dillərdən biridir.',
        'Python kodları yuxarıdan aşağıya doğru ardıcıl icra edir.',
      ],
      next_step_hint: 'Növbəti dərsdə ilk Python kodunuzu özünüz yazacaq və işə salacaqsınız!',
    }),

    // ================= DƏRS 1.2 =================
    blk(PY_M1_IDS.LES_1_2, 1, 'heading', null, {
      level: 2,
      text: 'print() əmri niyə lazımdır?',
    }),
    blk(PY_M1_IDS.LES_1_2, 2, 'paragraph', null, {
      text: 'Bir proqram yazdıqda onun nə etdiyini, hansı nəticəni hesabladığını görmək istəyirik. Bunun üçün Python-da ən ilk öyrənəcəyimiz əmr `print()` funksiyasıdır. İngiliscədən tərcümədə "çap et" deməkdir — yəni mötərizənin içində nə yazsanız, onu ekranda göstərir.',
    }),
    blk(PY_M1_IDS.LES_1_2, 3, 'code', 'İlk real kodumuz', {
      language: 'python',
      filename: 'salam.py',
      code: 'print("Salam, Kodera!")\nprint("Mən bu gün kod yazmağa başladım.")',
      expected_output: 'Salam, Kodera!\nMən bu gün kod yazmağa başladım.',
    }),
    blk(PY_M1_IDS.LES_1_2, 4, 'explanation', 'Hər detalın mənası', {
      text: 'İlk baxışda kiçik görünən simvolların Python-da dəqiq vəzifəsi var:',
      steps: [
        { line: 1, note: '`print` — kiçik hərflərlə yazılan funksiyanın adıdır.' },
        { line: 2, note: '`(...)` — mötərizələr funksiyaya nəyi göstərməli olduğunu ötürür.' },
        {
          line: 3,
          note: '`"Salam, Kodera!"` — qoşa dırnaq işarələri kompüterə deyir ki, içindəki adi mətndir.',
        },
      ],
    }),
    blk(PY_M1_IDS.LES_1_2, 5, 'example', 'Real Nümunə: Kafe Menyusu Çapı', {
      scenario: 'Kiçik bir kafenin menyusunu ekrana səliqəli çıxarmaq istəyirik:',
      language: 'python',
      code: 'print("=== KODERA KAFE ===")\nprint("1. Çay - 2 AZN")\nprint("2. Qəhvə - 4 AZN")',
      expected_output: '=== KODERA KAFE ===\n1. Çay - 2 AZN\n2. Qəhvə - 4 AZN',
      walkthrough: 'Hər `print()` əmri yeni sətirdən başlayır, buna görə menyu səliqəli alt-alta görünür.',
    }),
    blk(PY_M1_IDS.LES_1_2, 6, 'note', 'Şərhlər (#) nə üçündür?', {
      text: 'Kodun içində `#` işarəsi ilə başlayan sətirləri Python icra etmir. Bunlar özümüz və ya başqaları üçün yazdığımız qeydlərdir (şərhlər / comments).',
    }),
    blk(PY_M1_IDS.LES_1_2, 7, 'warning', 'Başlanğıcda ən çox edilən 3 xəta', {
      text: '1) `Print("Salam")` — böyük P yazmaq olmaz (`NameError`). 2) `print(Salam)` — mətni dırnaqsız yazmaq olmaz. 3) Dırnağı açıb bağlamağı unutmaq (`SyntaxError`).',
      common_mistake: 'Print("Salam")   # XƏTA: kiçik hərflə print olmalıdır!\nprint(Salam)     # XƏTA: dırnaq işarəsi unudulub!',
    }),
    blk(PY_M1_IDS.LES_1_2, 8, 'exercise', 'Özün sına: İlk Python proqramın', { display_mode: 'inline' }, {
      exercise_id: PY_M1_IDS.EX_1_2,
    }),
    blk(PY_M1_IDS.LES_1_2, 9, 'quiz', 'Bilik yoxlaması', { display_mode: 'inline' }, {
      quiz_id: PY_M1_IDS.QUIZ_1_2,
    }),
    blk(PY_M1_IDS.LES_1_2, 10, 'summary', 'Dərs 1.2 Xülasəsi', {
      key_takeaways: [
        '`print("...")` əmri mətni ekrana çıxarır.',
        'Mətnlər mütləq qoşa (`"..."`) və ya tək (`\'...\'`) dırnaq içində olmalıdır.',
        'Python böyük və kiçik hərfləri fərqli qəbul edir (`print` düzgündür, `Print` səhvdir).',
      ],
      next_step_hint: 'Növbəti dərsdə məlumatları yadda saxlamağı — Dəyişənləri öyrənəcəyik.',
    }),

    // ================= DƏRS 1.3 =================
    blk(PY_M1_IDS.LES_1_3, 1, 'heading', null, {
      level: 2,
      text: 'Dəyişənlər niyə lazımdır?',
    }),
    blk(PY_M1_IDS.LES_1_3, 2, 'paragraph', null, {
      text: 'Təsəvvür edin ki, bir proqramda tələbənin adını 10 fərqli yerdə ekrana çıxarmalısınız. Hər dəfə `"Aysel"` sözünü əl ilə yazsanız, sabah ad `"Leyla"` olduqda 10 yerin hamısını tək-tək dəyişməli olacaqsınız. Proqramlaşdırmada belə məlumatları bir yerdə yadda saxlamaq üçün **dəyişənlər (variables)** istifadə olunur.',
    }),
    blk(PY_M1_IDS.LES_1_3, 3, 'note', 'Sadə analogiya: Etiketli qutu', {
      text: 'Dəyişəni üzərində adı yazılmış bir qutu kimi düşünün. Məsələn, qutunun üzərinə `ad` yazırıq və içinə `"Aysel"` qoyuruq. Sonra nə vaxt `ad` desək, Python həmin qutunu açır və içindəki `"Aysel"` dəyərini gətirir.',
    }),
    blk(PY_M1_IDS.LES_1_3, 4, 'code', 'Dəyişən yaratmaq və istifadə etmək', {
      language: 'python',
      filename: 'deyisenler.py',
      code: 'ad = "Aysel"\nyas = 19\nprint("Tələbə:", ad)\nprint("Yaş:", yas)',
      expected_output: 'Tələbə: Aysel\nYaş: 19',
    }),
    blk(PY_M1_IDS.LES_1_3, 5, 'explanation', 'Sətirbəsətir izah', {
      text: 'Burada `=` işarəsi riyaziyyatdakı "bərabərdir" deyil, "sağdakı dəyəri soldakı qutuya qoy" deməkdir:',
      steps: [
        { line: 1, note: '`ad` adlı dəyişən yaradılır və içinə `"Aysel"` mətni yazılır.' },
        { line: 2, note: '`yas` adlı dəyişən yaradılır və içinə `19` ədədi yazılır (rəqəm dırnaqsız yazılır!).' },
        {
          line: 3,
          note: '`print("Tələbə:", ad)` — diqqət edin, `ad` sözünü dırnaqsız yazırıq ki, Python qutunun içindəki dəyəri göstərsin!',
        },
        { line: 4, note: 'Eyni qaydada `yas` dəyişəninin dəyəri (`19`) çap olunur.' },
      ],
    }),
    blk(PY_M1_IDS.LES_1_3, 6, 'example', 'Dəyişənin dəyərini yeniləmək', {
      scenario: 'Oyun oynayarkən xalınız əvvəl 0 olur, sonra 10 xal qazanırsınız:',
      language: 'python',
      code: 'xal = 0\nprint("Başlanğıc xal:", xal)\nxal = 10\nprint("Yeni xal:", xal)',
      expected_output: 'Başlanğıc xal: 0\nYeni xal: 10',
      walkthrough:
        'Adının "dəyişən" olmasının səbəbi də budur — proqram işlədikcə qutunun içindəki dəyər dəyişə bilər.',
    }),
    blk(PY_M1_IDS.LES_1_3, 7, 'warning', 'Dəyişən adlandırma qaydaları və tez-tez edilən xətalar', {
      text: 'Dəyişən adı hərf və ya `_` ilə başlamalıdır; içində boşluq olmamalıdır; mənalı adlar seçin (`x` yerinə `qiymet`). Həmçinin `print("ad")` yazsanız, qutunun içi yox, elə "ad" sözünün özü çıxar!',
      common_mistake: '1ci_ad = "Ali"       # XƏTA: rəqəmlə başlaya bilməz\ntelebe adi = "Ali"   # XƏTA: boşluq olmaz, telebe_adi yazın',
    }),
    blk(PY_M1_IDS.LES_1_3, 8, 'exercise', 'Özün sına: Tələbə kartı', { display_mode: 'inline' }, {
      exercise_id: PY_M1_IDS.EX_1_3,
    }),
    blk(PY_M1_IDS.LES_1_3, 9, 'quiz', 'Bilik yoxlaması', { display_mode: 'inline' }, {
      quiz_id: PY_M1_IDS.QUIZ_1_3,
    }),
    blk(PY_M1_IDS.LES_1_3, 10, 'summary', 'Dərs 1.3 Xülasəsi', {
      key_takeaways: [
        'Dəyişən məlumatı adlandıraraq yadda saxlayan etiketli qutudur.',
        '`=` operatoru sağdakı dəyəri soldakı dəyişənə mənimsədir.',
        'Dəyişən adlarında boşluq əvəzinə alt xətt (`_`) istifadə edin (`telebe_adi`).',
      ],
      next_step_hint: 'Modul 1-in son dərsində mətn və ədədlər arasındakı vacib fərqi öyrənəcəyik.',
    }),

    // ================= DƏRS 1.4 =================
    blk(PY_M1_IDS.LES_1_4, 1, 'heading', null, {
      level: 2,
      text: 'Məlumat növləri niyə önəmlidir?',
    }),
    blk(PY_M1_IDS.LES_1_4, 2, 'paragraph', null, {
      text: 'Kompüter üçün `"5"` (dırnaq içindəki beş) ilə `5` (həqiqi rəqəm beş) tamamilə fərqli şeylərdir. Birincisi sadəcə mətn simvoludur — onunla vurma və ya bölmə etmək olmaz. İkincisi isə riyazi ədəddir. Buna görə Python hər məlumatın **növünü (data type)** yadda saxlayır.',
    }),
    blk(PY_M1_IDS.LES_1_4, 3, 'code', '3 əsas məlumat növü: str, int, float', {
      language: 'python',
      filename: 'novler.py',
      code: 'ad = "Nigar"      # str (string) -> mətn\nyas = 21          # int (integer) -> tam ədəd\nqiymet = 3.50     # float -> kəsr (onluq) ədəd\n\nprint(5 + 5)      # ədədləri toplayır -> 10\nprint("5" + "5")  # mətnləri yan-yana yapışdırır -> 55',
      expected_output: '10\n55',
    }),
    blk(PY_M1_IDS.LES_1_4, 4, 'explanation', 'Niyə fərqli nəticələr alındı?', {
      text: 'Eyni `+` işarəsi məlumatın növünə görə fərqli davranır:',
      steps: [
        { line: 1, note: '`str` (mətn): həmişə dırnaq içində yazılır (`"Bakı"`, `"2026"`).' },
        { line: 2, note: '`int` (tam ədəd): nöqtəsiz müsbət, mənfi və ya sıfır ədədlər (`0`, `21`, `-5`).' },
        { line: 3, note: '`float` (kəsr ədəd): nöqtə ilə yazılan onluq ədədlər (`3.5`, `19.99`). Vergül yox, nöqtə istifadə olunur!' },
        { line: 5, note: 'İki ədədi `+` ilə topladıqda riyazi toplama (`10`), iki mətni `+` ilə birləşdirdikdə isə bitişdirmə (`"55"`) baş verir.' },
      ],
    }),
    blk(PY_M1_IDS.LES_1_4, 5, 'example', 'Real Nümunə: Market Çeki', {
      scenario: '3 ədəd çörək alırıq, biri 0.65 AZN-dir. Ümumi məbləği hesablayaq:',
      language: 'python',
      code: 'mehsul = "Çörək"\nqiymet = 0.65\nsay = 3\ncem = qiymet * say\nprint(mehsul, "üçün ödəniş:", cem, "AZN")',
      expected_output: 'Çörək üçün ödəniş: 1.95 AZN',
      walkthrough: 'Kəsr ədədi (`float`) tam ədədə (`int`) vurduqda Python avtomatik kəsr nəticə (`1.95`) verir.',
    }),
    blk(PY_M1_IDS.LES_1_4, 6, 'warning', 'Tez-tez edilən xəta: Mətnlə ədədi + ilə toplamaq', {
      text: 'Python `"Yaşım: " + 20` yazdıqda xəta (`TypeError`) verir, çünki mətnlə ədədi `+` ilə birləşdirə bilmir. Bunun əvəzinə `print("Yaşım:", 20)` yazmaq ən rahat və təmiz üsuldur.',
      common_mistake: 'print("Yaşım: " + 20)   # TypeError!\nprint("Yaşım:", 20)     # DÜZGÜN!',
    }),
    blk(PY_M1_IDS.LES_1_4, 7, 'exercise', 'Modul 1 Praktikası: Alış-veriş hesabı', { display_mode: 'inline' }, {
      exercise_id: PY_M1_IDS.EX_1_4,
    }),
    blk(PY_M1_IDS.LES_1_4, 8, 'quiz', 'Modul 1 Yekun Testi', { display_mode: 'inline' }, {
      quiz_id: PY_M1_IDS.QUIZ_1_4,
    }),
    blk(PY_M1_IDS.LES_1_4, 9, 'summary', 'Modul 1 Tamamlandı!', {
      key_takeaways: [
        'Artıq proqramlaşdırmanın məntiqini, `print()` əmrini, dəyişənləri və 3 əsas məlumat növünü (`str`, `int`, `float`) bilirsiniz.',
        'Kəsr ədədlər həmişə nöqtə (`.`) ilə yazılır (`2.5`), mətnlər isə dırnaqla (`"2.5"`).',
        'Fərqli növləri yan-yana çap etmək üçün `print()` daxilində vergüldən istifadə edin.',
      ],
      next_step_hint:
        'Modul 2-də proqramlarınız canlanacaq: istifadəçidən məlumat alacaq və şərtlərə görə qərar verəcək!',
    }),
  ];

  return { lessons, blocks, exercises, quizzes };
}
