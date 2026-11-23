import { Fragment } from 'react';
import { AlertTriangle, BookMarked, CheckCircle2, Info, Sparkles } from 'lucide-react';
import type {
  ExerciseAttemptSummary,
  LessonContentBlock,
  PublicExercise,
  QuizAttemptResult,
  QuizAttemptSummary,
} from '@shared/types/domain';
import { CodeBlock } from './CodeBlock';
import { ExerciseBlock, type PythonRunOutcome } from './ExerciseBlock';
import { QuizBlock } from './QuizBlock';
import { isSafeUrl } from '@/lib/formatters';

interface LessonContentRendererProps {
  blocks: LessonContentBlock[];
  canTrackStudentActions: boolean;
  previousQuizAttempts?: Record<string, QuizAttemptSummary[]>;
  previousExerciseAttempts?: Record<string, ExerciseAttemptSummary[]>;
  onRunPython?: (code: string, exercise: PublicExercise) => Promise<PythonRunOutcome>;
  onQuizSubmitted?: (quizId: string, result: QuizAttemptResult) => void;
}

/**
 * Safely renders text with inline `code` backtick spans using pure React elements (zero raw HTML injection).
 */
function RichInlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
          return (
            <code
              key={idx}
              className="rounded-md bg-[#EEF2FF] px-1.5 py-0.5 font-mono text-[0.9em] font-medium text-[#3730A3]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <Fragment key={idx}>{part}</Fragment>;
      })}
    </>
  );
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
}

