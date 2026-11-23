import type { z } from 'zod';
import type {
  applicationReviewSchema,
  contentBlockUpsertSchema,
  courseUpsertSchema,
  exerciseAttemptCreateSchema,
  exerciseUpsertSchema,
  lessonProgressUpdateSchema,
  lessonUpsertSchema,
  moduleUpsertSchema,
  platformSettingsUpdateSchema,
  profileUpdateSchema,
  quizSubmitSchema,
  quizUpsertSchema,
  registerSchema,
} from '../../src/shared/validation/schemas';

export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ApplicationReviewInput = z.infer<typeof applicationReviewSchema>;
export type CourseUpsertInput = z.infer<typeof courseUpsertSchema>;
export type ModuleUpsertInput = z.infer<typeof moduleUpsertSchema>;
export type LessonUpsertInput = z.infer<typeof lessonUpsertSchema>;
export type ContentBlockUpsertInput = z.infer<typeof contentBlockUpsertSchema>;
export type ExerciseUpsertInput = z.infer<typeof exerciseUpsertSchema>;
export type QuizUpsertInput = z.infer<typeof quizUpsertSchema>;
export type PlatformSettingsUpdateInput = z.infer<typeof platformSettingsUpdateSchema>;
export type QuizSubmitInput = z.infer<typeof quizSubmitSchema>;
export type LessonProgressUpdateInput = z.infer<typeof lessonProgressUpdateSchema>;
export type ExerciseAttemptCreateInput = z.infer<typeof exerciseAttemptCreateSchema>;
