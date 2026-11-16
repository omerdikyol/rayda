import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // GitHub Pages serves the app from /rayda/. Local dev runs at the root.
  base: mode === 'production' ? '/rayda/' : '/',
}));
