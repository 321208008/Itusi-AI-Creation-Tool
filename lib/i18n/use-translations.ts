import { create } from 'zustand';

type Language = 'en' | 'zh';

interface I18nStore {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useI18nStore = create<I18nStore>((set) => ({
  language: 'en',
  setLanguage: (language) => set({ language }),
}));