// Piper TTS integration — local HTTP server

const PIPER_API_URL = process.env.PIPER_API_URL || 'http://localhost:5000';

export interface TTSOptions {
  text: string;
  speed?: number;      // 0.5 – 2.0, default 1.0
  voiceId?: string;    // Piper voice model name
}

/**
 * Synthesize text to speech using local Piper server
 * Returns audio as ArrayBuffer (WAV)
 */
export async function synthesizeSpeech(options: TTSOptions): Promise<ArrayBuffer> {
  const { text, speed = 1.0, voiceId } = options;

  const body: Record<string, unknown> = {
    text,
    speed,
  };
  if (voiceId) body.voice = voiceId;

  const response = await fetch(`${PIPER_API_URL}/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Piper TTS error: ${response.status} ${response.statusText}`);
  }

  return response.arrayBuffer();
}

/**
 * Synthesize and return as a Blob URL for browser audio playback
 */
export async function synthesizeToUrl(options: TTSOptions): Promise<string> {
  const buffer = await synthesizeSpeech(options);
  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/**
 * Check if Piper TTS server is available
 */
export async function checkPiperHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${PIPER_API_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}
