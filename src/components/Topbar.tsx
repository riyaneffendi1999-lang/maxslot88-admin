import { useState, useEffect, useMemo, useRef } from 'react';
import { Bell, ChevronDown, LogOut, LogIn, Sun, Moon, Clock, KeyRound, Loader2, X, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAdminActivity, type AdminActivity } from '../hooks/useAdminActivity';
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
  const [toast, setToast] = useState<AdminActivity | null>(null);
  const lastSeenIdRef = useRef<string | null>(null);
  const { data: activities, loading: actLoading } = useAdminActivity(15);
  const _initials = username ? username.slice(0, 2).toUpperCase() : userEmail ? userEmail.slice(0, 2).toUpperCase() : 'AD';
  void _initials;

  const unreadCount = useMemo(() => {
    if (activities.length === 0) return 0;
    const lastSeenId = lastSeenIdRef.current;
    if (!lastSeenId) return Math.min(activities.length, 5);
    const idx = activities.findIndex((a) => a.id === lastSeenId);
    return idx === -1 ? activities.length : idx;
  }, [activities]);

  useEffect(() => {
    if (activities.length > 0 && !lastSeenIdRef.current) {
      lastSeenIdRef.current = activities[0].id;
    }
  }, [activities]);

  // Show toast when a new activity arrives
  useEffect(() => {
    if (activities.length === 0) return;
    const latest = activities[0];
    if (lastSeenIdRef.current && latest.id !== lastSeenIdRef.current) {
      setToast(latest);
      const timer = setTimeout(() => setToast(null), 5000);
      lastSeenIdRef.current = latest.id;
      return () => clearTimeout(timer);
    }
  }, [activities]);

  // Mark all as read when notification panel opens
  useEffect(() => {
    if (showNotif && activities.length > 0) {
      lastSeenIdRef.current = activities[0].id;
    }
  }, [showNotif, activities]);

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

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'Baru saja';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} mnt lalu`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} jam lalu`;
    const day = Math.floor(hr / 24);
    return `${day} hr lalu`;
  };

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

          {/* Notification bell */}
          <div className="relative">
            <button onClick={() => { setShowNotif(!showNotif); setShowUser(false); }} className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Notifikasi aktivitas admin">
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0a1628] animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotif && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)} />
                <div className="absolute right-0 top-10 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/40 z-20 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/5">
                    <p className="text-slate-800 dark:text-white text-sm font-semibold">Notifikasi Aktivitas</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Admin</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {actLoading ? (
                      <div className="flex items-center justify-center py-8"><Loader2 size={18} className="animate-spin text-blue-500 dark:text-blue-400" /></div>
                    ) : activities.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400 dark:text-slate-600">
                        <Bell size={24} className="opacity-40" />
                        <p className="text-xs">Belum ada aktivitas</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {activities.slice(0, 10).map((a) => {
                          const isLogin = a.action === 'login';
                          return (
                            <div key={a.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${a.id === activities[0].id && unreadCount > 0 ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isLogin ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                                {isLogin ? <LogIn size={14} className="text-emerald-500 dark:text-emerald-400" /> : <LogOut size={14} className="text-amber-500 dark:text-amber-400" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-800 dark:text-white leading-snug">
                                  <span className="font-semibold">{a.username || a.email.split('@')[0]}</span>{' '}
                                  <span className="text-slate-500 dark:text-slate-400">{isLogin ? 'telah login' : 'telah logout'}</span>
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Clock size={10} className="text-slate-400 dark:text-slate-600" />
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{timeAgo(a.created_at)}</span>
                                </div>
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${isLogin ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                                {isLogin ? 'Login' : 'Logout'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {activities.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-slate-200 dark:border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{activities.length} aktivitas tercatat</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          {/* Toast popup for new activity */}
          {toast && (
            <div className="fixed top-20 right-4 z-50 w-72 bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/40 p-3.5 cursor-pointer" onClick={() => setToast(null)}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${toast.action === 'login' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                  {toast.action === 'login' ? <LogIn size={16} className="text-emerald-500 dark:text-emerald-400" /> : <LogOut size={16} className="text-amber-500 dark:text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 dark:text-white leading-snug">
                    <span className="font-semibold">{toast.username || toast.email.split('@')[0]}</span>{' '}
                    <span className="text-slate-500 dark:text-slate-400">{toast.action === 'login' ? 'telah login' : 'telah logout'}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1"><Clock size={10} /> {timeAgo(toast.created_at)}</p>
                </div>
                <button className="text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 shrink-0" onClick={(e) => { e.stopPropagation(); setToast(null); }}><X size={14} /></button>
              </div>
            </div>
          )}

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
