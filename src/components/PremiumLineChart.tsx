import { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { Transaction } from '../types';
import { formatRupiah } from '../types';

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

function dayShortLabel(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short' });
}

function dayFullLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const weekday = d.toLocaleDateString('id-ID', { weekday: 'long' });
  const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${weekday}, ${date}`;
}

interface DayDatum {
  date: string;
  label: string;
  Transaksi: number;
  Total: number;
  prevTransaksi: number;
}

interface TooltipPayload {
  active?: boolean;
  payload?: { payload: DayDatum }[];
}

function ChartTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const diff = d.prevTransaksi > 0 ? d.Transaksi - d.prevTransaksi : d.Transaksi;
  const pct = d.prevTransaksi > 0 ? Math.round((diff / d.prevTransaksi) * 100) : (d.Transaksi > 0 ? 100 : 0);
  const isUp = diff >= 0;

  return (
    <div className="bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 px-4 py-3 min-w-[200px]">
      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{dayFullLabel(d.date)}</p>
      <div className="flex items-center justify-between gap-6 mb-1.5">
        <span className="text-xs text-slate-500 dark:text-slate-400">Total Transaksi</span>
        <span className="text-sm font-bold text-slate-800 dark:text-white">{d.Transaksi}</span>
      </div>
      <div className="flex items-center justify-between gap-6 mb-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">Total Deposit</span>
        <span className="text-sm font-bold text-slate-800 dark:text-white">{formatRupiah(d.Total)}</span>
      </div>
      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
        {isUp ? (
          <TrendingUp size={13} className="text-emerald-500 dark:text-emerald-400" />
        ) : (
          <TrendingDown size={13} className="text-red-500 dark:text-red-400" />
        )}
        <span className={`text-xs font-semibold ${isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
          {isUp ? '+' : ''}{pct}%
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">vs hari sebelumnya</span>
      </div>
    </div>
  );
}

export default function PremiumLineChart({ transactions }: { transactions: Transaction[] }) {
  const [mounted, setMounted] = useState(false);
  useMemo(() => { setMounted(true); }, []);

  const data: DayDatum[] = useMemo(() => {
    const days = getLast7Days();
    return days.map((day, i) => {
      const dayTx = transactions.filter((t) => t.created_at.slice(0, 10) === day);
      const prevDay = days[i - 1];
      const prevTx = prevDay ? transactions.filter((t) => t.created_at.slice(0, 10) === prevDay).length : 0;
      return {
        date: day,
        label: dayShortLabel(day),
        Transaksi: dayTx.length,
        Total: dayTx.reduce((a, t) => a + t.amount, 0),
        prevTransaksi: prevTx,
      };
    });
  }, [transactions]);

  const totalTrx = data.reduce((a, d) => a + d.Transaksi, 0);
  const totalDeposit = data.reduce((a, d) => a + d.Total, 0);

  return (
    <div
      className="bg-white dark:bg-[#0d1b2e] rounded-2xl p-6"
      style={{
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 10px 30px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Activity size={16} className="text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-slate-800 dark:text-white font-semibold text-base leading-tight">Transaksi 7 Hari Terakhir</h2>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Jumlah transaksi per hari</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Total Transaksi</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{totalTrx}</p>
          </div>
          <div className="w-px h-9 bg-slate-200 dark:bg-white/10" />
          <div className="text-right">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Total Deposit</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400 leading-tight">{formatRupiah(totalDeposit)}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 12, left: -16, bottom: 0 }} style={{ background: 'transparent' }}>
            <defs>
              <linearGradient id="premiumAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.28} />
                <stop offset="60%" stopColor="#3B82F6" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="premiumLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.4 }} />
            <Area
              type="monotone"
              dataKey="Transaksi"
              stroke="url(#premiumLineGrad)"
              strokeWidth={3}
              fill="url(#premiumAreaGrad)"
              dot={{ fill: '#3B82F6', r: 4, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, strokeWidth: 3, stroke: '#fff', fill: '#3B82F6' }}
              isAnimationActive
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
