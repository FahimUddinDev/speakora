'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

type Level = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

const LEVELS: { id: Level; label: string; desc: string; icon: string }[] = [
  { id: 'BEGINNER', label: 'Beginner', desc: 'I know basic English', icon: '🌱' },
  { id: 'INTERMEDIATE', label: 'Intermediate', desc: 'I can hold conversations', icon: '🌿' },
  { id: 'ADVANCED', label: 'Advanced', desc: 'I want to polish my English', icon: '🌳' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', level: 'BEGINNER' as Level });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return; }

      // Auto sign-in
      await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      router.push('/chat');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)', padding: 24 }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 50% 40% at 20% 30%, rgba(108,99,255,0.12) 0%, transparent 70%), radial-gradient(ellipse 40% 35% at 80% 70%, rgba(0,212,170,0.07) 0%, transparent 70%)' }} />

      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 48 }}>🗣️</span>
            <span style={{ fontSize: 28, fontWeight: 900 }} className="gradient-text">Speakora</span>
          </Link>
          <p style={{ marginTop: 8, color: 'var(--color-text-secondary)', fontSize: 15 }}>
            {step === 1 ? 'Create your free account' : 'What\'s your English level?'}
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {[1, 2].map((s) => (
            <div key={s} style={{ width: s <= step ? 32 : 8, height: 8, borderRadius: 4, background: s <= step ? 'var(--color-purple)' : 'var(--color-border)', transition: 'all 0.3s' }} />
          ))}
        </div>

        <div className="card" style={{ padding: 36 }}>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {step === 1 ? (
              <>
                <div>
                  <label htmlFor="reg-name" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Your Name</label>
                  <input id="reg-name" type="text" required className="input" placeholder="Alex" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
                </div>
                <div>
                  <label htmlFor="reg-email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Email</label>
                  <input id="reg-email" type="email" required className="input" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
                </div>
                <div>
                  <label htmlFor="reg-password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Password</label>
                  <input id="reg-password" type="password" required minLength={8} className="input" placeholder="At least 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px', marginTop: 4 }}>
                  Next →
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
                  Choose your level so Speakora can adapt its language and teaching style to match you.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {LEVELS.map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      id={`level-${lvl.id.toLowerCase()}`}
                      onClick={() => setForm({ ...form, level: lvl.id })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px',
                        borderRadius: 'var(--radius-md)', border: `2px solid ${form.level === lvl.id ? 'var(--color-purple)' : 'var(--color-border)'}`,
                        background: form.level === lvl.id ? 'rgba(108,99,255,0.1)' : 'var(--color-bg-secondary)',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                        boxShadow: form.level === lvl.id ? '0 0 0 3px var(--color-purple-glow)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: 28 }}>{lvl.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: form.level === lvl.id ? 'var(--color-purple-light)' : 'var(--color-text-primary)' }}>{lvl.label}</div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{lvl.desc}</div>
                      </div>
                      {form.level === lvl.id && <span style={{ marginLeft: 'auto', color: 'var(--color-purple-light)', fontSize: 18 }}>✓</span>}
                    </button>
                  ))}
                </div>

                {error && (
                  <div style={{ padding: '10px 14px', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-coral-light)', fontSize: 13 }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1, padding: '13px' }}>← Back</button>
                  <button type="submit" id="register-submit-btn" disabled={loading} className="btn btn-primary" style={{ flex: 2, padding: '13px' }}>
                    {loading ? 'Creating account...' : '🚀 Start Speaking!'}
                  </button>
                </div>
              </>
            )}
          </form>

          {step === 1 && (
            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--color-text-secondary)' }}>
              Already have an account?{' '}
              <Link href="/auth/login" style={{ color: 'var(--color-purple-light)', fontWeight: 600 }}>Sign in</Link>
            </p>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--color-text-tertiary)' }}>
          🔒 100% local AI — your data never leaves your machine
        </p>
      </div>
    </div>
  );
}
