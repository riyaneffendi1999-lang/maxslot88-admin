import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types';

export type BonusTaskProgram = Database['public']['Tables']['bonus_tasks']['Row']['program'];
export type BonusTaskStatus = Database['public']['Tables']['bonus_tasks']['Row']['status'];

export type BonusTask = Database['public']['Tables']['bonus_tasks']['Row'];

export function useBonusTasks(program: BonusTaskProgram) {
  const [data, setData] = useState<BonusTask[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bonus_tasks', filter: `program=eq.${program}` }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load, program]);

  const add = async (payload: Database['public']['Tables']['bonus_tasks']['Insert']): Promise<string | null> => {
    const { error } = await supabase.from('bonus_tasks').insert(payload as never);
    if (error) {
      console.error('[useBonusTasks] insert failed:', error.message, payload);
      return error.message;
    }
    await load();
    return null;
  };

  const update = async (id: string, payload: Database['public']['Tables']['bonus_tasks']['Update']): Promise<string | null> => {
    const { error } = await supabase.from('bonus_tasks').update(payload as never).eq('id', id);
    if (error) {
      console.error('[useBonusTasks] update failed:', error.message, id, payload);
      return error.message;
    }
    await load();
    return null;
  };

  const remove = async (id: string): Promise<string | null> => {
    const { error } = await supabase.from('bonus_tasks').delete().eq('id', id);
    if (error) {
      console.error('[useBonusTasks] delete failed:', error.message, id);
      return error.message;
    }
    await load();
    return null;
  };

  return { data, loading, refetch: load, add, update, remove };
}
