import { NextRequest } from 'next/server';
import { streamOllamaChat } from '@/lib/ai/ollama';
import { streamHuggingFaceChat } from '@/lib/ai/huggingface';
import { buildSystemPrompt, buildContextMessages } from '@/lib/ai/prompt-builder';
import { addToContext, getContextAsOllamaMessages } from '@/lib/memory/context';
import { getScenarioById } from '@/lib/roleplay/scenarios';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let aiProvider = 'local';
  try {
    const body = await req.json();
    const {
      message,
      conversationId,
      mode = 'chat',
      scenarioId,
      userLevel = 'BEGINNER',
      userName = 'there',
    } = body;
    aiProvider = body.aiProvider || 'local';

    if (!message?.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Resolve scenario if roleplay
    const scenario = scenarioId ? getScenarioById(scenarioId) : undefined;

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      userLevel,
      mode,
      scenario,
      userName,
    });

    // Get conversation context
    const contextMessages = conversationId
      ? getContextAsOllamaMessages(conversationId)
      : [];

    // Build full message array for Ollama
    const ollamaMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...buildContextMessages(contextMessages),
      { role: 'user' as const, content: message },
    ];

    // Add user message to context
    if (conversationId) {
      addToContext(conversationId, {
        role: 'USER',
        content: message,
        timestamp: new Date(),
      });
    }

    // Save user message to DB
    if (conversationId) {
      await prisma.message.create({
        data: {
          conversationId,
          role: 'USER',
          content: message,
        },
      }).catch(() => {}); // non-blocking
    }

    // Stream from chosen provider
    const stream = aiProvider === 'huggingface'
      ? await streamHuggingFaceChat({ messages: ollamaMessages })
      : await streamOllamaChat({ messages: ollamaMessages });

    // We'll collect the full response to save to DB
    let fullResponse = '';

    // Transform stream to collect response while forwarding
    const transformStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        // Extract tokens for collection
        const tokenMatches = text.matchAll(/data: ({.*?})\n\n/g);
        for (const match of tokenMatches) {
          try {
            const { token } = JSON.parse(match[1]);
            fullResponse += token;
          } catch { /* skip */ }
        }
        controller.enqueue(chunk);
      },
      async flush() {
        // Save AI response to DB and context
        if (conversationId && fullResponse) {
          addToContext(conversationId, {
            role: 'AI',
            content: fullResponse,
            timestamp: new Date(),
          });
          await prisma.message.create({
            data: {
              conversationId,
              role: 'AI',
              content: fullResponse,
            },
          }).catch(() => {});
        }
      },
    });

    return new Response(stream.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    const errorMsg = error?.message || '';
    console.error('Chat stream error:', error);
    
    let userMsg = 'Failed to connect to AI.';
    if (aiProvider === 'huggingface') {
      if (errorMsg.includes('403')) {
        userMsg = 'Hugging Face authentication failed. Please ensure your token has "Inference Providers" permission.';
      } else if (errorMsg.includes('503')) {
        userMsg = 'Hugging Face model is currently loading or overloaded. Please try again in a few seconds.';
      } else if (errorMsg.includes('404')) {
        userMsg = 'Hugging Face model not found. Please check your model ID in .env.local.';
      } else {
        userMsg = 'Couldn\'t connect to Hugging Face. Check your token and internet connection.';
      }
    } else {
      userMsg = 'Ollama is not responding. Make sure it is running with `ollama serve`.';
    }

    return Response.json({ error: userMsg }, { status: 503 });
  }
}
