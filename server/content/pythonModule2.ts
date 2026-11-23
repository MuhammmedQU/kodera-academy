import type {
  AdminQuiz,
  LessonContentBlock,
  LessonItem,
} from '../../src/shared/types/domain.js';
import type { SeedExercise } from './initialSeed.js';
import type { ModuleContentBundle } from './pythonModule1.js';

const NOW = '2026-11-24T00:00:00.000Z';

export const PY_M2_IDS = {
  MOD_2: '20000000-0000-4000-8000-000000000002',
  LES_2_1: '30000000-0000-4000-8000-000000000005',
  LES_2_2: '30000000-0000-4000-8000-000000000006',
  LES_2_3: '30000000-0000-4000-8000-000000000007',
  LES_2_4: '30000000-0000-4000-8000-000000000008',

  EX_2_1: '40000000-0000-4000-8000-000000000004',
  EX_2_2: '40000000-0000-4000-8000-000000000005',
  EX_2_3: '40000000-0000-4000-8000-000000000006',
  EX_2_4: '40000000-0000-4000-8000-000000000007',

  QUIZ_2_1: '50000000-0000-4000-8000-000000000021',
  QUIZ_2_2: '50000000-0000-4000-8000-000000000022',
  QUIZ_2_3: '50000000-0000-4000-8000-000000000023',
  QUIZ_2_4: '50000000-0000-4000-8000-000000000024',
} as const;

