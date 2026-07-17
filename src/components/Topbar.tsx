import { useState, useEffect } from 'react';
import { Bell, ChevronDown, LogOut, Sun, Moon, Clock, KeyRound, Loader2, X, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { ADMIN_ROLE_LABELS, ADMIN_ROLE_STYLES } from '../types';
import type { AdminRole } from '../types';
import logo from '../assets/logo.png';

type Props = {
  pageTitle: string;
  onToggleSidebar: () => void;
  userEmail: string;
  userId: string;
  username: string;
  role: AdminRole;
  onSignOut: () => void;
};

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://ncymtdnmpcjinhmyqntq.supabase.co';
const BASE = SUPABASE_URL + '/functions/v1';
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeW10ZG5tcGNqaW5obXlxbnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2OTY3NTgsImV4cCI6MjA5OTI3Mjc1OH0.Kx0AOaA6EW9z4oiobty0NL8LXwJ9tg-KcDiOsS27ECE';

export default function Topbar({ onToggleSidebar, userEmail, userId, username, role, onSignOut }: Props) {
  void onToggleSidebar;
  const { theme, toggle } = useTheme();
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [wibTime, setWibTime] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const initials = username ? username.slice(0, 2).toUpperCase() : userEmail ? userEmail.slice(0, 2).toUpperCase() : 'AD';

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const wib = new Date(now.getTime() + (now.getTimezoneOffset() + 420) * 60000);
      setWibTime(wib.toLocaleString('id-ID', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <header className="h-16 bg-white dark:bg-[#0a1628]/80 backdrop-blur-sm border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
        <div className="flex-1" />

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <Clock size={15} className="text-blue-500 dark:text-blue-400 shrink-0" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums whitespace-nowrap">{wibTime} WIB</span>
        </div>

        <div className="flex-1 flex items-center justify-end gap-3">
          <button onClick={toggle} className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <div className="relative">
            <button onClick={() => { setShowNotif(!showNotif); setShowUser(false); }} className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            </button>
            {showNotif && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)} />
                <div className="absolute right-0 top-10 w-72 bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/40 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5"><p className="text-slate-800 dark:text-white text-sm font-semibold">Notifikasi</p></div>
                  {[
                    { text: '3 deposit pending perlu dikonfirmasi', time: '2 mnt lalu', dot: 'bg-amber-400' },
                    { text: 'User baru mendaftar', time: '15 mnt lalu', dot: 'bg-blue-400' },
                    { text: 'Transaksi OVO gagal', time: '1 jam lalu', dot: 'bg-red-400' },
                  ].map((n, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-200 dark:border-white/5 last:border-0">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.dot}`} />
                      <div><p className="text-slate-600 dark:text-slate-300 text-xs">{n.text}</p><p className="text-slate-400 dark:text-slate-600 text-xs mt-0.5">{n.time}</p></div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button onClick={() => { setShowUser(!showUser); setShowNotif(false); }} className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-white/5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden ring-2 ring-white dark:ring-white/10">
                <img src={logo} alt="logo" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-slate-800 dark:text-white text-xs font-semibold leading-none">{username || userEmail.split('@')[0]}</p>
                <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${ADMIN_ROLE_STYLES[role]}`}>
                  {ADMIN_ROLE_LABELS[role]}
                </span>
              </div>
              <ChevronDown size={13} className="text-slate-400 dark:text-slate-500 hidden sm:block" />
            </button>
            {showUser && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUser(false)} />
                <div className="absolute right-0 top-12 w-56 bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/40 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                        <img src={logo} alt="logo" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-800 dark:text-white text-xs font-semibold truncate">{username || userEmail.split('@')[0]}</p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs truncate">{userEmail}</p>
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium border ${ADMIN_ROLE_STYLES[role]}`}>
                        {ADMIN_ROLE_LABELS[role]}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button onClick={() => { setShowUser(false); setResetOpen(true); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-sm">
                      <KeyRound size={14} />Reset Password
                    </button>
                    <button onClick={onSignOut} className="w-full flex items-center gap-2 px-4 py-2.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm">
                      <LogOut size={14} />Keluar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {resetOpen && (
        <ResetPasswordModal
          userId={userId}
          onClose={() => setResetOpen(false)}
          onSignOut={onSignOut}
        />
      )}
    </>
  );
}

function ResetPasswordModal({ userId, onClose, onSignOut }: { userId: string; onClose: () => void; onSignOut: () => void }) {
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPwd.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE}/update-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ userId, new_password: newPwd }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? 'Gagal mengubah password.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          onSignOut();
        }, 2000);
      }
    } catch {
      setError('Gagal terhubung ke server.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/50 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <KeyRound size={15} className="text-blue-500 dark:text-blue-400" />
            </div>
            <h2 className="text-slate-800 dark:text-white font-semibold text-base">Reset Password</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <KeyRound size={20} className="text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="text-slate-800 dark:text-white font-semibold mb-1">Password Berhasil Diubah</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Password Anda telah diperbarui.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Password Baru</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Minimal 6 karakter..."
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 pr-10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Konfirmasi Password</label>
              <input
                type={showPwd ? 'text' : 'password'}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Ulangi password baru..."
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 text-sm font-medium transition-colors">
                Batal
              </button>
              <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors shadow-lg shadow-blue-600/20">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                Ubah Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
