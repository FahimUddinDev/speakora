"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addMessage,
  appendStreamToken,
  clearStreamingContent,
  setConversationId,
  setIsStreaming,
  updateLastAIMessage,
  showCorrection,
  dismissCorrection,
  showSuggestions,
  dismissSuggestions,
} from "@/store/slices/chatSlice";
import { setShowAIProviderModal } from "@/store/slices/uiSlice";
import {
  resetVoice,
  setError,
  setInterimTranscript,
  setStatus,
  setTranscript,
  toggleAutoMode,
} from "@/store/slices/voiceSlice";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

type VoiceStatus =
  | "idle"
  | "recording"
  | "processing_stt"
  | "waiting_ai"
  | "speaking"
  | "error";

// Status descriptions for UI
const STATUS_LABELS: Record<VoiceStatus, { text: string; color: string }> = {
  idle: { text: "Tap to speak", color: "var(--color-text-secondary)" },
  recording: { text: "Listening...", color: "var(--color-coral)" },
  processing_stt: { text: "Transcribing...", color: "var(--color-amber)" },
  waiting_ai: { text: "AI is thinking...", color: "var(--color-purple-light)" },
  speaking: { text: "Speaking...", color: "var(--color-teal)" },
  error: { text: "Error — tap to retry", color: "var(--color-coral)" },
};

// Waveform animation component
function Waveform({
  active,
  color = "var(--color-purple-light)",
}: {
  active: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        height: 40,
        color,
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className={active ? "waveform-bar" : ""}
          style={{
            width: 3,
            height: active ? undefined : 4,
            borderRadius: 2,
            background: color,
            minHeight: 4,
            maxHeight: 36,
            animationDuration: `${0.6 + i * 0.05}s`,
            animationDelay: `${i * 0.07}s`,
            ...(active ? {} : { height: 4 }),
          }}
        />
      ))}
    </div>
  );
}

// ── Grammar Correction Toast ──────────────────────────────
function CorrectionToast({
  original, corrected, explanation, onDismiss,
}: { original: string; corrected: string; explanation: string; onDismiss: () => void }) {
  return (
    <div className="animate-fade-in-up" style={{
      position: 'fixed', bottom: 100, right: 24, zIndex: 50,
      width: 340, padding: 16,
      background: 'var(--color-surface)',
      border: '1px solid rgba(0,212,170,0.4)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span className="badge badge-teal">✨ Correction</span>
        <button onClick={onDismiss} className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ fontSize: 13, marginBottom: 8 }}>
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>❌ Said</span>
          <div className="correction-error" style={{ fontSize: 14, marginTop: 2 }}>{original}</div>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>✅ Better</span>
          <div className="correction-fixed" style={{ fontSize: 14, marginTop: 2 }}>{corrected}</div>
        </div>
      </div>
      {explanation && (
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
          💡 {explanation}
        </p>
      )}
    </div>
  );
}

