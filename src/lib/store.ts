import { create } from 'zustand';

type ThemeState = {
  theme: 'light';
  toggleTheme: () => void;
};

export const useThemeStore = create<ThemeState>()(() => ({
  theme: 'light',
  toggleTheme: () => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  },
}));

