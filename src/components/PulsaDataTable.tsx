import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, RefreshCw, Edit2, Trash2, Loader2, Wallet, Hash, Scale, ClipboardPaste, Check, ChevronDown, Calendar, Search, Smartphone } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useBankAccounts } from '../hooks/useBankAccounts';
import { useAuth } from '../hooks/useAuth';
import { ConfirmDialog } from './modals/ModalBase';
import { parseRawTransactions } from '../lib/parseRaw';
import type { Transaction, TransactionStatus, BankAccount } from '../types';
import { STATUS_STYLES, STATUS_LABELS, formatRupiah } from '../types';

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

const PULSA_STATUSES: TransactionStatus[] = ['approved', 'pending', 'unik', 'cuci-pulsa', 'biaya-admin'];
const ADD_STATUSES = new Set<TransactionStatus>(['approved', 'pending', 'unik']);
const SUB_STATUSES = new Set<TransactionStatus>(['cuci-pulsa', 'biaya-admin']);

const statusConfig: Record<TransactionStatus, { icon: React.ReactNode; class: string }> = {
  approved: { icon: <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />, class: STATUS_STYLES.approved },
  pending: { icon: <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />, class: STATUS_STYLES.pending },
  unik: { icon: <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />, class: STATUS_STYLES.unik },
  'pindah-dana': { icon: <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />, class: STATUS_STYLES['pindah-dana'] },
  'biaya-admin': { icon: <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />, class: STATUS_STYLES['biaya-admin'] },
  'cuci-pulsa': { icon: <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />, class: STATUS_STYLES['cuci-pulsa'] },
};

function formatAmount(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('id-ID');
}
function parseAmount(formatted: string): number {
  return parseInt(formatted.replace(/\./g, ''), 10) || 0;
}
function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function nowTimeStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PAGE_SIZE = 25;

type Props = {
  title: string;
  bankFilter?: 'telkomsel' | 'xl';
};

