import { synthesizeSpeechHF } from "@/lib/voice/hf-tts";
import { synthesizeSpeech } from "@/lib/voice/piper";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, speed = 1.0, voice, aiProvider = "local" } = body;

    if (!text?.trim()) {
      return Response.json({ error: "Text required" }, { status: 400 });
    }

    const options = { text, speed, voiceId: voice };

    if (aiProvider === "huggingface") {
      try {
        const audioBuffer = await synthesizeSpeechHF(options);
        return new Response(audioBuffer, {
          headers: { "Content-Type": "audio/wav" },
        });
      } catch (hfError) {
        console.error("Hugging Face TTS failed:", hfError);
        if (process.env.PIPER_API_URL) {
          try {
            const audioBuffer = await synthesizeSpeech(options);
            return new Response(audioBuffer, {
              headers: {
                "Content-Type": "audio/wav",
                "Cache-Control": "no-cache",
              },
            });
          } catch (localFallbackError) {
            console.error("Local Piper fallback failed:", localFallbackError);
            throw hfError;
          }
        }
        throw hfError;
      }
    }

    try {
      const audioBuffer = await synthesizeSpeech(options);
      return new Response(audioBuffer, {
        headers: {
          "Content-Type": "audio/wav",
          "Cache-Control": "no-cache",
        },
      });
    } catch (localError) {
      console.error("Local Piper TTS failed:", localError);
      if (process.env.HUGGINGFACE_TOKEN) {
        try {
          const audioBuffer = await synthesizeSpeechHF(options);
          return new Response(audioBuffer, {
            headers: {
              "Content-Type": "audio/wav",
              "Cache-Control": "no-cache",
            },
          });
        } catch (hfError) {
          console.error("Hugging Face TTS fallback failed:", hfError);
          throw hfError;
        }
      }

      throw localError;
    }
  } catch (error) {
    console.error("TTS error:", error);
    const message =
      error instanceof Error ? error.message : "Text-to-speech failed.";
    return Response.json(
      { error: `Text-to-speech failed. ${message}` },
      { status: 503 },
    );
  }
}
