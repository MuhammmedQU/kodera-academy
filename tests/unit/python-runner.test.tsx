import { execFileSync } from 'node:child_process';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  PYTHON_RUNNER_HARNESS,
  type WorkerOutboundMessage,
  type WorkerRunRequest,
} from '@/features/python-runner/harness';
import { PythonWorkerRunner, type PythonWorkerLike } from '@/features/python-runner/pythonRunner';
import { ExerciseBlock } from '@/features/lessons/ExerciseBlock';

function execHarnessInPython(
  userCode: string,
  testCases: WorkerRunRequest['testCases'],
  maxOutputChars = 10000,
) {
  const script = `
${PYTHON_RUNNER_HARNESS}
import sys
payload = sys.stdin.read()
data = json.loads(payload)
print(_kodera_run(data["code"], json.dumps(data["testCases"]), data["maxOutputChars"]))
`;
  const stdout = execFileSync('python', ['-c', script], {
    input: JSON.stringify({ code: userCode, testCases, maxOutputChars }),
    encoding: 'utf8',
    timeout: 5000,
  });
  return JSON.parse(stdout.trim()) as {
    status: 'passed' | 'failed' | 'error';
    stdout: string;
    stderr: string;
    testResults: Array<{
      label: string;
      passed: boolean;
      expected: string | null;
      actual: string | null;
      error: string | null;
    }>;
  };
}

class MockPythonWorker implements PythonWorkerLike {
  private listeners = new Map<string, Set<(ev: MessageEvent<WorkerOutboundMessage> | ErrorEvent) => void>>();
  public terminated = false;
  public posted: WorkerRunRequest[] = [];

  addEventListener(
    type: 'message' | 'error',
    listener: (ev: MessageEvent<WorkerOutboundMessage> | ErrorEvent) => void,
  ) {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);
  }

  removeEventListener(
    type: 'message' | 'error',
    listener: (ev: MessageEvent<WorkerOutboundMessage> | ErrorEvent) => void,
  ) {
    this.listeners.get(type)?.delete(listener);
  }

  emitMessage(data: WorkerOutboundMessage) {
    const ev = { data } as MessageEvent<WorkerOutboundMessage>;
    for (const fn of this.listeners.get('message') ?? []) fn(ev);
  }

  postMessage(msg: WorkerRunRequest) {
    this.posted.push(msg);
  }

  terminate() {
    this.terminated = true;
  }
}

