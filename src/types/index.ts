export type TransactionMethod = 'BCA' | 'Mandiri' | 'BNI' | 'BRI' | 'DANA' | 'OVO' | 'GOPAY' | 'LINKAJA' | 'PULSA';
export type TransactionStatus = 'approved' | 'pending' | 'unik' | 'pindah-dana' | 'biaya-admin' | 'cuci-pulsa';
export type BonusProgram = 'lucky-spin' | 'kamis-ceria' | 'gebyar-turnover' | 'slot-race';
export type BonusStatus = 'claimed' | 'unclaimed';
export type UserStatus = 'active' | 'inactive';
export type BankType = 'Bank Transfer' | 'E-Money' | 'Pulsa';
export type BankStatus = 'active' | 'inactive';

// ─── Admin Role System ───────────────────────────────────────────────────────
export type AdminRole = 'head' | 'supervisor' | 'ast-spv' | 'staff';

export const ADMIN_ROLES: AdminRole[] = ['head', 'supervisor', 'ast-spv', 'staff'];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  head: 'Head',
  supervisor: 'Supervisor',
  'ast-spv': 'Ast. SPV',
  staff: 'Staff',
};

export const ADMIN_ROLE_STYLES: Record<AdminRole, string> = {
  head: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  supervisor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'ast-spv': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  staff: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

/** Hierarchy rank: higher number = more authority */
export const ROLE_RANK: Record<AdminRole, number> = {
  head: 4,
  supervisor: 3,
  'ast-spv': 2,
  staff: 1,
};

export interface Transaction {
  id: string;
  user_name: string;
  method: TransactionMethod;
  amount: number;
  status: TransactionStatus;
  note: string;
  created_at: string;
  ticket: string;
  full_name: string;
  group_name: string;
  admin_email: string;
  bank_account_id: string | null;
  bank_name: string;
  transaction_date: string | null;
  transaction_time: string | null;
}

export interface BonusEntry {
  id: string;
  program: BonusProgram;
  user_name: string;
  prize: string;
  points: number;
  status: BonusStatus;
  created_at: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  joined_at: string;
  created_at: string;
}

export interface BankAccount {
  id: string;
  name: string;
  code: string;
  account_number: string;
  holder_name: string;
  type: BankType;
  status: BankStatus;
  initial_balance: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      transactions: { Row: Transaction; Insert: Omit<Transaction, 'id' | 'created_at'>; Update: Partial<Omit<Transaction, 'id' | 'created_at'>> };
      bonus_entries: { Row: BonusEntry; Insert: Omit<BonusEntry, 'id' | 'created_at'>; Update: Partial<Omit<BonusEntry, 'id' | 'created_at'>> };
      managed_users: { Row: ManagedUser; Insert: Omit<ManagedUser, 'id' | 'created_at'>; Update: Partial<Omit<ManagedUser, 'id' | 'created_at'>> };
      bank_accounts: { Row: BankAccount; Insert: Omit<BankAccount, 'id' | 'created_at'>; Update: Partial<Omit<BankAccount, 'id' | 'created_at'>> };
    };
  };
}

export const METHOD_COLORS: Record<TransactionMethod, string> = {
  OVO: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
  DANA: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
  GOPAY: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  LINKAJA: 'bg-red-500/10 text-red-600 dark:text-red-300',
  BCA: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
  Mandiri: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  BNI: 'bg-orange-500/10 text-orange-600 dark:text-orange-300',
  BRI: 'bg-blue-600/10 text-blue-600 dark:text-blue-400',
  PULSA: 'bg-pink-500/10 text-pink-600 dark:text-pink-300',
};

export const STATUS_STYLES: Record<TransactionStatus, string> = {
  approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  unik: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
  'pindah-dana': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
  'biaya-admin': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
  'cuci-pulsa': 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20',
};

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  unik: 'Unik',
  'pindah-dana': 'Pindah Dana',
  'biaya-admin': 'Biaya Admin',
  'cuci-pulsa': 'Cuci Pulsa',
};

export const BANK_METHODS: TransactionMethod[] = ['BCA', 'Mandiri', 'BNI', 'BRI'];
export const EMONEY_METHODS: TransactionMethod[] = ['DANA', 'OVO', 'GOPAY', 'LINKAJA'];
export const PULSA_METHODS: TransactionMethod[] = ['PULSA'];

export interface SidebarAccessItem { id: string; label: string; }
export const SIDEBAR_ACCESS_ITEMS: SidebarAccessItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'deposit-bank', label: 'Deposit Bank' },
  { id: 'bca', label: 'BCA' },
  { id: 'mandiri', label: 'Mandiri' },
  { id: 'bni', label: 'BNI' },
  { id: 'bri', label: 'BRI' },
  { id: 'deposit-emoney', label: 'Deposit E-Money' },
  { id: 'dana', label: 'DANA' },
  { id: 'ovo', label: 'OVO' },
  { id: 'gopay', label: 'GOPAY' },
  { id: 'linkaja', label: 'LINKAJA' },
  { id: 'deposit-pulsa', label: 'Deposit Pulsa' },
  { id: 'telkomsel', label: 'Telkomsel' },
  { id: 'xl', label: 'XL' },
  { id: 'bonus', label: 'Bonus' },
  { id: 'lucky-spin', label: 'Lucky Spin' },
  { id: 'kamis-ceria', label: 'Kamis Ceria' },
  { id: 'gebyar-turnover', label: 'Gebyar Turnover' },
  { id: 'slot-race', label: 'Slot Race' },
  { id: 'settings', label: 'Settings' },
  { id: 'manage-admin', label: 'Manage Admin' },
  { id: 'role-akses', label: 'Role & Akses' },
  { id: 'management-bank', label: 'Management Bank' },
];

export function formatRupiah(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}
