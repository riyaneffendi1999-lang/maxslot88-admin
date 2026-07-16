import { useState, useMemo, useRef, useCallback, useEffect, memo } from 'react';
import { Search, Star, Calendar, TrendingUp, Zap, Plus, Trash2, Check, Loader2, ChevronDown, ChevronLeft, ChevronRight, ClipboardPaste, CheckCircle2, Circle, Pencil, Users, Gift, Info, Clock, Package } from 'lucide-react';
import { useBonusTasks } from '../hooks/useBonusTasks';
import type { BonusTask, BonusTaskProgram } from '../hooks/useBonusTasks';
import { ConfirmDialog } from './modals/ModalBase';
import type { BonusProgram } from '../types';
import { formatRupiah } from '../types';
import { useAuth } from '../hooks/useAuth';

const BONUS_PAGE_SIZE = 10;

function BonusPagination({ total, page, onPage }: { total: number; page: number; onPage: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / BONUS_PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (current - 1) * BONUS_PAGE_SIZE + 1;
  const to = Math.min(current * BONUS_PAGE_SIZE, total);
  const pages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, -1, totalPages];
    if (current >= totalPages - 3) return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, -1, current - 1, current, current + 1, -2, totalPages];
  }, [totalPages, current]);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-white/5">
      <span className="text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{from}</span> to{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{to}</span> of{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{total}</span> entries
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(Math.max(1, current - 1))} disabled={current === 1} className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm">‹</button>
        {pages.map((p, i) => p < 0 ? <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">…</span> : (
          <button key={p} onClick={() => onPage(p)} className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${p === current ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}>{p}</button>
        ))}
        <button onClick={() => onPage(Math.min(totalPages, current + 1))} disabled={current === totalPages} className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm">›</button>
      </div>
    </div>
  );
}

type Props = { view: BonusProgram };

const icons: Record<BonusProgram, React.ReactNode> = {
  'lucky-spin': <Star size={20} className="text-amber-500 dark:text-amber-400" />,
  'kamis-ceria': <Calendar size={20} className="text-blue-500 dark:text-blue-400" />,
  'gebyar-turnover': <TrendingUp size={20} className="text-emerald-500 dark:text-emerald-400" />,
  'slot-race': <Zap size={20} className="text-violet-500 dark:text-violet-400" />,
};
const titles: Record<BonusProgram, string> = {
  'lucky-spin': 'Lucky Spin', 'kamis-ceria': 'Kamis Ceria', 'gebyar-turnover': 'Gebyar Turnover', 'slot-race': 'Slot Race',
};
const gradients: Record<BonusProgram, string> = {
  'lucky-spin': 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
  'kamis-ceria': 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
  'gebyar-turnover': 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
  'slot-race': 'from-violet-500/20 to-violet-600/5 border-violet-500/20',
};

type Period = 'today' | 'yesterday' | 'current-week' | 'current-month' | 'anothers';
const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today', yesterday: 'Yesterday', 'current-week': 'Current Week', 'current-month': 'Current Month', anothers: 'Anothers',
};

function getPeriodRange(period: Period): { from: Date; to: Date } {
  const now = new Date();
  const start = (y: number, m: number, d: number) => new Date(y, m, d, 0, 0, 0, 0);
  const end = (y: number, m: number, d: number) => new Date(y, m, d, 23, 59, 59, 999);
  if (period === 'today') return { from: start(now.getFullYear(), now.getMonth(), now.getDate()), to: end(now.getFullYear(), now.getMonth(), now.getDate()) };
  if (period === 'yesterday') { const y = new Date(now); y.setDate(now.getDate() - 1); return { from: start(y.getFullYear(), y.getMonth(), y.getDate()), to: end(y.getFullYear(), y.getMonth(), y.getDate()) }; }
  if (period === 'current-week') { const day = now.getDay(); const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1)); return { from: start(mon.getFullYear(), mon.getMonth(), mon.getDate()), to: end(now.getFullYear(), now.getMonth(), now.getDate()) }; }
  if (period === 'current-month') return { from: start(now.getFullYear(), now.getMonth(), 1), to: end(now.getFullYear(), now.getMonth(), now.getDate()) };
  return { from: new Date(0), to: new Date(8640000000000000) };
}