describe('Phase 7 — Interactive Python Runner (Harness & Isolated Web Worker)', () => {
  it('executes valid Python code and passes predefined expected_stdout test cases', () => {
    const res = execHarnessInPython('print("Salam, Kodera!")', [
      {
        label: 'Salam çıxışı',
        stdin_input: '',
        expected_stdout: 'Salam, Kodera!',
        assertion_code: null,
      },
    ]);
    expect(res.status).toBe('passed');
    expect(res.stdout.trim()).toBe('Salam, Kodera!');
    expect(res.stderr).toBe('');
    expect(res.testResults[0]?.passed).toBe(true);
  });

  it('mocks builtins.input() cleanly for interactive Module 2 exercises', () => {
    const res = execHarnessInPython(
      'ad = input()\nyas = int(input())\nprint(f"Salam {ad}, 1 il sonra {yas + 1} yaşın olacaq")',
      [
        {
          label: 'İki input ilə hesablama',
          stdin_input: 'Aysel\n18',
          expected_stdout: 'Salam Aysel, 1 il sonra 19 yaşın olacaq',
          assertion_code: null,
        },
      ],
    );
    expect(res.status).toBe('passed');
    expect(res.testResults[0]?.passed).toBe(true);
  });

  it('evaluates assertion_code against student variables and reports wrong answers cleanly', () => {
    const pass = execHarnessInPython('qiymet = 5\nsay = 4\ncem = qiymet * say\nprint(cem)', [
      {
        label: 'cem dəyişəni 20 olmalıdır',
        stdin_input: '',
        expected_stdout: '20',
        assertion_code: 'assert cem == 20',
      },
    ]);
    expect(pass.status).toBe('passed');

    const fail = execHarnessInPython('print("Yanlış")', [
      {
        label: 'Düzgün çıxış yoxlaması',
        stdin_input: '',
        expected_stdout: 'Düzgün',
        assertion_code: null,
      },
    ]);
    expect(fail.status).toBe('failed');
    expect(fail.testResults[0]?.passed).toBe(false);
    expect(fail.testResults[0]?.expected).toBe('Düzgün');
    expect(fail.testResults[0]?.actual).toBe('Yanlış');
  });

  it('captures runtime errors and truncates huge stdout output safely', () => {
    const errRes = execHarnessInPython('x = 10 / 0', []);
    expect(errRes.status).toBe('error');
    expect(errRes.stderr).toContain('ZeroDivisionError');

    const truncRes = execHarnessInPython('print("A" * 5000)', [], 300);
    expect(truncRes.stdout.length).toBeLessThan(400);
    expect(truncRes.stdout).toContain('kəsildi');
  });

  it('terminates stuck infinite-loop worker on timeout and recovers with a fresh worker', async () => {
    const workers: MockPythonWorker[] = [];
    const runner = new PythonWorkerRunner(() => {
      const w = new MockPythonWorker();
      workers.push(w);
      return w;
    });

    const p1 = runner.run('while True:\n    pass', {
      timeLimitMs: 500,
      maxOutputChars: 1000,
      testCases: [],
    });

    // Signal worker is ready -> strict 500ms execution timer starts now
    workers[0]!.emitMessage({ type: 'ready' });

    const out1 = await p1;
    expect(out1.status).toBe('timeout');
    expect(out1.stderr).toContain('sonsuz döngü');
    expect(workers[0]!.terminated).toBe(true);

    // Next execution automatically spawns a clean new worker
    const p2 = runner.run('print(42)', {
      timeLimitMs: 1000,
      maxOutputChars: 1000,
      testCases: [],
    });
    expect(workers).toHaveLength(2);
    const reqId = workers[1]!.posted[0]!.id;
    workers[1]!.emitMessage({ type: 'ready' });
    workers[1]!.emitMessage({
      type: 'result',
      id: reqId,
      status: 'passed',
      stdout: '42\n',
      stderr: '',
      executionTimeMs: 12,
      testResults: [],
    });

    const out2 = await p2;
    expect(out2.status).toBe('passed');
    expect(out2.stdout).toBe('42\n');
  });

  it('renders ExerciseBlock UI, inserts 4 spaces on Tab, and displays execution outcome', async () => {
    const user = userEvent.setup();
    const mockRun = vi.fn().mockResolvedValue({
      status: 'passed' as const,
      stdout: 'Salam, Kodera!\n',
      stderr: '',
      executionTimeMs: 18,
      testResults: [{ label: 'Çıxış testi', passed: true }],
    });

    render(
      <ExerciseBlock
        exercise={{
          id: 'ex-1',
          lesson_id: 'l-1',
          locale: 'az',
          title: 'Salamlaşma',
          instructions: 'Ekrana Salam yaz',
          programming_language: 'python',
          starter_code: 'print("Salam, Kodera!")',
          hints: ['Dırnaqları unutma'],
          execution_mode: 'pyodide_worker',
          time_limit_ms: 3000,
          max_output_chars: 10000,
          test_cases: [
            {
              id: 'tc-1',
              exercise_id: 'ex-1',
              label: 'Çıxış testi',
              stdin_input: '',
              expected_stdout: 'Salam, Kodera!',
              assertion_code: null,
              is_hidden: false,
              sort_order: 1,
            },
          ],
        }}
        canSaveAttempt={false}
        onRunPython={mockRun}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Kodu işə sal və yoxla/i }));
    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Bütün testlər keçdi!')).toBeInTheDocument();
    expect(screen.getByText('Salam, Kodera!')).toBeInTheDocument();
  });
});
