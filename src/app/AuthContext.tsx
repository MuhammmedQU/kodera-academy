import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AuthSessionUser } from '@shared/types/domain';
import type { LoginInput, RegisterInput } from '@shared/validation/schemas';
import { apiRequest, getSandboxToken, setSandboxToken } from '@/lib/apiClient';
import { clientEnv } from '@/lib/env';
import { getSupabaseClient } from '@/lib/supabase';

interface RegisterResult {
  user: AuthSessionUser | null;
  requiresEmailVerification: boolean;
  referenceCode?: string;
}

interface AuthContextValue {
  user: AuthSessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  justLoggedOut: boolean;
  acknowledgeLogout: () => void;
  refreshUser: () => Promise<AuthSessionUser | null>;
  login: (input: LoginInput) => Promise<AuthSessionUser>;
  loginAdmin: (input: LoginInput) => Promise<AuthSessionUser>;
  register: (input: RegisterInput) => Promise<RegisterResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isPasswordRecoveryUrl(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.pathname === '/reset-password' &&
    (window.location.hash.includes('type=recovery') ||
      window.location.search.includes('type=recovery') ||
      window.location.search.includes('code='))
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [justLoggedOut, setJustLoggedOut] = useState(false);
  const inFlightRefresh = useRef<Promise<AuthSessionUser | null> | null>(null);

  const acknowledgeLogout = useCallback(() => {
    setJustLoggedOut(false);
  }, []);

  const refreshUser = useCallback(async (): Promise<AuthSessionUser | null> => {
    if (inFlightRefresh.current) {
      return inFlightRefresh.current;
    }

    const promise = (async () => {
      if (isPasswordRecoveryUrl()) {
        setUser(null);
        setIsLoading(false);
        return null;
      }

      const supabase = getSupabaseClient();
      const hasToken = supabase
        ? Boolean((await supabase.auth.getSession()).data.session?.access_token)
        : Boolean(getSandboxToken());

      if (!hasToken) {
        setUser(null);
        setIsLoading(false);
        return null;
      }

      try {
        const me = await apiRequest<AuthSessionUser>('/api/auth/me', { auth: true });
        setUser(me);
        return me;
      } catch {
        setUser(null);
        if (clientEnv.isLocalSandbox) {
          setSandboxToken(null);
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    })();

    inFlightRefresh.current = promise;
    try {
      return await promise;
    } finally {
      inFlightRefresh.current = null;
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      void refreshUser();
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Never promote a PASSWORD_RECOVERY link session into normal authenticated navigation
      if (event === 'PASSWORD_RECOVERY') {
        setUser(null);
        setIsLoading(false);
        return;
      }
      if (!session) {
        setUser(null);
        setIsLoading(false);
      } else {
        void refreshUser();
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [refreshUser]);

  const login = useCallback(
    async (input: LoginInput): Promise<AuthSessionUser> => {
      setJustLoggedOut(false);
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('email not confirmed')) {
            throw new Error(
              'Email ünvanınız hələ təsdiqlənməyib. Zəhmət olmasa email qutunuzdakı təsdiq linkinə klikləyin.',
            );
          }
          if (msg.includes('too many requests') || msg.includes('rate limit')) {
            throw new Error('Çox sayda giriş cəhdi edildi. Bir az sonra yenidən yoxlayın.');
          }
          throw new Error('Email və ya şifrə yanlışdır.');
        }
        const me = await refreshUser();
        if (!me) {
          throw new Error('Hesab məlumatları yüklənə bilmədi.');
        }
        // Student login (/login) is exclusively for students; reject admin accounts here
        if (me.isAdmin) {
          await supabase.auth.signOut().catch(() => {});
          setUser(null);
          throw new Error('Email və ya şifrə yanlışdır.');
        }
        return me;
      }

      if (clientEnv.isLocalSandbox) {
        const res = await apiRequest<{ access_token: string; user: AuthSessionUser }>(
          '/api/auth/login',
          { method: 'POST', body: input, auth: false },
        );
        setSandboxToken(res.access_token);
        setUser(res.user);
        return res.user;
      }

      throw new Error(
        'Autentifikasiya servisi (Supabase) hələ konfiqurasiya edilməyib. .env.local faylını yoxlayın.',
      );
    },
    [refreshUser],
  );

  const loginAdmin = useCallback(
    async (input: LoginInput): Promise<AuthSessionUser> => {
      setJustLoggedOut(false);
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('too many requests') || msg.includes('rate limit')) {
            throw new Error(
              'Çox sayda administrator giriş cəhdi edildi. Bir az sonra yenidən yoxlayın.',
            );
          }
          throw new Error('Email və ya şifrə yanlışdır.');
        }
        try {
          await apiRequest<AuthSessionUser>('/api/auth/admin-verify', {
            method: 'POST',
            auth: true,
          });
        } catch {
          await supabase.auth.signOut().catch(() => {});
          setUser(null);
          throw new Error('Email və ya şifrə yanlışdır.');
        }
        const me = await refreshUser();
        if (!me || !me.isAdmin) {
          await supabase.auth.signOut().catch(() => {});
          setUser(null);
          throw new Error('Email və ya şifrə yanlışdır.');
        }
        return me;
      }

      if (clientEnv.isLocalSandbox) {
        const res = await apiRequest<{ access_token: string; user: AuthSessionUser }>(
          '/api/auth/admin-login',
          { method: 'POST', body: input, auth: false },
        );
        setSandboxToken(res.access_token);
        setUser(res.user);
        return res.user;
      }

      throw new Error(
        'Autentifikasiya servisi (Supabase) hələ konfiqurasiya edilməyib. .env.local faylını yoxlayın.',
      );
    },
    [refreshUser],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<RegisterResult> => {
      const res = await apiRequest<{
        access_token?: string;
        requires_email_verification: boolean;
        reference_code?: string;
        user?: AuthSessionUser;
      }>('/api/auth/register', {
        method: 'POST',
        body: input,
        auth: false,
      });

      const supabase = getSupabaseClient();
      if (supabase && !res.requires_email_verification) {
        await supabase.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });
        const me = await refreshUser();
        return {
          user: me,
          requiresEmailVerification: false,
          referenceCode: res.reference_code,
        };
      }

      if (clientEnv.isLocalSandbox && res.access_token && res.user) {
        setSandboxToken(res.access_token);
        setUser(res.user);
        return {
          user: res.user,
          requiresEmailVerification: false,
          referenceCode: res.reference_code ?? res.user.application?.reference_code,
        };
      }

      return {
        user: res.user ?? null,
        requiresEmailVerification: res.requires_email_verification,
        referenceCode: res.reference_code,
      };
    },
    [refreshUser],
  );

  const logout = useCallback(async () => {
    const token = clientEnv.isLocalSandbox ? getSandboxToken() : null;
    setJustLoggedOut(true);
    setUser(null);
    if (clientEnv.isLocalSandbox) {
      setSandboxToken(null);
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        justLoggedOut,
        acknowledgeLogout,
        refreshUser,
        login,
        loginAdmin,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
