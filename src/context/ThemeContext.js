import { createContext } from 'react';

export const ThemeContext = createContext({
  currentTheme: 'dark',
  setTheme: () => {},
});