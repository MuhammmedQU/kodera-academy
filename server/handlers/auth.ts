import type { ServerResponse } from 'node:http';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
} from '../../src/shared/validation/schemas.js';
import { requireAdmin, requireAuthenticated } from '../lib/auth.js';
import { getBearerToken, HttpError, sendJson, type ApiRequest } from '../lib/http.js';
import type { KoderaRepository } from '../lib/repository.js';

export async function handleAuthRoute(
  req: ApiRequest,
  res: ServerResponse,
  repo: KoderaRepository,
): Promise<void> {
  const subPath = req.pathname.replace(/^\/api\/auth\/?/, '').replace(/\/$/, '');

  // GET /api/auth/me
  if (req.method === 'GET' && subPath === 'me') {
    const { user } = await requireAuthenticated(req, repo);
    sendJson(res, 200, user);
    return;
  }

  // POST /api/auth/register
  if (req.method === 'POST' && subPath === 'register') {
    const allowedByIp = await repo.checkRateLimit(`register:ip:${req.ip}`, 'register', 900, 10);
    if (!allowedByIp) {
      throw new HttpError(
        429,
        'RATE_LIMIT_EXCEEDED',
        'Çox sayda qeydiyyat cəhdi edildi. Zəhmət olmasa 15 dəqiqə sonra yenidən cəhd edin.',
      );
    }

    // Strip any client-supplied role/status fields explicitly via schema parsing
    const input = registerSchema.parse(req.body);

    const allowedByEmail = await repo.checkRateLimit(
      `register:email:${input.email}`,
      'register',
      900,
      5,
    );
    if (!allowedByEmail) {
      throw new HttpError(
        429,
        'RATE_LIMIT_EXCEEDED',
        'Bu email ünvanı ilə çox sayda cəhd edildi. Bir az sonra yenidən yoxlayın.',
      );
    }

    const result = await repo.registerStudent(input, {
      ipAddress: req.ip,
      userAgent: req.userAgent,
    });
    sendJson(res, 201, result);
    return;
  }

  // POST /api/auth/login (Exclusively Student login in local sandbox mode; rejects admin accounts)
  if (req.method === 'POST' && subPath === 'login') {
    if (!repo.loginSandbox) {
      throw new HttpError(
        405,
        'USE_SUPABASE_AUTH',
        'Giriş birbaşa Supabase Auth müştərisi vasitəsilə icra olunmalıdır.',
      );
    }
    const allowedByIp = await repo.checkRateLimit(`login:ip:${req.ip}`, 'login', 300, 20);
    if (!allowedByIp) {
      throw new HttpError(
        429,
        'RATE_LIMIT_EXCEEDED',
        'Çox sayda giriş cəhdi edildi. Bir az sonra yenidən yoxlayın.',
      );
    }
    const input = loginSchema.parse(req.body);
    const allowedByEmail = await repo.checkRateLimit(
      `login:email:${input.email}`,
      'login',
      300,
      10,
    );
    if (!allowedByEmail) {
      throw new HttpError(
        429,
        'RATE_LIMIT_EXCEEDED',
        'Çox sayda giriş cəhdi edildi. Bir az sonra yenidən yoxlayın.',
      );
    }
    const result = await repo.loginSandbox(input.email, input.password);
    if (result.user.isAdmin) {
      if (repo.logoutSandbox) {
        await repo.logoutSandbox(result.access_token);
      }
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email və ya şifrə yanlışdır.');
    }
    sendJson(res, 200, result);
    return;
  }

  // POST /api/auth/admin-login (Dedicated Admin login in local sandbox mode; rejects student accounts)
  if (req.method === 'POST' && subPath === 'admin-login') {
    if (!repo.loginSandbox) {
      throw new HttpError(
        405,
        'USE_SUPABASE_AUTH',
        'Admin girişi birbaşa Supabase Auth müştərisi vasitəsilə icra olunmalıdır.',
      );
    }
    const allowedByIp = await repo.checkRateLimit(
      `admin_login:ip:${req.ip}`,
      'admin_login',
      300,
      10,
    );
    if (!allowedByIp) {
      throw new HttpError(
        429,
        'RATE_LIMIT_EXCEEDED',
        'Çox sayda administrator giriş cəhdi edildi. Bir az sonra yenidən yoxlayın.',
      );
    }
    const input = loginSchema.parse(req.body);
    const allowedByEmail = await repo.checkRateLimit(
      `admin_login:email:${input.email}`,
      'admin_login',
      300,
      5,
    );
    if (!allowedByEmail) {
      throw new HttpError(
        429,
        'RATE_LIMIT_EXCEEDED',
        'Çox sayda administrator giriş cəhdi edildi. Bir az sonra yenidən yoxlayın.',
      );
    }
    const result = await repo.loginSandbox(input.email, input.password);
    if (!result.user.isAdmin || result.user.profile.account_status !== 'active') {
      if (repo.logoutSandbox) {
        await repo.logoutSandbox(result.access_token);
      }
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email və ya şifrə yanlışdır.');
    }
    sendJson(res, 200, result);
    return;
  }

  // POST /api/auth/admin-verify (Server-side RBAC check after Supabase Auth admin login)
  if (req.method === 'POST' && subPath === 'admin-verify') {
    const allowed = await repo.checkRateLimit(`admin_verify:ip:${req.ip}`, 'admin_verify', 300, 20);
    if (!allowed) {
      throw new HttpError(429, 'RATE_LIMIT_EXCEEDED', 'Çox sayda sorğu göndərildi.');
    }
    const { user } = await requireAdmin(req, repo);
    sendJson(res, 200, user);
    return;
  }

  // POST /api/auth/logout (revokes sandbox token when active; safe no-op otherwise)
  if (req.method === 'POST' && subPath === 'logout') {
    const token = getBearerToken(req.headers);
    if (token && repo.logoutSandbox) {
      await repo.logoutSandbox(token);
    }
    sendJson(res, 200, { logged_out: true });
    return;
  }

  // POST /api/auth/forgot-password (neutral response + IP & per-email rate limiting)
  if (req.method === 'POST' && subPath === 'forgot-password') {
    const allowedByIp = await repo.checkRateLimit(`reset:ip:${req.ip}`, 'password_reset', 900, 5);
    if (!allowedByIp) {
      throw new HttpError(
        429,
        'RATE_LIMIT_EXCEEDED',
        'Çox sayda şifrə bərpası sorğusu göndərildi. Bir az sonra yenidən cəhd edin.',
      );
    }
    const input = forgotPasswordSchema.parse(req.body);
    const allowedByEmail = await repo.checkRateLimit(
      `reset:email:${input.email}`,
      'password_reset',
      900,
      3,
    );
    if (!allowedByEmail) {
      throw new HttpError(
        429,
        'RATE_LIMIT_EXCEEDED',
        'Bu email ünvanı üçün çox sayda bərpa sorğusu göndərildi. Bir az sonra yenidən yoxlayın.',
      );
    }
    await repo.requestPasswordReset(input.email);
    sendJson(res, 200, {
      message:
        'Əgər bu email ünvanı sistemdə mövcuddursa, şifrə bərpa təlimatı emailinizə göndərildi.',
    });
    return;
  }

  // POST /api/auth/resend-verification (neutral response + IP & per-email rate limiting)
  if (req.method === 'POST' && subPath === 'resend-verification') {
    const allowedByIp = await repo.checkRateLimit(
      `verify:ip:${req.ip}`,
      'resend_verification',
      900,
      5,
    );
    if (!allowedByIp) {
      throw new HttpError(
        429,
        'RATE_LIMIT_EXCEEDED',
        'Çox sayda təsdiq sorğusu göndərildi. Bir az sonra yenidən cəhd edin.',
      );
    }
    const input = resendVerificationSchema.parse(req.body);
    const allowedByEmail = await repo.checkRateLimit(
      `verify:email:${input.email}`,
      'resend_verification',
      900,
      3,
    );
    if (!allowedByEmail) {
      throw new HttpError(
        429,
        'RATE_LIMIT_EXCEEDED',
        'Bu email ünvanı üçün çox sayda təsdiq linki istəndi. Bir az sonra yenidən yoxlayın.',
      );
    }
    await repo.resendVerificationEmail(input.email);
    sendJson(res, 200, {
      message:
        'Əgər bu email ünvanı hələ təsdiqlənməyibsə, yeni təsdiq linki emailinizə göndərildi.',
    });
    return;
  }

  throw new HttpError(404, 'NOT_FOUND', 'Auth endpoint tapılmadı.');
}