export function buildPythonModule2(): ModuleContentBundle {
  const lessons: LessonItem[] = [
    {
      id: PY_M2_IDS.LES_2_1,
      module_id: PY_M2_IDS.MOD_2,
      slug: 'istifadeciden-melumat-almaq-input',
      title: '2.1 İstifadəçidən məlumat almaq: input()',
      summary:
        'Proqramı interaktiv etmək: istifadəçinin adını soruşmaq, cavabı dəyişəndə saxlamaq və fərdi salamlaşma yaratmaq.',
      estimated_minutes: 12,
      sort_order: 1,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: PY_M2_IDS.LES_2_2,
      module_id: PY_M2_IDS.MOD_2,
      slug: 'riyazi-emeliyyatlar-ve-cevirmeler',
      title: '2.2 Hesablamalar və int() / float() çevirmələri',
      summary:
        'input() həmişə mətn qaytarır! Onu necə ədədə çeviririk və Python-da toplama, çıxma, vurma, bölmə ilə real kalkulyator yazırıq.',
      estimated_minutes: 15,
      sort_order: 2,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: PY_M2_IDS.LES_2_3,
      module_id: PY_M2_IDS.MOD_2,
      slug: 'qerar-vermek-if-else',
      title: '2.3 Proqramın qərar verməsi: if, elif və else',
      summary:
        'Şərtlər, müqayisə işarələri (==, >, <, >=), Python-da 4 boşluq (indentation) qaydası və real imtahan/balans qərarları.',
      estimated_minutes: 16,
      sort_order: 3,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: PY_M2_IDS.LES_2_4,
      module_id: PY_M2_IDS.MOD_2,
      slug: 'modul-2-yekun-mini-layihe',
      title: '2.4 Yekun Mini-Layihə: Ağıllı Bilet Qiymət Kalkulyatoru',
      summary:
        'Modul 1 və Modul 2-də öyrəndiyiniz bütün bilikləri birləşdirərək ilk tam funksional Python proqramınızı yazın!',
      estimated_minutes: 18,
      sort_order: 4,
      status: 'published',
      is_published: true,
      created_at: NOW,
      updated_at: NOW,
    },
  ];

  const exercises: SeedExercise[] = [
    {
      id: PY_M2_IDS.EX_2_1,
      lesson_id: PY_M2_IDS.LES_2_1,
      locale: 'az',
      title: 'Fərdi salamlaşma proqramı',
      instructions:
        'input() ilə istifadəçinin adını oxuyub `ad` dəyişəninə yazın. Sonra ekrana "Xoş gəldin, <ad>!" formatında salamlaşma çıxarın (məs., ad "Ləman" olduqda "Xoş gəldin, Ləman!").',
      programming_language: 'python',
      starter_code:
        '# İstifadəçidən adı oxuyun\nad = input()\n\n# Aşağıda salamlaşmanı çap edin\n',
      solution_code: 'ad = input()\nprint("Xoş gəldin, " + ad + "!")\n',
      hints: [
        'input() çağırışında əlavə sual mətni yazmayın ki, çıxış dəqiq uyğun gəlsin.',
        'Mətnləri boşluq olmadan nida işarəsi ilə birləşdirmək üçün: print("Xoş gəldin, " + ad + "!")',
      ],
      execution_mode: 'pyodide_worker',
      time_limit_ms: 3000,
      max_output_chars: 10000,
      test_cases: [
        {
          id: '41000000-0000-4000-8000-000000000004',
          exercise_id: PY_M2_IDS.EX_2_1,
          label: 'Ləman daxil edildikdə "Xoş gəldin, Ləman!" çıxmalıdır',
          stdin_input: 'Ləman',
          expected_stdout: 'Xoş gəldin, Ləman!',
          assertion_code: null,
          is_hidden: false,
          sort_order: 1,
        },
        {
          id: '41000000-0000-4000-8000-000000000005',
          exercise_id: PY_M2_IDS.EX_2_1,
          label: 'Orxan daxil edildikdə "Xoş gəldin, Orxan!" çıxmalıdır',
          stdin_input: 'Orxan',
          expected_stdout: 'Xoş gəldin, Orxan!',
          assertion_code: null,
          is_hidden: false,
          sort_order: 2,
        },
      ],
    },
    {
      id: PY_M2_IDS.EX_2_2,
      lesson_id: PY_M2_IDS.LES_2_2,
      locale: 'az',
      title: 'Yaş hesablama kalkulyatoru',
      instructions:
        'İstifadəçidən doğum ilini `input()` ilə alın, `int()` ilə tam ədədə çevirin və 2026-cı ildəki yaşını (`2026 - dogum_ili`) hesablayıb yalnız rəqəmi çap edin.',
      programming_language: 'python',
      starter_code:
        'dogum_ili = int(input())\n# Yaşı hesablayıb çap edin\n',
      solution_code: 'dogum_ili = int(input())\nyas = 2026 - dogum_ili\nprint(yas)\n',
      hints: [
        'int(input()) daxil edilən mətni dərhal tam ədədə çevirir.',
        'yas = 2026 - dogum_ili yazın və print(yas) ilə çap edin.',
      ],
      execution_mode: 'pyodide_worker',
      time_limit_ms: 3000,
      max_output_chars: 10000,
      test_cases: [
        {
          id: '41000000-0000-4000-8000-000000000006',
          exercise_id: PY_M2_IDS.EX_2_2,
          label: '2006 daxil edildikdə 20 çıxmalıdır',
          stdin_input: '2006',
          expected_stdout: '20',
          assertion_code: null,
          is_hidden: false,
          sort_order: 1,
        },
        {
          id: '41000000-0000-4000-8000-000000000007',
          exercise_id: PY_M2_IDS.EX_2_2,
          label: '2000 daxil edildikdə 26 çıxmalıdır',
          stdin_input: '2000',
          expected_stdout: '26',
          assertion_code: null,
          is_hidden: false,
          sort_order: 2,
        },
      ],
    },
    {
      id: PY_M2_IDS.EX_2_3,
      lesson_id: PY_M2_IDS.LES_2_3,
      locale: 'az',
      title: 'İmtahan nəticəsi yoxlayıcısı',
      instructions:
        'İstifadəçidən imtahan balını (`int(input())`) oxuyun. Əgər bal 51 və ya daha yüksəkdirsə (`bal >= 51`), ekrana "Keçdiniz", əks halda "Yenidən cəhd edin" yazdırın.',
      programming_language: 'python',
      starter_code:
        'bal = int(input())\n\n# if və else ilə yoxlayın\n',
      solution_code:
        'bal = int(input())\nif bal >= 51:\n    print("Keçdiniz")\nelse:\n    print("Yenidən cəhd edin")\n',
      hints: [
        'Şərtin sonunda iki nöqtə (:) qoymağı unutmayın: if bal >= 51:',
        'if və else altındakı print() sətri 4 boşluq içəridən (Tab ilə) başlamalıdır.',
      ],
      execution_mode: 'pyodide_worker',
      time_limit_ms: 3000,
      max_output_chars: 10000,
      test_cases: [
        {
          id: '41000000-0000-4000-8000-000000000008',
          exercise_id: PY_M2_IDS.EX_2_3,
          label: '75 bal -> "Keçdiniz"',
          stdin_input: '75',
          expected_stdout: 'Keçdiniz',
          assertion_code: null,
          is_hidden: false,
          sort_order: 1,
        },
        {
          id: '41000000-0000-4000-8000-000000000009',
          exercise_id: PY_M2_IDS.EX_2_3,
          label: '51 bal (sərhəd dəyər) -> "Keçdiniz"',
          stdin_input: '51',
          expected_stdout: 'Keçdiniz',
          assertion_code: null,
          is_hidden: false,
          sort_order: 2,
        },
        {
          id: '41000000-0000-4000-8000-000000000010',
          exercise_id: PY_M2_IDS.EX_2_3,
          label: '40 bal -> "Yenidən cəhd edin"',
          stdin_input: '40',
          expected_stdout: 'Yenidən cəhd edin',
          assertion_code: null,
          is_hidden: false,
          sort_order: 3,
        },
      ],
    },
    {
      id: PY_M2_IDS.EX_2_4,
      lesson_id: PY_M2_IDS.LES_2_4,
      locale: 'az',
      title: 'Mini-Layihə: Ağıllı Bilet Qiymət Kalkulyatoru',
      instructions:
        'Kino zalı üçün bilet proqramı yazın. 1-ci input: yaş (`int`), 2-ci input: bilet sayı (`int`). Qayda: yaş < 12 olarsa 1 bilet 5 AZN; 12 <= yaş < 65 olarsa 10 AZN; yaş >= 65 olarsa 6 AZN. Ümumi məbləği hesablayıb "Ödəniş: <məbləğ> AZN" çap edin.',
      programming_language: 'python',
      starter_code:
        'yas = int(input())\nsay = int(input())\n\n# 1) Yaşa görə bir biletin qiymətini tapın\n# 2) Ümumi məbləği hesablayıb "Ödəniş: <məbləğ> AZN" çap edin\n',
      solution_code:
        'yas = int(input())\nsay = int(input())\n\nif yas < 12:\n    qiymet = 5\nelif yas < 65:\n    qiymet = 10\nelse:\n    qiymet = 6\n\ncem = qiymet * say\nprint("Ödəniş:", cem, "AZN")\n',
      hints: [
        'if yas < 12: qiymet = 5 / elif yas < 65: qiymet = 10 / else: qiymet = 6',
        'Sonra cem = qiymet * say hesablayıb print("Ödəniş:", cem, "AZN") yazın.',
      ],
      execution_mode: 'pyodide_worker',
      time_limit_ms: 3000,
      max_output_chars: 10000,
      test_cases: [
        {
          id: '41000000-0000-4000-8000-000000000011',
          exercise_id: PY_M2_IDS.EX_2_4,
          label: 'Uşaq (8 yaş, 2 bilet) -> "Ödəniş: 10 AZN"',
          stdin_input: '8\n2',
          expected_stdout: 'Ödəniş: 10 AZN',
          assertion_code: null,
          is_hidden: false,
          sort_order: 1,
        },
        {
          id: '41000000-0000-4000-8000-000000000012',
          exercise_id: PY_M2_IDS.EX_2_4,
          label: 'Gənc/Böyük (25 yaş, 3 bilet) -> "Ödəniş: 30 AZN"',
          stdin_input: '25\n3',
          expected_stdout: 'Ödəniş: 30 AZN',
          assertion_code: null,
          is_hidden: false,
          sort_order: 2,
        },
        {
          id: '41000000-0000-4000-8000-000000000013',
          exercise_id: PY_M2_IDS.EX_2_4,
          label: 'Yaşlı (70 yaş, 2 bilet) -> "Ödəniş: 12 AZN"',
          stdin_input: '70\n2',
          expected_stdout: 'Ödəniş: 12 AZN',
          assertion_code: null,
          is_hidden: false,
          sort_order: 3,
        },
      ],
    },
  ];

  const quizzes: AdminQuiz[] = [
    {
      id: PY_M2_IDS.QUIZ_2_1,
      lesson_id: PY_M2_IDS.LES_2_1,
      locale: 'az',
      title: '2.1 input() Yoxlama Testi',
      description: 'input() funksiyasının qaytardığı dəyər haqqında əsas qayda.',
      passing_score_percent: 70,
      max_attempts: null,
      status: 'published',
      questions: [
        {
          id: '51000000-0000-4000-8000-000000000211',
          quiz_id: PY_M2_IDS.QUIZ_2_1,
          question_type: 'single_choice',
          prompt: 'İstifadəçi input() sorğusuna 25 yazdıqda Python onu hansı növdə saxlayır?',
          code_snippet: 'cavab = input("Yaşınız: ")',
          code_language: 'python',
          explanation:
            'İstifadəçi rəqəm yazsa belə, input() funksiyası HƏMİŞƏ mətn (str) qaytarır. Hesablama etmək üçün onu int() və ya float() ilə çevirməliyik.',
          points: 1,
          sort_order: 1,
          options: [
            {
              id: '52000000-0000-4000-8000-000000000211',
              question_id: '51000000-0000-4000-8000-000000000211',
              option_text: 'str (mətn) — "25"',
              is_correct: true,
              sort_order: 1,
            },
            {
              id: '52000000-0000-4000-8000-000000000212',
              question_id: '51000000-0000-4000-8000-000000000211',
              option_text: 'int (tam ədəd) — 25',
              is_correct: false,
              sort_order: 2,
            },
          ],
        },
      ],
    },
    {
      id: PY_M2_IDS.QUIZ_2_2,
      lesson_id: PY_M2_IDS.LES_2_2,
      locale: 'az',
      title: '2.2 Riyazi Əməliyyatlar Testi',
      description: 'Çevirmə və bölmə operatorlarını yoxlayın.',
      passing_score_percent: 70,
      max_attempts: null,
      status: 'published',
      questions: [
        {
          id: '51000000-0000-4000-8000-000000000221',
          quiz_id: PY_M2_IDS.QUIZ_2_2,
          question_type: 'single_choice',
          prompt: 'int("12") + int("8") ifadəsinin nəticəsi nədir?',
          code_snippet: null,
          code_language: null,
          explanation: 'int() hər iki mətni tam ədədə çevirir (12 və 8), toplama isə 20 verir.',
          points: 1,
          sort_order: 1,
          options: [
            {
              id: '52000000-0000-4000-8000-000000000221',
              question_id: '51000000-0000-4000-8000-000000000221',
              option_text: '20',
              is_correct: true,
              sort_order: 1,
            },
            {
              id: '52000000-0000-4000-8000-000000000222',
              question_id: '51000000-0000-4000-8000-000000000221',
              option_text: '128',
              is_correct: false,
              sort_order: 2,
            },
          ],
        },
      ],
    },
    {
      id: PY_M2_IDS.QUIZ_2_3,
      lesson_id: PY_M2_IDS.LES_2_3,
      locale: 'az',
      title: '2.3 if / else Şərtlər Testi',
      description: 'Müqayisə operatorları və şərt məntiqini yoxlayın.',
      passing_score_percent: 70,
      max_attempts: null,
      status: 'published',
      questions: [
        {
          id: '51000000-0000-4000-8000-000000000231',
          quiz_id: PY_M2_IDS.QUIZ_2_3,
          question_type: 'single_choice',
          prompt: 'İki dəyərin bərabər olub-olmadığını yoxlamaq üçün if şərtində hansı işarə yazılır?',
          code_snippet: null,
          code_language: null,
          explanation:
            'Tək = mənimsətmə üçündür (x = 5), qoşa == isə müqayisə üçündür (if x == 5:).',
          points: 1,
          sort_order: 1,
          options: [
            {
              id: '52000000-0000-4000-8000-000000000231',
              question_id: '51000000-0000-4000-8000-000000000231',
              option_text: '== (qoşa bərabər)',
              is_correct: true,
              sort_order: 1,
            },
            {
              id: '52000000-0000-4000-8000-000000000232',
              question_id: '51000000-0000-4000-8000-000000000231',
              option_text: '= (tək bərabər)',
              is_correct: false,
              sort_order: 2,
            },
          ],
        },
      ],
    },
    {
      id: PY_M2_IDS.QUIZ_2_4,
      lesson_id: PY_M2_IDS.LES_2_4,
      locale: 'az',
      title: '2.4 Modul 2 Yekun Yoxlama Testi',
      description: 'İlk iki modulun ümumi yekun bilik yoxlaması.',
      passing_score_percent: 70,
      max_attempts: null,
      status: 'published',
      questions: [
        {
          id: '51000000-0000-4000-8000-000000000241',
          quiz_id: PY_M2_IDS.QUIZ_2_4,
          question_type: 'single_choice',
          prompt: 'Aşağıdakı kodda yas = 12 olduqda ekrana nə çıxar?',
          code_snippet:
            'yas = 12\nif yas < 12:\n    print("Uşaq")\nelif yas < 65:\n    print("Standart")\nelse:\n    print("Güzəştli")',
          code_language: 'python',
          explanation:
            '12 < 12 şərti yanlışdır, buna görə Python növbəti elif (12 < 65) şərtinə keçir. O doğru olduğu üçün "Standart" çap olunur.',
          points: 1,
          sort_order: 1,
          options: [
            {
              id: '52000000-0000-4000-8000-000000000241',
              question_id: '51000000-0000-4000-8000-000000000241',
              option_text: 'Standart',
              is_correct: true,
              sort_order: 1,
            },
            {
              id: '52000000-0000-4000-8000-000000000242',
              question_id: '51000000-0000-4000-8000-000000000241',
              option_text: 'Uşaq',
              is_correct: false,
              sort_order: 2,
            },
            {
              id: '52000000-0000-4000-8000-000000000243',
              question_id: '51000000-0000-4000-8000-000000000241',
              option_text: 'Güzəştli',
              is_correct: false,
              sort_order: 3,
            },
          ],
        },
      ],
    },
  ];

  let blockSeq = 200;
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
      id: `62000000-0000-4000-8000-${suffix}`,
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
    // ================= DƏRS 2.1 =================
    blk(PY_M2_IDS.LES_2_1, 1, 'heading', null, {
      level: 2,
      text: 'Proqramı necə canlı və interaktiv edirik?',
    }),
    blk(PY_M2_IDS.LES_2_1, 2, 'paragraph', null, {
      text: 'İndiyə qədər yazdığımız proqramlarda bütün məlumatı özümüz kodun içinə yazırdıq. Amma real tətbiqlər — məsələn, bankomat, qeydiyyat forması və ya mesaj proqramı — istifadəçidən məlumat alır. Python-da bunu `input()` funksiyası ilə edirik.',
    }),
    blk(PY_M2_IDS.LES_2_1, 3, 'code', 'İstifadəçidən ad soruşmaq', {
      language: 'python',
      filename: 'dialoq.py',
      code: 'ad = input("Adınız nədir? ")\nprint("Salam,", ad, "- Kodera-ya xoş gəldin!")',
      expected_output: 'Adınız nədir? Aysel\nSalam, Aysel - Kodera-ya xoş gəldin!',
    }),
    blk(PY_M2_IDS.LES_2_1, 4, 'explanation', 'Kod işləyərkən nə baş verir?', {
      text: '`input()` çağırılanda proqram dayanır və istifadəçinin cavab yazmasını gözləyir:',
      steps: [
        { line: 1, note: '`input(...)` istifadəçinin yazdığı mətni oxuyur və `ad` adlı dəyişənə saxlayır.' },
        { line: 2, note: 'Sonra `print()` həmin dəyişəndən istifadə edərək fərdi salamlaşma göstərir.' },
      ],
    }),
    blk(PY_M2_IDS.LES_2_1, 5, 'warning', 'Vacib qayda: input() həmişə mətn qaytarır!', {
      text: 'İstifadəçi klaviaturadan `20` yazsa belə, Python bunu ədəd kimi yox, `"20"` mətni (`str`) kimi qəbul edir. Növbəti dərsdə onu ədədə çevirməyi öyrənəcəyik.',
      common_mistake: 'yas = input()\nprint(yas + 1)   # TypeError: mətnlə ədəd toplanmır!',
    }),
    blk(PY_M2_IDS.LES_2_1, 6, 'exercise', 'Özün sına: Fərdi salamlaşma', { display_mode: 'inline' }, {
      exercise_id: PY_M2_IDS.EX_2_1,
    }),
    blk(PY_M2_IDS.LES_2_1, 7, 'quiz', 'Bilik yoxlaması', { display_mode: 'inline' }, {
      quiz_id: PY_M2_IDS.QUIZ_2_1,
    }),
    blk(PY_M2_IDS.LES_2_1, 8, 'summary', 'Dərs 2.1 Xülasəsi', {
      key_takeaways: [
        '`input()` istifadəçidən məlumat oxuyur və dəyişəndə saxlamağa imkan verir.',
        '`input()` nəticəsi həmişə mətn (`str`) növündə olur.',
      ],
      next_step_hint: 'İndi daxil edilən rəqəmlərlə real hesablamalar aparmağı öyrənək!',
    }),

    // ================= DƏRS 2.2 =================
    blk(PY_M2_IDS.LES_2_2, 1, 'heading', null, {
      level: 2,
      text: 'Mətni ədədə çevirmək və hesablamalar',
    }),
    blk(PY_M2_IDS.LES_2_2, 2, 'paragraph', null, {
      text: 'İstifadəçidən yaş, qiymət və ya məsafə aldıqda onun üzərində toplama, çıxma, vurma və bölmə etmək istəyirik. Bunun üçün `input()`-dan gələn mətni `int()` (tam ədəd) və ya `float()` (kəsr ədəd) funksiyasına ötürürük.',
    }),
    blk(PY_M2_IDS.LES_2_2, 3, 'code', 'Əsas riyazi operatorlar', {
      language: 'python',
      filename: 'hesablama.py',
      code: 'a = 15\nb = 4\nprint("Toplama:", a + b)\nprint("Çıxma:", a - b)\nprint("Vurma:", a * b)\nprint("Bölmə:", a / b)',
      expected_output: 'Toplama: 19\nÇıxma: 11\nVurma: 60\nBölmə: 3.75',
    }),
    blk(PY_M2_IDS.LES_2_2, 4, 'example', 'Real Nümunə: Taksi Gediş Haqqı', {
      scenario: 'Açılış qiyməti 2 AZN, hər kilometr isə 0.80 AZN olan taksi hesablayıcısı:',
      language: 'python',
      code: 'km = float(input())\node = 2 + (km * 0.80)\nprint("Ödəniş:", ode, "AZN")',
      expected_output: 'Ödəniş: 6.0 AZN   # (km = 5 olduqda)',
      walkthrough:
        '`float(input())` istifadəçinin yazdığı `"5"` və ya `"3.5"` mətnini kəsr ədədə çevirir ki, `0.80`-ə vura bilək.',
    }),
    blk(PY_M2_IDS.LES_2_2, 5, 'warning', 'Tez-tez edilən xəta: Rəqəm olmayan mətni int() etmək', {
      text: '`int("salam")` yazdıqda Python `"salam"` sözünü rəqəmə çevirə bilmədiyi üçün `ValueError` verir. Eyni zamanda kəsr ədəd üçün `int("3.5")` yox, `float("3.5")` istifadə olunmalıdır.',
      common_mistake: 'x = int("3.5")    # ValueError!\nx = float("3.5")  # DÜZGÜN -> 3.5',
    }),
    blk(PY_M2_IDS.LES_2_2, 6, 'exercise', 'Özün sına: Yaş kalkulyatoru', { display_mode: 'inline' }, {
      exercise_id: PY_M2_IDS.EX_2_2,
    }),
    blk(PY_M2_IDS.LES_2_2, 7, 'quiz', 'Bilik yoxlaması', { display_mode: 'inline' }, {
      quiz_id: PY_M2_IDS.QUIZ_2_2,
    }),
    blk(PY_M2_IDS.LES_2_2, 8, 'summary', 'Dərs 2.2 Xülasəsi', {
      key_takeaways: [
        'Tam ədəd üçün `int(input())`, kəsr ədəd üçün `float(input())` istifadə edin.',
        'Python-da əsas operatorlar `+`, `-`, `*`, `/` işarələridir.',
      ],
      next_step_hint: 'Növbəti dərsdə proqrama şərtlərə əsasən qərar verməyi (`if`/`else`) öyrədəcəyik.',
    }),

    // ================= DƏRS 2.3 =================
    blk(PY_M2_IDS.LES_2_3, 1, 'heading', null, {
      level: 2,
      text: 'Proqram necə qərar verir?',
    }),
    blk(PY_M2_IDS.LES_2_3, 2, 'paragraph', null, {
      text: 'Həyatda hər gün şərtlərə görə qərar veririk: "Əgər yağış yağırsa, çətir götür; əks halda götürmə". Və ya "Əgər avtobus kartında balans 0.50 AZN-dən çoxdursa, keç; yoxsa xəbərdarlıq göstər". Python-da bu məntiq `if` (əgər), `elif` (yox əgər) və `else` (əks halda) sözləri ilə yazılır.',
    }),
    blk(PY_M2_IDS.LES_2_3, 3, 'code', 'Avtobus kartı balansı yoxlaması', {
      language: 'python',
      filename: 'balans.py',
      code: 'balans = 1.20\nif balans >= 0.50:\n    print("Keçid uğurludur!")\nelse:\n    print("Balans kifayət etmir.")',
      expected_output: 'Keçid uğurludur!',
    }),
    blk(PY_M2_IDS.LES_2_3, 4, 'explanation', '3 vacib detalı yadda saxla', {
      text: '`if / else` yazarkən Python-un ən önəmli qaydaları bunlardır:',
      steps: [
        { line: 2, note: 'Şərtin sonunda mütləq iki nöqtə (`:`) qoyulur.' },
        {
          line: 3,
          note: 'Şərt doğru olduqda işləyəcək kod **4 boşluq içəridən** (indentation / Tab) yazılır.',
        },
        {
          line: 4,
          note: 'Müqayisə işarələri: `==` (bərabərdir), `!=` (fərqlidir), `>` (böyükdür), `<` (kiçikdir), `>=` (böyük və ya bərabər), `<=` (kiçik və ya bərabər).',
        },
      ],
    }),
    blk(PY_M2_IDS.LES_2_3, 5, 'example', 'Birdən çox seçim: if / elif / else', {
      scenario: 'Hava temperaturuna görə geyim məsləhəti verən proqram:',
      language: 'python',
      code: 'temp = 18\nif temp >= 25:\n    print("Hava istidir, yüngül geyinin.")\nelif temp >= 15:\n    print("Hava mülayimdir.")\nelse:\n    print("Hava soyuqdur, gödəkçə geyinin.")',
      expected_output: 'Hava mülayimdir.',
      walkthrough: 'Python şərtləri yuxarıdan aşağıya yoxlayır və ilk doğru olan bloku icra edib çıxır.',
    }),
    blk(PY_M2_IDS.LES_2_3, 6, 'warning', 'Ən çox edilən 2 şərt xətası', {
      text: '1) Bərabərliyi yoxlayanda tək `=` yazmaq (`if yas = 18:` səhvdir, `if yas == 18:` düzgündür). 2) `:` işarəsini və ya 4 boşluğu unutmaq (`IndentationError`).',
      common_mistake: 'if bal >= 51\nprint("Keçdiniz")   # XƏTA: : və 4 boşluq yoxdur!',
    }),
    blk(PY_M2_IDS.LES_2_3, 7, 'exercise', 'Özün sına: İmtahan nəticəsi', { display_mode: 'inline' }, {
      exercise_id: PY_M2_IDS.EX_2_3,
    }),
    blk(PY_M2_IDS.LES_2_3, 8, 'quiz', 'Bilik yoxlaması', { display_mode: 'inline' }, {
      quiz_id: PY_M2_IDS.QUIZ_2_3,
    }),
    blk(PY_M2_IDS.LES_2_3, 9, 'summary', 'Dərs 2.3 Xülasəsi', {
      key_takeaways: [
        '`if`, `elif`, `else` proqramın şərtlərə görə fərqli yollar seçməsini təmin edir.',
        'Müqayisə üçün `==`, böyük-bərabər üçün `>=`, kiçik-bərabər üçün `<=` yazılır.',
        'Şərtin altındakı sətirlər mütləq 4 boşluq (Tab) içəridən başlamalıdır.',
      ],
      next_step_hint: 'İndi bütün öyrəndiklərinizi bir araya gətirib ilk mini-layihənizi yazın!',
    }),

    // ================= DƏRS 2.4 =================
    blk(PY_M2_IDS.LES_2_4, 1, 'heading', null, {
      level: 2,
      text: 'İlk real mini-layihənizə hazırsınız!',
    }),
    blk(PY_M2_IDS.LES_2_4, 2, 'paragraph', null, {
      text: 'Təbrik edirik! Heç bir başlanğıc bilik olmadan artıq `print()`, dəyişənlər, `str`/`int`/`float`, `input()`, riyazi hesablamalar və `if`/`elif`/`else` şərtlərini mənimsəmisiniz. İndi bunların hamısını bir real tapşırıqda birləşdirəcəyik: **Kino zalı üçün Ağıllı Bilet Qiymət Kalkulyatoru**.',
    }),
    blk(PY_M2_IDS.LES_2_4, 3, 'explanation', 'Məsələni kiçik addımlara bölək', {
      text: 'Peşəkar proqramçılar heç vaxt kodu tələsik yazmırlar — əvvəlcə addımları planlaşdırırlar:',
      steps: [
        { line: 1, note: 'İstifadəçidən 2 məlumat al: `yas = int(input())` və `say = int(input())`.' },
        {
          line: 2,
          note: 'Yaşa görə bir biletin qiymətini müəyyən et: 12-dən kiçik → 5 AZN; 12–64 arası → 10 AZN; 65 və yuxarı → 6 AZN.',
        },
        { line: 3, note: 'Ümumi məbləği hesabla: `cem = qiymet * say`.' },
        { line: 4, note: 'Nəticəni səliqəli çap et: `print("Ödəniş:", cem, "AZN")`.' },
      ],
    }),
    blk(PY_M2_IDS.LES_2_4, 4, 'note', '3 fərqli testlə yoxlanacaq', {
      text: 'Aşağıdakı kodu işə saldıqda sistem proqramınızı avtomatik olaraq uşaq (8 yaş), böyük (25 yaş) və yaşlı (70 yaş) ssenariləri ilə yoxlayacaq.',
    }),
    blk(PY_M2_IDS.LES_2_4, 5, 'exercise', 'Mini-Layihə: Ağıllı Bilet Kalkulyatoru', { display_mode: 'inline' }, {
      exercise_id: PY_M2_IDS.EX_2_4,
    }),
    blk(PY_M2_IDS.LES_2_4, 6, 'quiz', 'Modul 2 Yekun Testi', { display_mode: 'inline' }, {
      quiz_id: PY_M2_IDS.QUIZ_2_4,
    }),
    blk(PY_M2_IDS.LES_2_4, 7, 'summary', 'İlk 2 Pulsuz Modulu Uğurla Tamamladınız!', {
      key_takeaways: [
        'Sıfırdan başlayaraq istifadəçi ilə dialoq quran, hesablama aparan və qərar verən tam Python proqramı yazdınız.',
        'Modul 3-dən etibarən for/while dövrləri, siyahılar (lists), funksiyalar və real layihələr sizi gözləyir.',
      ],
      next_step_hint:
        'Aşağıdakı qeydiyyat dəvəti vasitəsilə müraciət edərək tam Python kursuna qoşula bilərsiniz.',
    }),
  ];

  return { lessons, blocks, exercises, quizzes };
}
