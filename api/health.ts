import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from '../server/lib/http';

export default function handler(_req: IncomingMessage, res: ServerResponse): void {
  sendJson(res, 200, {
    status: 'ok',
    service: 'kodera-api',
    timestamp: new Date().toISOString(),
  });
}
