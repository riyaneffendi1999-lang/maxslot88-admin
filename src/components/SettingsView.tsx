import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, ShieldCheck, ShieldOff, Loader2, KeyRound, Crown, Power } from 'lucide-react';
import { useAdmins } from '../hooks/useAdmins';
import type { AdminUser } from '../hooks/useAdmins';
import { useAuth } from '../hooks/useAuth';
import { useBankAccounts } from '../hooks/useBankAccounts';
import AdminModal from './modals/AdminModal';
import BankModal from './modals/BankModal';
import { ConfirmDialog } from './modals/ModalBase';
import { SIDEBAR_ACCESS_ITEMS, formatRupiah, ADMIN_ROLE_LABELS, ADMIN_ROLE_STYLES, ROLE_RANK } from '../types';
import type { AdminRole } from '../types';
import type { BankAccount } from '../types';

const logoBCA = '/assets/deposit-logos/logo-bca.jpg';
const logoMandiri = '/assets/deposit-logos/logo-mandiri.jpg';
const logoBNI = '/assets/deposit-logos/logo-bni.jpg';
const logoBRI = '/assets/deposit-logos/logo-bri.jpg';
const logoDANA = '/assets/deposit-logos/logo-dana.jpg';
const logoOVO = '/assets/deposit-logos/logo-ovo.webp';
const logoLINKAJA = '/assets/deposit-logos/logo-linkaja.webp';
const logoGOPAY = '/assets/deposit-logos/4da0041cb04db5413b19185939b223a7.jpg';
const logoTSEL = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 40'><rect width='140' height='40' rx='20' fill='%23e30613'/><text x='8' y='28' font-family='Arial Black,Arial' font-weight='900' font-size='16' fill='%23ffffff'>TELKOMSEL</text></svg>`;
const logoXL = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 40'><rect width='140' height='40' rx='20' fill='%230086c9'/><text x='45' y='28' font-family='Arial Black,Arial' font-weight='900' font-size='22' fill='%23ffffff'>XL</text></svg>`;

const bankLogos: Record<string, string> = {
  BCA: logoBCA, Mandiri: logoMandiri, BNI: logoBNI, BRI: logoBRI,
  DANA: logoDANA, OVO: logoOVO, GOPAY: logoGOPAY, LINKAJA: logoLINKAJA,
  TSEL: logoTSEL, XL: logoXL,
};

interface Props {
  view: 'manage-admin' | 'role-akses' | 'management-bank';
}

