import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  activeModal: string | null;
  toasts: Toast[];
  aiProvider: 'local' | 'huggingface' | null;
  showAIProviderModal: boolean;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'dark',
  activeModal: null,
  toasts: [],
  aiProvider: null,
  showAIProviderModal: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      state.toasts.push({ ...action.payload, id: Date.now().toString() });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setAIProvider: (state, action: PayloadAction<'local' | 'huggingface'>) => {
      state.aiProvider = action.payload;
    },
    setShowAIProviderModal: (state, action: PayloadAction<boolean>) => {
      state.showAIProviderModal = action.payload;
    },
  },
});

export const { 
  toggleSidebar, 
  setSidebarOpen, 
  openModal, 
  closeModal, 
  addToast, 
  removeToast,
  setAIProvider,
  setShowAIProviderModal 
} = uiSlice.actions;
export default uiSlice.reducer;
