// Hugging Face TTS Integration
import { TTSOptions } from "./piper";

const HF_TOKEN =
  process.env.HF_TOKEN?.replace(/^["']|["']$/g, "") ||
  process.env.HUGGINGFACE_TOKEN?.replace(/^["']|["']$/g, "");

/**
 * Synthesize text to speech using fal-ai/kokoro via Hugging Face Router
 */
export async function synthesizeSpeechHF(
  options: TTSOptions,
): Promise<ArrayBuffer> {
  const { text } = options;

  if (!HF_TOKEN) {
    throw new Error("HF_TOKEN or HUGGINGFACE_TOKEN is not configured");
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(
        "https://router.huggingface.co/fal-ai/fal-ai/dia-tts",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        },
      );

      if (!response.ok) {
        let err = `HTTP ${response.status}`;
        try {
          const errorText = await response.text();
          err += `: ${errorText}`;
        } catch {
          err += ": Failed to read error response";
        }
        throw new Error(`HF TTS error: ${err}`);
      }

      const result = await response.json();

      // Debug: log the result structure
      console.log("TTS API response:", JSON.stringify(result, null, 2));

      // Check different possible response formats
      let audioData: string | null = null;
      if (result.audio && typeof result.audio === "string") {
        audioData = result.audio;
      } else if (result.data && typeof result.data === "string") {
        audioData = result.data;
      } else if (result.wav && typeof result.wav === "string") {
        audioData = result.wav;
      } else if (typeof result === "string") {
        // Maybe the whole response is base64
        audioData = result;
      }

      if (!audioData) {
        throw new Error(
          `Invalid response format. Expected audio data, got: ${JSON.stringify(result)}`,
        );
      }

      // Decode base64 to ArrayBuffer
      try {
        const binaryString = atob(audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      } catch (decodeError) {
        throw new Error(`Failed to decode audio data: ${decodeError}`);
      }
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        // Wait before retrying, exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1)),
        );
      }
    }
  }

  throw lastError || new Error("Speech synthesis failed after retries");
}

/**
 * Helper to return a Blob URL for browser playback
 */
export async function synthesizeToUrlHF(options: TTSOptions): Promise<string> {
  const buffer = await synthesizeSpeechHF(options);
  const blob = new Blob([buffer], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}