// ── Vocabulary Suggestions Toast ───────────────────────────
function SuggestionsToast({
  suggestions, onDismiss,
}: { suggestions: Array<{ word: string; suggestion: string; naturalPhrasing: string }>; onDismiss: () => void }) {
  return (
    <div className="animate-fade-in-up" style={{
      position: 'fixed', bottom: 100, left: 24, zIndex: 50,
      width: 340, padding: 16,
      background: 'var(--color-surface)',
      border: '1px solid rgba(108,99,255,0.4)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span className="badge badge-purple">💡 Suggestions</span>
        <button onClick={onDismiss} className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ fontSize: 13 }}>
        {suggestions.map((s, i) => (
          <div key={i} style={{ marginBottom: i < suggestions.length - 1 ? 12 : 0 }}>
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instead of</span>
              <div style={{ fontSize: 14, marginTop: 2, fontStyle: 'italic' }}>&ldquo;{s.word}&rdquo;</div>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Try</span>
              <div style={{ fontSize: 14, marginTop: 2, color: 'var(--color-purple-light)' }}>&ldquo;{s.suggestion}&rdquo;</div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
              📝 {s.naturalPhrasing}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VoicePage() {
  const dispatch = useAppDispatch();
  const { status, transcript, interimTranscript, isAutoMode } = useAppSelector(
    (s) => s.voice,
  );
  const { messages, streamingContent, conversationId, activeCorrection, activeSuggestions } = useAppSelector(
    (s) => s.chat,
  );
  const { level: userLevel, name: userName } = useAppSelector((s) => s.user);
  const { aiProvider } = useAppSelector((s) => s.ui);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);

  // Ensure conversation
  useEffect(() => {
    if (!conversationId) {
      fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "VOICE" }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d?.conversation?.id) {
            dispatch(setConversationId(d.conversation.id));
          } else {
            console.error("Failed to init conversation:", d);
          }
        });
    }
  }, [conversationId, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioRef.current?.pause();
      userAudioRef.current?.pause();
      if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
      if (userAudioUrl) URL.revokeObjectURL(userAudioUrl);
    };
  }, [currentAudioUrl, userAudioUrl]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(blob);
      };

      mr.start(100);
      dispatch(setStatus("recording" as VoiceStatus));
    } catch {
      dispatch(setError("Microphone access denied"));
    }
  }

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const processAudio = async (blob: Blob) => {
    dispatch(setStatus("processing_stt" as VoiceStatus));
    try {
      const userUrl = URL.createObjectURL(blob);
      if (userAudioUrl) URL.revokeObjectURL(userAudioUrl);
      setUserAudioUrl(userUrl);

      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      formData.append("aiProvider", aiProvider || "local");

      const sttRes = await fetch("/api/voice/stt", {
        method: "POST",
        body: formData,
      });
      const sttData = await sttRes.json().catch(() => ({}));

      if (!sttRes.ok) {
        throw new Error(sttData?.error || "STT failed");
      }

      if (!sttData.text?.trim()) {
        throw new Error("No transcription");
      }

      dispatch(setTranscript(sttData.text));
      dispatch(setInterimTranscript(""));

      // Add user message to chat
      const userMsgId = uuidv4();
      dispatch(
        addMessage({
          id: userMsgId,
          role: "USER",
          content: sttData.text,
          timestamp: new Date().toISOString(),
        }),
      );

      // Run feedback analysis in background
      fetch('/api/feedback/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sttData.text, userLevel: 'INTERMEDIATE' }),
      }).then((r) => r.json()).then((data) => {
        if (data.feedback) {
          // Show grammar corrections
          if (data.feedback.grammar?.hasError) {
            dispatch(showCorrection({
              messageId: userMsgId,
              original: data.feedback.grammar.original,
              corrected: data.feedback.grammar.corrected,
              explanation: data.feedback.grammar.explanation,
            }));
          }

          // Show vocabulary suggestions
          if (data.feedback.vocabulary && data.feedback.vocabulary.length > 0) {
            const suggestions = data.feedback.vocabulary.map((s: { word: string; suggestion: string; naturalPhrasing: string }) => ({
              messageId: userMsgId,
              word: s.word,
              suggestion: s.suggestion,
              naturalPhrasing: s.naturalPhrasing,
            }));
            dispatch(showSuggestions(suggestions));
          }
        }
      }).catch(() => {});

      // Get AI response
      await getAIResponse(sttData.text);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Transcription failed";
      dispatch(setError(message));
    }
  };

  const getAIResponse = async (text: string) => {
    dispatch(setStatus("waiting_ai" as VoiceStatus));
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId,
          mode: "voice",
          userLevel: userLevel || "BEGINNER",
          userName: userName || "there",
          aiProvider,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody?.error || "Chat stream request failed");
      }

      dispatch(setIsStreaming(true));
      const aiMsgId = uuidv4();
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
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ") && line.slice(6).trim() !== "[DONE]") {
            try {
              const { token } = JSON.parse(line.slice(6));
              fullContent += token;
              dispatch(appendStreamToken(token));
            } catch {
              /* skip */
            }
          }
        }
      }

      if (!fullContent.trim()) {
        throw new Error("Received empty AI response");
      }

      dispatch(updateLastAIMessage(fullContent));
      dispatch(setIsStreaming(false));
      dispatch(clearStreamingContent());

      // TTS
      await speakText(fullContent);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        dispatch(
          setError(
            `AI response failed (${aiProvider === "huggingface" ? "HF" : "Local"})`,
          ),
        );
      }
      dispatch(setIsStreaming(false));
    }
  };

  const speakText = async (text: string) => {
    dispatch(setStatus("speaking" as VoiceStatus));
    try {
      const trimmedText = text?.trim();
      if (!trimmedText) {
        dispatch(setStatus("idle" as VoiceStatus));
        return;
      }

      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmedText, aiProvider }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody?.error || "TTS failed");
      }

      const buffer = await res.arrayBuffer();
      const blob = new Blob([buffer], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);

      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(url);
      setCurrentAudioUrl(url);
      audioRef.current.onended = () => {
        dispatch(setStatus("idle" as VoiceStatus));
        dispatch(resetVoice());
        URL.revokeObjectURL(url);
        if (isAutoMode) startRecording();
      };
      await audioRef.current.play();
    } catch {
      // Fallback: browser TTS
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.onend = () => {
          dispatch(setStatus("idle" as VoiceStatus));
          if (isAutoMode) startRecording();
        };
        speechSynthesis.speak(utterance);
        dispatch(setStatus("speaking" as VoiceStatus));
      } else {
        dispatch(setStatus("idle" as VoiceStatus));
      }
    }
  };

  const handleInterrupt = () => {
    audioRef.current?.pause();
    speechSynthesis.cancel();
    abortRef.current?.abort();
    dispatch(setStatus("idle" as VoiceStatus));
  };

  const handleMicBtn = () => {
    if (status === "recording") stopRecording();
    else if (status === "idle") startRecording();
    else if (status === "speaking") handleInterrupt();
    else if (status === "error") {
      dispatch(setStatus("idle" as VoiceStatus));
      startRecording();
    }
  };

  const handleReplayAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      dispatch(setStatus("speaking" as VoiceStatus));
    }
  };

  const handlePlayUserAudio = async () => {
    if (!userAudioUrl) return;

    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }

    if (!userAudioRef.current) {
      userAudioRef.current = new Audio(userAudioUrl);
      userAudioRef.current.onended = () => {
        userAudioRef.current = null;
      };
    }

    userAudioRef.current.currentTime = 0;
    await userAudioRef.current.play();
  };

  const statusInfo = STATUS_LABELS[status as VoiceStatus];
  const isRecording = status === "recording";
  const isSpeaking = status === "speaking";

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--color-bg-primary)",
        overflow: "hidden",
      }}
    >
      {/* Sidebar nav */}
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
        {[
          { href: "/chat", icon: "💬", label: "Text Chat" },
          { href: "/voice", icon: "🎤", label: "Voice Mode", active: true },
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
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </aside>

      {/* Main voice UI */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          gap: 48,
          background:
            "radial-gradient(ellipse at center, rgba(108,99,255,0.08) 0%, transparent 70%)",
        }}
      >
        {/* Status + transcript */}
        <div style={{ textAlign: "center", maxWidth: 500 }}>
          <div
            style={{
              fontSize: 14,
              color: statusInfo.color,
              fontWeight: 600,
              marginBottom: 16,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {statusInfo.text}
          </div>
          {(transcript || interimTranscript) && (
            <div
              className="card animate-fade-in-up"
              style={{ padding: "12px 20px", marginBottom: 16 }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "var(--color-text-primary)",
                }}
              >
                &ldquo;{interimTranscript || transcript}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Waveform */}
        <div style={{ height: 48, display: "flex", alignItems: "center" }}>
          <Waveform
            active={isRecording || isSpeaking}
            color={isSpeaking ? "var(--color-teal)" : "var(--color-coral)"}
          />
        </div>

        {/* Big mic button */}
        <button
          id="voice-mic-btn"
          onClick={handleMicBtn}
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            position: "relative",
            background: isRecording
              ? "linear-gradient(135deg, var(--color-coral), #e05555)"
              : isSpeaking
                ? "linear-gradient(135deg, var(--color-teal), var(--color-teal-dark))"
                : "linear-gradient(135deg, var(--color-purple), var(--color-purple-dark))",
            boxShadow: isRecording
              ? "0 0 0 0 rgba(255,107,107,0.5)"
              : isSpeaking
                ? "0 0 30px var(--color-teal-glow)"
                : "0 0 30px var(--color-purple-glow)",
            fontSize: 40,
            transition: "transform 0.2s",
            animation: isRecording
              ? "glow-pulse 1s ease-in-out infinite"
              : undefined,
          }}
          title={
            isRecording
              ? "Stop recording"
              : isSpeaking
                ? "Interrupt AI"
                : "Start speaking"
          }
        >
          {isRecording ? "⬜" : isSpeaking ? "✋" : "🎤"}
          {isRecording && (
            <span
              style={{
                position: "absolute",
                inset: -8,
                borderRadius: "50%",
                border: "3px solid rgba(255,107,107,0.5)",
                animation: "pulse-ring 1.5s ease-out infinite",
              }}
            />
          )}
        </button>

        {/* Auto mode toggle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            id="auto-mode-btn"
            onClick={() => dispatch(toggleAutoMode())}
            className={`btn ${isAutoMode ? "btn-teal" : "btn-secondary"}`}
          >
            {isAutoMode ? "🔄 Auto Mode ON" : "🔄 Auto Mode OFF"}
          </button>
          <p
            style={{
              fontSize: 12,
              color: "var(--color-text-tertiary)",
              margin: 0,
            }}
          >
            {isAutoMode
              ? "Continuous conversation — AI listens again after speaking"
              : "Manual mode — press mic to speak each time"}
          </p>

          {userAudioUrl && (
            <button
              id="play-sent-audio-btn"
              onClick={handlePlayUserAudio}
              className="btn btn-secondary"
              style={{ marginTop: 12 }}
            >
              ▶️ Play sent audio
            </button>
          )}

          {currentAudioUrl && (
            <button
              id="replay-audio-btn"
              onClick={handleReplayAudio}
              className="btn btn-secondary"
              style={{ marginTop: 12 }}
            >
              🔊 Hear AI response again
            </button>
          )}

          <div
            style={{
              marginTop: 20,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 16px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: "var(--color-text-tertiary)",
                  textTransform: "uppercase",
                }}
              >
                Current AI
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-purple-light)",
                }}
              >
                {aiProvider === "huggingface"
                  ? "🤗 Hugging Face"
                  : "🏠 Local AI"}
              </span>
            </div>
            <button
              onClick={() => dispatch(setShowAIProviderModal(true))}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                padding: 4,
              }}
              title="Switch AI Provider"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Recent transcript log */}
        {messages.length > 0 && (
          <div
            style={{
              width: "100%",
              maxWidth: 500,
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {messages.slice(-4).map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent:
                      msg.role === "USER" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    className={
                      msg.role === "USER" ? "message-user" : "message-ai"
                    }
                    style={{
                      padding: "8px 14px",
                      fontSize: 13,
                      maxWidth: "80%",
                    }}
                  >
                    {msg.role === "AI" && msg.isStreaming
                      ? streamingContent
                      : msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
