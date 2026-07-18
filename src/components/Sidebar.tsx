import { useState } from 'react';
import {
  LayoutDashboard, Building2, Wallet, ChevronDown, Gift, Settings,
  Star, Calendar, TrendingUp, Zap, Users, ShieldCheck, CreditCard, Menu, Smartphone,
} from 'lucide-react';
import logo from '../assets/logo.png';
import type { AdminRole } from '../types';

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: { id: string; label: string; icon: React.ReactNode }[];
};

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  {
    id: 'deposit-bank', label: 'Deposit Bank', icon: <Building2 size={18} />,
    children: [
      { id: 'bca', label: 'BCA', icon: <CreditCard size={15} /> },
      { id: 'mandiri', label: 'Mandiri', icon: <CreditCard size={15} /> },
      { id: 'bni', label: 'BNI', icon: <CreditCard size={15} /> },
      { id: 'bri', label: 'BRI', icon: <CreditCard size={15} /> },
    ],
  },
  {
    id: 'deposit-emoney', label: 'Deposit E-Money', icon: <Wallet size={18} />,
    children: [
      { id: 'dana', label: 'DANA', icon: <CreditCard size={15} /> },
      { id: 'ovo', label: 'OVO', icon: <CreditCard size={15} /> },
      { id: 'gopay', label: 'GOPAY', icon: <CreditCard size={15} /> },
      { id: 'linkaja', label: 'LINKAJA', icon: <CreditCard size={15} /> },
    ],
  },
  {
    id: 'deposit-pulsa', label: 'Deposit Pulsa', icon: <Smartphone size={18} />, children: [
      { id: 'telkomsel', label: 'Telkomsel', icon: <Smartphone size={15} /> },
      { id: 'xl', label: 'XL', icon: <Smartphone size={15} /> },
    ],
  },
  {
    id: 'bonus', label: 'Bonus', icon: <Gift size={18} />,
    children: [
      { id: 'lucky-spin', label: 'Lucky Spin', icon: <Star size={15} /> },
      { id: 'kamis-ceria', label: 'Kamis Ceria', icon: <Calendar size={15} /> },
      { id: 'gebyar-turnover', label: 'Gebyar Turnover', icon: <TrendingUp size={15} /> },
      { id: 'slot-race', label: 'Slot Race', icon: <Zap size={15} /> },
    ],
  },
  {
    id: 'settings', label: 'Settings', icon: <Settings size={18} />,
    children: [
      { id: 'manage-admin', label: 'Manage Admin', icon: <Users size={15} /> },
      { id: 'role-akses', label: 'Role & Akses', icon: <ShieldCheck size={15} /> },
      { id: 'management-bank', label: 'Management Bank', icon: <Building2 size={15} /> },
    ],
  },
];

type Props = {
  activeMenu: string;
  onMenuSelect: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  access?: string[];
  role?: AdminRole;
};

function hasAccess(id: string, access?: string[]) {
  if (!access || access.length === 0) return true;
  return access.includes(id);
}

/** Role-based filter for settings sub-menus */
function canSeeSettingsChild(childId: string, role?: AdminRole): boolean {
  if (!role || role === 'head' || role === 'supervisor') return true;
  if (role === 'ast-spv') return childId === 'manage-admin' || childId === 'management-bank';
  if (role === 'staff') return childId === 'management-bank';
  return false;
}

export default function Sidebar({ activeMenu, onMenuSelect, collapsed, onToggleCollapse, access, role }: Props) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'deposit-bank': true, 'deposit-emoney': true, 'deposit-pulsa': true, bonus: true, settings: true,
  });

  const visibleItems = menuItems.filter((item) => {
    if (item.id === 'settings' && role === 'staff') {
      const hasBankAccess = hasAccess('management-bank', access);
      if (!hasBankAccess) return false;
    }
    return hasAccess(item.id, access);
  });

  const toggleGroup = (id: string) => setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  const handleItemClick = (item: MenuItem) => item.children ? toggleGroup(item.id) : onMenuSelect(item.id);

  return (
    <aside className={`relative flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'} min-h-screen bg-gradient-to-b from-rose-50 to-pink-100 dark:from-[#0d1b2e] dark:to-[#0d1b2e] border-r border-rose-200/60 dark:border-white/5 shrink-0`}>
      <button onClick={() => onMenuSelect('dashboard')} className="flex items-center justify-center px-4 py-4 border-b border-rose-200/60 dark:border-white/5 cursor-pointer hover:bg-rose-100/70 dark:hover:bg-white/5 transition-colors w-full">
        <img src={logo} alt="MaxSlot88" className={`${collapsed ? 'h-7' : 'h-9'} object-contain`} />
      </button>

      {collapsed && (
        <button onClick={onToggleCollapse} className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-rose-100 dark:bg-[#1a2d45] border border-rose-200 dark:border-white/10 flex items-center justify-center text-rose-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-white transition-colors z-10">
          <Menu size={12} />
        </button>
      )}

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const isGroup = !!item.children;
          let visibleChildren = isGroup ? item.children!.filter((child) => hasAccess(child.id, access)) : [];
          // Apply role-based filtering for settings children
          if (item.id === 'settings') {
            visibleChildren = visibleChildren.filter((child) => canSeeSettingsChild(child.id, role));
          }
          if (isGroup && visibleChildren.length === 0) return null;
          const isGroupOpen = openGroups[item.id];
          const isActive = activeMenu === item.id;
          return (
            <div key={item.id}>
              <button
                onClick={() => handleItemClick(item)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive && !isGroup
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'text-rose-700/80 dark:text-slate-400 hover:text-rose-900 dark:hover:text-white hover:bg-rose-100/80 dark:hover:bg-white/5'
                }`}
              >
                <span className={`shrink-0 ${isActive && !isGroup ? 'text-white' : 'text-rose-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-slate-300'}`}>{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {isGroup && <span className="text-rose-300 dark:text-slate-600 group-hover:text-rose-500 dark:group-hover:text-slate-400 transition-transform duration-200" style={{ transform: isGroupOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}><ChevronDown size={14} /></span>}
                  </>
                )}
              </button>
              {isGroup && isGroupOpen && !collapsed && (
                <div className="mt-0.5 ml-3 pl-3 border-l border-rose-200/60 dark:border-white/5 space-y-0.5">
                  {visibleChildren.map((child) => {
                    const isChildActive = activeMenu === child.id;
                    return (
                      <button key={child.id} onClick={() => onMenuSelect(child.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group ${isChildActive ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'text-rose-700/80 dark:text-slate-500 hover:text-rose-900 dark:hover:text-white hover:bg-rose-100/80 dark:hover:bg-white/5'}`}>
                        <span className={`shrink-0 ${isChildActive ? 'text-white' : 'text-rose-400 dark:text-slate-600 group-hover:text-rose-600 dark:group-hover:text-slate-400'}`}>{child.icon}</span>
                        <span className="flex-1 text-left font-medium">{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-4 py-4 border-t border-rose-200/60 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">AD</div>
            <div className="min-w-0">
              <p className="text-rose-900 dark:text-white text-sm font-semibold truncate">Admin User</p>
              <p className="text-rose-400 dark:text-slate-500 text-xs truncate">admin@panel.com</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
