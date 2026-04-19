import { transcribeAudioHF } from "@/lib/voice/hf-stt";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const aiProvider = (formData.get("aiProvider") as string) || "local";

    if (!audioFile) {
      return Response.json({ error: "Audio file required" }, { status: 400 });
    }

    if (aiProvider === "huggingface") {
      const hfResult = await transcribeAudioHF(audioFile);
      return Response.json(hfResult);
    }

    const WHISPER_URL = process.env.WHISPER_API_URL || "http://localhost:9000";

    // Forward to local Whisper server (OpenAI compatible API)
    const whisperForm = new FormData();
    whisperForm.append("file", audioFile);
    whisperForm.append("model", "large.en");
    whisperForm.append("language", "en");

    try {
      const response = await fetch(`${WHISPER_URL}/v1/audio/transcriptions`, {
        method: "POST",
        body: whisperForm,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Whisper error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const text = data.text || data.transcription || "";

      return Response.json({
        text: text.trim(),
        confidence: data.avg_logprob ? Math.exp(data.avg_logprob) : 0.85,
        language: data.language || "en",
      });
    } catch (localError) {
      console.error("Whisper STT error:", localError);

      if (process.env.HUGGINGFACE_TOKEN) {
        try {
          const hfResult = await transcribeAudioHF(audioFile);
          return Response.json(hfResult);
        } catch (hfError) {
          console.error("Hugging Face STT fallback failed:", hfError);
        }
      }

      throw localError;
    }
  } catch (error) {
    console.error("STT error:", error);
    const message =
      error instanceof Error ? error.message : "Speech-to-text failed";
    return Response.json(
      {
        error: `Speech-to-text failed. ${message}`,
      },
      { status: 503 },
    );
  }
}
