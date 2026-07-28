import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const rootDir = process.cwd();

function getHtmlEntryPoints() {
  return Object.fromEntries(
    fs
      .readdirSync(rootDir)
      .filter((file) => file.endsWith('.html'))
      .map((file) => [
        file === 'index.html' ? 'main' : path.basename(file, '.html'),
        path.resolve(rootDir, file)
      ])
  );
}

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: getHtmlEntryPoints()
    }
  }
});
