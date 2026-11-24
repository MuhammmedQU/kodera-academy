import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  getEphemeralSandboxPassword,
  LocalSandboxRepository,
} from '@server/dev/localSandboxRepository';
import { dispatchApiRequest } from '@server/dev/viteApiMiddleware';
import { resetRepositoryForTests } from '@server/lib/getRepository';

export interface TestResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export function createTestSandbox(): LocalSandboxRepository {
  process.env.KODERA_LOCAL_SANDBOX = 'true';
  const repo = new LocalSandboxRepository();
  resetRepositoryForTests(repo);
  return repo;
}

export async function callApi(options: {
  method?: string;
  url: string;
  body?: unknown;
  token?: string;
  ip?: string;
}): Promise<TestResponse> {
  const headers: Record<string, string> = {
    'user-agent': 'vitest-security-runner',
  };
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  if (options.ip) headers['x-forwarded-for'] = options.ip;

  const req = {
    method: options.method ?? 'GET',
    url: options.url,
    headers,
    body: options.body,
    socket: { remoteAddress: options.ip ?? '127.0.0.1' },
  } as unknown as IncomingMessage;

  let status = 200;
  const resHeaders: Record<string, string> = {};
  let rawBody = '';

  const res = {
    get statusCode() {
      return status;
    },
    set statusCode(code: number) {
      status = code;
    },
    headersSent: false,
    setHeader(name: string, value: string) {
      resHeaders[name.toLowerCase()] = String(value);
    },
    end(chunk?: string) {
      if (chunk) rawBody += chunk;
      (this as { headersSent: boolean }).headersSent = true;
    },
  } as unknown as ServerResponse;

  await dispatchApiRequest(req, res);

  let parsed: unknown = null;
  if (rawBody) {
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = rawBody;
    }
  }

  return { status, headers: resHeaders, body: parsed };
}

export async function loginAs(
  email: string,
  password = getEphemeralSandboxPassword(),
): Promise<string> {
  const res = await callApi({
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password },
  });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return (res.body as { data: { access_token: string } }).data.access_token;
}

export async function loginAdminAs(
  email = 'koderaaz@gmail.com',
  password = getEphemeralSandboxPassword(),
): Promise<string> {
  const res = await callApi({
    method: 'POST',
    url: '/api/auth/admin-login',
    body: { email, password },
  });
  if (res.status !== 200) {
    throw new Error(`Admin login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return (res.body as { data: { access_token: string } }).data.access_token;
}
