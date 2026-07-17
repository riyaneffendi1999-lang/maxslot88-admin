import { useState } from 'react';
import { Modal, FormField, FormActions, inputCls, selectCls } from './ModalBase';
import type { BankAccount, BankType, BankStatus } from '../../types';

const BANK_OPTIONS: Record<BankType, { name: string; code: string }[]> = {
  'Bank Transfer': [
    { name: 'BCA', code: 'BCA' },
    { name: 'BNI', code: 'BNI' },
    { name: 'BRI', code: 'BRI' },
    { name: 'Mandiri', code: 'MDR' },
  ],
  'E-Money': [
    { name: 'DANA', code: 'DANA' },
    { name: 'OVO', code: 'OVO' },
    { name: 'GOPAY', code: 'GOPAY' },
    { name: 'LINKAJA', code: 'LINKAJA' },
  ],
  'Pulsa': [
    { name: 'TELKOMSEL', code: 'TSEL' },
    { name: 'XL', code: 'XL' },
  ],
};

interface Props {
  initial?: BankAccount;
  onClose: () => void;
  onSave: (payload: { name: string; code: string; account_number: string; holder_name: string; type: BankType; status: BankStatus; initial_balance: number }) => Promise<string | null>;
}

export default function BankModal({ initial, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    code: initial?.code ?? '',
    account_number: initial?.account_number ?? '',
    holder_name: initial?.holder_name ?? '',
    type: initial?.type ?? 'Bank Transfer',
    status: initial?.status ?? 'active',
    initial_balance: initial?.initial_balance?.toString() ?? '0',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = BANK_OPTIONS[form.type as BankType];

  const handleTypeChange = (type: string) => {
    const newOptions = BANK_OPTIONS[type as BankType];
    const currentName = form.name;
    const stillValid = newOptions.some((o) => o.name === currentName);
    setForm((p) => ({
      ...p,
      type: type as BankType,
      name: stillValid ? currentName : newOptions[0].name,
      code: stillValid ? p.code : newOptions[0].code,
    }));
  };

  const handleNameChange = (name: string) => {
    const opt = options.find((o) => o.name === name);
    setForm((p) => ({ ...p, name, code: opt?.code ?? '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await onSave({
      name: form.name,
      code: form.code.toUpperCase(),
      account_number: form.account_number,
      holder_name: form.holder_name,
      type: form.type as BankType,
      status: form.status as BankStatus,
      initial_balance: parseFloat(form.initial_balance) || 0,
    });
    if (err) { setError(err); setLoading(false); }
    else onClose();
  };

  return (
    <Modal title={initial ? 'Edit Bank' : 'Tambah Bank'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Tipe">
          <select className={selectCls} value={form.type} onChange={(e) => handleTypeChange(e.target.value)}>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="E-Money">E-Money</option>
            <option value="Pulsa">Pulsa</option>
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nama Bank">
            <select className={selectCls} value={form.name} onChange={(e) => handleNameChange(e.target.value)}>
              {options.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}
            </select>
          </FormField>
          <FormField label="Kode">
            <input className={inputCls} value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="BCA" required />
          </FormField>
        </div>
        <FormField label="No. Rekening / Nomor">
          <input className={inputCls} value={form.account_number} onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))} placeholder="1234567890" required />
        </FormField>
        <FormField label="Atas Nama">
          <input className={inputCls} value={form.holder_name} onChange={(e) => setForm((p) => ({ ...p, holder_name: e.target.value }))} placeholder="PT Admin Panel" required />
        </FormField>
        <FormField label="Status">
          <select className={selectCls} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </FormField>
        <FormField label="Saldo Awal (Rp)">
          <input className={inputCls} type="number" min={0} step={1} value={form.initial_balance} onChange={(e) => setForm((p) => ({ ...p, initial_balance: e.target.value }))} placeholder="0" />
        </FormField>
        {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}
        <FormActions loading={loading} onClose={onClose} />
      </form>
    </Modal>
  );
}
