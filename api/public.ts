import type { IncomingMessage, ServerResponse } from 'node:http';
import { handlePublicRoute } from '../server/handlers/public.js';
import { getRepository } from '../server/lib/getRepository.js';
import { parseApiRequest, sendError } from '../server/lib/http.js';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const parsed = await parseApiRequest(req);
    const repo = await getRepository();
    await handlePublicRoute(parsed, res, repo);
  } catch (err) {
    sendError(res, err);
  }
}