export function LessonContentRenderer({
  blocks,
  canTrackStudentActions,
  previousQuizAttempts = {},
  previousExerciseAttempts = {},
  onRunPython,
  onQuizSubmitted,
}: LessonContentRendererProps) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        const c = block.content;

        switch (block.block_type) {
          case 'heading': {
            const level = c.level === 3 ? 3 : 2;
            const text = asString(c.text, block.title ?? '');
            return level === 3 ? (
              <h3
                key={block.id}
                className="pt-2 font-display text-xl font-bold text-[#18181B]"
              >
                {text}
              </h3>
            ) : (
              <h2
                key={block.id}
                className="border-b border-zinc-200/80 pb-2 pt-3 font-display text-2xl font-extrabold text-[#18181B]"
              >
                {text}
              </h2>
            );
          }

          case 'paragraph': {
            const text = asString(c.text);
            return (
              <p key={block.id} className="text-base leading-relaxed text-zinc-700">
                <RichInlineText text={text} />
              </p>
            );
          }

          case 'image': {
            const url = asString(c.url || c.storage_path);
            const alt = asString(c.alt, block.title ?? 'Dərs illüstrasiyası');
            const caption = asString(c.caption);
            if (!isSafeUrl(url)) return null;
            return (
              <figure
                key={block.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3"
              >
                <img
                  src={url}
                  alt={alt}
                  loading="lazy"
                  className="mx-auto max-h-[420px] w-full rounded-xl object-contain"
                />
                {caption && (
                  <figcaption className="mt-2.5 text-center text-xs text-zinc-500">
                    {caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          case 'code': {
            const highlightLines = Array.isArray(c.highlight_lines)
              ? c.highlight_lines.filter((n): n is number => typeof n === 'number')
              : [];
            return (
              <CodeBlock
                key={block.id}
                code={asString(c.code)}
                language={asString(c.language, 'python')}
                filename={asString(c.filename) || undefined}
                title={block.title}
                expectedOutput={asString(c.expected_output) || undefined}
                highlightLines={highlightLines}
              />
            );
          }

          case 'explanation': {
            const text = asString(c.text);
            const steps = Array.isArray(c.steps)
              ? (c.steps as Array<{ line?: number; note?: string }>)
              : [];
            return (
              <div
                key={block.id}
                className="rounded-2xl border border-[#4338CA]/20 bg-[#EEF2FF]/60 p-5"
              >
                <div className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-[#312E81]">
                  <Sparkles className="h-4 w-4 text-[#4338CA]" />
                  {block.title || 'Bu kod necə işləyir?'}
                </div>
                {text && (
                  <p className="text-sm leading-relaxed text-zinc-800">
                    <RichInlineText text={text} />
                  </p>
                )}
                {steps.length > 0 && (
                  <ol className="mt-3 space-y-2">
                    {steps.map((st, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 rounded-xl bg-white/85 px-3.5 py-2.5 text-sm text-zinc-800"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4338CA] font-mono text-[11px] font-bold text-white">
                          {st.line ?? idx + 1}
                        </span>
                        <span className="leading-relaxed">
                          <RichInlineText text={st.note ?? ''} />
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          }

          case 'example': {
            const scenario = asString(c.scenario);
            const code = asString(c.code);
            const walkthrough = asString(c.walkthrough);
            return (
              <div
                key={block.id}
                className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs"
              >
                <div className="flex items-center gap-2 font-display text-sm font-bold text-[#18181B]">
                  <BookMarked className="h-4 w-4 text-[#F59E0B]" />
                  {block.title || 'Real Həyat Nümunəsi'}
                </div>
                {scenario && (
                  <p className="text-sm leading-relaxed text-zinc-700">
                    <RichInlineText text={scenario} />
                  </p>
                )}
                {code && (
                  <CodeBlock
                    code={code}
                    language={asString(c.language, 'python')}
                    expectedOutput={asString(c.expected_output) || undefined}
                  />
                )}
                {walkthrough && (
                  <p className="text-sm leading-relaxed text-zinc-600">
                    <RichInlineText text={walkthrough} />
                  </p>
                )}
              </div>
            );
          }

          case 'note': {
            return (
              <div
                key={block.id}
                className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50/75 p-4 text-sm text-sky-950"
              >
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                <div className="space-y-1">
                  <p className="font-semibold">{block.title || 'Vacib qeyd'}</p>
                  <p className="leading-relaxed">
                    <RichInlineText text={asString(c.text)} />
                  </p>
                </div>
              </div>
            );
          }

          case 'warning': {
            const commonMistake = asString(c.common_mistake);
            return (
              <div
                key={block.id}
                className="flex gap-3 rounded-2xl border border-[#F59E0B]/45 bg-[#FEF3C7]/65 p-4 text-sm text-[#78350F]"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#D97706]" />
                <div className="space-y-1.5">
                  <p className="font-bold">{block.title || 'Diqqət: Tez-tez edilən xəta'}</p>
                  <p className="leading-relaxed">
                    <RichInlineText text={asString(c.text)} />
                  </p>
                  {commonMistake && (
                    <pre className="overflow-x-auto rounded-lg bg-[#18181B] px-3 py-2 font-mono text-xs text-amber-200">
                      {commonMistake}
                    </pre>
                  )}
                </div>
              </div>
            );
          }

          case 'exercise': {
            if (!block.exercise) return null;
            return (
              <ExerciseBlock
                key={block.id}
                exercise={block.exercise}
                canSaveAttempt={canTrackStudentActions}
                previousAttempts={previousExerciseAttempts[block.exercise.id]}
                onRunPython={onRunPython}
              />
            );
          }

          case 'quiz': {
            if (!block.quiz) return null;
            return (
              <QuizBlock
                key={block.id}
                quiz={block.quiz}
                canSubmit={canTrackStudentActions}
                previousAttempts={previousQuizAttempts[block.quiz.id]}
                onAttemptRecorded={(res) => onQuizSubmitted?.(block.quiz!.id, res)}
              />
            );
          }

          case 'summary': {
            const takeaways = asStringArray(c.key_takeaways);
            const nextHint = asString(c.next_step_hint);
            return (
              <div
                key={block.id}
                className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5"
              >
                <h3 className="font-display text-base font-bold text-emerald-950">
                  {block.title || 'Bu dərsdən yadda saxlamalı olduqların'}
                </h3>
                {takeaways.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {takeaways.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-emerald-950">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>
                          <RichInlineText text={item} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {nextHint && (
                  <p className="mt-3 border-t border-emerald-200/80 pt-3 text-xs font-medium text-emerald-800">
                    Növbəti addım: {nextHint}
                  </p>
                )}
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
