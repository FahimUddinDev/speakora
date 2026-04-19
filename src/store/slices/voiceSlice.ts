import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type VoiceStatus = 'idle' | 'recording' | 'processing_stt' | 'waiting_ai' | 'speaking' | 'error';

interface VoiceState {
  status: VoiceStatus;
  transcript: string;
  interimTranscript: string;
  isAutoMode: boolean;  // continuous conversation (no button press)
  isMuted: boolean;
  volume: number;
  audioBlob: null;  // kept null in serialized state — actual blob in a ref
  error: string | null;
  pronunciationScore: number | null;
}

const initialState: VoiceState = {
  status: 'idle',
  transcript: '',
  interimTranscript: '',
  isAutoMode: false,
  isMuted: false,
  volume: 1.0,
  audioBlob: null,
  error: null,
  pronunciationScore: null,
};

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<VoiceStatus>) => {
      state.status = action.payload;
      if (action.payload !== 'error') state.error = null;
    },
    setTranscript: (state, action: PayloadAction<string>) => {
      state.transcript = action.payload;
    },
    setInterimTranscript: (state, action: PayloadAction<string>) => {
      state.interimTranscript = action.payload;
    },
    toggleAutoMode: (state) => {
      state.isAutoMode = !state.isAutoMode;
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload;
    },
    setAudioBlob: (state) => {
      // Blob stored in ref outside Redux — just signal it's set
      state.audioBlob = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.status = 'error';
    },
    setPronunciationScore: (state, action: PayloadAction<number>) => {
      state.pronunciationScore = action.payload;
    },
    resetVoice: (state) => {
      state.status = 'idle';
      state.transcript = '';
      state.interimTranscript = '';
      state.error = null;
    },
  },
});

export const {
  setStatus,
  setTranscript,
  setInterimTranscript,
  toggleAutoMode,
  toggleMute,
  setVolume,
  setAudioBlob,
  setError,
  setPronunciationScore,
  resetVoice,
} = voiceSlice.actions;

export default voiceSlice.reducer;
