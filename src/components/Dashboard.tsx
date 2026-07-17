import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Loader2, ChevronDown, Calendar, Star, Zap, Gift } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useTransactions } from '../hooks/useTransactions';
import { useBonusSummary } from '../hooks/useBonusSummary';
import { formatRupiah, METHOD_COLORS, STATUS_LABELS, STATUS_STYLES } from '../types';
import type { Transaction } from '../types';

const CHART_COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'];

const BONUS_COLORS: Record<string, string> = {
  'lucky-spin': '#f59e0b',
  'kamis-ceria': '#3b82f6',
  'gebyar-turnover': '#10b981',
  'slot-race': '#8b5cf6',
};

const BONUS_LABELS: Record<string, string> = {
  'lucky-spin': 'Lucky Spin',
  'kamis-ceria': 'Kamis Ceria',
  'gebyar-turnover': 'Gebyar Turnover',
  'slot-race': 'Slot Race',
};

const BONUS_ICONS: Record<string, React.ReactNode> = {
  'lucky-spin': <Star size={13} className="text-amber-400" />,
  'kamis-ceria': <Calendar size={13} className="text-blue-400" />,
  'gebyar-turnover': <TrendingUp size={13} className="text-emerald-400" />,
  'slot-race': <Zap size={13} className="text-violet-400" />,
};

type Period = 'today' | 'yesterday' | 'current-week' | 'current-month' | 'anothers';

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  'current-week': 'Current Week',
  'current-month': 'Current Month',
  anothers: 'Anothers',
};

