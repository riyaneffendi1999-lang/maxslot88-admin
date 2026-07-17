import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, RefreshCw, Edit2, Trash2, Loader2, Wallet, Hash, Scale, ClipboardPaste, Check, ChevronDown, Calendar, Search } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useBankAccounts } from '../hooks/useBankAccounts';
import { useAuth } from '../hooks/useAuth';
import TransactionModal from './modals/TransactionModal';
import { ConfirmDialog } from './modals/ModalBase';
import { parseRawTransactions } from '../lib/parseRaw';
import type { Transaction, TransactionMethod, TransactionStatus } from '../types';
import { STATUS_STYLES, STATUS_LABELS, formatRupiah } from '../types';

type Props = {
  title: string;
  subtitle?: string;
  methods: TransactionMethod[];
  logo?: string;
};

type Period = 'today' | 'yesterday' | 'current-week' | 'current-month' | 'anothers';
const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today', yesterday: 'Yesterday',
  'current-week': 'Current Week', 'current-month': 'Current Month', anothers: 'Anothers',
};

function getPeriodRange(period: Period, customFrom?: string, customTo?: string): { from: Date; to: Date } | null {
  const now = new Date();
  const s = (y: number, m: number, d: number) => new Date(y, m, d, 0, 0, 0, 0);
  const e = (y: number, m: number, d: number) => new Date(y, m, d, 23, 59, 59, 999);
  if (period === 'today') return { from: s(now.getFullYear(), now.getMonth(), now.getDate()), to: e(now.getFullYear(), now.getMonth(), now.getDate()) };
  if (period === 'yesterday') { const y = new Date(now); y.setDate(now.getDate() - 1); return { from: s(y.getFullYear(), y.getMonth(), y.getDate()), to: e(y.getFullYear(), y.getMonth(), y.getDate()) }; }
  if (period === 'current-week') { const day = now.getDay(); const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1)); return { from: s(mon.getFullYear(), mon.getMonth(), mon.getDate()), to: e(now.getFullYear(), now.getMonth(), now.getDate()) }; }
  if (period === 'current-month') return { from: s(now.getFullYear(), now.getMonth(), 1), to: e(now.getFullYear(), now.getMonth(), now.getDate()) };
  if (period === 'anothers') return { from: customFrom ? new Date(customFrom + 'T00:00:00') : new Date(0), to: customTo ? new Date(customTo + 'T23:59:59') : new Date(8640000000000000) };
  return null;
}

