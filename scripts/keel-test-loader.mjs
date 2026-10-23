import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const source = resolve(import.meta.dirname, '../src');
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/lib/keel/')) {
      return nextResolve(pathToFileURL(resolve(source, specifier.slice(2) + '.ts')).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key),
};

globalThis.window = { localStorage: globalThis.localStorage };
