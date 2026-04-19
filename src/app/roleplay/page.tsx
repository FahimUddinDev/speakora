'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { startSession } from '@/store/slices/roleplaySlice';
import { setConversationId } from '@/store/slices/chatSlice';
import { ROLEPLAY_SCENARIOS } from '@/lib/roleplay/scenarios';

const SCENARIO_ICONS: Record<string, string> = {
  job_interview: '💼',
  restaurant: '🍽️',
  travel: '✈️',
  daily_life: '☕',
  doctor_visit: '🏥',
  shopping: '🛍️',
};

const SCENARIO_COLORS: Record<string, { color: string; glow: string }> = {
  job_interview: { color: 'var(--color-purple)', glow: 'var(--color-purple-glow)' },
  restaurant: { color: 'var(--color-teal)', glow: 'var(--color-teal-glow)' },
  travel: { color: 'var(--color-amber)', glow: 'var(--color-amber-glow)' },
  daily_life: { color: '#7EC8E3', glow: 'rgba(126,200,227,0.2)' },
  doctor_visit: { color: '#4CAF50', glow: 'rgba(76,175,80,0.2)' },
  shopping: { color: 'var(--color-coral)', glow: 'var(--color-coral-glow)' },
};

export default function RoleplayPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectScenario = async (scenarioId: string) => {
    setLoading(scenarioId);
    try {
      const res = await fetch('/api/roleplay/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });
      const data = await res.json();

      dispatch(setConversationId(data.conversation.id));
      dispatch(startSession({
        scenario: data.scenario,
        sessionId: data.conversation.id,
      }));

      router.push(`/roleplay/${data.conversation.id}`);
    } catch (err) {
      console.error(err);
      setLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-primary)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside className="glass" style={{
        width: 260, height: '100vh', display: 'flex', flexDirection: 'column',
        borderRight: '1px solid var(--color-border)', flexShrink: 0,
        padding: '16px 12px', gap: 8,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', textDecoration: 'none', marginBottom: 8 }}>
          <span style={{ fontSize: 24 }}>🗣️</span>
          <span style={{ fontSize: 18, fontWeight: 800 }} className="gradient-text">Speakora</span>
        </Link>
        {[
          { href: '/chat', icon: '💬', label: 'Text Chat' },
          { href: '/voice', icon: '🎤', label: 'Voice Mode' },
          { href: '/roleplay', icon: '🎭', label: 'Roleplay', active: true },
          { href: '/dashboard', icon: '📊', label: 'Dashboard' },
        ].map((item) => (
          <Link key={item.href} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 'var(--radius-md)', textDecoration: 'none', fontSize: 14, fontWeight: 500,
            background: item.active ? 'rgba(108,99,255,0.15)' : 'transparent',
            color: item.active ? 'var(--color-purple-light)' : 'var(--color-text-secondary)',
            border: item.active ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
          }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>{item.label}
          </Link>
        ))}
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 48 }}>
        <div className="animate-fade-in-up" style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <div className="badge badge-purple" style={{ marginBottom: 16 }}>🎭 Roleplay Mode</div>
            <h1 style={{
              fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em',
              marginBottom: 12,
            }}>
              Pick your <span className="gradient-text">scenario</span>
            </h1>
            <p style={{ fontSize: 16, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              Step into a real-life situation. The AI plays a character and you practice
              natural English conversation in context. No pressure — just realistic practice.
            </p>
          </div>

          {/* Scenario grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {ROLEPLAY_SCENARIOS.map((scenario, i) => {
              const colors = SCENARIO_COLORS[scenario.id] || SCENARIO_COLORS.job_interview;
              const icon = SCENARIO_ICONS[scenario.id] || '💬';
              const isLoading = loading === scenario.id;

              return (
                <div
                  key={scenario.id}
                  id={`scenario-card-${scenario.id}`}
                  className="card card-hover animate-fade-in-up"
                  style={{
                    animationDelay: `${i * 0.07}s`,
                    cursor: isLoading ? 'wait' : 'pointer',
                    position: 'relative', overflow: 'hidden',
                    opacity: loading && !isLoading ? 0.6 : 1,
                    transition: 'all 0.25s',
                  }}
                  onClick={() => !loading && handleSelectScenario(scenario.id)}
                >
                  {/* Glow orb */}
                  <div style={{
                    position: 'absolute', top: -20, right: -20,
                    width: 80, height: 80, borderRadius: '50%',
                    background: colors.glow, filter: 'blur(20px)', pointerEvents: 'none',
                  }} />

                  {/* Icon */}
                  <div style={{
                    width: 56, height: 56, borderRadius: 'var(--radius-md)',
                    background: `linear-gradient(135deg, ${colors.glow}, transparent)`,
                    border: `1px solid ${colors.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, marginBottom: 16,
                  }}>
                    {isLoading ? (
                      <span style={{ fontSize: 16 }} className="typing-dot" />
                    ) : icon}
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>
                    {scenario.name}
                  </h3>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: '0 0 16px' }}>
                    {scenario.context.slice(0, 100)}...
                  </p>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge" style={{
                      background: `${colors.glow}`,
                      color: colors.color,
                      border: `1px solid ${colors.color}33`,
                    }}>
                      {scenario.aiRole.split(' ').slice(0, 3).join(' ')}
                    </span>
                  </div>

                  {/* Start button */}
                  <div style={{
                    marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
                      You: {scenario.userRole}
                    </span>
                    <span style={{
                      fontSize: 13, fontWeight: 600, color: colors.color,
                    }}>
                      {isLoading ? 'Starting...' : 'Start →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom scenario teaser */}
          <div className="card" style={{
            marginTop: 24,
            background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,212,170,0.05))',
            border: '1px dashed var(--color-border)',
            textAlign: 'center', padding: 32,
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✏️</div>
            <h3 style={{ marginBottom: 8 }}>Custom Scenario</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Define your own scene, character, and context. Coming soon!
            </p>
            <button className="btn btn-secondary" disabled>Coming Soon</button>
          </div>
        </div>
      </div>
    </div>
  );
}
