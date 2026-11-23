import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAdminRoute } from '../handlers/admin.js';
import { handleAuthRoute } from '../handlers/auth.js';
import { handlePublicRoute } from '../handlers/public.js';
import { handleStudentRoute } from '../handlers/student.js';
import { getRepository } from '../lib/getRepository.js';
import { parseApiRequest, sendError, sendJson } from '../lib/http.js';

export async function dispatchApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const parsed = await parseApiRequest(req);
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

    if (parsed.pathname === '/api/health') {
      sendJson(res, 200, {
        status: 'ok',
        service: 'kodera-api',
        mode: !isProd && process.env.KODERA_LOCAL_SANDBOX === 'true' ? 'local-sandbox' : 'supabase',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const repo = await getRepository();

    if (parsed.pathname.startsWith('/api/public')) {
      await handlePublicRoute(parsed, res, repo);
      return;
    }

    if (parsed.pathname.startsWith('/api/auth')) {
      await handleAuthRoute(parsed, res, repo);
      return;
    }

    if (parsed.pathname.startsWith('/api/student')) {
      await handleStudentRoute(parsed, res, repo);
      return;
    }

    if (parsed.pathname.startsWith('/api/admin')) {
      await handleAdminRoute(parsed, res, repo);
      return;
    }

    sendJson(res, 404, { error: 'API route not found' });
  } catch (err) {
    sendError(res, err);
  }
}

export async function handleDevApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  await dispatchApiRequest(req, res);
}
