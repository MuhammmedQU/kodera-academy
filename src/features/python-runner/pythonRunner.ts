import type { PublicExercise } from '@shared/types/domain';
import type { PythonRunOutcome } from '@/features/lessons/ExerciseBlock';
import type { WorkerOutboundMessage, WorkerRunRequest } from './harness';

const BOOTSTRAP_GRACE_MS = 25_000;

export interface PythonWorkerLike {
  postMessage: (msg: WorkerRunRequest) => void;
  terminate: () => void;
  addEventListener: (
    type: 'message' | 'error',
    listener: (ev: MessageEvent<WorkerOutboundMessage> | ErrorEvent) => void,
  ) => void;
  removeEventListener: (
    type: 'message' | 'error',
    listener: (ev: MessageEvent<WorkerOutboundMessage> | ErrorEvent) => void,
  ) => void;
}

export type WorkerFactory = () => PythonWorkerLike;

function createBrowserPythonWorker(): PythonWorkerLike {
  return new Worker(new URL('./python.worker.ts', import.meta.url), {
    type: 'module',
  }) as unknown as PythonWorkerLike;
}

/**
 * Isolated browser Python execution manager using a dedicated Web Worker + Pyodide.
 *
 * SECURITY & RELIABILITY GUARANTEES:
 * - Student code NEVER runs on the backend.
 * - UI main thread NEVER freezes.
 * - Infinite loops (e.g. `while True: pass`) are strictly terminated via `worker.terminate()`
 *   once `timeLimitMs` expires after runtime readiness.
 * - Cancelling/stopping settles pending promises immediately and clears all timers (zero leaks).
 */
export class PythonWorkerRunner {
  private worker: PythonWorkerLike | null = null;
  private isReady = false;
  private factory: WorkerFactory;
  private activeCancel: ((reason?: string) => void) | null = null;

  constructor(factory: WorkerFactory = createBrowserPythonWorker) {
    this.factory = factory;
  }

  private ensureWorker(): PythonWorkerLike {
    if (!this.worker) {
      this.worker = this.factory();
      this.isReady = false;
    }
    return this.worker;
  }

  public terminate(reason = 'İcra istifadəçi tərəfindən dayandırıldı.'): void {
    const cancel = this.activeCancel;
    this.activeCancel = null;
    if (cancel) {
      cancel(reason);
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
    }
  }

  public run(
    code: string,
    options: {
      timeLimitMs: number;
      maxOutputChars: number;
      testCases: WorkerRunRequest['testCases'];
      onStatus?: (stage: string) => void;
    },
  ): Promise<PythonRunOutcome> {
    if (typeof Worker === 'undefined' && this.factory === createBrowserPythonWorker) {
      return Promise.resolve({
        status: 'error',
        stdout: '',
        stderr: 'Bu brauzer Web Worker dəstəkləmir; interaktiv Python mühiti işlədilə bilmədi.',
        executionTimeMs: 0,
        testResults: [],
      });
    }

    if (this.activeCancel) {
      this.terminate('Əvvəlki icra yeni sorğu ilə əvəz olundu.');
    }

    const worker = this.ensureWorker();
    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const clampedLimit = Math.min(Math.max(options.timeLimitMs, 500), 15_000);

    return new Promise<PythonRunOutcome>((resolve) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const finish = (outcome: PythonRunOutcome) => {
        if (settled) return;
        settled = true;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        if (this.activeCancel === cancelCurrent) {
          this.activeCancel = null;
        }
        resolve(outcome);
      };

      const cancelCurrent = (reason?: string) => {
        finish({
          status: 'timeout',
          stdout: '',
          stderr: reason || 'İcra istifadəçi tərəfindən dayandırıldı.',
          executionTimeMs: 0,
          testResults: [],
          cancelled: true,
        });
      };

      this.activeCancel = cancelCurrent;

      const armTimer = (ms: number, isBootstrap: boolean) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          if (settled) return;
          finish({
            status: isBootstrap ? 'error' : 'timeout',
            stdout: '',
            stderr: isBootstrap
              ? 'Python WebAssembly mühiti vaxtında yüklənmədi (internet bağlantınızı yoxlayın).'
              : `İcra vaxtı limiti (${(clampedLimit / 1000).toFixed(1)} san) aşıldı. Kodda sonsuz döngü ola bilər.`,
            executionTimeMs: ms,
            testResults: [],
          });
          if (this.worker === worker) {
            this.worker.terminate();
            this.worker = null;
            this.isReady = false;
          }
        }, ms);
      };

      const onMessage = (event: MessageEvent<WorkerOutboundMessage> | ErrorEvent) => {
        if (!('data' in event)) return;
        const msg = event.data;
        if (!msg) return;

        if (msg.type === 'loading') {
          options.onStatus?.(msg.stage);
          return;
        }

        if (msg.type === 'ready') {
          this.isReady = true;
          options.onStatus?.('Python kodu icra olunur...');
          armTimer(clampedLimit, false);
          return;
        }

        if (msg.type === 'init_error' && (!msg.id || msg.id === runId)) {
          finish({
            status: 'error',
            stdout: '',
            stderr: msg.message,
            executionTimeMs: 0,
            testResults: [],
          });
          if (this.worker === worker) {
            this.worker.terminate();
            this.worker = null;
            this.isReady = false;
          }
          return;
        }

        if (msg.type === 'result' && msg.id === runId) {
          finish({
            status: msg.status,
            stdout: msg.stdout,
            stderr: msg.stderr,
            executionTimeMs: msg.executionTimeMs,
            testResults: msg.testResults,
          });
        }
      };

      const onError = (ev: MessageEvent<WorkerOutboundMessage> | ErrorEvent) => {
        const message = 'message' in ev && ev.message ? ev.message : 'Worker icra xətası baş verdi.';
        finish({
          status: 'error',
          stdout: '',
          stderr: message,
          executionTimeMs: 0,
          testResults: [],
        });
        if (this.worker === worker) {
          this.worker.terminate();
          this.worker = null;
          this.isReady = false;
        }
      };

      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);

      armTimer(this.isReady ? clampedLimit : BOOTSTRAP_GRACE_MS, !this.isReady);

      worker.postMessage({
        id: runId,
        code,
        maxOutputChars: options.maxOutputChars,
        testCases: options.testCases,
      });
    });
  }
}

const sharedRunner = new PythonWorkerRunner();

export function runPythonExercise(
  code: string,
  exercise: PublicExercise,
  onStatus?: (stage: string) => void,
): Promise<PythonRunOutcome> {
  return sharedRunner.run(code, {
    timeLimitMs: exercise.time_limit_ms,
    maxOutputChars: exercise.max_output_chars,
    testCases: exercise.test_cases.map((tc) => ({
      label: tc.label,
      stdin_input: tc.stdin_input,
      expected_stdout: tc.expected_stdout,
      assertion_code: tc.assertion_code,
    })),
    onStatus,
  });
}

export function resetSharedPythonRunner(): void {
  sharedRunner.terminate();
}
