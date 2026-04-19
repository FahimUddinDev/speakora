import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

interface UserState {
  id: string | null;
  name: string | null;
  email: string | null;
  level: UserLevel;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: UserState = {
  id: null,
  name: null,
  email: null,
  level: 'BEGINNER',
  isAuthenticated: false,
  isLoading: true,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ id: string; name: string; email: string; level: UserLevel }>) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.level = action.payload.level;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    setLevel: (state, action: PayloadAction<UserLevel>) => {
      state.level = action.payload;
    },
    clearUser: (state) => {
      state.id = null;
      state.name = null;
      state.email = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setUser, setLevel, clearUser, setLoading } = userSlice.actions;
export default userSlice.reducer;
