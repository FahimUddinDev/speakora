'use client';

import { useState, useRef, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  addMessage, appendStreamToken, clearStreamingContent,
  setIsStreaming, updateLastAIMessage, type Message,
} from '@/store/slices/chatSlice';
import { 
  incrementMessageCount, endSession, setSessionFeedback,
} from '@/store/slices/roleplaySlice';
import { setShowAIProviderModal } from '@/store/slices/uiSlice';
import { v4 as uuidv4 } from 'uuid';

function TypingIndicator() {
  return (
    <div className="message-ai" style={{ padding: '10px 16px', display: 'inline-flex', gap: 6 }}>
      <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
    </div>
  );
}

function MessageBubble({ message, streamContent }: { message: Message; streamContent: string }) {
  const isUser = message.role === 'USER';
  const content = message.isStreaming ? streamContent : message.content;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
      <div className={isUser ? 'message-user' : 'message-ai'} style={{ padding: '10px 16px', maxWidth: '72%', fontSize: 15, lineHeight: 1.6 }}>
        {content}
      </div>
    </div>
  );
}

function FeedbackModal({ feedback, score, onClose }: { feedback: string; score: number; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      backdropFilter: 'blur(4px)',
    }}>
      <div className="card animate-fade-in-up" style={{ maxWidth: 480, width: '90%', padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎭</div>
          <h2 style={{ marginBottom: 4 }}>Session Complete!</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '16px 0' }}>
            <div className="badge badge-teal" style={{ fontSize: 16, padding: '8px 20px' }}>
              Score: {score}/100
            </div>
          </div>
        </div>
        <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 24, fontSize: 14, lineHeight: 1.7 }}>
          {feedback}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>← Back to Scenarios</button>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ flex: 1 }}>Try Again</button>
        </div>
      </div>
    </div>
  );
}

export default function ActiveRoleplayPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { activeScenario, messageCount, showFeedbackModal, sessionFeedback, score } = useAppSelector((s) => s.roleplay);
  const { messages, streamingContent, isStreaming } = useAppSelector((s) => s.chat);
  const { level: userLevel } = useAppSelector((s) => s.user);
  const { aiProvider } = useAppSelector((s) => s.ui);

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isThinking]);

  // Auto-start: show AI opener
  useEffect(() => {
    if (!isStarted && activeScenario && messages.length === 0) {
      setIsStarted(true);
      dispatch(addMessage({
        id: uuidv4(), role: 'AI',
        content: activeScenario.sampleOpener,
        timestamp: new Date().toISOString(),
      }));
    }
  }, [activeScenario, isStarted, messages.length, dispatch]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming || isThinking) return;
    setInput('');

    const userMsgId = uuidv4();
    dispatch(addMessage({ id: userMsgId, role: 'USER', content: text, timestamp: new Date().toISOString() }));
    dispatch(incrementMessageCount());

    setIsThinking(true);
    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: sessionId,
          mode: 'roleplay',
          scenarioId: activeScenario?.id,
          userLevel: userLevel || 'BEGINNER',
          aiProvider,
        }),
      });

      setIsThinking(false);
      dispatch(setIsStreaming(true));
      const aiMsgId = uuidv4();
      dispatch(addMessage({ id: aiMsgId, role: 'AI', content: '', timestamp: new Date().toISOString(), isStreaming: true }));

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ') && line.slice(6).trim() !== '[DONE]') {
            try { const { token } = JSON.parse(line.slice(6)); full += token; dispatch(appendStreamToken(token)); } catch { /* skip */ }
          }
        }
      }

      dispatch(updateLastAIMessage(full));
      dispatch(setIsStreaming(false));
      dispatch(clearStreamingContent());
    } catch {
      setIsThinking(false);
      dispatch(setIsStreaming(false));
    }
  };

  const handleEndSession = async () => {
    dispatch(endSession());
    // Generate feedback
    const allMessages = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Please give feedback on this roleplay session. Messages:\n${allMessages}\n\nRate their English (0-100) and give 3-4 specific tips. Be encouraging!`,
          conversationId: 'feedback-' + sessionId,
          mode: 'chat',
          userLevel: userLevel || 'BEGINNER',
          aiProvider,
        }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fb = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ') && line.slice(6).trim() !== '[DONE]') {
            try { const { token } = JSON.parse(line.slice(6)); fb += token; } catch { /* skip */ }
          }
        }
      }
      dispatch(setSessionFeedback({ feedback: fb || 'Great job practicing!', score: Math.min(95, 60 + messageCount * 2) }));
    } catch {
      dispatch(setSessionFeedback({ feedback: 'Great roleplay session! Keep practicing!', score: 75 }));
    }
  };

  if (!activeScenario) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <h2>No active roleplay session</h2>
        <Link href="/roleplay" className="btn btn-primary">Choose a Scenario</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-primary)', overflow: 'hidden' }}>
      {showFeedbackModal && sessionFeedback && score !== null && (
        <FeedbackModal feedback={sessionFeedback} score={score} onClose={() => router.push('/roleplay')} />
      )}

      <aside className="glass" style={{ width: 260, height: '100vh', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)', flexShrink: 0, padding: '16px 12px', gap: 8 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', textDecoration: 'none', marginBottom: 8 }}>
          <span style={{ fontSize: 24 }}>🗣️</span>
          <span style={{ fontSize: 18, fontWeight: 800 }} className="gradient-text">Speakora</span>
        </Link>
        <div style={{ padding: 12, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 'var(--radius-md)', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-coral)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>🎭 Active Roleplay</div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{activeScenario.name}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>AI: {activeScenario.aiRole.slice(0, 40)}</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', padding: '0 4px' }}>
          Messages: {messageCount}
        </div>
        <div style={{
          marginTop: 12,
          padding: '12px 8px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 9, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>AI Engine</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-purple)' }}>
                {aiProvider === 'huggingface' ? '🤗 HF Cloud' : '🏠 Local AI'}
              </span>
            </div>
            <button 
              onClick={() => dispatch(setShowAIProviderModal(true))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4 }}
              title="Change AI Provider"
            >
              ⚙️
            </button>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={handleEndSession} className="btn btn-danger" id="end-session-btn">End Session & Get Feedback</button>
        <Link href="/roleplay" className="btn btn-ghost" style={{ textAlign: 'center', fontSize: 13 }}>← Change Scenario</Link>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-coral), #e05555)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎭</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{activeScenario.name}</span>
              <span className="badge badge-coral">Roleplay Active</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
              {activeScenario.aiRole} · Type /exit to end
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 48px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map((msg) => <MessageBubble key={msg.id} message={msg} streamContent={streamingContent} />)}
          {isThinking && <div style={{ display: 'flex' }}><TypingIndicator /></div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 48px 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '8px 8px 8px 16px' }}>
            <textarea
              ref={inputRef}
              id="roleplay-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Respond in character... (Enter to send)"
              rows={1}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: 15, lineHeight: 1.6, color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)', maxHeight: 120, overflowY: 'auto', paddingTop: 6, paddingBottom: 6 }}
              onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; }}
            />
            <button onClick={handleSend} disabled={!input.trim() || isStreaming || isThinking} className="btn btn-primary" id="roleplay-send-btn" style={{ flexShrink: 0, borderRadius: 'var(--radius-lg)', padding: '10px 20px' }}>
              Send ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
