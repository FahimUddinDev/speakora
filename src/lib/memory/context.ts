// In-memory context manager for short-term conversation memory

export interface ContextMessage {
  role: 'USER' | 'AI';
  content: string;
  timestamp: Date;
}

const MAX_CONTEXT_MESSAGES = 20;

// In-memory store: conversationId → messages
const contextStore = new Map<string, ContextMessage[]>();

export function addToContext(conversationId: string, message: ContextMessage): void {
  if (!contextStore.has(conversationId)) {
    contextStore.set(conversationId, []);
  }
  const messages = contextStore.get(conversationId)!;
  messages.push(message);

  // Keep only last N messages
  if (messages.length > MAX_CONTEXT_MESSAGES) {
    messages.splice(0, messages.length - MAX_CONTEXT_MESSAGES);
  }
}

export function getContext(conversationId: string): ContextMessage[] {
  return contextStore.get(conversationId) ?? [];
}

export function clearContext(conversationId: string): void {
  contextStore.delete(conversationId);
}

export function getContextAsOllamaMessages(
  conversationId: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages = getContext(conversationId);
  return messages.map((m) => ({
    role: m.role === 'USER' ? 'user' : 'assistant',
    content: m.content,
  }));
}
