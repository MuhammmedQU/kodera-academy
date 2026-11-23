import type { IncomingMessage, ServerResponse } from 'node:http';
import { isIP } from 'node:net';
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

function normalizeCandidateIp(raw: string | undefined): string | null {
  if (!raw) return null;
  let candidate = raw.trim();
  if (!candidate || candidate.length > 64) return null;
  if (candidate.startsWith('::ffff:')) {
    candidate = candidate.slice(7);
  }
  return isIP(candidate) !== 0 ? candidate : null;
}

export function sanitizeIpForDb(ip: string | null | undefined): string | null {
  return normalizeCandidateIp(ip ?? undefined);
}

export function getClientIp(req: IncomingMessage): string {
  // Prefer Vercel-verified platform headers when present; validate strictly with node:net isIP()
  const platformHeaders = [
    req.headers['x-vercel-forwarded-for'],
    req.headers['x-real-ip'],
    req.headers['x-forwarded-for'],
  ];

  for (const header of platformHeaders) {
    const raw = Array.isArray(header) ? header[0] : header;
    if (typeof raw === 'string' && raw.length > 0) {
      const firstPart = raw.split(',')[0];
      const valid = normalizeCandidateIp(firstPart);
      if (valid) return valid;
    }
  }

  return normalizeCandidateIp(req.socket?.remoteAddress) ?? '127.0.0.1';
}

export function getBearerToken(headers: IncomingMessage['headers']): string | null {
  const raw = headers.authorization ?? headers.Authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  // Vercel Node runtime may expose req.body as a lazy getter that throws on invalid JSON
  let preParsed: unknown;
  try {
    preParsed = (req as IncomingMessage & { body?: unknown }).body;
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'JSON formatı düzgün deyil.');
  }

  if (preParsed !== undefined && preParsed !== null) {
    if (Buffer.isBuffer(preParsed)) {
      if (preParsed.byteLength > MAX_BODY_BYTES) {
        throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Sorğu həcmi icazə verilən limiti aşır.');
      }
      const raw = preParsed.toString('utf8').trim();
      if (!raw) return {};
      try {
        return JSON.parse(raw);
      } catch {
        throw new HttpError(400, 'INVALID_JSON', 'JSON formatı düzgün deyil.');
      }
    }

    if (typeof preParsed === 'string') {
      if (Buffer.byteLength(preParsed, 'utf8') > MAX_BODY_BYTES) {
        throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Sorğu həcmi icazə verilən limiti aşır.');
      }
      const trimmed = preParsed.trim();
      if (!trimmed) return {};
      try {
        return JSON.parse(trimmed);
      } catch {
        throw new HttpError(400, 'INVALID_JSON', 'JSON formatı düzgün deyil.');
      }
    }

    // Object pre-parsed by Vercel runtime — still enforce our 1 MB byte cap
    try {
      const serializedSize = Buffer.byteLength(JSON.stringify(preParsed), 'utf8');
      if (serializedSize > MAX_BODY_BYTES) {
        throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Sorğu həcmi icazə verilən limiti aşır.');
      }
    } catch (err) {
      if (err instanceof HttpError) throw err;
      throw new HttpError(400, 'INVALID_JSON', 'JSON formatı düzgün deyil.');
    }
    return preParsed;
  }

  if (typeof req.on !== 'function') {
    return {};
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

  // Reconstruct canonical pathname when Vercel rewrites /api/<domain>/:path* -> /api/<domain>?__route=:path*
  let pathname = parsedUrl.pathname;
  const rewrittenRoute = parsedUrl.searchParams.get('__route');
  if (rewrittenRoute !== null) {
    parsedUrl.searchParams.delete('__route');
    const cleanBase = pathname.replace(/\/$/, '');
    const cleanSuffix = rewrittenRoute.replace(/^\/+/, '');
    pathname = cleanSuffix ? `${cleanBase}/${cleanSuffix}` : cleanBase;
  }

  const shouldReadBody = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  const body = shouldReadBody ? await readJsonBody(req) : undefined;
  const ua = req.headers['user-agent'];

  return {
    method,
    url: rawUrl,
    pathname,
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
