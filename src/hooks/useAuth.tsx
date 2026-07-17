import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { AdminRole } from './useAdmins';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  access: string[];
  username: string;
  role: AdminRole;
  signIn: (identifier: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const DOMAIN = '@admin.maxslot88.com';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ncymtdnmpcjinhmyqntq.supabase.co';
const BASE = SUPABASE_URL + '/functions/v1';
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const SESSION_TOKEN_KEY = 'admin_session_token';
const SESSION_CHECK_INTERVAL = 30_000; // 30 seconds

function toEmail(identifier: string): string {
  const v = identifier.trim().toLowerCase();
  return v.includes('@') ? v : `${v}${DOMAIN}`;
}

function extractMeta(user: User | null): { access: string[]; username: string; role: AdminRole } {
  if (!user) return { access: [], username: '', role: 'staff' };
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    access: Array.isArray(meta.access) ? (meta.access as string[]) : [],
    username: (meta.username as string) ?? (user.email ?? '').split('@')[0],
    role: (meta.role as AdminRole) ?? 'staff',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[Auth] getSession failed:', err);
        if (!mounted) return;
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!mounted) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Periodic session validation
  useEffect(() => {
    if (!user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const validateSession = async () => {
      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!storedToken || !user) return;

      try {
        const res = await fetch(`${BASE}/validate-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, session_token: storedToken }),
        });
        const json = await res.json();

        if (!json.valid) {
          localStorage.removeItem(SESSION_TOKEN_KEY);
          await supabase.auth.signOut();
        }
      } catch {
        // network error — skip this check
      }
    };

    validateSession();
    intervalRef.current = setInterval(validateSession, SESSION_CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user]);

  const signIn = async (identifier: string, password: string): Promise<string | null> => {
    try {
      const email = toEmail(identifier);

      const res = await fetch(`${BASE}/auth-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('[Auth] Non-JSON response:', res.status, text);
        return `Server error (${res.status}). Coba lagi dalam beberapa detik.`;
      }

      const json = await res.json();

      if (!res.ok || json.error) {
        return json.error ?? 'Login gagal';
      }

      // Store session token for single-session enforcement
      if (json.session_token) {
        localStorage.setItem(SESSION_TOKEN_KEY, json.session_token);
      }

      if (json.session) {
        await supabase.auth.setSession({
          access_token: json.session.access_token,
          refresh_token: json.session.refresh_token,
        });
      }

      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Auth] signIn error:', msg);
      return `Gagal terhubung ke server. Periksa koneksi internet Anda.`;
    }
  };

  const signUp = async (email: string, password: string): Promise<string | null> => {
    const url = `${BASE}/confirm-signup`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok || json.error) return json.error ?? 'Terjadi kesalahan';
    return null;
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    try {
      await supabase.auth.signOut();
    } catch {
      // Session may already be invalid (e.g. after password reset) — clear local state anyway
    }
    setUser(null);
    setSession(null);
  };

  const meta = extractMeta(user);

  return (
    <AuthContext.Provider value={{ user, session, loading, access: meta.access, username: meta.username, role: meta.role, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
