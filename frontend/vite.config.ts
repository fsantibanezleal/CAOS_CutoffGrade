import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// The footer prints the release in its display form, read from the repo's VERSION file. It was a literal in
// main.tsx and still said 0.07.001 two releases later.
const version = readFileSync(new URL('../VERSION', import.meta.url), 'utf8').trim();

export default defineConfig({
  base: '/', // served at the custom domain root (cutoffgrade.fasl-work.com)
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(version) },
});
