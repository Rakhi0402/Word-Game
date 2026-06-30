import { createSlice } from '@reduxjs/toolkit';

interface SettingsState {
  darkMode: boolean;
  sound: boolean;
}

const initialState: SettingsState = (() => {
  try {
    const saved = localStorage.getItem('kungfu_settings');
    if (saved) {
      const parsed: SettingsState = JSON.parse(saved);
      if (parsed.darkMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return parsed;
    }
  } catch (_) {}
  return { darkMode: false, sound: true };
})();

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
      if (state.darkMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.setItem('kungfu_settings', JSON.stringify(state));
    },
    toggleSound(state) {
      state.sound = !state.sound;
      localStorage.setItem('kungfu_settings', JSON.stringify(state));
    },
    resetSettings(state) {
      state.darkMode = false;
      state.sound = true;
      document.documentElement.classList.remove('dark');
      localStorage.setItem('kungfu_settings', JSON.stringify(state));
    },
  },
});

export const { toggleDarkMode, toggleSound, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
export type { SettingsState };
