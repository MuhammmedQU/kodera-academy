import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from '../server/lib/http.js';

export default function handler(_req: IncomingMessage, res: ServerResponse): void {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  sendJson(res, 200, {
    status: 'ok',
    service: 'kodera-api',
    mode: !isProd && process.env.KODERA_LOCAL_SANDBOX === 'true' ? 'local-sandbox' : 'supabase',
    timestamp: new Date().toISOString(),
  });
}