function ManageAdmin() {
  const { data: admins, loading, create, update, remove, setStatus, resetPassword } = useAdmins();
  const { role: myRole } = useAuth();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const myRank = ROLE_RANK[myRole ?? 'staff'];
  const filtered = admins.filter((a) =>
    a.username.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleStatus = async (admin: AdminUser) => {
    const newStatus = admin.status === 'active' ? 'inactive' : 'active';
    await setStatus(admin.id, newStatus);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    await remove(confirmDelete.id);
    setDeleting(false);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari admin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        {myRank >= 3 && (
          <button onClick={() => { setEditAdmin(null); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={16} /> Tambah Admin
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={24} /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Username</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Akses</th>
                <th className="text-right px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map((admin) => {
                const adminRank = ROLE_RANK[admin.role];
                const canEdit = myRank > adminRank;
                const canDelete = myRank > adminRank;
                return (
                  <tr key={admin.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 dark:text-slate-100">{admin.username}</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">{admin.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ADMIN_ROLE_STYLES[admin.role]}`}>
                        {admin.role === 'head' && <Crown size={10} className="inline mr-1" />}
                        {ADMIN_ROLE_LABELS[admin.role]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${admin.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {admin.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{admin.access.length} menu</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <>
                            <button onClick={() => handleToggleStatus(admin)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title={admin.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}>
                              {admin.status === 'active' ? <ShieldOff size={14} className="text-amber-500" /> : <ShieldCheck size={14} className="text-emerald-500" />}
                            </button>
                            <button onClick={() => { setEditAdmin(admin); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                              <Edit2 size={14} className="text-blue-500" />
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button onClick={() => setConfirmDelete(admin)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-sm text-slate-400">Tidak ada admin ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <AdminModal
          initial={editAdmin ?? undefined}
          onClose={() => setModalOpen(false)}
          onSave={async (username, password, access, role) => {
            if (editAdmin) return await update(editAdmin.id, access, role);
            return await create(username, password, access, role);
          }}
          onSetStatus={editAdmin ? async (status) => await setStatus(editAdmin.id, status) : undefined}
          onResetPassword={editAdmin ? async (newPwd) => await resetPassword(editAdmin.id, newPwd) : undefined}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Hapus Admin"
          message={`Yakin ingin menghapus admin "${confirmDelete.username}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
          variant="danger"
        />
      )}
    </div>
  );
}

function RoleAkses() {
  const { data: admins, loading, update } = useAdmins();
  const { role: myRole } = useAuth();
  const myRank = ROLE_RANK[myRole ?? 'staff'];

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={24} /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">Kelola akses menu untuk setiap admin.</p>
      <div className="grid gap-3">
        {admins.map((admin) => {
          const adminRank = ROLE_RANK[admin.role];
          const canEdit = myRank > adminRank;
          return (
            <div key={admin.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{admin.username}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ADMIN_ROLE_STYLES[admin.role]}`}>
                    {ADMIN_ROLE_LABELS[admin.role]}
                  </span>
                </div>
                {!canEdit && <KeyRound size={14} className="text-slate-400" title="Tidak bisa edit role lebih tinggi" />}
              </div>
              <div className="flex flex-wrap gap-2">
                {SIDEBAR_ACCESS_ITEMS.map((item) => {
                  const has = admin.access.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      disabled={!canEdit}
                      onClick={async () => {
                        const newAccess = has ? admin.access.filter((a) => a !== item.id) : [...admin.access, item.id];
                        await update(admin.id, newAccess);
                      }}
                      className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                        has
                          ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                          : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'
                      } ${canEdit ? 'hover:border-blue-400 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ManagementBank() {
  const { data: banks, loading, add, update, remove } = useBankAccounts();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editBank, setEditBank] = useState<BankAccount | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BankAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = banks.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.code.toLowerCase().includes(search.toLowerCase()) ||
    b.holder_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    await remove(confirmDelete.id);
    setDeleting(false);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button onClick={() => { setEditBank(null); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={16} /> Tambah Bank
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={24} /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Bank</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">No. Rekening</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Pemilik</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Tipe</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Saldo Awal</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map((bank) => (
                <tr key={bank.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {bankLogos[bank.code] && (
                        <img src={bankLogos[bank.code]} alt={bank.code} className="h-5 w-auto rounded object-contain" />
                      )}
                      <span className="font-medium text-slate-800 dark:text-slate-100">{bank.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 font-mono text-xs">{bank.account_number}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{bank.holder_name}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${bank.type === 'Bank Transfer' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : bank.type === 'E-Money' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'}`}>
                      {bank.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 font-mono text-xs whitespace-nowrap">{formatRupiah(bank.initial_balance)}</td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => update(bank.id, { status: bank.status === 'active' ? 'inactive' : 'active' })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${bank.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      title={bank.status === 'active' ? 'Nonaktifkan bank' : 'Aktifkan bank'}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${bank.status === 'active' ? 'translate-x-4' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditBank(bank); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <Edit2 size={14} className="text-blue-500" />
                      </button>
                      <button onClick={() => setConfirmDelete(bank)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-sm text-slate-400">Tidak ada data bank.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <BankModal
          initial={editBank}
          onClose={() => setModalOpen(false)}
          onSave={async (payload) => {
            if (editBank) return await update(editBank.id, payload);
            return await add(payload as Parameters<typeof add>[0]);
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Hapus Bank"
          message={`Yakin ingin menghapus "${confirmDelete.name} - ${confirmDelete.code}"?`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
          variant="danger"
        />
      )}
    </div>
  );
}

export default function SettingsView({ view }: Props) {
  if (view === 'manage-admin') return <ManageAdmin />;
  if (view === 'role-akses') return <RoleAkses />;
  if (view === 'management-bank') return <ManagementBank />;
  return null;
}
