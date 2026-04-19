'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAIProvider, setShowAIProviderModal } from '@/store/slices/uiSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function AIProviderModal() {
  const dispatch = useAppDispatch();
  const currentProvider = useAppSelector((state) => state.ui.aiProvider);
  const showModal = useAppSelector((state) => state.ui.showAIProviderModal);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const savedProvider = localStorage.getItem('speakora_ai_provider');
    if (savedProvider === 'local' || savedProvider === 'huggingface') {
      dispatch(setAIProvider(savedProvider as 'local' | 'huggingface'));
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, [dispatch]);

  const active = isVisible || showModal;

  const handleSelect = (provider: 'local' | 'huggingface') => {
    dispatch(setAIProvider(provider));
    localStorage.setItem('speakora_ai_provider', provider);
    setIsVisible(false);
    dispatch(setShowAIProviderModal(false));
  };

  if (!active) return null;

  return (
    <AnimatePresence>
      {active && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(5, 5, 10, 0.85)',
              backdropFilter: 'blur(12px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="card"
            style={{
              position: 'relative',
              maxWidth: 500,
              width: '100%',
              padding: '40px 32px',
              textAlign: 'center',
              border: '1px solid var(--color-border)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Close Button (only if not forced) */}
            {currentProvider && (
              <button
                onClick={() => {
                  setIsVisible(false);
                  dispatch(setShowAIProviderModal(false));
                }}
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-tertiary)',
                  cursor: 'pointer',
                  padding: 8,
                }}
              >
                <X size={20} />
              </button>
            )}

            <div style={{ fontSize: 48, marginBottom: 20 }}>🤖</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }} className="gradient-text">
              Choose Your AI Provider
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
              Select how you want Speakora to power your conversations. You can change this later in settings.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button
                onClick={() => handleSelect('local')}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '20px',
                  height: 'auto',
                  border: '2px solid transparent',
                  transition: 'all 0.2s',
                  background: 'rgba(255,255,255,0.03)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-purple)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>🏠</span>
                  <strong style={{ fontSize: 16 }}>Local AI (Recommended)</strong>
                </div>
                <span style={{ fontSize: 13, opacity: 0.7, textAlign: 'left' }}>
                  Runs entirely on your machine. Maximum privacy, no latency from cloud servers. Requires Ollama, Whisper, and Piper.
                </span>
              </button>

              <button
                onClick={() => handleSelect('huggingface')}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '20px',
                  height: 'auto',
                  border: '2px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>🤗</span>
                  <strong style={{ fontSize: 16 }}>Hugging Face Cloud</strong>
                </div>
                <span style={{ fontSize: 13, opacity: 0.9, textAlign: 'left' }}>
                  Use powerful models hosted in the cloud. No local setup required. Perfect if your computer isn&apos;t beefy enough.
                </span>
              </button>
            </div>

            <p style={{ marginTop: 24, fontSize: 12, color: 'var(--color-text-dim)' }}>
              Note: Hugging Face models are free but subject to cloud rate limits.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
