'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError('Invalid email or password');
    } else {
      router.push('/chat');
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    router.push('/chat');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg-primary)',
      padding: 24,
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 50% 40% at 20% 30%, rgba(108,99,255,0.12) 0%, transparent 70%), radial-gradient(ellipse 40% 35% at 80% 70%, rgba(0,212,170,0.07) 0%, transparent 70%)',
      }} />

      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 48 }}>🗣️</span>
            <span style={{ fontSize: 28, fontWeight: 900 }} className="gradient-text">Speakora</span>
          </Link>
          <p style={{ marginTop: 8, color: 'var(--color-text-secondary)', fontSize: 15 }}>
            Welcome back! Sign in to continue
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 36 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="login-password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(255,107,107,0.1)',
                border: '1px solid rgba(255,107,107,0.3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-coral-light)',
                fontSize: 13,
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              id="login-submit-btn"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: 4, padding: '13px' }}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          <button
            id="guest-btn"
            onClick={handleGuest}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '13px' }}
          >
            👋 Continue as Guest
          </button>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" style={{ color: 'var(--color-purple-light)', fontWeight: 600 }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
