import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  role: 'USER' | 'AI';
  content: string;
  correctedContent?: string;
  feedback?: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface GrammarCorrection {
  messageId: string;
  original: string;
  corrected: string;
  explanation: string;
}

export interface VocabSuggestion {
  messageId: string;
  word: string;
  suggestion: string;
  naturalPhrasing: string;
}

interface ChatState {
  conversationId: string | null;
  messages: Message[];
  isStreaming: boolean;
  isThinking: boolean;
  activeCorrection: GrammarCorrection | null;
  activeSuggestions: VocabSuggestion[];
  corrections: GrammarCorrection[];
  suggestions: VocabSuggestion[];
  streamingContent: string;
  error: string | null;
}

const initialState: ChatState = {
  conversationId: null,
  messages: [],
  isStreaming: false,
  isThinking: false,
  activeCorrection: null,
  activeSuggestions: [],
  corrections: [],
  suggestions: [],
  streamingContent: '',
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversationId: (state, action: PayloadAction<string>) => {
      state.conversationId = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    updateLastAIMessage: (state, action: PayloadAction<string>) => {
      const lastAI = [...state.messages].reverse().find((m) => m.role === 'AI');
      if (lastAI) {
        lastAI.content = action.payload;
        lastAI.isStreaming = false;
      }
    },
    appendStreamToken: (state, action: PayloadAction<string>) => {
      state.streamingContent += action.payload;
    },
    clearStreamingContent: (state) => {
      state.streamingContent = '';
    },
    setIsStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    },
    setIsThinking: (state, action: PayloadAction<boolean>) => {
      state.isThinking = action.payload;
    },
    showCorrection: (state, action: PayloadAction<GrammarCorrection>) => {
      state.activeCorrection = action.payload;
      state.corrections.push(action.payload);
    },
    dismissCorrection: (state) => {
      state.activeCorrection = null;
    },
    showSuggestions: (state, action: PayloadAction<VocabSuggestion[]>) => {
      state.activeSuggestions = action.payload;
      state.suggestions.push(...action.payload);
    },
    dismissSuggestions: (state) => {
      state.activeSuggestions = [];
    },
    clearChat: (state) => {
      state.messages = [];
      state.conversationId = null;
      state.streamingContent = '';
      state.error = null;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    loadMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
  },
});

export const {
  setConversationId,
  addMessage,
  updateLastAIMessage,
  appendStreamToken,
  clearStreamingContent,
  setIsStreaming,
  setIsThinking,
  showCorrection,
  dismissCorrection,
  showSuggestions,
  dismissSuggestions,
  clearChat,
  setError,
  loadMessages,
} = chatSlice.actions;

export default chatSlice.reducer;
