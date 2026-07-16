import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type BonusTaskProgram = 'lucky-spin' | 'kamis-ceria' | 'gebyar-turnover' | 'slot-race';
export type BonusTaskStatus = 'pending' | 'complete';

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
  completed_at: string | null;
  edited_at: string | null;
  edited_by: string | null;
  periode: string | null;
}

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

  const add = async (payload: Omit<BonusTask, 'id' | 'created_at' | 'completed_at' | 'edited_at' | 'edited_by' | 'periode'> & { periode?: string | null; completed_at?: string | null }): Promise<string | null> => {
    const { error } = await supabase.from('bonus_tasks').insert(payload);
    if (error) {
      console.error('[useBonusTasks] insert failed:', error.message, payload);
      return error.message;
    }
    await load();
    return null;
  };

  const update = async (id: string, payload: Partial<Omit<BonusTask, 'id' | 'created_at'>>): Promise<string | null> => {
    const { error } = await supabase.from('bonus_tasks').update(payload).eq('id', id);
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
