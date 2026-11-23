import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, HelpCircle, Lock, XCircle } from 'lucide-react';
import type { PublicQuiz, QuizAttemptResult, QuizAttemptSummary } from '@shared/types/domain';
import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { CodeBlock } from './CodeBlock';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { formatDateAz } from '@/lib/formatters';

interface QuizBlockProps {
  quiz: PublicQuiz;
  canSubmit: boolean;
  previousAttempts?: QuizAttemptSummary[];
  onAttemptRecorded?: (result: QuizAttemptResult) => void;
}

export function QuizBlock({
  quiz,
  canSubmit,
  previousAttempts = [],
  onAttemptRecorded,
}: QuizBlockProps) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleOption = (questionId: string, optionId: string, multiple: boolean) => {
    setSelections((prev) => {
      const current = prev[questionId] ?? [];
      if (!multiple) {
        return { ...prev, [questionId]: [optionId] };
      }
      return {
        ...prev,
        [questionId]: current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      };
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const answers = quiz.questions.map((q) => ({
        question_id: q.id,
        selected_option_ids: selections[q.id] ?? [],
      }));
      const res = await apiRequest<QuizAttemptResult>(`/api/student/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        body: { answers },
      });
      setResult(res);
      onAttemptRecorded?.(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Quiz göndərilərkən xəta baş verdi.');
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = quiz.questions.every((q) => (selections[q.id]?.length ?? 0) > 0);

  return (
    <Card className="border-[#4338CA]/25">
      <CardHeader className="bg-[#EEF2FF]/45 rounded-t-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-5 w-5 text-[#4338CA]" />
            {quiz.title}
          </CardTitle>
          <Badge variant="brand">Keçid balı: {quiz.passing_score_percent}%</Badge>
        </div>
        {quiz.description && <CardDescription>{quiz.description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {error && <Alert variant="error">{error}</Alert>}

        {quiz.questions.map((question, qIndex) => {
          const isMultiple = question.question_type === 'multiple_choice';
          const selected = selections[question.id] ?? [];
          const qFeedback = result?.feedback.find((f) => f.question_id === question.id);

          return (
            <div
              key={question.id}
              className="space-y-3 rounded-xl border border-zinc-200/80 bg-[#FAFAF9] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[#18181B]">
                  {qIndex + 1}. {question.prompt}
                </p>
                <span className="shrink-0 text-xs text-zinc-500">{question.points} bal</span>
              </div>

              {question.code_snippet && (
                <CodeBlock
                  code={question.code_snippet}
                  language={question.code_language || 'python'}
                />
              )}

              <div className="space-y-2">
                {question.options.map((opt) => {
                  const isChecked = selected.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-3.5 py-2.5 text-sm transition-colors ${
                        isChecked
                          ? 'border-[#4338CA] bg-[#EEF2FF]/50 font-medium text-[#18181B]'
                          : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      <input
                        type={isMultiple ? 'checkbox' : 'radio'}
                        name={`quiz-${quiz.id}-q-${question.id}`}
                        checked={isChecked}
                        onChange={() => toggleOption(question.id, opt.id, isMultiple)}
                        className="h-4 w-4 accent-[#4338CA]"
                      />
                      <span>{opt.option_text}</span>
                    </label>
                  );
                })}
              </div>

              {qFeedback && (
                <div
                  className={`flex items-start gap-2 rounded-xl p-3 text-xs ${
                    qFeedback.is_correct
                      ? 'bg-emerald-50 text-emerald-900'
                      : 'bg-red-50 text-red-900'
                  }`}
                >
                  {qFeedback.is_correct ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {qFeedback.is_correct ? 'Düzgün cavab!' : 'Yanlış cavab'}
                    </p>
                    {qFeedback.explanation && (
                      <p className="mt-0.5 leading-relaxed">{qFeedback.explanation}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {result && (
          <Alert
            variant={result.is_passed ? 'success' : 'warning'}
            title={
              result.is_passed
                ? `Təbriklər! Quiz-dən keçdiniz (${result.score_percent}%)`
                : `Nəticə: ${result.score_percent}% — Yenidən cəhd edə bilərsiniz`
            }
          >
            Cəhd #{result.attempt_number}: {result.earned_points} / {result.total_points} bal.
          </Alert>
        )}

        {canSubmit ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="primary"
              disabled={!allAnswered}
              isLoading={submitting}
              onClick={handleSubmit}
            >
              <Award className="h-4 w-4" />
              Cavabları yoxla
            </Button>
            {!allAnswered && (
              <span className="text-xs text-zinc-500">
                Göndərmək üçün bütün suallara cavab seçin.
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
            <div className="flex items-start gap-2.5">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" />
              <p className="text-xs leading-relaxed">
                Quiz cavabları təhlükəsizlik məqsədilə yalnız serverdə qiymətləndirilir. Balınızı
                yoxlamaq və irəliləyişinizi yadda saxlamaq üçün qeydiyyat müraciəti edin.
              </p>
            </div>
            <Link to="/register">
              <Button variant="accent" size="sm">
                Qeydiyyat müraciəti
              </Button>
            </Link>
          </div>
        )}

        {previousAttempts.length > 0 && (
          <div className="border-t border-zinc-100 pt-3">
            <p className="mb-2 text-xs font-semibold text-zinc-500 uppercase">Əvvəlki cəhdləriniz</p>
            <div className="flex flex-wrap gap-2">
              {previousAttempts.slice(0, 5).map((att) => (
                <Badge key={att.id} variant={att.is_passed ? 'success' : 'neutral'}>
                  #{att.attempt_number}: {att.score_percent}% ({formatDateAz(att.submitted_at)})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
