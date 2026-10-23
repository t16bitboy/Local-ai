import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const root = resolve(import.meta.dirname, '..');
const result = await build({
  configFile: false,
  root,
  plugins: [react(), tailwind()],
  resolve: { alias: [
    { find: '@/lib/keel/assist', replacement: resolve(root, 'scripts/review-assist.ts') },
    { find: /^@\//, replacement: root + '/src/' },
  ] },
  build: {
    write: false,
    lib: { entry: resolve(root, 'scripts/review-entry.tsx'), formats: ['iife'], name: 'KeelReview' },
    cssCodeSplit: false,
    minify: true,
  },
});
const chunks = (Array.isArray(result) ? result : [result]).flatMap(r => r.output);
const js = chunks.filter(c => c.type === 'chunk').map(c => c.code).join('\n');
const css = chunks.filter(c => c.type === 'asset' && c.fileName.endsWith('.css')).map(c => c.source).join('\n');
const fonts = [['Fraunces','Fraunces.ttf'],['Source Sans 3','SourceSans3.ttf']].map(([family,file]) => `@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${readFileSync(resolve(root,'artifacts/brand',file)).toString('base64')}) format('truetype');font-display:swap}`).join('');
mkdirSync(resolve(root, 'review'), { recursive: true });
writeFileSync(resolve(root, 'review/Keel-Fixed-Preview.html'), `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Keel review: task desk with seven regression fixes. Local browser saving and offline draft planning. No live AI or billing."><title>Keel | Fixed review</title><style>${fonts}${css}</style></head><body><div id="root"></div><script>${js.replaceAll('</script','<\\/script')}</script></body></html>`);
console.log('Created review/Keel-Fixed-Preview.html');
