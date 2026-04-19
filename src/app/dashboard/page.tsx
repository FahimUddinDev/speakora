'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { useAppSelector } from '@/store/hooks';

interface AnalyticsData {
  totalConversations: number;
  totalMistakes: number;
  totalVocab: number;
  totalMessages: number;
  mistakes: Array<{ id: string; sentence: string; correction: string; explanation: string }>;
  vocabulary: Array<{ id: string; word: string; suggestion: string }>;
  dailyConversations: Array<{ createdAt: string; _count: number }>;
}

const mockWeekData = [
  { day: 'Mon', messages: 12, mistakes: 3 },
  { day: 'Tue', messages: 8, mistakes: 1 },
  { day: 'Wed', messages: 25, mistakes: 5 },
  { day: 'Thu', messages: 14, mistakes: 2 },
  { day: 'Fri', messages: 30, mistakes: 7 },
  { day: 'Sat', messages: 19, mistakes: 3 },
  { day: 'Sun', messages: 22, mistakes: 4 },
];

export default function DashboardPage() {
  const { id: userId, level } = useAppSelector((s) => s.user);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const url = userId ? `/api/analytics/summary?userId=${userId}` : '/api/analytics/summary?userId=guest';
        const res = await fetch(url);
        const json = await res.json();
        setData(json);
      } catch {
        // Use mock data
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [userId]);

  const stats = [
    { label: 'Conversations', value: data?.totalConversations ?? 0, icon: '💬', color: 'var(--color-purple)' },
    { label: 'Messages Sent', value: data?.totalMessages ?? 0, icon: '✉️', color: 'var(--color-teal)' },
    { label: 'Mistakes Logged', value: data?.totalMistakes ?? 0, icon: '❌', color: 'var(--color-coral)' },
    { label: 'Words Improved', value: data?.totalVocab ?? 0, icon: '📚', color: 'var(--color-amber)' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-primary)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside className="glass" style={{ width: 260, height: '100vh', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)', flexShrink: 0, padding: '16px 12px', gap: 8 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', textDecoration: 'none', marginBottom: 8 }}>
          <span style={{ fontSize: 24 }}>🗣️</span>
          <span style={{ fontSize: 18, fontWeight: 800 }} className="gradient-text">Speakora</span>
        </Link>
        {[
          { href: '/chat', icon: '💬', label: 'Text Chat' },
          { href: '/voice', icon: '🎤', label: 'Voice Mode' },
          { href: '/roleplay', icon: '🎭', label: 'Roleplay' },
          { href: '/dashboard', icon: '📊', label: 'Dashboard', active: true },
        ].map((item) => (
          <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-md)', textDecoration: 'none', fontSize: 14, fontWeight: 500, background: item.active ? 'rgba(108,99,255,0.15)' : 'transparent', color: item.active ? 'var(--color-purple-light)' : 'var(--color-text-secondary)', border: item.active ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent' }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>{item.label}
          </Link>
        ))}
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px' }}>
        <div className="animate-fade-in-up" style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>
              Your <span className="gradient-text">Progress</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Current Level:</span>
              <span className={`badge ${level === 'ADVANCED' ? 'badge-teal' : level === 'INTERMEDIATE' ? 'badge-purple' : 'badge-amber'}`}>
                {level || 'BEGINNER'}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
            {stats.map((stat) => (
              <div key={stat.label} className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: stat.color, lineHeight: 1 }}>
                  {loading ? '—' : stat.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
            {/* Activity chart */}
            <div className="card">
              <h3 style={{ marginBottom: 20, fontSize: 16 }}>📈 Weekly Activity</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={mockWeekData} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }}
                    cursor={{ fill: 'rgba(108,99,255,0.08)' }}
                  />
                  <Bar dataKey="messages" name="Messages" fill="var(--color-purple)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Mistakes trend */}
            <div className="card">
              <h3 style={{ marginBottom: 20, fontSize: 16 }}>🔍 Mistake Trend</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={mockWeekData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }} />
                  <Line type="monotone" dataKey="mistakes" name="Mistakes" stroke="var(--color-coral)" strokeWidth={2} dot={{ fill: 'var(--color-coral)', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mistakes & Vocab tables */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="card">
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>❌ Recent Mistakes</h3>
              {(!data?.mistakes || data.mistakes.length === 0) ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>No mistakes logged yet. Start chatting!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.mistakes.map((m) => (
                    <div key={m.id} style={{ padding: '10px 12px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                      <div className="correction-error" style={{ marginBottom: 4 }}>{m.sentence}</div>
                      <div className="correction-fixed" style={{ marginBottom: 4 }}>{m.correction}</div>
                      <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>{m.explanation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>📚 Vocabulary Improvements</h3>
              {(!data?.vocabulary || data.vocabulary.length === 0) ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>No vocabulary tracked yet. Keep chatting!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.vocabulary.map((v) => (
                    <div key={v.id} style={{ padding: '10px 12px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: 13, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{v.word}</span>
                      <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
                      <span style={{ color: 'var(--color-teal)', fontWeight: 600 }}>{v.suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
