import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAdminRoute } from '../handlers/admin';
import { handleAuthRoute } from '../handlers/auth';
import { handlePublicRoute } from '../handlers/public';
import { handleStudentRoute } from '../handlers/student';
import { getRepository } from '../lib/getRepository';
import { parseApiRequest, sendError, sendJson } from '../lib/http';

export async function dispatchApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const parsed = await parseApiRequest(req);

    if (parsed.pathname === '/api/health') {
      sendJson(res, 200, {
        status: 'ok',
        service: 'kodera-api',
        mode:
          process.env.NODE_ENV !== 'production' && process.env.KODERA_LOCAL_SANDBOX === 'true'
            ? 'local-sandbox'
            : 'supabase',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const repo = getRepository();

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
