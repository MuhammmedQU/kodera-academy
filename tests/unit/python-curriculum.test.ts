import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { buildInitialSeedContent } from '@server/content/initialSeed';
import { PYTHON_RUNNER_HARNESS } from '@/features/python-runner/harness';

describe('Phase 8 — Python Intro Modules (Module 1 & Module 2) Curriculum Verification', () => {
  const seed = buildInitialSeedContent();
  const pyCourse = seed.courses.find((c) => c.slug === 'python-esaslari')!;
  const publicPyModules = seed.modules.filter(
    (m) => m.course_id === pyCourse.id && m.is_public && m.is_published,
  );
  const publicModIds = new Set(publicPyModules.map((m) => m.id));
  const publicLessons = seed.lessons.filter((l) => publicModIds.has(l.module_id));

  it('contains exactly 2 public introductory Python modules with 8 beginner lessons (4 per module)', () => {
    expect(publicPyModules).toHaveLength(2);
    expect(publicLessons).toHaveLength(8);
    expect(seed.lessons.filter((l) => l.module_id === publicPyModules[0]!.id)).toHaveLength(4);
    expect(seed.lessons.filter((l) => l.module_id === publicPyModules[1]!.id)).toHaveLength(4);
  });

  it('validates that every single Python exercise solution passes ALL its test cases in real Python 3.12', () => {
    expect(seed.exercises.length).toBeGreaterThanOrEqual(7);

    const script = `
${PYTHON_RUNNER_HARNESS}
import sys
payload = sys.stdin.read()
data = json.loads(payload)
print(_kodera_run(data["code"], json.dumps(data["testCases"]), data["maxOutputChars"]))
`;

    for (const ex of seed.exercises) {
      expect(ex.test_cases.length).toBeGreaterThanOrEqual(1);
      expect(ex.solution_code.trim().length).toBeGreaterThan(0);

      const stdout = execFileSync('python', ['-c', script], {
        input: JSON.stringify({
          code: ex.solution_code,
          testCases: ex.test_cases.map((tc) => ({
            label: tc.label,
            stdin_input: tc.stdin_input,
            expected_stdout: tc.expected_stdout,
            assertion_code: tc.assertion_code,
          })),
          maxOutputChars: ex.max_output_chars,
        }),
        encoding: 'utf8',
        timeout: 5000,
      });

      const parsed = JSON.parse(stdout.trim()) as {
        status: string;
        stderr: string;
        testResults: Array<{ label: string; passed: boolean; error: string | null }>;
      };

      expect(parsed.status, `Exercise "${ex.title}" failed: ${parsed.stderr}`).toBe('passed');
      expect(parsed.testResults.every((r) => r.passed)).toBe(true);
    }
  });

  it('validates every quiz has valid options, at least one correct answer, and Azerbaijani explanations', () => {
    expect(seed.quizzes.length).toBeGreaterThanOrEqual(8);
    for (const qz of seed.quizzes) {
      expect(qz.questions.length).toBeGreaterThanOrEqual(1);
      for (const q of qz.questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.options.some((o) => o.is_correct)).toBe(true);
        expect((q.explanation ?? '').trim().length).toBeGreaterThan(10);
      }
    }
  });
});
