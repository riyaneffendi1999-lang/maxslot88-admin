import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AdminRole } from '../types';

export type { AdminRole } from '../types';
export type BonusTaskProgram = 'lucky-spin' | 'kamis-ceria' | 'gebyar-turnover' | 'slot-race';
export type BonusTaskStatus = 'pending' | 'complete';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  access: string[];
  role: AdminRole;
  status: 'active' | 'inactive';
  failed_login_count: number;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface BonusTask {
  id: string;
  program: BonusTaskProgram;
  ticket: string;
  user_name: string;
  inject_bonus: number;
  total_turnover: number;
  prize: string;
  status: BonusTaskStatus;
  created_at: string;
  edited_at: string | null;
  edited_by: string | null;
  periode: string | null;
}

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://ncymtdnmpcjinhmyqntq.supabase.co';
const BASE = SUPABASE_URL + '/functions/v1';
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeW10ZG5tcGNqaW5obXlxbnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2OTY3NTgsImV4cCI6MjA5OTI3Mjc1OH0.Kx0AOaA6EW9z4oiobty0NL8LXwJ9tg-KcDiOsS27ECE';

async function callFn(name: string, body: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json: { error?: string };
    try {
      json = JSON.parse(text);
    } catch {
      return `Server error: ${text.slice(0, 100)}`;
    }
    if (!res.ok || json.error) return json.error ?? 'Terjadi kesalahan';
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

export function useAdmins() {
  const [data, setData] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/list-admins`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      });
      const text = await res.text();
      let json: { error?: string; users?: unknown[] };
      try {
        json = JSON.parse(text);
      } catch {
        setError(`Server error: ${text.slice(0, 100)}`);
        setLoading(false);
        return;
      }
      if (json.error) { setError(json.error); }
      else { setData((json.users ?? []) as AdminUser[]); }
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (username: string, password: string, access: string[], role: AdminRole = 'staff'): Promise<string | null> => {
    const err = await callFn('confirm-signup', { username, password, access, role });
    if (!err) await load();
    return err;
  };

  const update = async (userId: string, access: string[], role?: AdminRole): Promise<string | null> => {
    const payload: Record<string, unknown> = { userId, access };
    if (role) payload.role = role;
    const err = await callFn('update-admin', payload);
    if (!err) await load();
    return err;
  };

  const remove = async (userId: string): Promise<string | null> => {
    const err = await callFn('delete-admin', { userId });
    if (!err) await load();
    return err;
  };

  const setStatus = async (userId: string, status: 'active' | 'inactive'): Promise<string | null> => {
    const err = await callFn('update-admin', { userId, status });
    if (!err) await load();
    return err;
  };

  const resetPassword = async (userId: string, newPassword: string): Promise<string | null> => {
    const err = await callFn('update-admin', { userId, new_password: newPassword });
    if (!err) await load();
    return err;
  };

  return { data, loading, error, refetch: load, create, update, remove, setStatus, resetPassword };
}
