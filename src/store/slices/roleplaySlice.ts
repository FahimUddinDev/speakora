import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RoleplayScenario {
  id: string;
  name: string;
  aiRole: string;
  userRole: string;
  context: string;
  tone: string;
  sampleOpener: string;
}

interface RoleplayState {
  activeScenario: RoleplayScenario | null;
  sessionId: string | null;
  messageCount: number;
  isSessionActive: boolean;
  showFeedbackModal: boolean;
  sessionFeedback: string | null;
  score: number | null;
}

const initialState: RoleplayState = {
  activeScenario: null,
  sessionId: null,
  messageCount: 0,
  isSessionActive: false,
  showFeedbackModal: false,
  sessionFeedback: null,
  score: null,
};

const roleplaySlice = createSlice({
  name: 'roleplay',
  initialState,
  reducers: {
    startSession: (state, action: PayloadAction<{ scenario: RoleplayScenario; sessionId: string }>) => {
      state.activeScenario = action.payload.scenario;
      state.sessionId = action.payload.sessionId;
      state.isSessionActive = true;
      state.messageCount = 0;
      state.sessionFeedback = null;
      state.score = null;
    },
    incrementMessageCount: (state) => {
      state.messageCount += 1;
    },
    endSession: (state) => {
      state.isSessionActive = false;
      state.showFeedbackModal = true;
    },
    setSessionFeedback: (state, action: PayloadAction<{ feedback: string; score: number }>) => {
      state.sessionFeedback = action.payload.feedback;
      state.score = action.payload.score;
    },
    closeFeedbackModal: (state) => {
      state.showFeedbackModal = false;
      state.activeScenario = null;
      state.sessionId = null;
    },
  },
});

export const {
  startSession,
  incrementMessageCount,
  endSession,
  setSessionFeedback,
  closeFeedbackModal,
} = roleplaySlice.actions;

export default roleplaySlice.reducer;
