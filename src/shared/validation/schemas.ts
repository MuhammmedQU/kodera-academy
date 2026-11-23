import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const phoneRegex = /^\+?[0-9\s\-()]{7,25}$/;
const whatsappDigitsRegex = /^[1-9][0-9]{7,14}$/;

export const registerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Ad və soyad ən azı 2 simvoldan ibarət olmalıdır.')
    .max(120, 'Ad və soyad ən çoxu 120 simvol ola bilər.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Düzgün email ünvanı daxil edin.')
    .max(180, 'Email ünvanı çox uzundur.'),
  password: z
    .string()
    .min(8, 'Şifrə ən azı 8 simvoldan ibarət olmalıdır.')
    .max(128, 'Şifrə ən çoxu 128 simvol ola bilər.')
    .regex(/[A-Za-z]/, 'Şifrədə ən azı bir hərf olmalıdır.')
    .regex(/[0-9]/, 'Şifrədə ən azı bir rəqəm olmalıdır.'),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine((v) => v === undefined || phoneRegex.test(v), {
      message: 'Telefon nömrəsi formatı düzgün deyil (məs., +994 50 123 45 67).',
    }),
  learning_goals: z
    .string()
    .trim()
    .max(1000, 'Öyrənmə məqsədi ən çoxu 1000 simvol ola bilər.')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Düzgün email ünvanı daxil edin.'),
  password: z.string().min(1, 'Şifrəni daxil edin.'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Düzgün email ünvanı daxil edin.'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Yeni şifrə ən azı 8 simvoldan ibarət olmalıdır.')
      .max(128, 'Şifrə ən çoxu 128 simvol ola bilər.')
      .regex(/[A-Za-z]/, 'Şifrədə ən azı bir hərf olmalıdır.')
      .regex(/[0-9]/, 'Şifrədə ən azı bir rəqəm olmalıdır.'),
    confirmPassword: z.string().min(1, 'Şifrə təsdiqini daxil edin.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifrələr uyğun gəlmir.',
    path: ['confirmPassword'],
  });

export const profileUpdateSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, 'Ad və soyad ən azı 2 simvoldan ibarət olmalıdır.')
      .max(120, 'Ad və soyad ən çoxu 120 simvol ola bilər.'),
    phone: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null))
      .refine((v) => v === null || phoneRegex.test(v), {
        message: 'Telefon nömrəsi formatı düzgün deyil.',
      }),
    learning_goals: z
      .string()
      .trim()
      .max(1000, 'Öyrənmə məqsədi ən çoxu 1000 simvol ola bilər.')
      .nullable()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    preferred_locale: z.enum(['az', 'en']).optional(),
  })
  .strict();

export const applicationReviewSchema = z
  .object({
    decision: z.enum(['approved', 'rejected']),
    rejection_reason: z.string().trim().max(500).nullable().optional(),
    internal_note: z.string().trim().max(2000).optional(),
  })
  .strict();

export const applicationNoteSchema = z
  .object({
    note: z.string().trim().min(1, 'Qeyd boş ola bilməz.').max(2000),
  })
  .strict();

export const studentAccountStatusSchema = z
  .object({
    account_status: z.enum(['active', 'suspended']),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

export const assignEnrollmentSchema = z
  .object({
    student_id: z.string().uuid('Tələbə ID düzgün deyil.'),
    course_ids: z.array(z.string().uuid()).min(1, 'Ən azı bir kurs seçin.'),
  })
  .strict();

export const revokeEnrollmentSchema = z
  .object({
    revoke_reason: z.string().trim().max(500).optional(),
  })
  .strict();

export const courseUpsertSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(slugRegex, 'Slug yalnız kiçik latın hərfləri, rəqəmlər və tire (-) ola bilər.'),
    locale: z.enum(['az', 'en']).default('az'),
    title: z.string().trim().min(2).max(160),
    subtitle: z.string().trim().max(280).nullable().optional(),
    description: z.string().trim().min(10).max(5000),
    learning_objectives: z.array(z.string().trim().min(2).max(300)).default([]),
    target_audience: z.string().trim().max(1000).nullable().optional(),
    programming_language: z.string().trim().toLowerCase().min(1).max(40).default('python'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    estimated_duration_minutes: z.coerce.number().int().min(0).max(100000).default(0),
    cover_image_path: z.string().trim().max(500).nullable().optional(),
    sort_order: z.coerce.number().int().min(0).default(0),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
  })
  .strict();

export const moduleUpsertSchema = z
  .object({
    course_id: z.string().uuid(),
    slug: z.string().trim().toLowerCase().regex(slugRegex),
    title: z.string().trim().min(2).max(160),
    description: z.string().trim().max(1000).nullable().optional(),
    sort_order: z.coerce.number().int().min(0),
    is_public: z.boolean().default(false),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
  })
  .strict();

export const lessonUpsertSchema = z
  .object({
    module_id: z.string().uuid(),
    slug: z.string().trim().toLowerCase().regex(slugRegex),
    title: z.string().trim().min(2).max(180),
    summary: z.string().trim().max(1000).nullable().optional(),
    estimated_minutes: z.coerce.number().int().min(1).max(300).default(10),
    sort_order: z.coerce.number().int().min(0),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
  })
  .strict();

export const contentBlockUpsertSchema = z
  .object({
    lesson_id: z.string().uuid(),
    locale: z.enum(['az', 'en']).default('az'),
    block_type: z.enum([
      'heading',
      'paragraph',
      'image',
      'code',
      'explanation',
      'example',
      'note',
      'warning',
      'exercise',
      'quiz',
      'summary',
    ]),
    sort_order: z.coerce.number().int().min(0),
    title: z.string().trim().max(180).nullable().optional(),
    content: z.record(z.string(), z.unknown()).default({}),
    exercise_id: z.string().uuid().nullable().optional(),
    quiz_id: z.string().uuid().nullable().optional(),
    is_published: z.boolean().default(true),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.block_type === 'exercise' && (!val.exercise_id || val.quiz_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Exercise bloku üçün exercise_id mütləqdir.',
      });
    }
    if (val.block_type === 'quiz' && (!val.quiz_id || val.exercise_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Quiz bloku üçün quiz_id mütləqdir.',
      });
    }
    if (
      val.block_type !== 'exercise' &&
      val.block_type !== 'quiz' &&
      (val.exercise_id || val.quiz_id)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bu blok növü exercise_id və ya quiz_id daşıya bilməz.',
      });
    }
  });

