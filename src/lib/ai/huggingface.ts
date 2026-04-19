// Hugging Face Inference API client
import { OllamaStreamOptions } from "./ollama";

const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN?.replace(
  /^["']|["']$/g,
  "",
);
const HF_CHAT_MODEL =
  process.env.HF_CHAT_MODEL?.replace(/^["']|["']$/g, "") ||
  "HuggingFaceH4/zephyr-7b-beta";
const HF_STT_MODEL =
  process.env.HF_STT_MODEL?.replace(/^["']|["']$/g, "") ||
  "openai/whisper-large-v3";
const HF_TTS_MODEL =
  process.env.HF_TTS_MODEL?.replace(/^["']|["']$/g, "") || "hexgrad/Kokoro-82M";

/**
 * Single completion using Hugging Face Inference API
 */
export async function huggingFaceComplete(
  prompt: string,
  systemPrompt?: string,
  model = HF_CHAT_MODEL,
): Promise<string> {
  if (!HUGGINGFACE_TOKEN) {
    throw new Error("HUGGINGFACE_TOKEN is not configured");
  }

  const messages = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: prompt });

  const response = await fetch(
    `https://router.huggingface.co/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        stream: false,
      }),
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown HF error" }));
    console.log(response);
    throw new Error(
      `Hugging Face error: ${response.status} ${JSON.stringify(error)}`,
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Stream chat response from Hugging Face Inference API
 * Note: Free Inference API supports streaming via Server-Sent Events (SSE)
 */
export async function streamHuggingFaceChat(
  options: OllamaStreamOptions,
): Promise<ReadableStream<Uint8Array>> {
  const model = options.model || HF_CHAT_MODEL;
  if (!HUGGINGFACE_TOKEN) {
    throw new Error("HUGGINGFACE_TOKEN is not configured");
  }

  const response = await fetch(
    `https://router.huggingface.co/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
      },
      body: JSON.stringify({
        model: model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens || 1000,
        stream: true,
      }),
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown HF error" }));
    throw new Error(
      `Hugging Face error: ${response.status} ${JSON.stringify(error)}`,
    );
  }

  if (!response.body) throw new Error("No response body from Hugging Face");

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Transform OpenAI-style streaming format to match internal token stream
  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    async transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const content = line.slice(5).trim();
        if (content === "[DONE]") {
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          continue;
        }

        try {
          const data = JSON.parse(content);
          const token = data.choices?.[0]?.delta?.content;
          if (token) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ token })}\n\n`),
            );
          }
        } catch {
          /* skip malformed */
        }
      }
    },
  });

  return response.body.pipeThrough(transformStream);
}
