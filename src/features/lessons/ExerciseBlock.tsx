import { useState } from 'react';
import { ChevronDown, ChevronUp, Code2, Lightbulb, Play, RotateCcw } from 'lucide-react';
import type { ExerciseAttemptSummary, PublicExercise } from '@shared/types/domain';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';

export interface PythonRunOutcome {
  status: 'passed' | 'failed' | 'error' | 'timeout';
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  testResults: Array<{
    label: string;
    passed: boolean;
    expected?: string | null;
    actual?: string | null;
    error?: string | null;
  }>;
}

interface ExerciseBlockProps {
  exercise: PublicExercise;
  canSaveAttempt: boolean;
  previousAttempts?: ExerciseAttemptSummary[];
  onRunPython?: (
    code: string,
    exercise: PublicExercise,
  ) => Promise<PythonRunOutcome>;
  onAttemptSaved?: (attempt: ExerciseAttemptSummary) => void;
}

export function ExerciseBlock({
  exercise,
  canSaveAttempt,
  previousAttempts = [],
  onRunPython,
  onAttemptSaved,
}: ExerciseBlockProps) {
  const [code, setCode] = useState(exercise.starter_code);
  const [showHints, setShowHints] = useState(false);
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState<PythonRunOutcome | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleRun = async () => {
    if (!onRunPython) return;
    setRunning(true);
    setSaveMessage(null);
    try {
      const res = await onRunPython(code, exercise);
      setOutcome(res);

      if (canSaveAttempt) {
        const passedTests = res.testResults.filter((t) => t.passed).length;
        const { apiRequest } = await import('@/lib/apiClient');
        const saved = await apiRequest<ExerciseAttemptSummary>(
          `/api/student/exercises/${exercise.id}/attempts`,
          {
            method: 'POST',
            body: {
              submitted_code: code,
              status: res.status,
              passed_tests: passedTests,
              total_tests: res.testResults.length,
              stdout: res.stdout || null,
              stderr: res.stderr || null,
              execution_time_ms: res.executionTimeMs,
              test_results: res.testResults,
            },
          },
        );
        setSaveMessage('Cəhdiniz irəliləyiş tarixçənizə yazıldı.');
        onAttemptSaved?.(saved);
      }
    } catch (err) {
      setOutcome({
        status: 'error',
        stdout: '',
        stderr: err instanceof Error ? err.message : 'İcra zamanı xəta baş verdi.',
        executionTimeMs: 0,
        testResults: [],
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="border-zinc-300/90">
      <CardHeader className="rounded-t-2xl bg-zinc-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Code2 className="h-5 w-5 text-[#F59E0B]" />
            Praktik Məşq: {exercise.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="amber">{exercise.programming_language.toUpperCase()}</Badge>
            <Badge variant="neutral">Limit: {(exercise.time_limit_ms / 1000).toFixed(1)}s</Badge>
          </div>
        </div>
        <CardDescription className="text-zinc-300">{exercise.instructions}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor={`ex-editor-${exercise.id}`}
              className="text-xs font-semibold text-zinc-600 uppercase"
            >
              Kod redaktoru (Brauzerdə izolyasiya olunmuş Web Worker)
            </label>
            <button
              type="button"
              onClick={() => {
                setCode(exercise.starter_code);
                setOutcome(null);
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-[#18181B]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Sıfırla
            </button>
          </div>
          <textarea
            id={`ex-editor-${exercise.id}`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={7}
            spellCheck={false}
            aria-label={`${exercise.title} kod redaktoru`}
            className="w-full rounded-xl border border-zinc-800 bg-[#18181B] p-4 font-mono text-sm leading-relaxed text-zinc-100 focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/30 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {onRunPython && exercise.execution_mode === 'pyodide_worker' ? (
              <Button variant="primary" isLoading={running} onClick={handleRun}>
                <Play className="h-4 w-4" />
                {running ? 'Python icra olunur...' : 'Kodu işə sal və yoxla'}
              </Button>
            ) : (
              <Badge variant="neutral">
                İnteraktiv brauzer icrası bu dil/mərhələ üçün aktiv deyil
              </Badge>
            )}

            {exercise.hints.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHints((prev) => !prev)}
              >
                <Lightbulb className="h-4 w-4 text-[#F59E0B]" />
                İpucu ({exercise.hints.length})
                {showHints ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {previousAttempts.length > 0 && (
            <Badge variant={previousAttempts[0]?.status === 'passed' ? 'success' : 'neutral'}>
              Son cəhd: {previousAttempts[0]?.passed_tests}/{previousAttempts[0]?.total_tests} test
            </Badge>
          )}
        </div>

        {showHints && exercise.hints.length > 0 && (
          <Alert variant="warning" title="İpucları">
            <ul className="list-disc space-y-1 pl-4 text-xs">
              {exercise.hints.map((hint, idx) => (
                <li key={idx}>{hint}</li>
              ))}
            </ul>
          </Alert>
        )}

        {outcome && (
          <div className="space-y-3 rounded-xl border border-zinc-200 bg-[#FAFAF9] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge
                variant={
                  outcome.status === 'passed'
                    ? 'success'
                    : outcome.status === 'timeout'
                      ? 'amber'
                      : 'danger'
                }
              >
                {outcome.status === 'passed'
                  ? 'Bütün testlər keçdi!'
                  : outcome.status === 'timeout'
                    ? 'İcra vaxtı bitdi (Timeout)'
                    : outcome.status === 'error'
                      ? 'İcra xətası'
                      : 'Bəzi testlər keçmədi'}
              </Badge>
              <span className="text-xs text-zinc-500">{outcome.executionTimeMs} ms</span>
            </div>

            {outcome.stdout && (
              <div>
                <p className="mb-1 text-xs font-semibold text-zinc-500 uppercase">Çıxış (stdout)</p>
                <pre className="overflow-x-auto rounded-lg bg-[#18181B] p-3 font-mono text-xs text-emerald-300">
                  {outcome.stdout}
                </pre>
              </div>
            )}

            {outcome.stderr && (
              <div>
                <p className="mb-1 text-xs font-semibold text-red-600 uppercase">Xəta (stderr)</p>
                <pre className="overflow-x-auto rounded-lg bg-red-950 p-3 font-mono text-xs text-red-200">
                  {outcome.stderr}
                </pre>
              </div>
            )}

            {outcome.testResults.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Test nəticələri</p>
                {outcome.testResults.map((tr, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border px-3 py-2 text-xs ${
                      tr.passed
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        : 'border-red-200 bg-red-50 text-red-900'
                    }`}
                  >
                    <p className="font-semibold">
                      {tr.passed ? '✓' : '✗'} {tr.label}
                    </p>
                    {!tr.passed && tr.expected !== undefined && tr.expected !== null && (
                      <p className="mt-0.5 font-mono">
                        Gözlənilən: &ldquo;{tr.expected}&rdquo; | Alınan: &ldquo;{tr.actual ?? ''}
                        &rdquo;
                      </p>
                    )}
                    {tr.error && <p className="mt-0.5 font-mono">{tr.error}</p>}
                  </div>
                ))}
              </div>
            )}

            {saveMessage && <p className="text-xs font-medium text-emerald-700">{saveMessage}</p>}
          </div>
        )}

        {exercise.test_cases.length > 0 && !outcome && (
          <div className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600">
            <p className="font-semibold text-zinc-700">
              Yoxlama meyarları ({exercise.test_cases.length} test):
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {exercise.test_cases.map((tc) => (
                <li key={tc.id}>{tc.label}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
