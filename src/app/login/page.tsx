'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginViaPHP, UserRole } from '../../lib/auth';
import { DEFAULT_PHP_API_BASE_URL } from '../../lib/config';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_PHP_API_BASE_URL);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await loginViaPHP({ apiBaseUrl, email, password, role });
      router.push('/chatlist');
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #0b0c1a, #162534, #1d1238, #5c3f2f, #051321ff, #040620ff, #8c5c3f)',
      backgroundSize: '400% 400%',
      animation: 'gradientMove 15s ease infinite'
    }}>
      <style jsx>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <form onSubmit={onSubmit} className="w-full max-w-md bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
        <h1 className="text-white text-xl font-semibold">Login</h1>

        <div>
          <label className="block text-white/80 text-sm mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-white/10 border border-white/20 rounded text-white"
          />
        </div>

        <div>
          <label className="block text-white/80 text-sm mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-white/10 border border-white/20 rounded text-white"
          />
        </div>

        <div>
          <label className="block text-white/80 text-sm mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full p-3 bg-white/10 border border-white/20 rounded text-white"
          >
            <option value="user">User</option>
            <option value="astrologer">Astrologer</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="text-white/70 text-sm underline"
        >
          {showAdvanced ? 'Hide advanced' : 'Show advanced'}
        </button>

        {showAdvanced && (
          <div>
            <label className="block text-white/80 text-sm mb-1">PHP API Base URL</label>
            <input
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="https://api.yourdomain.com"
              className="w-full p-3 bg-white/10 border border-white/20 rounded text-white placeholder-white/60"
            />
            <p className="text-white/50 text-xs mt-1">Default from env NEXT_PUBLIC_PHP_API_BASE_URL</p>
          </div>
        )}

        {error && <div className="text-red-400 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full text-white py-3 rounded bg-white/20 border border-white/20 hover:bg-white/30 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
