import { useState } from 'react';
import { Eye, EyeOff, Loader2, Sun, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import logo from '../assets/logo.png';

// Coin positions - seeded so they don't jump on re-render
const COINS = [
  { x: 8,  y: 12, size: 52, delay: 0,    dur: 7  },
  { x: 20, y: 55, size: 38, delay: 1.2,  dur: 9  },
  { x: 35, y: 22, size: 60, delay: 0.5,  dur: 8  },
  { x: 50, y: 70, size: 44, delay: 2,    dur: 6  },
  { x: 63, y: 15, size: 36, delay: 0.8,  dur: 10 },
  { x: 75, y: 48, size: 56, delay: 1.5,  dur: 7  },
  { x: 88, y: 30, size: 40, delay: 0.3,  dur: 9  },
  { x: 14, y: 82, size: 48, delay: 1.8,  dur: 8  },
  { x: 55, y: 88, size: 34, delay: 0.6,  dur: 11 },
  { x: 82, y: 78, size: 62, delay: 1.1,  dur: 7  },
  { x: 42, y: 44, size: 30, delay: 2.4,  dur: 9  },
  { x: 93, y: 60, size: 46, delay: 0.9,  dur: 8  },
  { x: 28, y: 36, size: 42, delay: 1.7,  dur: 6  },
  { x: 70, y: 92, size: 38, delay: 0.4,  dur: 10 },
  { x: 5,  y: 65, size: 54, delay: 2.1,  dur: 7  },
];

function RupiahCoin({ x, y, size, delay, dur }: { x: number; y: number; size: number; delay: number; dur: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        animation: `coinFloat ${dur}s ease-in-out ${delay}s infinite`,
        opacity: 0.18,
      }}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer ring */}
        <circle cx="50" cy="50" r="47" fill="url(#coinGrad)" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="url(#shimmer)" strokeWidth="2" />
        {/* Inner face */}
        <circle cx="50" cy="50" r="36" fill="url(#innerGrad)" />
        {/* Rp symbol */}
        <text
          x="50" y="57"
          textAnchor="middle"
          fontSize="28"
          fontWeight="900"
          fontFamily="serif"
          fill="#7c3f00"
          opacity="0.9"
        >Rp</text>
        <defs>
          <radialGradient id="coinGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="40%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#B8860B" />
          </radialGradient>
          <radialGradient id="innerGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFE55C" />
            <stop offset="100%" stopColor="#D4860A" />
          </radialGradient>
          <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF8DC" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await signIn(email, password);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-100 dark:bg-[#0a0e1a] transition-colors duration-300">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-[#0a0e1a] dark:via-[#0f1829] dark:to-[#0a1020] transition-colors duration-300" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(180,120,0,0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(200,140,0,0.08),transparent_55%)]" />

      {/* Floating coins */}
      <div className="absolute inset-0 overflow-hidden">
        {COINS.map((c, i) => <RupiahCoin key={i} {...c} />)}
      </div>

      {/* Coin animation keyframes */}
      <style>{`
        @keyframes coinFloat {
          0%   { transform: translateY(0px) rotate(0deg); }
          33%  { transform: translateY(-18px) rotate(8deg); }
          66%  { transform: translateY(-8px) rotate(-5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes coinSpin {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="absolute top-5 right-5 p-2.5 rounded-xl bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:border-slate-400 dark:hover:border-white/20 transition-colors z-10"
        title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
      >
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="MaxSlot88" className="h-16 object-contain drop-shadow-[0_0_24px_rgba(255,180,0,0.5)]" />
        </div>

        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-7 shadow-2xl shadow-black/10 dark:shadow-black/60 transition-colors duration-300">
          <div className="mb-6 text-center">
            <h2 className="text-slate-800 dark:text-white text-lg font-bold tracking-wide">Selamat Datang</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Masuk ke panel admin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Username</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="username"
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-500 dark:text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 mt-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-60 text-black font-bold rounded-xl py-2.5 text-sm transition-all shadow-lg shadow-amber-500/30"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Masuk
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 dark:text-slate-600 text-xs mt-5">
          &copy; {new Date().getFullYear()} MaxSlot88. All rights reserved.
        </p>
      </div>
    </div>
  );
}
