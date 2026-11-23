import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAdminRoute } from '../../server/handlers/admin';
import { getRepository } from '../../server/lib/getRepository';
import { parseApiRequest, sendError } from '../../server/lib/http';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const parsed = await parseApiRequest(req);
    await handleAdminRoute(parsed, res, getRepository());
  } catch (err) {
    sendError(res, err);
  }
}
