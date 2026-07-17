import { useState, useMemo } from 'react';
import { Modal, FormActions, inputCls } from './ModalBase';
import { parseRawTransactions, type ParsedTransaction } from '../../lib/parseRaw';
import type { BankAccount, TransactionMethod } from '../../types';
import { formatRupiah } from '../../types';

interface Props {
  bankAccounts: BankAccount[];
  method: TransactionMethod;
  onClose: () => void;
  onImport: (rows: ParsedTransaction[], bankAccountId: string, status: string) => Promise<string | null>;
}

export default function BulkImportModal({ bankAccounts, method, onClose, onImport }: Props) {
  const [raw, setRaw] = useState('');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id ?? '');
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => parseRawTransactions(raw), [raw]);
  const selectedBank = bankAccounts.find((b) => b.id === bankAccountId) ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsed.length === 0) { setError('Tidak ada data valid terdeteksi'); return; }
    if (!bankAccountId) { setError('Pilih rekening terlebih dahulu'); return; }
    setError(null);
    setLoading(true);
    const err = await onImport(parsed, bankAccountId, status);
    if (err) { setError(err); setLoading(false); }
    else onClose();
  };

  return (
    <Modal title="Import Data Mentah" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5 block">Rekening</label>
            <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors">
              <option value="">— Pilih —</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>{b.holder_name} — {b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5 block">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="unik">Unik</option>
              <option value="pindah-dana">Pindah Dana</option>
              <option value="biaya-admin">Biaya Admin</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5 block">Data Mentah (paste di sini)</label>
          <textarea
            className={`${inputCls} min-h-[160px] font-mono text-xs resize-y`}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Paste data di sini..."
          />
        </div>

        {parsed.length > 0 && (
          <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
              <span className="text-xs text-slate-500 dark:text-slate-400">{parsed.length} transaksi terdeteksi</span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white dark:bg-[#0d1b2e]">
                  <tr className="border-b border-slate-200 dark:border-white/5">
                    {['Tiket', 'Username', 'Nama', 'Group', 'Jumlah'].map((h) => (
                      <th key={h} className="text-left text-[10px] text-slate-400 dark:text-slate-500 font-medium px-3 py-2 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {parsed.map((r, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.ticket}</td>
                      <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.user_name}</td>
                      <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{r.full_name || '—'}</td>
                      <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{r.group_name || '—'}</td>
                      <td className="px-3 py-2 text-xs text-slate-800 dark:text-white font-semibold whitespace-nowrap">{formatRupiah(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}
        <FormActions loading={loading} onClose={onClose} submitLabel={`Import ${parsed.length > 0 ? `${parsed.length} Transaksi` : ''}`} />
      </form>
    </Modal>
  );
}
