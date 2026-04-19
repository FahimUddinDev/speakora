// Ollama streaming client — primary AI integration

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const PRIMARY_MODEL = process.env.OLLAMA_PRIMARY_MODEL || "tinyllama";
const FALLBACK_MODEL = process.env.OLLAMA_FALLBACK_MODEL || "mistral";

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaStreamOptions {
  messages: OllamaMessage[];
  model?: string;
  temperature?: number;
  onToken?: (token: string) => void;
}

/**
 * Check if Ollama is running and model is available
 */
export async function checkOllamaHealth(): Promise<{
  ok: boolean;
  models: string[];
}> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { ok: false, models: [] };
    const data = await res.json();
    const models = data.models?.map((m: { name: string }) => m.name) ?? [];
    return { ok: true, models };
  } catch {
    return { ok: false, models: [] };
  }
}

/**
 * Stream a chat response from Ollama — returns a ReadableStream of tokens
 */
export async function streamOllamaChat(
  options: OllamaStreamOptions,
): Promise<ReadableStream<Uint8Array>> {
  const model = options.model || PRIMARY_MODEL;

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: options.messages,
      stream: true,
      options: {
        temperature: options.temperature ?? 0.85,
        top_p: 0.9,
        repeat_penalty: 1.1,
      },
    }),
  });

  if (!response.ok) {
    // If model not found, try alternatives
    if (response.status === 404 || response.status === 400) {
      if (model === PRIMARY_MODEL && PRIMARY_MODEL !== FALLBACK_MODEL) {
        console.warn(`Primary model ${PRIMARY_MODEL} not found, trying fallback ${FALLBACK_MODEL}`);
        return streamOllamaChat({ ...options, model: FALLBACK_MODEL });
      }
      
      // Try to find ANY available model
      const { models } = await checkOllamaHealth();
      if (models.length > 0 && model !== models[0]) {
        console.warn(`Model ${model} not found, trying first available: ${models[0]}`);
        return streamOllamaChat({ ...options, model: models[0] });
      }
    }
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  if (!response.body) throw new Error("No response body from Ollama");

  // Transform the NDJSON stream into a clean SSE-compatible token stream
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    async transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split("\n").filter(Boolean);

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            // SSE format: "data: {token}\n\n"
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ token: json.message.content })}\n\n`,
              ),
            );
          }
          if (json.done) {
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          }
        } catch {
          // skip malformed lines
        }
      }
    },
  });

  return response.body.pipeThrough(transformStream);
}

/**
 * Single non-streaming completion — for feedback/analysis tasks
 */
export async function ollamaComplete(
  prompt: string,
  systemPrompt?: string,
  model = PRIMARY_MODEL,
): Promise<string> {
  const messages: OllamaMessage[] = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: prompt });

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
  });

  if (!response.ok) {
    if ((response.status === 404 || response.status === 400) && model === PRIMARY_MODEL) {
      const { models } = await checkOllamaHealth();
      if (models.length > 0 && models[0] !== model) {
        return ollamaComplete(prompt, systemPrompt, models[0]);
      }
    }
    throw new Error(`Ollama error: ${response.status}`);
  }
  const data = await response.json();
  return data.message?.content ?? "";
}
