import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ZodError } from 'zod';

const MAX_BODY_BYTES = 1_048_576; // 1 MB hard cap against payload DoS

export interface ApiRequest {
  method: string;
  url: string;
  pathname: string;
  query: URLSearchParams;
  headers: IncomingMessage['headers'];
  body: unknown;
  ip: string;
  userAgent: string;
}

export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || '127.0.0.1';
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0]?.trim() || '127.0.0.1';
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

export function getBearerToken(headers: IncomingMessage['headers']): string | null {
  const raw = headers.authorization ?? headers.Authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  // Vercel sometimes pre-parses req.body
  const preParsed = (req as IncomingMessage & { body?: unknown }).body;
  if (preParsed !== undefined && preParsed !== null) {
    if (typeof preParsed === 'string') {
      return preParsed.length > 0 ? JSON.parse(preParsed) : {};
    }
    return preParsed;
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;

    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Sorğu həcmi icazə verilən limiti aşır.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new HttpError(400, 'INVALID_JSON', 'JSON formatı düzgün deyil.'));
      }
    });

    req.on('error', () => {
      reject(new HttpError(400, 'READ_ERROR', 'Sorğu oxunarkən xəta baş verdi.'));
    });
  });
}

export async function parseApiRequest(req: IncomingMessage): Promise<ApiRequest> {
  const method = (req.method || 'GET').toUpperCase();
  const rawUrl = req.url || '/';
  const parsedUrl = new URL(rawUrl, 'http://localhost');
  const shouldReadBody = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  const body = shouldReadBody ? await readJsonBody(req) : undefined;
  const ua = req.headers['user-agent'];

  return {
    method,
    url: rawUrl,
    pathname: parsedUrl.pathname,
    query: parsedUrl.searchParams,
    headers: req.headers,
    body,
    ip: getClientIp(req),
    userAgent: typeof ua === 'string' ? ua.slice(0, 500) : '',
  };
}

export function setSecurityHeaders(res: ServerResponse, cacheControl = 'no-store'): void {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', cacheControl);
}

export function sendJson(
  res: ServerResponse,
  status: number,
  data: unknown,
  cacheControl = 'no-store',
): void {
  setSecurityHeaders(res, cacheControl);
  res.statusCode = status;
  res.end(JSON.stringify({ data }));
}

export function sendError(res: ServerResponse, err: unknown): void {
  setSecurityHeaders(res, 'no-store');

  if (err instanceof HttpError) {
    res.statusCode = err.status;
    res.end(
      JSON.stringify({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      }),
    );
    return;
  }

  if (err && typeof err === 'object' && 'issues' in err && Array.isArray((err as ZodError).issues)) {
    const zodErr = err as ZodError;
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: zodErr.issues[0]?.message || 'Göndərilən məlumatlar düzgün deyil.',
          details: zodErr.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        },
      }),
    );
    return;
  }

  console.error('[Kodera API Unhandled Error]', err);
  res.statusCode = 500;
  res.end(
    JSON.stringify({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Serverdə gözlənilməz xəta baş verdi.',
      },
    }),
  );
}
