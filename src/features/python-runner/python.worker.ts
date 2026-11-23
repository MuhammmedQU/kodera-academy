/// <reference lib="webworker" />
import {
  PYTHON_RUNNER_HARNESS,
  type WorkerOutboundMessage,
  type WorkerRunRequest,
} from './harness';

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: {
    set: (key: string, value: unknown) => void;
    get: (key: string) => unknown;
    delete: (key: string) => void;
  };
}

const PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/';

let pyodidePromise: Promise<PyodideInstance> | null = null;
let pyodideReady = false;

function post(msg: WorkerOutboundMessage): void {
  self.postMessage(msg);
}

async function getPyodide(): Promise<PyodideInstance> {
  if (!pyodidePromise) {
    post({ type: 'loading', stage: 'Python WebAssembly mühiti yüklənir...' });
    pyodidePromise = (async () => {
      const mod = (await import(
        /* @vite-ignore */ `${PYODIDE_INDEX_URL}pyodide.mjs`
      )) as {
        loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInstance>;
      };
      const instance = await mod.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
      await instance.runPythonAsync(PYTHON_RUNNER_HARNESS);
      pyodideReady = true;
      post({ type: 'ready' });
      return instance;
    })();
  }
  return pyodidePromise;
}

self.addEventListener('message', async (event: MessageEvent<WorkerRunRequest>) => {
  const req = event.data;
  if (!req || !req.id) return;

  try {
    const pyodide = await getPyodide();
    if (pyodideReady) {
      post({ type: 'ready' });
    }

    const start = performance.now();
    pyodide.globals.set('_kodera_user_code', req.code);
    pyodide.globals.set('_kodera_test_cases_json', JSON.stringify(req.testCases));
    pyodide.globals.set('_kodera_max_out', req.maxOutputChars);

    const rawJson = (await pyodide.runPythonAsync(
      '_kodera_run(_kodera_user_code, _kodera_test_cases_json, _kodera_max_out)',
    )) as string;

    const elapsed = Math.round(performance.now() - start);
    const parsed = JSON.parse(rawJson) as {
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

    post({
      type: 'result',
      id: req.id,
      status: parsed.status,
      stdout: parsed.stdout,
      stderr: parsed.stderr,
      executionTimeMs: elapsed,
      testResults: parsed.testResults,
    });
  } catch (err) {
    pyodidePromise = null;
    pyodideReady = false;
    post({
      type: 'init_error',
      id: req.id,
      message:
        err instanceof Error
          ? `Python mühiti işə salına bilmədi: ${err.message}`
          : 'Python mühiti yüklənərkən xəta baş verdi.',
    });
  }
});
