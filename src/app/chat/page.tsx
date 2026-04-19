"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addMessage,
  appendStreamToken,
  clearStreamingContent,
  dismissCorrection,
  dismissSuggestions,
  setConversationId,
  setIsStreaming,
  setIsThinking,
  showCorrection,
  showSuggestions,
  updateLastAIMessage,
  type Message,
} from "@/store/slices/chatSlice";
import { setShowAIProviderModal } from "@/store/slices/uiSlice";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

// ── Typing Indicator ───────────────────────────────────────
function TypingIndicator() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "10px 16px",
      }}
      className="message-ai"
    >
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

// ── Grammar Correction Toast ──────────────────────────────
function CorrectionToast({
  original,
  corrected,
  explanation,
  onDismiss,
}: {
  original: string;
  corrected: string;
  explanation: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className="animate-fade-in-up"
      style={{
        position: "fixed",
        bottom: 100,
        right: 24,
        zIndex: 50,
        width: 340,
        padding: 16,
        background: "var(--color-surface)",
        border: "1px solid rgba(0,212,170,0.4)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span className="badge badge-teal">✨ Correction</span>
        <button
          onClick={onDismiss}
          className="btn btn-ghost btn-sm"
          style={{ padding: "2px 8px", fontSize: 18, lineHeight: 1 }}
        >
          ×
        </button>
      </div>
      <div style={{ fontSize: 13, marginBottom: 8 }}>
        <div style={{ marginBottom: 4 }}>
          <span
            style={{
              color: "var(--color-text-tertiary)",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            ❌ Said
          </span>
          <div
            className="correction-error"
            style={{ fontSize: 14, marginTop: 2 }}
          >
            {original}
          </div>
        </div>
        <div>
          <span
            style={{
              color: "var(--color-text-tertiary)",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            ✅ Better
          </span>
          <div
            className="correction-fixed"
            style={{ fontSize: 14, marginTop: 2 }}
          >
            {corrected}
          </div>
        </div>
      </div>
      {explanation && (
        <p
          style={{
            fontSize: 12,
            color: "var(--color-text-secondary)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          💡 {explanation}
        </p>
      )}
    </div>
  );
}

// ── Vocabulary Suggestions Toast ───────────────────────────
function SuggestionsToast({
  suggestions,
  onDismiss,
}: {
  suggestions: Array<{
    word: string;
    suggestion: string;
    naturalPhrasing: string;
  }>;
  onDismiss: () => void;
}) {
  return (
    <div
      className="animate-fade-in-up"
      style={{
        position: "fixed",
        bottom: 100,
        left: 24,
        zIndex: 50,
        width: 340,
        padding: 16,
        background: "var(--color-surface)",
        border: "1px solid rgba(108,99,255,0.4)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span className="badge badge-purple">💡 Suggestions</span>
        <button
          onClick={onDismiss}
          className="btn btn-ghost btn-sm"
          style={{ padding: "2px 8px", fontSize: 18, lineHeight: 1 }}
        >
          ×
        </button>
      </div>
      <div style={{ fontSize: 13 }}>
        {suggestions.map((s, i) => (
          <div
            key={i}
            style={{ marginBottom: i < suggestions.length - 1 ? 12 : 0 }}
          >
            <div style={{ marginBottom: 4 }}>
              <span
                style={{
                  color: "var(--color-text-tertiary)",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Instead of
              </span>
              <div style={{ fontSize: 14, marginTop: 2, fontStyle: "italic" }}>
                &ldquo;{s.word}&rdquo;
              </div>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span
                style={{
                  color: "var(--color-text-tertiary)",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Try
              </span>
              <div
                style={{
                  fontSize: 14,
                  marginTop: 2,
                  color: "var(--color-purple-light)",
                }}
              >
                &ldquo;{s.suggestion}&rdquo;
              </div>
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--color-text-secondary)",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              📝 {s.naturalPhrasing}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "USER";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        marginBottom: 4,
      }}
    >
      <div
        className={isUser ? "message-user" : "message-ai"}
        style={{
          padding: "10px 16px",
          maxWidth: "72%",
          fontSize: 15,
          lineHeight: 1.6,
        }}
      >
        {message.isStreaming ? (
          <span style={{ opacity: 0.8 }}>
            {message.content}
            <span className="typing-dot" style={{ marginLeft: 4 }} />
          </span>
        ) : (
          message.content
        )}
      </div>
      <span
        style={{
          fontSize: 11,
          color: "var(--color-text-tertiary)",
          marginTop: 3,
          marginLeft: 4,
          marginRight: 4,
        }}
      >
        {new Date(message.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────
function Sidebar({
  conversationId,
  onNewChat,
}: {
  conversationId: string | null;
  onNewChat: () => void;
}) {
  const dispatch = useAppDispatch();
  const aiProvider = useAppSelector((state) => state.ui.aiProvider);

  return (
    <aside
      className="glass"
      style={{
        width: 260,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--color-border)",
        flexShrink: 0,
        padding: "16px 12px",
        gap: 8,
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "4px 8px",
          textDecoration: "none",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 24 }}>🗣️</span>
        <span
          style={{ fontSize: 18, fontWeight: 800 }}
          className="gradient-text"
        >
          Speakora
        </span>
      </Link>

      <button
        onClick={onNewChat}
        className="btn btn-primary"
        style={{ width: "100%", marginBottom: 8 }}
        id="new-chat-btn"
      >
        + New Chat
      </button>

      {/* Nav */}
      {[
        { href: "/chat", icon: "💬", label: "Text Chat", active: true },
        { href: "/voice", icon: "🎤", label: "Voice Mode" },
        { href: "/roleplay", icon: "🎭", label: "Roleplay" },
        { href: "/dashboard", icon: "📊", label: "Dashboard" },
      ].map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
            background: item.active ? "rgba(108,99,255,0.15)" : "transparent",
            color: item.active
              ? "var(--color-purple-light)"
              : "var(--color-text-secondary)",
            border: item.active
              ? "1px solid rgba(108,99,255,0.3)"
              : "1px solid transparent",
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: 18 }}>{item.icon}</span>
          {item.label}
        </Link>
      ))}

      <div
        className="sidebar-history"
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {/* Chat history items would go here */}
      </div>

      {/* AI Provider Settings */}
      <div
        style={{
          marginTop: "auto",
          padding: "12px 0",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 4px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 10,
                color: "var(--color-text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              AI Engine
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-purple)",
              }}
            >
              {aiProvider === "huggingface" ? "🤗 Hugging Face" : "🏠 Local AI"}
            </span>
          </div>
          <button
            onClick={() => dispatch(setShowAIProviderModal(true))}
            className="btn-icon"
            title="Change AI Provider"
            style={{ width: 32, height: 32 }}
          >
            ⚙️
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Main Chat Page ────────────────────────────────────────
export default function ChatPage() {
  const dispatch = useAppDispatch();
  const {
    messages,
    isStreaming,
    isThinking,
    activeCorrection,
    activeSuggestions,
    streamingContent,
    conversationId,
  } = useAppSelector((s) => s.chat);
  const { level: userLevel, name: userName } = useAppSelector((s) => s.user);
  const { aiProvider } = useAppSelector((s) => s.ui);

  const [input, setInput] = useState("");
  const [isFeedbackEnabled, setIsFeedbackEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, isThinking]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const startNewConversation = useCallback(async () => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "CHAT" }),
    });
    const data = await res.json();
    if (!data?.conversation) {
      console.error("Failed to create conversation: ", data);
      return null;
    }
    dispatch(setConversationId(data.conversation.id));
    return data.conversation.id;
  }, [dispatch]);

  // Ensure conversation exists
  useEffect(() => {
    if (!conversationId) {
      startNewConversation();
    }
  }, [conversationId, startNewConversation]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    dispatch(clearStreamingContent());

    // Ensure conversation
    let convId = conversationId;
    if (!convId) {
      convId = await startNewConversation();
      if (!convId) return; // Cannot start chat without a conversation ID
    }

    // Add user message
    const userMsgId = uuidv4();
    dispatch(
      addMessage({
        id: userMsgId,
        role: "USER",
        content: text,
        timestamp: new Date().toISOString(),
      }),
    );

    // Run feedback analysis in background
    if (isFeedbackEnabled) {
      console.log("🚀 Starting feedback analysis for:", text);
      fetch("/api/feedback/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, userLevel: userLevel || "BEGINNER" }),
      })
        .then((r) => r.json())
        .then((data) => {
          console.log("📬 Feedback received:", data);
          if (data.feedback) {
            // Show grammar corrections
            if (data.feedback.grammar?.hasError) {
              console.log("✅ Showing grammar correction");
              dispatch(
                showCorrection({
                  messageId: userMsgId,
                  original: data.feedback.grammar.original,
                  corrected: data.feedback.grammar.corrected,
                  explanation: data.feedback.grammar.explanation,
                }),
              );
            } else {
              console.log("❌ No grammar error detected");
            }

            // Show vocabulary suggestions
            if (
              data.feedback.vocabulary &&
              data.feedback.vocabulary.length > 0
            ) {
              console.log(
                "✅ Showing vocabulary suggestions:",
                data.feedback.vocabulary.length,
              );
              const suggestions = data.feedback.vocabulary.map(
                (s: {
                  word: string;
                  suggestion: string;
                  naturalPhrasing: string;
                }) => ({
                  messageId: userMsgId,
                  word: s.word,
                  suggestion: s.suggestion,
                  naturalPhrasing: s.naturalPhrasing,
                }),
              );
              dispatch(showSuggestions(suggestions));
            } else {
              console.log("❌ No vocabulary suggestions");
            }
          } else {
            console.log("❌ No feedback in response");
          }
        })
        .catch((error) => {
          console.error("❌ Feedback fetch failed:", error);
        });
    } else {
      console.log("🚫 Feedback disabled");
    }

    // Add placeholder AI message
    const aiMsgId = uuidv4();
    dispatch(setIsThinking(true));

    // Stream AI response
    dispatch(setIsStreaming(true));
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: convId,
          mode: "chat",
          userLevel: userLevel || "BEGINNER",
          userName: userName || "there",
          aiProvider,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error("Failed to get AI response");
      }

      dispatch(setIsThinking(false));
      dispatch(
        addMessage({
          id: aiMsgId,
          role: "AI",
          content: "",
          timestamp: new Date().toISOString(),
          isStreaming: true,
        }),
      );

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const { token } = JSON.parse(data);
              fullContent += token;
              dispatch(appendStreamToken(token));
            } catch {
              /* skip */
            }
          }
        }
      }

      dispatch(updateLastAIMessage(fullContent));
    } catch (err: unknown) {
      dispatch(setIsThinking(false));
      if (err instanceof Error && err.name !== "AbortError") {
        dispatch(
          addMessage({
            id: uuidv4(),
            role: "AI",
            content: `⚠️ Couldn't connect to AI. Make sure ${aiProvider === "huggingface" ? "your Hugging Face token is valid and the model is available" : "Ollama is running with `ollama serve`"}.`,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    } finally {
      dispatch(setIsStreaming(false));
      dispatch(clearStreamingContent());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    startNewConversation();
    // Also clear chat state — import clearChat from slice
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--color-bg-primary)",
        overflow: "hidden",
      }}
    >
      <Sidebar conversationId={conversationId} onNewChat={handleNewChat} />

      {/* ── Main Chat Area ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--color-bg-secondary)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--color-purple), var(--color-teal))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              🗣️
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Speakora</div>
              <div
                style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}
              >
                English Conversation Partner
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setIsFeedbackEnabled((v) => !v)}
              className={`btn btn-sm ${isFeedbackEnabled ? "btn-teal" : "btn-secondary"}`}
              id="toggle-feedback-btn"
              title="Toggle grammar feedback"
            >
              ✨ {isFeedbackEnabled ? "Corrections ON" : "Corrections OFF"}
            </button>
            <Link href="/voice" className="btn btn-secondary btn-sm">
              🎤 Voice
            </Link>
            <Link href="/roleplay" className="btn btn-secondary btn-sm">
              🎭 Roleplay
            </Link>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 48px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {messages.length === 0 && (
            <div
              className="animate-fade-in-up"
              style={{
                textAlign: "center",
                marginTop: 80,
                color: "var(--color-text-tertiary)",
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16 }}>🗣️</div>
              <h2
                style={{
                  color: "var(--color-text-primary)",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Hey! Start talking 👋
              </h2>
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  maxWidth: 400,
                  margin: "0 auto",
                }}
              >
                Just type anything — how your day went, what you want to
                practice, or ask me anything. I&apos;m here to chat!
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  justifyContent: "center",
                  marginTop: 24,
                }}
              >
                {[
                  "Tell me about yourself",
                  "Let's practice greetings",
                  "How do I say this in English?",
                  "Give me a fun conversation topic",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInput(prompt);
                      inputRef.current?.focus();
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 13 }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={
                msg.isStreaming
                  ? { ...msg, content: streamingContent || msg.content }
                  : msg
              }
            />
          ))}

          {isThinking && (
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <TypingIndicator />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: "16px 48px 24px",
            borderTop: "1px solid var(--color-border)",
            background: "var(--color-bg-secondary)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-end",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              padding: "8px 8px 8px 16px",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--color-purple)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 0 3px var(--color-purple-glow)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--color-border)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <textarea
              ref={inputRef}
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type anything... (Enter to send, Shift+Enter for new line)"
              rows={1}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-sans)",
                maxHeight: 160,
                overflowY: "auto",
                paddingTop: 6,
                paddingBottom: 6,
              }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 160) + "px";
              }}
            />
            {isStreaming && (
              <button
                onClick={() => abortRef.current?.abort()}
                className="btn btn-secondary btn-sm btn-icon"
                style={{ flexShrink: 0, color: "var(--color-coral)" }}
                title="Stop generating"
              >
                ⬜
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              id="send-message-btn"
              className="btn btn-primary"
              style={{
                flexShrink: 0,
                borderRadius: "var(--radius-lg)",
                padding: "10px 20px",
              }}
            >
              {isStreaming ? "..." : "Send ↑"}
            </button>
          </div>
          <p
            style={{
              textAlign: "center",
              fontSize: 11,
              color: "var(--color-text-tertiary)",
              marginTop: 8,
            }}
          >
            Powered by Ollama · 100% local · Your conversations stay private
          </p>
        </div>
      </div>

      {/* Grammar correction toast */}
      {activeCorrection && (
        <CorrectionToast
          original={activeCorrection.original}
          corrected={activeCorrection.corrected}
          explanation={activeCorrection.explanation}
          onDismiss={() => dispatch(dismissCorrection())}
        />
      )}

      {/* Vocabulary suggestions toast */}
      {activeSuggestions && activeSuggestions.length > 0 && (
        <SuggestionsToast
          suggestions={activeSuggestions}
          onDismiss={() => dispatch(dismissSuggestions())}
        />
      )}
    </div>
  );
}
