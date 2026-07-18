import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types';

export type BonusTaskProgram = Database['public']['Tables']['bonus_tasks']['Row']['program'];
export type BonusTaskStatus = Database['public']['Tables']['bonus_tasks']['Row']['status'];

export type BonusTask = Database['public']['Tables']['bonus_tasks']['Row'];

export function useBonusTasks(program: BonusTaskProgram) {
  const [data, setData] = useState<BonusTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Guard against the realtime echo racing with — and overwriting — the local
  // cache mutation we already applied optimistically. While a local mutation is
  // pending for a given id, we defer realtime-driven reloads so the canonical
  // fetch can't clobber the in-flight update with a stale snapshot.
  const pendingMutations = useRef<Set<string>>(new Set());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const { data: rows } = await supabase
      .from('bonus_tasks')
      .select('*')
      .eq('program', program)
      .order('created_at', { ascending: false });
    setData((rows as BonusTask[]) ?? []);
    setLoading(false);
  }, [program]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel(`bonus_tasks_${program}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bonus_tasks', filter: `program=eq.${program}` }, (payload) => {
        // If this echo corresponds to a mutation we just applied locally,
        // ignore it — our cache already reflects the change and a reload could
        // race with the DB commit. Clear the guard shortly after.
        const row = (payload as { new?: { id?: string }; old?: { id?: string } });
        const id = row.new?.id ?? row.old?.id;
        if (id && pendingMutations.current.has(id)) {
          pendingMutations.current.delete(id);
          if (flushTimer.current) clearTimeout(flushTimer.current);
          flushTimer.current = setTimeout(() => load(), 400);
          return;
        }
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (flushTimer.current) clearTimeout(flushTimer.current);
    };
  }, [load, program]);

  const add = async (payload: Database['public']['Tables']['bonus_tasks']['Insert']): Promise<string | null> => {
    const { data: row, error } = await supabase
      .from('bonus_tasks')
      .insert(payload as never)
      .select('*')
      .maybeSingle();
    if (error) {
      console.error('[useBonusTasks] insert failed:', error.message, payload);
      return error.message;
    }
    if (row) {
      pendingMutations.current.add((row as BonusTask).id);
      setData((prev) => [row as BonusTask, ...prev]);
    }
    return null;
  };

  // Updates Supabase AND the local cache atomically. Returns the canonical
  // updated row so callers can use it without waiting for realtime.
  const update = async (id: string, payload: Database['public']['Tables']['bonus_tasks']['Update']): Promise<{ error: string | null; row: BonusTask | null }> => {
    const { data: row, error } = await supabase
      .from('bonus_tasks')
      .update(payload as never)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) {
      console.error('[useBonusTasks] update failed:', error.message, id, payload);
      return { error: error.message, row: null };
    }
    const updated = row as BonusTask | null;
    if (updated) {
      pendingMutations.current.add(id);
      setData((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
    }
    return { error: null, row: updated };
  };

  const remove = async (id: string): Promise<string | null> => {
    const { error } = await supabase.from('bonus_tasks').delete().eq('id', id);
    if (error) {
      console.error('[useBonusTasks] delete failed:', error.message, id);
      return error.message;
    }
    pendingMutations.current.add(id);
    setData((prev) => prev.filter((d) => d.id !== id));
    return null;
  };

  return { data, loading, refetch: load, add, update, remove };
}