function PeriodDropdown({ value, onChange }: { value: Period; onChange: (v: Period) => void }) {
  const [open, setOpen] = useState(false);
  const periods: Period[] = ['today', 'yesterday', 'current-week', 'current-month', 'anothers'];
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 hover:border-blue-500/40 transition-colors min-w-[130px] justify-between">
        <div className="flex items-center gap-1.5"><Calendar size={12} className="text-blue-500 dark:text-blue-400 shrink-0" />{PERIOD_LABELS[value]}</div>
        <ChevronDown size={11} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
          {periods.map((p) => (
            <button key={p} onClick={() => { onChange(p); setOpen(false); }} className={`w-full text-left px-3 py-2 text-xs transition-colors ${p === value ? 'text-blue-600 dark:text-blue-400 bg-blue-500/5' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}>{PERIOD_LABELS[p]}</button>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── Dual Table for Lucky Spin ─────────────────────────────────────────────────

const pendingThCls = 'text-left text-xs text-slate-500 dark:text-slate-500 font-medium px-3 py-2.5 uppercase tracking-wider whitespace-nowrap';
const pendingTdCls = 'px-3 py-2.5';
const pendingInCls = 'w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors';

interface PendingRowProps {
  task: BonusTask;
  onCommit: (id: string, field: 'user_name' | 'inject_bonus', value: string) => void;
  onComplete: (task: BonusTask) => void;
  onRemove: (id: string) => void;
}

const PendingRow = memo(function PendingRow({ task, onCommit, onComplete, onRemove }: PendingRowProps) {
  const [userName, setUserName] = useState(task.user_name);
  const [bonusText, setBonusText] = useState(task.inject_bonus ? formatRupiah(task.inject_bonus).replace('Rp ', '') : '');

  // Sync local state if the task changes externally (e.g. realtime update from another admin)
  useEffect(() => {
    setUserName(task.user_name);
    setBonusText(task.inject_bonus ? formatRupiah(task.inject_bonus).replace('Rp ', '') : '');
  }, [task.user_name, task.inject_bonus]);

  const hasBonus = task.inject_bonus > 0;
  const hasUsername = userName.trim() !== '';

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
      <td className={`${pendingTdCls} min-w-[120px]`}>
        <input
          className={pendingInCls}
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          onBlur={() => {
            if (userName !== task.user_name) onCommit(task.id, 'user_name', userName);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          placeholder="username"
        />
      </td>
      <td className={pendingTdCls}>
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">{task.ticket || '—'}</span>
      </td>
      <td className={`${pendingTdCls} min-w-[120px]`}>
        <input
          className={pendingInCls}
          type="text"
          inputMode="numeric"
          value={bonusText}
          onChange={(e) => setBonusText(e.target.value)}
          onBlur={() => {
            if (bonusText !== (task.inject_bonus ? formatRupiah(task.inject_bonus).replace('Rp ', '') : '')) {
              onCommit(task.id, 'inject_bonus', bonusText);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const parsed = parseFloat(bonusText.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
              onComplete({ ...task, user_name: userName, inject_bonus: parsed });
            }
          }}
          placeholder="Nominal, Enter untuk simpan"
        />
      </td>
      <td className={pendingTdCls}>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${hasBonus ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : hasUsername ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'}`}>
          {hasBonus ? <CheckCircle2 size={11} /> : hasUsername ? <Clock size={11} /> : <Circle size={11} />}
          {hasBonus ? 'Complete' : hasUsername ? 'Pending' : 'Belum Digunakan'}
        </span>
      </td>
      <td className={pendingTdCls}>
        <button onClick={() => onRemove(task.id)} className="p-1 rounded text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors">
          <Trash2 size={12} />
        </button>
      </td>
    </tr>
  );
}, (prev, next) => prev.task.id === next.task.id
  && prev.task.user_name === next.task.user_name
  && prev.task.inject_bonus === next.task.inject_bonus
  && prev.task.status === next.task.status
  && prev.task.ticket === next.task.ticket
);

function LuckySpinView() {
  const { data, loading, add, update, remove } = useBonusTasks('lucky-spin');
  const { user } = useAuth();

  // Left table state
  const [ticketInput, setTicketInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingPage, setPendingPage] = useState(1);
  const PENDING_PAGE_SIZE = 20;

  // Right table state
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<Period>('today');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deleting, setDeleting] = useState<BonusTask | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Pending tickets from DB (visible to all admins via realtime)
  const pending = data.filter((d) => d.status === 'pending');

  // Auto-split pasted long ticket string into 10-char chunks
  const handleTicketChange = (raw: string) => {
    const cleaned = raw.replace(/\s+/g, '');
    if (cleaned.length > 10) {
      const chunks: string[] = [];
      for (let i = 0; i < cleaned.length; i += 10) chunks.push(cleaned.slice(i, i + 10));
      chunks.forEach((ticket) => {
        add({ program: 'lucky-spin', ticket, user_name: '', inject_bonus: 0, status: 'pending' });
      });
      setTicketInput('');
      inputRef.current?.focus();
    } else {
      setTicketInput(cleaned.slice(0, 10));
    }
  };

  const addTicketRow = useCallback(() => {
    const ticket = ticketInput.trim();
    if (!ticket || ticket.length < 1 || ticket.length > 10) return;
    add({ program: 'lucky-spin', ticket, user_name: '', inject_bonus: 0, status: 'pending' });
    setTicketInput('');
    inputRef.current?.focus();
  }, [ticketInput, add]);

  const updatePendingRow = (id: string, field: 'user_name' | 'inject_bonus', value: string) =>
    update(id, { [field]: field === 'inject_bonus' ? (parseFloat(value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0) : value });

  const removePendingRow = (id: string) => remove(id);

  // When Enter is pressed on inject_bonus field: save username + bonus + mark complete in one atomic update
  const handleBonusEnter = async (task: BonusTask) => {
    if (!task.user_name.trim()) return;
    const amount = task.inject_bonus > 0 ? task.inject_bonus : 0;
    const status: BonusTask['status'] = amount > 0 ? 'complete' : 'pending';
    await update(task.id, {
      user_name: task.user_name.trim(),
      inject_bonus: amount,
      status,
      completed_at: status === 'complete' ? new Date().toISOString() : null,
    });
  };

  const startEdit = (t: BonusTask) => {
    setEditingId(t.id);
    setEditValue(t.inject_bonus > 0 ? String(t.inject_bonus) : '');
  };

  const saveEdit = async (t: BonusTask) => {
    setEditSaving(true);
    const amount = parseFloat(editValue.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
    const nextStatus: BonusTask['status'] = amount > 0 ? 'complete' : 'pending';
    await update(t.id, {
      inject_bonus: amount,
      status: nextStatus,
      completed_at: nextStatus === 'complete' ? (t.completed_at ?? new Date().toISOString()) : null,
      edited_at: new Date().toISOString(),
      edited_by: user?.email ?? 'admin',
    });
    setEditSaving(false);
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    await remove(deleting.id);
    setDeleteLoading(false);
    setDeleting(null);
  };

  const { from, to } = useMemo(() => getPeriodRange(period), [period]);
  const completed = useMemo(() =>
    data.filter((d) => {
      const dt = new Date(d.completed_at ?? d.created_at);
      return d.status === 'complete' && dt >= from && dt <= to &&
        (d.user_name.toLowerCase().includes(search.toLowerCase()) || d.ticket.toLowerCase().includes(search.toLowerCase()));
    }),
    [data, from, to, search]
  );

  const totalPages = Math.max(1, Math.ceil(completed.length / BONUS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = completed.slice((currentPage - 1) * BONUS_PAGE_SIZE, currentPage * BONUS_PAGE_SIZE);
  const totalMemberClaim = completed.length;
  const totalClaimBonus = completed.reduce((sum, d) => sum + (d.inject_bonus || 0), 0);
  useEffect(() => { setPage(1); }, [search, period]);

  const thCls = 'text-left text-xs text-slate-500 dark:text-slate-500 font-medium px-3 py-2.5 uppercase tracking-wider whitespace-nowrap';
  const tdCls = 'px-3 py-2.5';
  const inCls = 'w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      {/* ── LEFT TABLE ───────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5 flex items-center gap-2">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex-1">Input Data</p>
          <input
            ref={inputRef}
            type="text"
            value={ticketInput}
            onChange={(e) => handleTicketChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addTicketRow(); }}
            placeholder="Ketik/paste tiket..."
            maxLength={10}
            className={`bg-slate-100 dark:bg-white/5 border rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none transition-colors w-48 font-mono ${
              ticketInput.length === 10 ? 'border-emerald-500/50 focus:border-emerald-500' : ticketInput.length > 0 ? 'border-amber-500/50 focus:border-amber-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500/50'
            }`}
          />
          <span className="text-[10px] text-slate-400 dark:text-slate-600 shrink-0">{ticketInput.length}/10</span>
          <button onClick={addTicketRow} disabled={ticketInput.trim().length < 1 || ticketInput.trim().length > 10} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-medium transition-colors shrink-0">
            <Plus size={12} />Tambah
          </button>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/5">
                <th className={thCls}>Username</th>
                <th className={thCls}>Tiket</th>
                <th className={thCls}>Inject Bonus</th>
                <th className={thCls}>Status</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {pending.slice((pendingPage - 1) * PENDING_PAGE_SIZE, pendingPage * PENDING_PAGE_SIZE).map((r) => (
                <PendingRow
                  key={r.id}
                  task={r}
                  onCommit={updatePendingRow}
                  onComplete={handleBonusEnter}
                  onRemove={removePendingRow}
                />
              ))}
              {pending.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 dark:text-slate-600 text-xs">Masukkan tiket di atas lalu tekan Enter untuk menambah baris</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pending.length > PENDING_PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {pending.length} baris · Hal {pendingPage} / {Math.ceil(pending.length / PENDING_PAGE_SIZE)}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
                disabled={pendingPage === 1}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronLeft size={12} />
              </button>
              <button
                onClick={() => setPendingPage((p) => Math.min(Math.ceil(pending.length / PENDING_PAGE_SIZE), p + 1))}
                disabled={pendingPage >= Math.ceil(pending.length / PENDING_PAGE_SIZE)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT TABLE ──────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5 flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex-1">Data Complete</p>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari username / tiket..." className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors w-40" />
          </div>
          <PeriodDropdown value={period} onChange={setPeriod} />
        </div>

        {/* Totals summary */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[140px] rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 px-3 py-2">
            <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Member Claim</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-0.5">{totalMemberClaim} <span className="text-xs font-medium text-blue-500 dark:text-blue-400">member</span></p>
          </div>
          <div className="flex-1 min-w-[160px] rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 px-3 py-2">
            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Claim Bonus</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{formatRupiah(totalClaimBonus)}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={20} className="animate-spin text-blue-500 dark:text-blue-400" /></div>
        ) : (
          <>
          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/5">
                  <th className={thCls}>Tanggal</th>
                  <th className={thCls}>Jam</th>
                  <th className={thCls}>Username</th>
                  <th className={thCls}>Tiket</th>
                  <th className={thCls}>Inject Bonus</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {paginated.map((t) => {
                  const dt = new Date(t.completed_at ?? t.created_at);
                  const isEditing = editingId === t.id;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className={tdCls}><span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{dt.toLocaleDateString('id-ID')}</span></td>
                      <td className={tdCls}><span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></td>
                      <td className={tdCls}><span className="text-sm text-slate-800 dark:text-white font-medium whitespace-nowrap">{t.user_name}</span></td>
                      <td className={tdCls}><span className="text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{t.ticket || '—'}</span></td>
                      <td className={`${tdCls} min-w-[130px]`}>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              autoFocus
                              className={inCls}
                              type="text"
                              inputMode="numeric"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(t); if (e.key === 'Escape') setEditingId(null); }}
                            />
                            <button onClick={() => saveEdit(t)} disabled={editSaving} className="p-1 rounded text-emerald-500 hover:text-emerald-400 disabled:opacity-40 transition-colors shrink-0">
                              {editSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-800 dark:text-white font-semibold whitespace-nowrap">{formatRupiah(t.inject_bonus)}</span>
                        )}
                      </td>
                      <td className={tdCls}>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                          <CheckCircle2 size={11} />Complete
                        </span>
                      </td>
                      <td className={tdCls}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(t)} disabled={isEditing} className="p-1 rounded text-slate-400 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-40 transition-colors" title="Edit bonus"><Pencil size={12} /></button>
                          <button onClick={() => setDeleting(t)} className="p-1 rounded text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Hapus data"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {completed.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 dark:text-slate-600 text-xs">Belum ada data complete untuk periode ini</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <BonusPagination total={completed.length} page={currentPage} onPage={setPage} />
          </>
        )}

        {deleting && (
          <ConfirmDialog message={`Hapus data bonus "${deleting.user_name}"?`} loading={deleteLoading} onConfirm={handleDelete} onClose={() => setDeleting(null)} />
        )}
      </div>
    </div>
  );
}

// ─── Dual Table for Kamis Ceria ────────────────────────────────────────────────
function KamisCeriaView() {
  const { data, loading, add, remove } = useBonusTasks('kamis-ceria');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<BonusTask | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<Period>('today');
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const FIXED_BONUS = 50000;

  const handleAdd = async () => {
    const name = username.trim();
    if (!name || saving) return;
    setError(null);

    // Duplicate check: same username on same calendar date
    const today = new Date().toDateString();
    const duplicate = data.some((d) => {
      return d.user_name.toLowerCase() === name.toLowerCase() &&
        new Date(d.created_at).toDateString() === today;
    });
    if (duplicate) {
      setError(`"${name}" sudah ada di hari ini`);
      return;
    }

    setSaving(true);
    await add({ program: 'kamis-ceria', ticket: '', user_name: name, inject_bonus: FIXED_BONUS, status: 'complete' });
    setSaving(false);
    setUsername('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    await remove(deleting.id);
    setDeleteLoading(false);
    setDeleting(null);
  };

  const { from, to } = useMemo(() => getPeriodRange(period), [period]);
  const filtered = useMemo(() =>
    data.filter((d) => {
      const dt = new Date(d.created_at);
      return dt >= from && dt <= to &&
        d.user_name.toLowerCase().includes(search.toLowerCase());
    }),
    [data, from, to, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / BONUS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * BONUS_PAGE_SIZE, currentPage * BONUS_PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search, period]);

  const totalMember = filtered.length;
  const totalInject = useMemo(() => filtered.reduce((sum, d) => sum + d.inject_bonus, 0), [filtered]);

  const thCls = 'text-left text-xs text-slate-500 dark:text-slate-500 font-medium px-3 py-2.5 uppercase tracking-wider whitespace-nowrap';
  const tdCls = 'px-3 py-2.5';

  return (
    <div className="space-y-3">
      {/* Stats bubbles */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-3 bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 min-w-[160px]">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <Users size={16} className="text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">Total Member</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white leading-tight">{totalMember}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 min-w-[200px]">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Gift size={16} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">Total Inject Bonus</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white leading-tight">{formatRupiah(totalInject)}</p>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
        <Info size={14} className="text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          <span className="font-semibold">Syarat Bonus Kamis Ceria:</span> Member dapat melakukan klaim apabila sudah melakukan deposit selama <span className="font-semibold">1 minggu</span> dengan minimal akumulasi deposit <span className="font-semibold">Rp 1.500.000</span>, ditambah target minimal <span className="font-semibold">5 hari aktif deposit</span> dalam seminggu.
        </p>
      </div>

      <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden">
      {/* Input bar */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            ref={inputRef}
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="Masukkan username..."
            className={`flex-1 bg-slate-100 dark:bg-white/5 border rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none transition-colors ${error ? 'border-red-500/50 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500/50'}`}
          />
          <div className="flex items-center px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold whitespace-nowrap shrink-0">
            Rp 50.000
          </div>
          <button
            onClick={handleAdd}
            disabled={!username.trim() || saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shrink-0"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Tambah
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 font-medium w-full">{error}</p>
        )}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari username..." className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-7 pr-3 py-2 text-xs text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors w-36" />
          </div>
          <PeriodDropdown value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={20} className="animate-spin text-blue-500 dark:text-blue-400" /></div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                  <th className={thCls}>Tanggal</th>
                  <th className={thCls}>Jam</th>
                  <th className={thCls}>Username</th>
                  <th className={thCls}>Inject Bonus</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {paginated.map((t) => {
                  const dt = new Date(t.created_at);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className={tdCls}><span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{dt.toLocaleDateString('id-ID')}</span></td>
                      <td className={tdCls}><span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></td>
                      <td className={tdCls}><span className="text-sm text-slate-800 dark:text-white font-medium whitespace-nowrap">{t.user_name}</span></td>
                      <td className={tdCls}><span className="text-sm text-slate-800 dark:text-white font-semibold whitespace-nowrap">{formatRupiah(t.inject_bonus)}</span></td>
                      <td className={tdCls}>
                        <span className="flex items-center gap-1.5 w-fit px-2 py-1 rounded-full text-xs font-semibold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                          <CheckCircle2 size={11} />Complete
                        </span>
                      </td>
                      <td className={tdCls}>
                        <button onClick={() => setDeleting(t)} className="p-1 rounded text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-600 text-xs">Belum ada data untuk periode ini</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <BonusPagination total={filtered.length} page={currentPage} onPage={setPage} />
        </>
      )}

      {deleting && (
        <ConfirmDialog message={`Hapus data bonus "${deleting.user_name}"?`} loading={deleteLoading} onConfirm={handleDelete} onClose={() => setDeleting(null)} />
      )}
      </div>
    </div>
  );
}

// ─── Gebyar Turnover Dual Table ─────────────────────────────────────────────────
type GtLocalRow = { tempId: string; user_name: string; total_turnover: string; prize: string };

// A batch = one paste session tagged with a period (bulan + tahun)
type GtBatch = {
  batchId: string;
  bulan: number;   // 1–12
  tahun: number;
  rows: GtLocalRow[];
};

/**
 * Parse pasted turnover data. Supports two formats:
 *
 * 1. Multi-line (tab / space / pipe separated):
 *    lucky776  107,623,850  250.000
 *    g0c0      107,356,380  500.000
 *
 * 2. Concatenated single line (username + turnover + optional prize all run together):
 *    lucky776107,623,850250.000g0c0107,356,380500.000...
 *
 * Prize is optional in both formats — leave blank if not present.
 */
function parseTurnoverPaste(raw: string): GtLocalRow[] {
  const results: GtLocalRow[] = [];

  // ── Try multi-line first ──────────────────────────────────────────────────
  // Split by newlines; each non-empty line must have at least username + turnover
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Check if any line looks like "word  number  ..." (tab/space/pipe delimited)
  const isMultiline = lines.length > 1 && lines.some((l) => /\t|  +|\|/.test(l));

  if (isMultiline || (lines.length === 1 && /\t|  +|\|/.test(lines[0]))) {
    for (const line of lines) {
      // Split by tabs, 2+ spaces, or pipe
      const parts = line.split(/\t|  +|\|/).map((p) => p.trim()).filter(Boolean);
      if (parts.length < 2) continue;
      results.push({
        tempId: crypto.randomUUID(),
        user_name: parts[0],
        total_turnover: parts[1],
        prize: parts[2] ?? '',
      });
    }
    if (results.length > 0) return results;
  }

  // ── Fallback: single-line concatenated ────────────────────────────────────
  const text = raw.replace(/\s+/g, '');
  const regex = /([a-zA-Z][a-zA-Z0-9]*?)(\d{1,3}(?:,\d{3})+)((?:\d{1,3}(?:\.\d{3})+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    results.push({
      tempId: crypto.randomUUID(),
      user_name: m[1],
      total_turnover: m[2],
      prize: m[3] ?? '',
    });
  }
  return results;
}

const BULAN_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function periodeLabel(key: string) {
  const [y, m] = key.split('-');
  return `${BULAN_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

function GebyarTurnoverView() {
  const { data, loading, add, remove } = useBonusTasks('gebyar-turnover');

  const [batches, setBatches] = useState<GtBatch[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [showPaste, setShowPaste] = useState(false);

  const now = new Date();
  const [pasteBulan, setPasteBulan] = useState(now.getMonth() + 1);
  const [pasteTahun, setPasteTahun] = useState(now.getFullYear());

  const [filterPeriode, setFilterPeriode] = useState<string>('all');

  const STORAGE_KEY = 'gt-batches-v2';
  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) setBatches(JSON.parse(s)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(batches)); } catch {}
  }, [batches]);

  const handlePaste = () => {
    const parsed = parseTurnoverPaste(pasteText);
    if (!parsed.length) return;
    const newBatch: GtBatch = {
      batchId: crypto.randomUUID(),
      bulan: pasteBulan,
      tahun: pasteTahun,
      rows: parsed,
    };
    setBatches((prev) => [...prev, newBatch]);
    setPasteText('');
    setShowPaste(false);
  };

  const updateRow = (batchId: string, tempId: string, field: keyof GtLocalRow, value: string) =>
    setBatches((prev) => prev.map((b) =>
      b.batchId !== batchId ? b : { ...b, rows: b.rows.map((r) => r.tempId === tempId ? { ...r, [field]: value } : r) }
    ));

  const deleteRow = (batchId: string, tempId: string) =>
    setBatches((prev) => prev.map((b) =>
      b.batchId !== batchId ? b : { ...b, rows: b.rows.filter((r) => r.tempId !== tempId) }
    ).filter((b) => b.rows.length > 0));

  const deleteBatch = (batchId: string) =>
    setBatches((prev) => prev.filter((b) => b.batchId !== batchId));

  const periodeKey = (b: GtBatch) => `${b.tahun}-${String(b.bulan).padStart(2, '0')}`;

  const claimRow = async (batch: GtBatch, tempId: string) => {
    const r = batch.rows.find((x) => x.tempId === tempId);
    if (!r || !r.user_name.trim()) return;
    const turnover = parseFloat(r.total_turnover.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')) || 0;
    const pk = periodeKey(batch);
    const err = await add({
      program: 'gebyar-turnover',
      ticket: '',
      user_name: r.user_name.trim(),
      inject_bonus: 0,
      total_turnover: turnover,
      prize: r.prize.trim(),
      status: 'complete',
      periode: pk,
    });
    if (!err) deleteRow(batch.batchId, tempId);
  };

  const allLeftRows = batches.flatMap((b) => b.rows);
  const totalMemberLeft = allLeftRows.filter((r) => r.user_name.trim()).length;
  const totalPendingBonus = allLeftRows.reduce((sum, r) => {
    const n = parseFloat((r.prize || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, ''));
    return isNaN(n) ? sum : sum + n;
  }, 0);

  const claimed = filterPeriode === 'all' ? data : data.filter((d) => d.periode === filterPeriode);
  const allPeriodes = [...new Set(data.map((d) => d.periode).filter(Boolean) as string[])].sort().reverse();

  const totalClaimMember = claimed.length;
  const totalClaimPrizeCash = claimed.reduce((sum, d) => {
    if (!d.prize || !d.prize.match(/^\s*[\d.,]+\s*$/)) return sum;
    const num = parseFloat(d.prize.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, ''));
    return isNaN(num) ? sum : sum + num;
  }, 0);
  const barangPrizes = claimed.filter((d) => d.prize && !d.prize.match(/^\s*[\d.,]+\s*$/));

  const thCls = 'px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap';
  const tdCls = 'px-4 py-3.5 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      {/* ── LEFT TABLE ── */}
      <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Input Data Turnover</p>
          <button
            onClick={() => setShowPaste((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ClipboardPaste size={13} /> Paste Data
          </button>
        </div>

        {showPaste && (
          <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5 space-y-3 bg-slate-50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">Periode:</p>
              <select
                value={pasteBulan}
                onChange={(e) => setPasteBulan(Number(e.target.value))}
                className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              >
                {BULAN_NAMES.map((b, i) => <option key={i + 1} value={i + 1}>{b}</option>)}
              </select>
              <input
                type="number"
                value={pasteTahun}
                onChange={(e) => setPasteTahun(Number(e.target.value))}
                min={2020}
                max={2099}
                className="w-20 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Contoh: <span className="font-mono">lucky776107,623,850250.000g0c0107,356,380500.000...</span></p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste data di sini..."
              rows={4}
              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={handlePaste}
                disabled={!pasteText.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
              >
                <Plus size={13} /> Tambah ke Tabel
              </button>
              <button
                onClick={() => { setPasteText(''); setShowPaste(false); }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Left totals */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[120px] rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 px-3 py-2">
            <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Member</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-0.5">{totalMemberLeft} <span className="text-xs font-medium text-blue-500 dark:text-blue-400">member</span></p>
          </div>
          <div className="flex-1 min-w-[160px] rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 px-3 py-2">
            <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Total Claim Bonus Terpending</p>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-0.5">{formatRupiah(totalPendingBonus)}</p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-600">
              <ClipboardPaste size={28} className="opacity-40" />
              <p className="text-sm">Klik <span className="font-semibold text-slate-500 dark:text-slate-400">Paste Data</span> untuk menambah data</p>
            </div>
          ) : (
            batches.map((batch) => {
              const pk = periodeKey(batch);
              return (
                <div key={batch.batchId}>
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5 sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-blue-500 dark:text-blue-400" />
                      <span className="text-xs font-bold text-slate-700 dark:text-white">{periodeLabel(pk)}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">({batch.rows.length} member)</span>
                    </div>
                    <button
                      onClick={() => deleteBatch(batch.batchId)}
                      title="Hapus periode ini"
                      className="p-1 rounded text-slate-400 dark:text-slate-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <table className="w-full">
                    <thead className="bg-slate-50/50 dark:bg-white/[0.01]">
                      <tr>
                        <th className={thCls}>No</th>
                        <th className={thCls}>Username</th>
                        <th className={thCls}>Total Turnover</th>
                        <th className={thCls}>Hadiah</th>
                        <th className={thCls}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {batch.rows.map((r, i) => (
                        <tr key={r.tempId} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className={tdCls}>{i + 1}</td>
                          <td className={tdCls}>
                            <input value={r.user_name} onChange={(e) => updateRow(batch.batchId, r.tempId, 'user_name', e.target.value)} className="bg-transparent text-sm text-slate-800 dark:text-white font-medium focus:outline-none focus:bg-slate-100 dark:focus:bg-white/5 rounded px-1 py-0.5 w-full min-w-[80px]" />
                          </td>
                          <td className={tdCls}>
                            <input value={r.total_turnover} onChange={(e) => updateRow(batch.batchId, r.tempId, 'total_turnover', e.target.value)} className="bg-transparent text-sm text-slate-800 dark:text-white focus:outline-none focus:bg-slate-100 dark:focus:bg-white/5 rounded px-1 py-0.5 w-full min-w-[90px]" />
                          </td>
                          <td className={tdCls}>
                            <input value={r.prize} onChange={(e) => updateRow(batch.batchId, r.tempId, 'prize', e.target.value)} className="bg-transparent text-sm text-slate-800 dark:text-white focus:outline-none focus:bg-slate-100 dark:focus:bg-white/5 rounded px-1 py-0.5 w-full min-w-[80px]" />
                          </td>
                          <td className={tdCls}>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => claimRow(batch, r.tempId)}
                                title="Claim — pindah ke tabel kanan"
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              >
                                <Package size={14} />
                              </button>
                              <button
                                onClick={() => deleteRow(batch.batchId, r.tempId)}
                                className="p-1 rounded text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT TABLE ── */}
      <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Data Claim</p>
          {allPeriodes.length > 0 && (
            <select
              value={filterPeriode}
              onChange={(e) => setFilterPeriode(e.target.value)}
              className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="all">Semua Periode</option>
              {allPeriodes.map((pk) => <option key={pk} value={pk}>{periodeLabel(pk)}</option>)}
            </select>
          )}
        </div>
        <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[140px] rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 px-3 py-2">
            <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Claim Member</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-0.5">{totalClaimMember} <span className="text-xs font-medium text-blue-500 dark:text-blue-400">member</span></p>
          </div>
          <div className="flex-1 min-w-[160px] rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 px-3 py-2">
            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Claim Hadiah</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{formatRupiah(totalClaimPrizeCash)}</p>
          </div>
        </div>
        {barangPrizes.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-200 dark:border-white/5">
            <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Hadiah Barang</p>
            <div className="flex flex-wrap gap-1.5">
              {barangPrizes.map((b) => (
                <span key={b.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Gift size={11} /> {b.user_name}: {b.prize}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={20} className="animate-spin text-blue-500 dark:text-blue-400" /></div>
          ) : claimed.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-slate-400 dark:text-slate-600 text-sm">Belum ada claim</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-white/[0.02]">
                <tr>
                  <th className={thCls}>No</th>
                  <th className={thCls}>Username</th>
                  <th className={thCls}>Total Turnover</th>
                  <th className={thCls}>Hadiah</th>
                  <th className={thCls}>Periode</th>
                  <th className={thCls}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {claimed.map((d, i) => {
                  const isCash = d.prize.match(/^\s*[\d.,]+\s*$/);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className={tdCls}>{i + 1}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-800 dark:text-white font-medium whitespace-nowrap">{d.user_name}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-800 dark:text-white font-semibold whitespace-nowrap">
                        {Number(d.total_turnover).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                        {isCash
                          ? <span className="font-semibold text-slate-800 dark:text-white">{formatRupiah(parseFloat(d.prize.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')) || 0)}</span>
                          : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"><Gift size={11} /> {d.prize}</span>
                        }
                      </td>
                      <td className={tdCls}>
                        {d.periode ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <Calendar size={10} /> {periodeLabel(d.periode)}
                          </span>
                        ) : <span className="text-slate-400 dark:text-slate-600">—</span>}
                      </td>
                      <td className={tdCls}>
                        <button onClick={() => remove(d.id)} className="p-1 rounded text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function BonusView({ view }: Props) {
  if (view === 'lucky-spin') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[view]} border flex items-center justify-center`}>{icons[view]}</div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{titles[view]}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Data kiri = input baru &bull; Data kanan = sudah Complete</p>
          </div>
        </div>
        <LuckySpinView />
      </div>
    );
  }

  if (view === 'kamis-ceria') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[view]} border flex items-center justify-center`}>{icons[view]}</div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{titles[view]}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Rekap program bonus Kamis Ceria</p>
          </div>
        </div>
        <KamisCeriaView />
      </div>
    );
  }

  if (view === 'gebyar-turnover') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[view]} border flex items-center justify-center`}>{icons[view]}</div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{titles[view]}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Data kiri = input baru &bull; Data kanan = sudah Claim</p>
          </div>
        </div>
        <GebyarTurnoverView />
      </div>
    );
  }

  // Slot Race — keep original simple view
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[view]} border flex items-center justify-center`}>{icons[view]}</div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{titles[view]}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Rekap program bonus {titles[view]}</p>
        </div>
      </div>
      <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl p-8 text-center">
        <p className="text-slate-400 dark:text-slate-500 text-sm">Halaman {titles[view]} belum dikonfigurasi.</p>
      </div>
    </div>
  );
}
