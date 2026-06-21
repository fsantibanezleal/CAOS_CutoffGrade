import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/', // served at the custom domain root (cutoffgrade.fasl-work.com)
  plugins: [react()],
});
