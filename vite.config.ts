import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    target: 'es2020',
    rollupOptions: {
      // Multi-page build: the wheel site (index.html) stays the
      // default entry; survey.html is a second, independent page
      // sharing the same Vite/TS build pipeline and brand tokens
      // (src/styles/main.css) without sharing any runtime state.
      input: {
        main:   r('./index.html'),
        survey: r('./survey.html'),
      },
    },
  },
});
