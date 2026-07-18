import { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import DataTable from './components/DataTable';
import PulsaDataTable from './components/PulsaDataTable';
import LoginPage from './components/LoginPage';
import { BANK_METHODS, EMONEY_METHODS } from './types';
import type { TransactionMethod, BonusProgram } from './types';
import { Loader2 } from 'lucide-react';

// Inline SVG logos (no external dependencies)
const logoBCA = '/assets/deposit-logos/logo-bca.jpg';
const logoMandiri = '/assets/deposit-logos/logo-mandiri.jpg';
const logoBNI = '/assets/deposit-logos/logo-bni.jpg';
const logoBRI = '/assets/deposit-logos/logo-bri.jpg';
const logoDANA = '/assets/deposit-logos/logo-dana.jpg';
const logoOVO = '/assets/deposit-logos/logo-ovo.webp';
const logoGOPAY = '/assets/deposit-logos/4da0041cb04db5413b19185939b223a7.jpg';
const logoLINKAJA = '/assets/deposit-logos/logo-linkaja.webp';
const logoPULSA = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 40'><rect width='140' height='40' rx='20' fill='%23ec4899'/><text x='10' y='28' font-family='Arial Black,Arial' font-weight='900' font-size='18' fill='%23ffffff'>PULSA</text></svg>`;

const methodLogos: Record<string, string> = {
  'deposit-bank': logoBCA, 'deposit-emoney': logoDANA,
  bca: logoBCA, mandiri: logoMandiri, bni: logoBNI, bri: logoBRI,
  dana: logoDANA, ovo: logoOVO, gopay: logoGOPAY, linkaja: logoLINKAJA, pulsa: logoPULSA,
};

const BonusView = lazy(() => import('./components/BonusView'));
const SettingsView = lazy(() => import('./components/SettingsView'));

function FallbackLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    </div>
  );
}

type ActiveMenu =
  | 'dashboard'
  | 'deposit-bank' | 'bca' | 'mandiri' | 'bni' | 'bri'
  | 'deposit-emoney' | 'dana' | 'ovo' | 'gopay' | 'linkaja'
  | 'deposit-pulsa' | 'telkomsel' | 'xl'
  | 'bonus' | 'lucky-spin' | 'kamis-ceria' | 'gebyar-turnover' | 'slot-race'
  | 'settings' | 'manage-admin' | 'role-akses' | 'management-bank';

const methodMap: Record<string, TransactionMethod> = {
  bca: 'BCA', mandiri: 'Mandiri', bni: 'BNI', bri: 'BRI',
  dana: 'DANA', ovo: 'OVO', gopay: 'GOPAY', linkaja: 'LINKAJA', pulsa: 'PULSA',
};

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  'deposit-bank': 'Deposit Bank', bca: 'Deposit BCA', mandiri: 'Deposit Mandiri', bni: 'Deposit BNI', bri: 'Deposit BRI',
  'deposit-emoney': 'Deposit E-Money', dana: 'Deposit DANA', ovo: 'Deposit OVO', gopay: 'Deposit GOPAY', linkaja: 'Deposit LINKAJA',
  'deposit-pulsa': 'Deposit Pulsa', telkomsel: 'Deposit Telkomsel', xl: 'Deposit XL',
  bonus: 'Bonus', 'lucky-spin': 'Lucky Spin', 'kamis-ceria': 'Kamis Ceria', 'gebyar-turnover': 'Gebyar Turnover', 'slot-race': 'Slot Race',
  settings: 'Settings', 'manage-admin': 'Manage Admin', 'role-akses': 'Role & Akses', 'management-bank': 'Management Bank',
};

const bonusMenus = new Set<string>(['lucky-spin', 'kamis-ceria', 'gebyar-turnover', 'slot-race']);
const settingsMenus = new Set<string>(['manage-admin', 'role-akses', 'management-bank']);

function renderContent(active: ActiveMenu) {
  if (active === 'dashboard') return <Dashboard />;
  if (active === 'deposit-bank') return <DataTable title="Semua Bank" methods={BANK_METHODS} logo={methodLogos[active]} />;
  if (active === 'deposit-emoney') return <DataTable title="Semua E-Money" methods={EMONEY_METHODS} logo={methodLogos[active]} />;
  if (active === 'deposit-pulsa') return <PulsaDataTable title="Deposit Pulsa" />;
  if (active === 'telkomsel') return <PulsaDataTable title="Deposit Telkomsel" bankFilter="telkomsel" />;
  if (active === 'xl') return <PulsaDataTable title="Deposit XL" bankFilter="xl" />;
  const method = methodMap[active];
  if (method) return <DataTable title={method} methods={[method]} logo={methodLogos[active]} />;
  if (bonusMenus.has(active)) return <Suspense fallback={<FallbackLoader />}><BonusView view={active as BonusProgram} /></Suspense>;
  if (settingsMenus.has(active)) return <Suspense fallback={<FallbackLoader />}><SettingsView view={active as 'manage-admin' | 'role-akses' | 'management-bank'} /></Suspense>;
  return <Dashboard />;
}

function AdminApp() {
  const { user, loading, signOut, access, role, username } = useAuth();
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#060e1a] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-blue-500 dark:text-blue-400" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#060e1a]">
      <Sidebar activeMenu={activeMenu} onMenuSelect={(id) => setActiveMenu(id as ActiveMenu)} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((v) => !v)} access={access} role={role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar pageTitle={pageTitles[activeMenu] ?? 'Panel'} onToggleSidebar={() => setSidebarCollapsed((v) => !v)} userEmail={user.email ?? ''} userId={user.id} username={username} role={role} onSignOut={signOut} />
        <main className="flex-1 overflow-y-auto p-6">{renderContent(activeMenu)}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
