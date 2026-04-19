import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Speakora — Human-Like AI English Conversation Partner',
  description: 'Master English naturally with AI that sounds human. Text chat, voice conversations, and immersive roleplay scenarios — all powered by local AI.',
};

const features = [
  {
    icon: '💬',
    title: 'Natural Text Chat',
    desc: 'Conversations that feel like texting a native speaker. No robotic responses.',
    color: 'var(--color-purple)',
    glow: 'var(--color-purple-glow)',
  },
  {
    icon: '🎤',
    title: 'Real-time Voice',
    desc: 'Speak freely. AI listens, responds, and even plays back natural speech.',
    color: 'var(--color-teal)',
    glow: 'var(--color-teal-glow)',
  },
  {
    icon: '🎭',
    title: 'Roleplay Scenarios',
    desc: 'Job interviews, restaurants, travel — practice real situations with a character AI.',
    color: 'var(--color-coral)',
    glow: 'var(--color-coral-glow)',
  },
  {
    icon: '🧠',
    title: 'Smart Corrections',
    desc: 'Instant grammar and vocabulary feedback — subtle and encouraging.',
    color: 'var(--color-amber)',
    glow: 'var(--color-amber-glow)',
  },
];

const modes = [
  { href: '/chat', label: 'Start Chatting', icon: '💬', variant: 'btn-primary btn-lg' },
  { href: '/voice', label: 'Voice Mode', icon: '🎤', variant: 'btn-secondary btn-lg' },
  { href: '/roleplay', label: 'Roleplay', icon: '🎭', variant: 'btn-secondary btn-lg' },
];

export default function LandingPage() {
  return (
    <main style={{ minHeight: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Background orbs */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 60% 50% at 20% 20%, rgba(108,99,255,0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 70%, rgba(0,212,170,0.08) 0%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ===== NAVBAR ===== */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 48px', borderBottom: '1px solid var(--color-border-subtle)',
        }} className="glass-subtle">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🗣️</span>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }} className="gradient-text">
              Speakora
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/auth/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link href="/auth/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </nav>

        {/* ===== HERO ===== */}
        <section style={{
          textAlign: 'center', padding: '100px 24px 80px',
          maxWidth: 840, margin: '0 auto',
        }} className="animate-fade-in-up">
          <div className="badge badge-purple" style={{ marginBottom: 24, fontSize: 12 }}>
            ✨ 100% Local AI — Your Data Stays Private
          </div>

          <h1 style={{
            fontSize: 'clamp(42px, 6vw, 72px)',
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: 24,
            color: 'var(--color-text-primary)',
          }}>
            English that feels{' '}
            <span className="gradient-text-animated">actually human</span>
          </h1>

          <p style={{
            fontSize: 20, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 48px',
            color: 'var(--color-text-secondary)',
          }}>
            Practice English with an AI friend who never sounds robotic. Real conversations,
            instant corrections, immersive roleplay — all powered by local AI.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {modes.map((m) => (
              <Link key={m.href} href={m.href} className={`btn ${m.variant}`} id={`hero-cta-${m.label.toLowerCase().replace(/\s/g, '-')}`}>
                <span>{m.icon}</span> {m.label}
              </Link>
            ))}
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section style={{
          maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24,
        }}>
          {features.map((f, i) => (
            <div
              key={f.title}
              className="card card-hover animate-fade-in-up"
              style={{
                animationDelay: `${i * 0.08}s`,
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 80, height: 80, borderRadius: '50%',
                background: f.glow, filter: 'blur(20px)',
              }} />
              <div style={{
                fontSize: 36, marginBottom: 16,
                width: 60, height: 60,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius-md)',
                background: `linear-gradient(135deg, ${f.glow}, transparent)`,
                border: `1px solid ${f.color}33`,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 8, color: 'var(--color-text-primary)' }}>{f.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </section>

        {/* ===== DEMO CHAT PREVIEW ===== */}
        <section style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 100px' }}>
          <h2 style={{
            textAlign: 'center', fontSize: 32, marginBottom: 40,
            fontWeight: 800, letterSpacing: '-0.02em',
          }}>
            Sounds like a <span className="gradient-text">real friend</span>
          </h2>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Chat header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--color-bg-secondary)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-purple), var(--color-teal))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>🗣️</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Speakora</div>
                <div style={{ fontSize: 12, color: 'var(--color-teal)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                  Online
                </div>
              </div>
            </div>

            {/* Demo messages */}
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { role: 'ai', text: "Hey! So how was your day? Anything exciting happen? 😊" },
                { role: 'user', text: "I go to the park today and it was really nice!" },
                { role: 'ai', text: "Oh nice, you went to the park! That sounds lovely — did you go with friends or just needed some fresh air on your own?" },
                { role: 'user', text: "With my friend. We talk a lot and drink coffee" },
                { role: 'ai', text: "That's the best kind of afternoon honestly — catching up with a friend over coffee. What did you guys talk about?" },
              ].map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    animationDelay: `${i * 0.15}s`,
                  }}
                  className="animate-fade-in-up"
                >
                  <div
                    className={msg.role === 'user' ? 'message-user' : 'message-ai'}
                    style={{
                      padding: '10px 16px', maxWidth: '75%',
                      fontSize: 14, lineHeight: 1.6,
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subtle note about grammar correction */}
          <div style={{
            marginTop: 16, padding: '12px 16px',
            background: 'rgba(0,212,170,0.06)',
            border: '1px solid rgba(0,212,170,0.2)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13, color: 'var(--color-teal)',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span>💡</span>
            <span>
              <strong>Notice:</strong> The user said "I go to the park today" (wrong tense) — Speakora naturally replied
              "you went to the park" without making it awkward. That&apos;s how real correction works.
            </span>
          </div>
        </section>

        {/* ===== CTA FOOTER ===== */}
        <section style={{
          textAlign: 'center', padding: '80px 24px',
          borderTop: '1px solid var(--color-border-subtle)',
          background: 'linear-gradient(180deg, transparent, rgba(108,99,255,0.05))',
        }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.02em' }}>
            Ready to actually <span className="gradient-text">speak</span>?
          </h2>
          <p style={{ marginBottom: 40, fontSize: 18, color: 'var(--color-text-secondary)' }}>
            No subscriptions. No API keys. All local. Free forever.
          </p>
          <Link href="/chat" className="btn btn-primary btn-lg animate-glow-pulse" id="bottom-cta-btn">
            💬 Start Your First Conversation
          </Link>
        </section>
      </div>
    </main>
  );
}
