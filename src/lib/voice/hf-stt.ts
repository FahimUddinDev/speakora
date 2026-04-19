import { WhisperResult } from "./whisper";

const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN?.replace(
  /^["']|["']$/g,
  "",
);
const HF_STT_MODEL =
  process.env.HF_STT_MODEL?.replace(/^["']|["']$/g, "") ||
  "openai/whisper-large-v3";

/**
 * Query Hugging Face Inference API for speech-to-text with parameters for accuracy
 */
async function query(data: Buffer): Promise<{ text: string }> {
  // Convert buffer to base64
  const base64Audio = data.toString("base64");

  const payload = {
    inputs: base64Audio,
    parameters: {
      return_timestamps: false,
      // language: "en",
      generation_parameters: {
        temperature: 0.0,
        top_k: 50,
        top_p: 0.9,
        do_sample: false,
        max_new_tokens: 256,
        early_stopping: true,
        num_beams: 1,
        use_cache: false,
      },
    },
  };

  const response = await fetch(
    `https://router.huggingface.co/hf-inference/models/${HF_STT_MODEL}`,
    {
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HF API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result;
}

/**
 * Transcribe audio blob using Hugging Face Inference API
 */
export async function transcribeAudioHF(
  audioBlob: Blob,
): Promise<WhisperResult> {
  if (!HUGGINGFACE_TOKEN) {
    throw new Error("HUGGINGFACE_TOKEN is not configured");
  }

  try {
    // Convert Blob to Buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const output = await query(buffer);

    return {
      text: output.text || "",
      confidence: 1.0,
      language: "en",
      duration: 0,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Transcription failed";
    throw new Error(`HF STT error: ${errorMessage}`);
  }
}
