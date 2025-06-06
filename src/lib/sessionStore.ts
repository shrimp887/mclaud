import { create } from "zustand";

interface SessionState {
  email: string | null;
  setEmail: (email: string | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  email: null,
  setEmail: (email) => set({ email }),
}));

