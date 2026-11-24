import type { AuthSessionUser } from '../../src/shared/types/domain.js';
import { getBearerToken, HttpError, type ApiRequest } from './http.js';
import type { AuditContext, KoderaRepository } from './repository.js';

/**
 * Resolves the current user strictly from the server-verified Authorization Bearer JWT.
 * NEVER trusts role headers, body flags, or client-supplied metadata.
 */
export async function resolveOptionalUser(
  req: ApiRequest,
  repo: KoderaRepository,
): Promise<AuthSessionUser | null> {
  const token = getBearerToken(req.headers);
  if (!token) return null;
  return repo.resolveUserByToken(token);
}

export async function requireAuthenticated(
  req: ApiRequest,
  repo: KoderaRepository,
): Promise<{ user: AuthSessionUser; token: string }> {
  const token = getBearerToken(req.headers);
  if (!token) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Bu əməliyyat üçün hesabınıza daxil olmalısınız.');
  }
  const user = await repo.resolveUserByToken(token);
  if (!user) {
    throw new HttpError(401, 'INVALID_SESSION', 'Sessiyanız etibarsızdır və ya vaxtı bitib.');
  }
  return { user, token };
}

export async function requireActiveStudent(
  req: ApiRequest,
  repo: KoderaRepository,
): Promise<{ user: AuthSessionUser; token: string }> {
  const result = await requireAuthenticated(req, repo);
  if (result.user.isAdmin || !result.user.isActiveStudent) {
    throw new HttpError(
      403,
      'STUDENT_ACCESS_REQUIRED',
      'Tələbə panelinə giriş yalnız təsdiqlənmiş aktiv tələbə hesabları üçün açıqdır.',
    );
  }
  return result;
}

export async function requireAdmin(
  req: ApiRequest,
  repo: KoderaRepository,
): Promise<{ user: AuthSessionUser; token: string; audit: AuditContext }> {
  const result = await requireAuthenticated(req, repo);
  if (!result.user.isAdmin || result.user.profile.account_status !== 'active') {
    throw new HttpError(
      403,
      'ADMIN_ACCESS_REQUIRED',
      'Bu əməliyyat yalnız səlahiyyətli administratorlar üçündür.',
    );
  }
  return {
    ...result,
    audit: {
      actorId: result.user.profile.id,
      actorRole: 'admin',
      ipAddress: req.ip,
      userAgent: req.userAgent,
    },
  };
}
