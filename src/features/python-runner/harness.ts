export interface WorkerTestCaseInput {
  label: string;
  stdin_input: string;
  expected_stdout: string | null;
  assertion_code: string | null;
}

export interface WorkerRunRequest {
  id: string;
  code: string;
  maxOutputChars: number;
  testCases: WorkerTestCaseInput[];
}

export interface WorkerTestCaseResult {
  label: string;
  passed: boolean;
  expected: string | null;
  actual: string | null;
  error: string | null;
}

export type WorkerOutboundMessage =
  | { type: 'ready' }
  | { type: 'loading'; stage: string }
  | {
      type: 'result';
      id: string;
      status: 'passed' | 'failed' | 'error';
      stdout: string;
      stderr: string;
      executionTimeMs: number;
      testResults: WorkerTestCaseResult[];
    }
  | { type: 'init_error'; id?: string; message: string };

/**
 * Pure Python harness script executed inside the isolated Pyodide Web Worker.
 * Captures stdout/stderr, mocks builtins.input from predefined test stdin lines,
 * enforces output truncation, separates student runtime errors from test assertion
 * failures, and evaluates predefined test cases cleanly.
 */
export const PYTHON_RUNNER_HARNESS = `
import io
import sys
import json
import traceback
import contextlib

def _kodera_run(user_code, test_cases_json, max_output_chars):
    test_cases = json.loads(test_cases_json)
    results = []
    primary_stdout = ""
    primary_stderr = ""
    had_runtime_error = False

    def _exec_single(stdin_text, assertion_code):
        stdout_buf = io.StringIO()
        stderr_buf = io.StringIO()
        input_lines = stdin_text.splitlines()
        input_idx = {"i": 0}

        def _fake_input(prompt=""):
            if prompt:
                stdout_buf.write(str(prompt))
            i = input_idx["i"]
            if i >= len(input_lines):
                raise EOFError("input() üçün kifayət qədər daxil edilən sətir yoxdur.")
            input_idx["i"] = i + 1
            return input_lines[i]

        builtins_src = __builtins__.__dict__ if hasattr(__builtins__, "__dict__") else __builtins__
        builtins_dict = dict(builtins_src)
        orig_import = builtins_dict["__import__"]

        def _safe_import(name, globals=None, locals=None, fromlist=(), level=0):
            root = (name or "").split(".")[0]
            if root in ("js", "pyodide", "pyodide_js"):
                raise ImportError(f"'{name}' modulu öyrənmə mühitində məhdudlaşdırılıb.")
            return orig_import(name, globals, locals, fromlist, level)

        builtins_dict["input"] = _fake_input
        builtins_dict["__import__"] = _safe_import

        safe_globals = {
            "__name__": "__main__",
            "__builtins__": builtins_dict,
        }

        runtime_err = None
        assertion_err = None

        with contextlib.redirect_stdout(stdout_buf), contextlib.redirect_stderr(stderr_buf):
            try:
                compiled = compile(user_code, "<student_code.py>", "exec")
                exec(compiled, safe_globals)
            except BaseException as exc:
                tb_lines = traceback.format_exception(type(exc), exc, exc.__traceback__)
                runtime_err = "".join(tb_lines[-3:]).strip()

            if runtime_err is None and assertion_code:
                try:
                    assert_compiled = compile(assertion_code, "<test_assertion.py>", "exec")
                    exec(assert_compiled, safe_globals)
                except AssertionError as exc:
                    detail = str(exc).strip()
                    assertion_err = detail if detail else "Kodun nəticəsi gözlənilən test şərtinə uyğun gəlmədi."
                except BaseException as exc:
                    assertion_err = f"{type(exc).__name__}: {exc}"

        out = stdout_buf.getvalue()
        if len(out) > max_output_chars:
            out = out[:max_output_chars] + "\\n...[çıxış limiti aşıldı, kəsildi]"

        err = stderr_buf.getvalue()
        if runtime_err:
            err = (err + "\\n" + runtime_err).strip() if err else runtime_err
        if len(err) > max_output_chars:
            err = err[:max_output_chars] + "\\n...[xəta çıxışı kəsildi]"

        return out, err, assertion_err

    if not test_cases:
        out, err, _ = _exec_single("", None)
        primary_stdout = out
        primary_stderr = err
        had_runtime_error = bool(err)
    else:
        for idx, tc in enumerate(test_cases):
            out, err, assert_err = _exec_single(tc.get("stdin_input") or "", tc.get("assertion_code"))
            if idx == 0:
                primary_stdout = out
                primary_stderr = err
            if err:
                had_runtime_error = True
                results.append({
                    "label": tc["label"],
                    "passed": False,
                    "expected": tc.get("expected_stdout"),
                    "actual": out.strip(),
                    "error": err,
                })
                continue

            if assert_err:
                results.append({
                    "label": tc["label"],
                    "passed": False,
                    "expected": tc.get("expected_stdout"),
                    "actual": out.strip(),
                    "error": assert_err,
                })
                continue

            expected = tc.get("expected_stdout")
            if expected is not None:
                passed = out.strip() == str(expected).strip()
                results.append({
                    "label": tc["label"],
                    "passed": passed,
                    "expected": str(expected).strip(),
                    "actual": out.strip(),
                    "error": None,
                })
            else:
                results.append({
                    "label": tc["label"],
                    "passed": True,
                    "expected": None,
                    "actual": out.strip(),
                    "error": None,
                })

    if had_runtime_error:
        status = "error"
    elif results and all(r["passed"] for r in results):
        status = "passed"
    elif not results:
        status = "passed"
    else:
        status = "failed"

    return json.dumps({
        "status": status,
        "stdout": primary_stdout,
        "stderr": primary_stderr,
        "testResults": results,
    })
`;