export const exerciseUpsertSchema = z
  .object({
    lesson_id: z.string().uuid(),
    locale: z.enum(['az', 'en']).default('az'),
    title: z.string().trim().min(2).max(180),
    instructions: z.string().trim().min(5).max(5000),
    programming_language: z.string().trim().toLowerCase().default('python'),
    starter_code: z.string().max(20000).default(''),
    solution_code: z.string().max(20000).optional(),
    hints: z.array(z.string().trim().min(1).max(500)).default([]),
    execution_mode: z.enum(['pyodide_worker', 'static_review']).default('pyodide_worker'),
    time_limit_ms: z.coerce.number().int().min(500).max(15000).default(3000),
    max_output_chars: z.coerce.number().int().min(256).max(50000).default(10000),
    status: z.enum(['draft', 'published', 'archived']).default('published'),
    test_cases: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(160),
          stdin_input: z.string().max(5000).default(''),
          expected_stdout: z.string().max(10000).nullable().optional(),
          assertion_code: z.string().max(10000).nullable().optional(),
          is_hidden: z.boolean().default(false),
          sort_order: z.coerce.number().int().min(0).default(0),
        }),
      )
      .default([]),
  })
  .strict();

export const quizUpsertSchema = z
  .object({
    lesson_id: z.string().uuid(),
    locale: z.enum(['az', 'en']).default('az'),
    title: z.string().trim().min(2).max(180),
    description: z.string().trim().max(1000).nullable().optional(),
    passing_score_percent: z.coerce.number().int().min(0).max(100).default(70),
    max_attempts: z.coerce.number().int().min(1).nullable().optional(),
    status: z.enum(['draft', 'published', 'archived']).default('published'),
    questions: z
      .array(
        z.object({
          question_type: z.enum(['single_choice', 'multiple_choice', 'true_false']),
          prompt: z.string().trim().min(3).max(2000),
          code_snippet: z.string().max(10000).nullable().optional(),
          code_language: z.string().max(40).nullable().optional(),
          explanation: z.string().trim().max(2000).nullable().optional(),
          points: z.coerce.number().int().min(1).max(100).default(1),
          sort_order: z.coerce.number().int().min(0).default(0),
          options: z
            .array(
              z.object({
                option_text: z.string().trim().min(1).max(500),
                is_correct: z.boolean(),
                sort_order: z.coerce.number().int().min(0).default(0),
              }),
            )
            .min(2),
        }),
      )
      .min(1),
  })
  .strict();

export const platformSettingsUpdateSchema = z
  .object({
    academy_name: z.string().trim().min(2).max(100),
    academy_tagline: z.string().trim().min(2).max(240),
    logo_storage_path: z.string().trim().max(500).nullable().optional(),
    contact_email: z
      .string()
      .trim()
      .email('Düzgün əlaqə emaili daxil edin.')
      .nullable()
      .optional()
      .or(z.literal('').transform(() => null)),
    whatsapp_phone: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((v) => {
        if (!v) return null;
        const digits = v.replace(/[^0-9]/g, '');
        return digits.length > 0 ? digits : null;
      })
      .refine((v) => v === null || whatsappDigitsRegex.test(v), {
        message: 'WhatsApp nömrəsi yalnız beynəlxalq rəqəmlərlə olmalıdır (məs., 994501234567).',
      }),
    whatsapp_button_enabled: z.boolean(),
    whatsapp_button_label: z.string().trim().min(2).max(100),
    whatsapp_message_template: z.string().trim().min(10).max(1000),
    alternative_contact_text: z.string().trim().max(500).nullable().optional(),
    registration_enabled: z.boolean(),
    default_public_modules_count: z.coerce.number().int().min(0).max(20),
  })
  .strict();

export const quizSubmitSchema = z
  .object({
    answers: z
      .array(
        z.object({
          question_id: z.string().uuid(),
          selected_option_ids: z.array(z.string().uuid()),
        }),
      )
      .min(1, 'Ən azı bir suala cavab verin.'),
  })
  .strict();

export const lessonProgressUpdateSchema = z
  .object({
    status: z.enum(['not_started', 'in_progress', 'completed']),
  })
  .strict();

export const exerciseAttemptCreateSchema = z
  .object({
    submitted_code: z.string().max(50000),
    status: z.enum(['passed', 'failed', 'error', 'timeout']),
    passed_tests: z.number().int().min(0),
    total_tests: z.number().int().min(0),
    stdout: z.string().max(20000).nullable().optional(),
    stderr: z.string().max(20000).nullable().optional(),
    execution_time_ms: z.number().int().min(0).nullable().optional(),
    test_results: z
      .array(
        z.object({
          label: z.string(),
          passed: z.boolean(),
          expected: z.string().nullable().optional(),
          actual: z.string().nullable().optional(),
          error: z.string().nullable().optional(),
        }),
      )
      .default([]),
  })
  .strict()
  .refine((v) => v.passed_tests <= v.total_tests, {
    message: 'Keçən test sayı ümumi test sayından çox ola bilməz.',
  });