function PeriodDropdown({ value, onChange }: { value: Period; onChange: (v: Period) => void }) {
  const [open, setOpen] = useState(false);
  const periods: Period[] = ['today', 'yesterday', 'current-week', 'current-month', 'anothers'];
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 hover:border-blue-500/40 transition-colors min-w-[130px] justify-between">
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

const statusConfig: Record<TransactionStatus, { icon: React.ReactNode; class: string }> = {
  approved: { icon: <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />, class: STATUS_STYLES.approved },
  pending: { icon: <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />, class: STATUS_STYLES.pending },
  unik: { icon: <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />, class: STATUS_STYLES.unik },
  'pindah-dana': { icon: <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />, class: STATUS_STYLES['pindah-dana'] },
  'biaya-admin': { icon: <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />, class: STATUS_STYLES['biaya-admin'] },
};

function TablePagination({
  total,
  page,
  pageSize,
  onPage,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  const pages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, -1, totalPages];
    if (current >= totalPages - 3) return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, -1, current - 1, current, current + 1, -2, totalPages];
  }, [totalPages, current]);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-white/5">
      <span className="text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{from}</span> to{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{to}</span> of{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{total}</span> entries
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, current - 1))}
          disabled={current === 1}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p < 0 ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                p === current
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(Math.min(totalPages, current + 1))}
          disabled={current === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export default function DataTable({ title, subtitle, methods, logo }: Props) {
  void subtitle;
  const { data, loading, refetch, add, update, remove, bulkAdd } = useTransactions(methods);
  const { data: bankAccounts } = useBankAccounts();
  const { username } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [period, setPeriod] = useState<Period>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const [pasteText, setPasteText] = useState('');
  const [pasteStatus, setPasteStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [pasteSaving, setPasteSaving] = useState(false);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  const pageBankAccounts = useMemo(() => {
    const active = bankAccounts.filter((b) => b.status === 'active');
    if (methods.length === 0) return active;
    const lowerMethods = methods.map((m) => m.toLowerCase());
    return active.filter((b) => lowerMethods.includes(b.name.toLowerCase()));
  }, [bankAccounts, methods]);

  const selectedBank = pageBankAccounts.find((b) => b.id === selectedBankId) ?? null;

  useEffect(() => {
    if (!selectedBankId && pageBankAccounts.length > 0) {
      setSelectedBankId(pageBankAccounts[0].id);
    }
    if (selectedBankId && !pageBankAccounts.find((b) => b.id === selectedBankId)) {
      setSelectedBankId(pageBankAccounts.length > 0 ? pageBankAccounts[0].id : '');
    }
  }, [pageBankAccounts, selectedBankId]);

  const periodRange = useMemo(() => getPeriodRange(period, customFrom, customTo), [period, customFrom, customTo]);

  const filtered = useMemo(() => data.filter((r) => {
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchBank = !selectedBankId || r.bank_account_id === selectedBankId;
    const matchUser = !userSearch || r.user_name.toLowerCase().includes(userSearch.toLowerCase());
    if (!periodRange) return matchStatus && matchBank && matchUser;
    const txDate = new Date(r.created_at);
    return matchStatus && matchBank && matchUser && txDate >= periodRange.from && txDate <= periodRange.to;
  }), [data, statusFilter, selectedBankId, periodRange, userSearch]);

  const handlePasteSave = async () => {
    const text = pasteText.trim();
    if (!text || pasteSaving) return;
    setPasteStatus(null);
    const parsed = parseRawTransactions(text);
    if (parsed.length === 0) {
      setPasteStatus({ type: 'error', msg: 'Format tidak dikenali — pastikan data memiliki tanggal & nominal' });
      return;
    }
    const bank = selectedBank ?? pageBankAccounts[0] ?? null;
    const txMethod = methods[0];
    setPasteSaving(true);
    const err = await bulkAdd(parsed.map((r) => ({
      date: r.date,
      time: r.time,
      ticket: r.ticket,
      user_name: r.user_name,
      full_name: r.full_name,
      group_name: r.group_name,
      amount: r.amount,
      method: txMethod,
      status: 'approved' as TransactionStatus,
      bank_account_id: bank?.id ?? null,
      bank_name: bank?.name ?? txMethod,
    })));
    setPasteSaving(false);
    if (err) {
      setPasteStatus({ type: 'error', msg: `Gagal simpan: ${err}` });
    } else {
      setPasteStatus({ type: 'success', msg: `${parsed.length} transaksi berhasil disimpan` });
      setPasteText('');
    }
  };

  const handlePasteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePasteSave();
    }
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [statusFilter, selectedBankId, period, userSearch, methods.join(',')]);

  const totalTrx = filtered.length;
  const totalPending = filtered.filter((r) => r.status === 'pending').length;
  const totalPindah = filtered.filter((r) => r.status === 'pindah-dana').length;
  const totalUnik = filtered.filter((r) => r.status === 'unik').length;
  const totalBiayaAdmin = filtered.filter((r) => r.status === 'biaya-admin').length;

  const endingBalance = useMemo(() => {
    if (!selectedBank) return 0;
    const sum = (status: TransactionStatus) =>
      data.filter((r) => r.bank_account_id === selectedBank.id && r.status === status).reduce((a, r) => a + r.amount, 0);
    return selectedBank.initial_balance + sum('approved') + sum('pending') + sum('unik') - sum('pindah-dana') - sum('biaya-admin');
  }, [selectedBank, data]);

  // Map of bank_id → ending balance (for modal live preview)
  const bankBalances = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of pageBankAccounts) {
      const sum = (status: TransactionStatus) =>
        data.filter((r) => r.bank_account_id === b.id && r.status === status).reduce((a, r) => a + r.amount, 0);
      map[b.id] = b.initial_balance + sum('approved') + sum('pending') + sum('unik') - sum('pindah-dana') - sum('biaya-admin');
    }
    return map;
  }, [pageBankAccounts, data]);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    await remove(deleting.id);
    setDeleteLoading(false);
    setDeleting(null);
  };

  const bubbles = [
    { label: 'Total Transaksi', value: totalTrx, sub: `${filtered.filter(r => r.status === 'approved').length} approved`, dot: 'bg-blue-500', ring: 'border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
    { label: 'Total Pending', value: totalPending, sub: 'Perlu diproses', dot: 'bg-amber-500', ring: 'border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
    { label: 'Total Pindah Dana', value: totalPindah, sub: 'trx', dot: 'bg-cyan-500', ring: 'border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400' },
    { label: 'Total Unik', value: totalUnik, sub: 'trx', dot: 'bg-violet-500', ring: 'border-violet-500/20 bg-violet-500/5 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
    { label: 'Total Biaya Admin', value: totalBiayaAdmin, sub: 'trx', dot: 'bg-slate-500', ring: 'border-slate-500/20 bg-slate-500/5 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' },
  ];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {logo && (
            <img src={logo} alt={title} className="h-10 w-auto object-contain" />
          )}
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-0.5">TRACKING MONEY</p>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white leading-none">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors">
            <RefreshCw size={14} />Refresh
          </button>
          <button onClick={() => { setSelected(null); setModal('add'); }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-600/20">
            <Plus size={14} />Tambah
          </button>
        </div>
      </div>

      {/* Rekening info boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={14} className="text-blue-500 dark:text-blue-400" />
            <p className="text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wider">Atas Nama</p>
          </div>
          <select value={selectedBankId} onChange={(e) => setSelectedBankId(e.target.value)} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer">
            <option value="">— Pilih Rekening —</option>
            {pageBankAccounts.map((b) => (
              <option key={b.id} value={b.id}>{b.holder_name} — {b.name}</option>
            ))}
          </select>
        </div>
        <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Hash size={14} className="text-cyan-500 dark:text-cyan-400" />
            <p className="text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wider">Nomor Rekening</p>
          </div>
          <p className="text-slate-800 dark:text-white text-base font-semibold font-mono tracking-wide truncate">
            {selectedBank ? selectedBank.account_number : '—'}
          </p>
          {selectedBank && <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 truncate">{selectedBank.name}</p>}
        </div>
        <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Scale size={14} className="text-emerald-500 dark:text-emerald-400" />
            <p className="text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wider">Saldo Akhir</p>
          </div>
          <p className="text-slate-800 dark:text-white text-base font-bold truncate">{formatRupiah(endingBalance)}</p>
          {selectedBank && <p className="text-emerald-500 dark:text-emerald-400 text-xs mt-1">Saldo awal {formatRupiah(selectedBank.initial_balance)}</p>}
        </div>
      </div>

      {/* Summary bubbles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {bubbles.map((b) => (
          <div key={b.label} className={`relative overflow-hidden rounded-xl border ${b.ring} p-4 transition-all hover:scale-[1.02] hover:shadow-md`}>
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-20 ${b.dot}`} />
            <div className="relative">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{b.label}</p>
              <p className={`text-2xl font-bold ${b.text}`}>{b.value}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{b.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden">
        {/* Table toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-200 dark:border-white/5">
          {/* Top row: paste + search */}
          <div className="flex items-center gap-3">
            {/* Paste area - compact */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <ClipboardPaste size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <textarea
                ref={pasteRef}
                value={pasteText}
                onChange={(e) => { setPasteText(e.target.value); setPasteStatus(null); }}
                onKeyDown={handlePasteKeyDown}
                placeholder="Paste data di sini..."
                rows={1}
                className="w-48 lg:w-64 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none h-[34px] max-h-20 font-mono"
              />
              <button
                onClick={handlePasteSave}
                disabled={!pasteText.trim() || pasteSaving}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors shrink-0"
              >
                {pasteSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}Simpan
              </button>
              {pasteStatus && (
                <span className={`text-xs font-medium shrink-0 ${pasteStatus.type === 'error' ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'}`}>{pasteStatus.msg}</span>
              )}
            </div>

            {/* Search username */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari username..."
                  className="w-44 lg:w-56 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors h-[34px]"
                />
              </div>
            </div>
          </div>

          {/* Bottom row: filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <PeriodDropdown value={period} onChange={setPeriod} />
            {period === 'anothers' && (
              <>
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors" />
                <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors" />
              </>
            )}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 focus:outline-none focus:border-blue-500/50 transition-colors">
              <option value="">Semua Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="unik">Unik</option>
              <option value="pindah-dana">Pindah Dana</option>
              <option value="biaya-admin">Biaya Admin</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={22} className="animate-spin text-blue-500 dark:text-blue-400" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                    {['Tanggal', 'Jam', 'Tiket', 'Username', 'Nama Lengkap', 'Group', 'Jumlah Deposit', 'Status', 'Aksi', 'Admin'].map((h) => (
                      <th key={h} className="text-left text-xs text-slate-500 dark:text-slate-500 font-medium px-4 py-3 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {paginated.map((row) => {
                    const sc = statusConfig[row.status];
                    const dt = new Date(row.created_at);
                    const txDate = row.transaction_date ? new Date(row.transaction_date + 'T00:00:00') : dt;
                    const txTime = row.transaction_time ?? dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3.5 text-xs text-slate-400 dark:text-slate-400 whitespace-nowrap">{txDate.toLocaleDateString('id-ID')}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-400 dark:text-slate-400 whitespace-nowrap">{txTime}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{row.ticket || '—'}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-800 dark:text-white font-medium whitespace-nowrap">{row.user_name}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{row.full_name || '—'}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.group_name || '—'}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-800 dark:text-white font-semibold whitespace-nowrap">{formatRupiah(row.amount)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`flex items-center gap-1.5 w-fit text-xs font-semibold px-2.5 py-1 rounded-full ${sc.class}`}>{sc.icon}{STATUS_LABELS[row.status]}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => { setSelected(row); setModal('edit'); }} className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-colors"><Edit2 size={13} /></button>
                            <button onClick={() => setDeleting(row)} className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.admin_email ? row.admin_email.split('@')[0] : '—'}</td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} className="px-6 py-14 text-center text-slate-400 dark:text-slate-600 text-sm">{selectedBankId ? 'Belum ada transaksi untuk rekening ini' : 'Belum ada data'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination total={filtered.length} page={currentPage} pageSize={PAGE_SIZE} onPage={setPage} />
          </>
        )}
      </div>

      {modal && (
        <TransactionModal
          initial={modal === 'edit' ? selected ?? undefined : undefined}
          bankAccounts={pageBankAccounts}
          bankBalances={bankBalances}
          onClose={() => { setModal(null); setSelected(null); }}
          onSave={modal === 'edit' && selected ? (p) => update(selected.id, p) : add}
        />
      )}

      {deleting && (
        <ConfirmDialog
          message={`Hapus transaksi dari "${deleting.user_name}" senilai ${formatRupiah(deleting.amount)}?`}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
