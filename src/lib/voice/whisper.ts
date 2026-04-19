// Whisper STT integration — local HTTP server

const WHISPER_API_URL = process.env.WHISPER_API_URL || 'http://localhost:9000';

export interface WhisperResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
}

/**
 * Transcribe audio blob using local Whisper server
 * Expects whisper.cpp HTTP server or faster-whisper server
 */
export async function transcribeAudio(audioBlob: Blob): Promise<WhisperResult> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', 'medium.en');
  formData.append('language', 'en');
  formData.append('task', 'transcribe');

  const response = await fetch(`${WHISPER_API_URL}/v1/audio/transcriptions`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Whisper STT error: ${response.status}`);
  }

  const data = await response.json();

  // Handle different whisper server response formats
  const text = data.text || data.transcription || '';
  const confidence = data.avg_logprob ? Math.exp(data.avg_logprob) : 0.85;

  return {
    text: text.trim(),
    confidence: Math.min(Math.max(confidence, 0), 1),
    language: data.language || 'en',
    duration: data.duration || 0,
  };
}

/**
 * Check if Whisper server is available
 */
export async function checkWhisperHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${WHISPER_API_URL}/`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}