function getPeriodRange(period: Period): { from: Date; to: Date } {
  const now = new Date();
  const start = (y: number, m: number, d: number) => new Date(y, m, d, 0, 0, 0, 0);
  const end = (y: number, m: number, d: number) => new Date(y, m, d, 23, 59, 59, 999);
  if (period === 'today')
    return { from: start(now.getFullYear(), now.getMonth(), now.getDate()), to: end(now.getFullYear(), now.getMonth(), now.getDate()) };
  if (period === 'yesterday') {
    const y = new Date(now); y.setDate(now.getDate() - 1);
    return { from: start(y.getFullYear(), y.getMonth(), y.getDate()), to: end(y.getFullYear(), y.getMonth(), y.getDate()) };
  }
  if (period === 'current-week') {
    const day = now.getDay();
    const monday = new Date(now); monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    return { from: start(monday.getFullYear(), monday.getMonth(), monday.getDate()), to: end(now.getFullYear(), now.getMonth(), now.getDate()) };
  }
  if (period === 'current-month')
    return { from: start(now.getFullYear(), now.getMonth(), 1), to: end(now.getFullYear(), now.getMonth(), now.getDate()) };
  return { from: new Date(0), to: new Date(8640000000000000) };
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-slate-400 dark:text-slate-400 mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.name === 'Total' || p.name === 'Deposit' || p.name === 'Total Bonus' ? formatRupiah(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

function PeriodDropdown({ value, onChange }: { value: Period; onChange: (v: Period) => void }) {
  const [open, setOpen] = useState(false);
  const periods: Period[] = ['today', 'yesterday', 'current-week', 'current-month', 'anothers'];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300 hover:border-blue-500/40 transition-colors min-w-[160px] justify-between"
      >
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-blue-500 dark:text-blue-400 shrink-0" />
          {PERIOD_LABELS[value]}
        </div>
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => { onChange(p); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${p === value ? 'text-blue-600 dark:text-blue-400 bg-blue-500/5' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TopDepositorTable({ transactions }: { transactions: Transaction[] }) {
  const rows = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    transactions.filter(t => t.status === 'approved').forEach((t) => {
      const prev = map.get(t.user_name) ?? { total: 0, count: 0 };
      map.set(t.user_name, { total: prev.total + t.amount, count: prev.count + 1 });
    });
    return Array.from(map.entries())
      .map(([user_name, { total, count }]) => ({ user_name, total, count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [transactions]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
            {['#', 'Username', 'Trx', 'Total Deposit'].map((h) => (
              <th key={h} className="text-left text-xs text-slate-500 dark:text-slate-500 font-medium px-3 py-2.5 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
          {rows.map((r, i) => (
            <tr key={r.user_name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
              <td className="px-3 py-2.5">
                {i < 3 ? (
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${i === 0 ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400' : i === 1 ? 'bg-slate-300/20 text-slate-600 dark:text-slate-300' : 'bg-orange-400/20 text-orange-600 dark:text-orange-400'}`}>{i + 1}</span>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500">{i + 1}</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-xs text-slate-800 dark:text-white font-medium truncate max-w-[100px]">{r.user_name}</td>
              <td className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400">{r.count}</td>
              <td className="px-3 py-2.5 text-xs text-slate-800 dark:text-white font-semibold whitespace-nowrap">{formatRupiah(r.total)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-400 dark:text-slate-600 text-xs">Belum ada data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard() {
  const { data: transactions, loading } = useTransactions();
  const [period, setPeriod] = useState<Period>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const periodRange = useMemo(() => {
    if (period === 'anothers' && (customFrom || customTo)) {
      return {
        from: customFrom ? new Date(customFrom + 'T00:00:00') : new Date(0),
        to: customTo ? new Date(customTo + 'T23:59:59') : new Date(8640000000000000),
      };
    }
    return getPeriodRange(period);
  }, [period, customFrom, customTo]);

  const { data: bonusSummary, loading: bonusLoading } = useBonusSummary(periodRange.from, periodRange.to);

  const periodTx = useMemo(
    () => transactions.filter((t) => { const d = new Date(t.created_at); return d >= periodRange.from && d <= periodRange.to; }),
    [transactions, periodRange]
  );

  const stats = useMemo(() => {
    const total = periodTx.reduce((a, t) => a + t.amount, 0);
    const pending = periodTx.filter((t) => t.status === 'pending').length;
    const approved = periodTx.filter((t) => t.status === 'approved').length;
    return { total, pending, approved, count: periodTx.length };
  }, [periodTx]);

  const areaData = useMemo(() => {
    const days = getLast7Days();
    return days.map((day) => {
      const dayTx = transactions.filter((t) => t.created_at.slice(0, 10) === day);
      return { name: dayLabel(day), Transaksi: dayTx.length, Total: dayTx.reduce((a, t) => a + t.amount, 0) };
    });
  }, [transactions]);

  const methodData = useMemo(() => {
    const map = new Map<string, number>();
    periodTx.forEach((t) => map.set(t.method, (map.get(t.method) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [periodTx]);

  const barData = useMemo(() => {
    const map = new Map<string, number>();
    periodTx.forEach((t) => map.set(t.method, (map.get(t.method) ?? 0) + t.amount));
    return Array.from(map.entries()).map(([method, total]) => ({ method, total }));
  }, [periodTx]);

  // Bonus bar chart data: member count + total bonus per program
  const bonusBarData = useMemo(() =>
    bonusSummary.map((s) => ({
      name: BONUS_LABELS[s.program],
      program: s.program,
      Member: s.memberCount,
      'Total Bonus': s.totalBonus,
    })),
    [bonusSummary]
  );

  const totalBonusAll = useMemo(() => bonusSummary.reduce((a, s) => a + s.totalBonus, 0), [bonusSummary]);
  const totalMemberAll = useMemo(() => bonusSummary.reduce((a, s) => a + s.memberCount, 0), [bonusSummary]);

  const statCards = [
    { label: 'Total Deposit', value: formatRupiah(stats.total), icon: <TrendingUp size={14} className="text-emerald-500 dark:text-emerald-400" />, color: 'text-emerald-500 dark:text-emerald-400', sub: `${stats.approved} approved` },
    { label: 'Total Transaksi', value: stats.count.toString(), icon: <TrendingUp size={14} className="text-blue-500 dark:text-blue-400" />, color: 'text-blue-500 dark:text-blue-400', sub: 'periode ini' },
    { label: 'Pending', value: stats.pending.toString(), icon: <TrendingDown size={14} className="text-amber-500 dark:text-amber-400" />, color: 'text-amber-500 dark:text-amber-400', sub: 'perlu diproses' },
    { label: 'Transaksi All-time', value: transactions.length.toString(), icon: <TrendingUp size={14} className="text-cyan-500 dark:text-cyan-400" />, color: 'text-cyan-500 dark:text-cyan-400', sub: 'semua waktu' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-blue-500 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Rekap data transaksi secara real-time.</p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodDropdown value={period} onChange={setPeriod} />
          {period === 'anothers' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors" />
              <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors" />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl p-5 hover:border-slate-300 dark:hover:border-white/10 transition-colors">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{s.label}</p>
            <p className="text-slate-800 dark:text-white text-xl font-bold mt-2 truncate">{s.value}</p>
            <div className="flex items-center gap-1.5 mt-2">
              {s.icon}
              <span className={`text-xs font-semibold ${s.color}`}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Area chart */}
      <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl p-6">
        <h2 className="text-slate-800 dark:text-white font-semibold mb-1">Transaksi 7 Hari Terakhir</h2>
        <p className="text-slate-400 dark:text-slate-500 text-xs mb-5">Jumlah transaksi per hari</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={areaData}>
            <defs>
              <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="Transaksi" stroke="#3b82f6" strokeWidth={2} fill="url(#txGrad)" dot={{ fill: '#3b82f6', r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pie + Bar charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl p-6">
          <h2 className="text-slate-800 dark:text-white font-semibold mb-1">Distribusi per Metode</h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs mb-4">Periode: {PERIOD_LABELS[period]}</p>
          {methodData.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-600 text-sm text-center py-10">Belum ada data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={methodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={2}>
                  {methodData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl p-6">
          <h2 className="text-slate-800 dark:text-white font-semibold mb-1">Total Nominal per Metode</h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs mb-4">Periode: {PERIOD_LABELS[period]}</p>
          {barData.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-600 text-sm text-center py-10">Belum ada data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="method" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Depositor + Bonus Recap */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Top Depositor — compact, 2/5 width */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-white/5">
            <div>
              <h2 className="text-slate-800 dark:text-white font-semibold text-sm">Top Depositor</h2>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">
                <span className="text-blue-500 dark:text-blue-400">{PERIOD_LABELS[period]}</span>
              </p>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-2 py-0.5">
              {periodTx.filter(t => t.status === 'approved').length} trx
            </span>
          </div>
          <TopDepositorTable transactions={periodTx} />
        </div>

        {/* Bonus Recap — 3/5 width */}
        <div className="lg:col-span-3 bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3.5 border-b border-slate-200 dark:border-white/5">
            <h2 className="text-slate-800 dark:text-white font-semibold text-sm">Rekap Program Bonus</h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Total klaim & inject bonus seluruh program</p>
          </div>

          {bonusLoading ? (
            <div className="flex items-center justify-center flex-1 py-12">
              <Loader2 size={18} className="animate-spin text-blue-500 dark:text-blue-400" />
            </div>
          ) : (
            <div className="flex flex-col flex-1 p-4 gap-4">

              {/* Summary badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl px-3 py-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Gift size={14} className="text-blue-500 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">Total Member Claim</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{totalMemberAll}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl px-3 py-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <TrendingUp size={14} className="text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">Total Inject Bonus</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{formatRupiah(totalBonusAll)}</p>
                  </div>
                </div>
              </div>

              {/* Per-program mini cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {bonusSummary.map((s) => (
                  <div key={s.program} className="flex flex-col gap-1 rounded-xl px-3 py-2.5 border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-1.5">
                      {BONUS_ICONS[s.program]}
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">{BONUS_LABELS[s.program]}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{s.memberCount} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">member</span></p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatRupiah(s.totalBonus)}</p>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div className="flex-1 min-h-[160px]">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={bonusBarData} barSize={18} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                    <Bar yAxisId="left" dataKey="Member" radius={[4, 4, 0, 0]} fill="#3b82f6" opacity={0.85}>
                      {bonusBarData.map((entry) => (
                        <Cell key={entry.program} fill={BONUS_COLORS[entry.program]} />
                      ))}
                    </Bar>
                    <Bar yAxisId="right" dataKey="Total Bonus" radius={[4, 4, 0, 0]} fill="#10b981" opacity={0.5}>
                      {bonusBarData.map((entry) => (
                        <Cell key={entry.program} fill={BONUS_COLORS[entry.program]} opacity={0.4} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/5">
          <h2 className="text-slate-800 dark:text-white font-semibold">Breakdown Status</h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Periode: {PERIOD_LABELS[period]}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-200 dark:divide-white/5">
          {(['approved', 'pending', 'unik', 'pindah-dana', 'biaya-admin'] as const).map((s) => {
            const count = periodTx.filter(t => t.status === s).length;
            const total = periodTx.filter(t => t.status === s).reduce((a, t) => a + t.amount, 0);
            return (
              <div key={s} className="p-4 text-center">
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[s]}`}>{STATUS_LABELS[s]}</span>
                <p className="text-slate-800 dark:text-white text-lg font-bold mt-2">{count}</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{formatRupiah(total)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