export default function PulsaDataTable({ title, bankFilter }: Props) {
  const { data, loading, refetch, add, update, remove, bulkAdd } = useTransactions('PULSA');
  const { data: bankAccounts } = useBankAccounts();
  const { username } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [period, setPeriod] = useState<Period>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [page, setPage] = useState(1);

  // Two bank selectors: TELKOMSEL and XL (hidden when bankFilter is set)
  const telkomselBanks = useMemo(() => bankAccounts.filter((b) => b.status === 'active' && b.name.toUpperCase().includes('TELKOMSEL')), [bankAccounts]);
  const xlBanks = useMemo(() => bankAccounts.filter((b) => b.status === 'active' && b.name.toUpperCase().includes('XL')), [bankAccounts]);

  const [telkomselId, setTelkomselId] = useState('');
  const [xlId, setXlId] = useState('');
  const [activeBank, setActiveBank] = useState<'telkomsel' | 'xl'>(bankFilter ?? 'telkomsel');

  useEffect(() => {
    if (!telkomselId && telkomselBanks.length > 0) setTelkomselId(telkomselBanks[0].id);
  }, [telkomselBanks, telkomselId]);
  useEffect(() => {
    if (!xlId && xlBanks.length > 0) setXlId(xlBanks[0].id);
  }, [xlBanks, xlId]);

  const selectedBankId = bankFilter
    ? (bankFilter === 'telkomsel' ? telkomselId : xlId)
    : (activeBank === 'telkomsel' ? telkomselId : xlId);
  const selectedBank = bankAccounts.find((b) => b.id === selectedBankId) ?? null;

  const periodRange = useMemo(() => getPeriodRange(period, customFrom, customTo), [period, customFrom, customTo]);

  const filtered = useMemo(() => data.filter((r) => {
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchBank = !selectedBankId || r.bank_account_id === selectedBankId;
    const matchUser = !userSearch || r.user_name.toLowerCase().includes(userSearch.toLowerCase());
    if (!periodRange) return matchStatus && matchBank && matchUser;
    const txDate = new Date(r.created_at);
    return matchStatus && matchBank && matchUser && txDate >= periodRange.from && txDate <= periodRange.to;
  }), [data, statusFilter, selectedBankId, periodRange, userSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [statusFilter, selectedBankId, period, userSearch]);

  const endingBalance = useMemo(() => {
    if (!selectedBank) return 0;
    const sum = (status: TransactionStatus) =>
      data.filter((r) => r.bank_account_id === selectedBank.id && r.status === status).reduce((a, r) => a + r.amount, 0);
    return selectedBank.initial_balance + sum('approved') + sum('pending') + sum('unik') - sum('cuci-pulsa') - sum('biaya-admin');
  }, [selectedBank, data]);

  // Paste state
  const [pasteText, setPasteText] = useState('');
  const [pasteStatus, setPasteStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [pasteSaving, setPasteSaving] = useState(false);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  const handlePasteSave = async () => {
    const text = pasteText.trim();
    if (!text || pasteSaving) return;
    setPasteStatus(null);
    const parsed = parseRawTransactions(text);
    if (parsed.length === 0) {
      setPasteStatus({ type: 'error', msg: 'Format tidak dikenali — pastikan data memiliki tanggal & nominal' });
      return;
    }
    const bank = selectedBank;
    if (!bank) {
      setPasteStatus({ type: 'error', msg: 'Pilih rekening aktif terlebih dahulu' });
      return;
    }
    setPasteSaving(true);
    const err = await bulkAdd(parsed.map((r) => ({
      date: r.date,
      time: r.time,
      ticket: r.ticket,
      user_name: r.user_name,
      full_name: r.full_name,
      group_name: r.group_name,
      amount: r.amount,
      method: 'PULSA' as const,
      status: 'approved' as TransactionStatus,
      bank_account_id: bank.id,
      bank_name: bank.name,
    })));
    setPasteSaving(false);
    if (err) {
      setPasteStatus({ type: 'error', msg: `Gagal simpan: ${err}` });
    } else {
      setPasteStatus({ type: 'success', msg: `${parsed.length} transaksi berhasil disimpan` });
      setPasteText('');
    }
  };

  // Modal state
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    user_name: '',
    ticket: '',
    amountDisplay: '',
    status: 'approved' as TransactionStatus,
    note: '',
    penerima: '',
    bank_account_id: '',
    transaction_date: todayStr(),
    transaction_time: nowTimeStr(),
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openAdd = () => {
    setSelected(null);
    setForm({
      user_name: '', ticket: '', amountDisplay: '', status: 'approved',
      note: '', penerima: '', bank_account_id: selectedBankId,
      transaction_date: todayStr(), transaction_time: nowTimeStr(),
    });
    setModal('add');
  };

  const openEdit = (t: Transaction) => {
    setSelected(t);
    setForm({
      user_name: t.user_name,
      ticket: t.ticket,
      amountDisplay: formatAmount(t.amount.toString()),
      status: t.status,
      note: t.note,
      penerima: t.group_name,
      bank_account_id: t.bank_account_id ?? selectedBankId,
      transaction_date: t.transaction_date ?? todayStr(),
      transaction_time: t.transaction_time ?? nowTimeStr(),
    });
    setModal('edit');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const bank = bankAccounts.find((b) => b.id === form.bank_account_id);
    const payload = {
      user_name: form.user_name.trim(),
      method: 'PULSA' as const,
      amount: parseAmount(form.amountDisplay),
      status: form.status,
      note: form.note,
      ticket: form.ticket.trim(),
      full_name: '',
      group_name: form.penerima.trim(),
      bank_account_id: form.bank_account_id || null,
      bank_name: bank?.name ?? 'PULSA',
      transaction_date: form.transaction_date || null,
      transaction_time: form.transaction_time || null,
    };
    setFormLoading(true);
    const err = modal === 'edit' && selected ? await update(selected.id, payload) : await add(payload);
    setFormLoading(false);
    if (err) setFormError(err);
    else setModal(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    await remove(deleting.id);
    setDeleteLoading(false);
    setDeleting(null);
  };

  const totalTrx = filtered.length;
  const totalPending = filtered.filter((r) => r.status === 'pending').length;
  const totalCuciPulsa = filtered.filter((r) => r.status === 'cuci-pulsa').length;
  const totalUnik = filtered.filter((r) => r.status === 'unik').length;
  const totalBiayaAdmin = filtered.filter((r) => r.status === 'biaya-admin').length;

  const bubbles = [
    { label: 'Total Transaksi', value: totalTrx, sub: `${filtered.filter(r => r.status === 'approved').length} approved`, dot: 'bg-blue-500', ring: 'border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
    { label: 'Total Pending', value: totalPending, sub: 'Perlu diproses', dot: 'bg-amber-500', ring: 'border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
    { label: 'Total Cuci Pulsa', value: totalCuciPulsa, sub: 'trx', dot: 'bg-pink-500', ring: 'border-pink-500/20 bg-pink-500/5 dark:bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400' },
    { label: 'Total Unik', value: totalUnik, sub: 'trx', dot: 'bg-violet-500', ring: 'border-violet-500/20 bg-violet-500/5 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
    { label: 'Total Biaya Admin', value: totalBiayaAdmin, sub: 'trx', dot: 'bg-slate-500', ring: 'border-slate-500/20 bg-slate-500/5 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' },
  ];

  const inputCls = 'w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:bg-white dark:focus:bg-white/8 transition-colors';
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
            <Smartphone size={20} className="text-pink-500 dark:text-pink-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-0.5">TRACKING MONEY</p>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white leading-none">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors">
            <RefreshCw size={14} />Refresh
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-600/20">
            <Plus size={14} />Tambah
          </button>
        </div>
      </div>

      {/* Two bank selectors: TELKOMSEL AKTIF & XL AKTIF */}
      <div className={`grid grid-cols-1 ${bankFilter ? '' : 'sm:grid-cols-2'} gap-4`}>
      {(!bankFilter || bankFilter === 'telkomsel') && (
        <div className={`bg-white dark:bg-[#0d1b2e] border rounded-xl p-4 transition-colors ${(bankFilter ?? activeBank) === 'telkomsel' ? 'border-blue-500/40 ring-1 ring-blue-500/20' : 'border-slate-200 dark:border-white/5'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Smartphone size={14} className="text-blue-500 dark:text-blue-400" />
            <p className="text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wider font-semibold">TELKOMSEL AKTIF</p>
          </div>
          <select
            value={telkomselId}
            onChange={(e) => { setTelkomselId(e.target.value); if (!bankFilter) setActiveBank('telkomsel'); }}
            className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
          >
            <option value="">— Pilih Rekening —</option>
            {telkomselBanks.map((b) => (
              <option key={b.id} value={b.id}>{b.holder_name} — {b.account_number}</option>
            ))}
            {telkomselBanks.length === 0 && <option value="" disabled>Tidak ada rekening TELKOMSEL aktif</option>}
          </select>
        </div>
      )}
      {(!bankFilter || bankFilter === 'xl') && (
        <div className={`bg-white dark:bg-[#0d1b2e] border rounded-xl p-4 transition-colors ${(bankFilter ?? activeBank) === 'xl' ? 'border-blue-500/40 ring-1 ring-blue-500/20' : 'border-slate-200 dark:border-white/5'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Smartphone size={14} className="text-emerald-500 dark:text-emerald-400" />
            <p className="text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wider font-semibold">XL AKTIF</p>
          </div>
          <select
            value={xlId}
            onChange={(e) => { setXlId(e.target.value); if (!bankFilter) setActiveBank('xl'); }}
            className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
          >
            <option value="">— Pilih Rekening —</option>
            {xlBanks.map((b) => (
              <option key={b.id} value={b.id}>{b.holder_name} — {b.account_number}</option>
            ))}
            {xlBanks.length === 0 && <option value="" disabled>Tidak ada rekening XL aktif</option>}
          </select>
        </div>
      )}
      </div>

      {/* Saldo akhir */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={14} className="text-blue-500 dark:text-blue-400" />
            <p className="text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wider">Rekening Aktif</p>
          </div>
          <p className="text-slate-800 dark:text-white text-sm font-semibold truncate">
            {selectedBank ? `${selectedBank.holder_name} — ${selectedBank.name}` : '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Hash size={14} className="text-cyan-500 dark:text-cyan-400" />
            <p className="text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wider">Nomor Rekening</p>
          </div>
          <p className="text-slate-800 dark:text-white text-base font-semibold font-mono tracking-wide truncate">
            {selectedBank ? selectedBank.account_number : '—'}
          </p>
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
        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <ClipboardPaste size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <textarea
                ref={pasteRef}
                value={pasteText}
                onChange={(e) => { setPasteText(e.target.value); setPasteStatus(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePasteSave(); } }}
                placeholder="Paste data mentah di sini..."
                rows={1}
                className="w-48 lg:w-64 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none h-[34px] max-h-20 font-mono"
              />
              <button onClick={handlePasteSave} disabled={!pasteText.trim() || pasteSaving} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors shrink-0">
                {pasteSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}Simpan
              </button>
              {pasteStatus && (
                <span className={`text-xs font-medium shrink-0 ${pasteStatus.type === 'error' ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'}`}>{pasteStatus.msg}</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Cari username..." className="w-44 lg:w-56 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors h-[34px]" />
              </div>
            </div>
          </div>
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
              <option value="cuci-pulsa">Cuci Pulsa</option>
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
                    {['Tanggal', 'Jam', 'Username', 'Nomor Telp / SN', 'Deposit', 'Kredit', 'Status', 'Value 20%', 'Penerima', 'Admin', 'Aksi'].map((h) => (
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
                    const isAdd = ADD_STATUSES.has(row.status);
                    const value20 = isAdd ? Math.round(row.amount * 0.2) : 0;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3.5 text-xs text-slate-400 dark:text-slate-400 whitespace-nowrap">{txDate.toLocaleDateString('id-ID')}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-400 dark:text-slate-400 whitespace-nowrap">{txTime}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-800 dark:text-white font-medium whitespace-nowrap">{row.user_name}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono">{row.ticket || '—'}</td>
                        <td className="px-4 py-3.5 text-sm text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">{isAdd ? formatRupiah(row.amount) : '—'}</td>
                        <td className="px-4 py-3.5 text-sm text-red-500 dark:text-red-400 font-semibold whitespace-nowrap">{SUB_STATUSES.has(row.status) ? formatRupiah(row.amount) : '—'}</td>
                        <td className="px-4 py-3.5">
                          <span className={`flex items-center gap-1.5 w-fit text-xs font-semibold px-2.5 py-1 rounded-full ${sc.class}`}>{sc.icon}{STATUS_LABELS[row.status]}</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{value20 > 0 ? formatRupiah(value20) : '—'}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{row.group_name || '—'}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.admin_email ? row.admin_email.split('@')[0] : '—'}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-colors"><Edit2 size={13} /></button>
                            <button onClick={() => setDeleting(row)} className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={11} className="px-6 py-14 text-center text-slate-400 dark:text-slate-600 text-sm">{selectedBankId ? 'Belum ada transaksi untuk rekening ini' : 'Belum ada data'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-white/5">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> of{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> entries
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm">‹</button>
                <span className="px-3 text-xs text-slate-600 dark:text-slate-300 font-medium">{currentPage} / {totalPages}</span>
                <button onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm">›</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/50 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/8">
              <h2 className="text-slate-800 dark:text-white font-semibold text-base">{modal === 'edit' ? 'Edit Transaksi PULSA' : 'Tambah Transaksi PULSA'}</h2>
              <button onClick={() => setModal(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-lg leading-none">&times;</button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Tanggal</label>
                  <input type="date" className={inputCls} value={form.transaction_date} onChange={(e) => setForm((p) => ({ ...p, transaction_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Jam</label>
                  <input type="time" className={inputCls} value={form.transaction_time} onChange={(e) => setForm((p) => ({ ...p, transaction_time: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Username</label>
                <input className={inputCls} value={form.user_name} onChange={(e) => setForm((p) => ({ ...p, user_name: e.target.value }))} placeholder="Username member..." required />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Nomor Telp / SN</label>
                <input className={inputCls} value={form.ticket} onChange={(e) => setForm((p) => ({ ...p, ticket: e.target.value }))} placeholder="Nomor telp atau SN..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Jumlah (Rp)</label>
                  <input className={inputCls} type="text" inputMode="numeric" value={form.amountDisplay} onChange={(e) => setForm((p) => ({ ...p, amountDisplay: formatAmount(e.target.value) }))} placeholder="50.000" required />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Status</label>
                  <select className={selectCls} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as TransactionStatus }))}>
                    {PULSA_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Penerima</label>
                <input className={inputCls} value={form.penerima} onChange={(e) => setForm((p) => ({ ...p, penerima: e.target.value }))} placeholder="Nama penerima..." />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Rekening</label>
                <select className={selectCls} value={form.bank_account_id} onChange={(e) => setForm((p) => ({ ...p, bank_account_id: e.target.value }))}>
                  <option value="">— Pilih Rekening —</option>
                  <optgroup label="TELKOMSEL AKTIF">
                    {telkomselBanks.map((b) => <option key={b.id} value={b.id}>{b.holder_name} — {b.account_number}</option>)}
                  </optgroup>
                  <optgroup label="XL AKTIF">
                    {xlBanks.map((b) => <option key={b.id} value={b.id}>{b.holder_name} — {b.account_number}</option>)}
                  </optgroup>
                </select>
              </div>
              {formError && <p className="text-red-500 dark:text-red-400 text-xs">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 text-sm font-medium transition-colors">Batal</button>
                <button type="submit" disabled={formLoading} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors shadow-lg shadow-blue-600/20">
                  {formLoading && <Loader2 size={14} className="animate-spin" />}Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleting && (
        <ConfirmDialog message={`Hapus transaksi PULSA dari "${deleting.user_name}" senilai ${formatRupiah(deleting.amount)}?`} loading={deleteLoading} onConfirm={handleDelete} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
