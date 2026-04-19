import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import chatReducer from './slices/chatSlice';
import voiceReducer from './slices/voiceSlice';
import roleplayReducer from './slices/roleplaySlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    chat: chatReducer,
    voice: voiceReducer,
    roleplay: roleplayReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths for non-serializable data
        ignoredActions: ['voice/setAudioBlob'],
        ignoredPaths: ['voice.audioBlob'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
