// Deep links for GitHub Pages. The app uses BrowserRouter (history API), so a hard navigation, reload or shared link
// to a sub-route (e.g. /methodology) asks Pages for a file at that path. A copy of the built index.html as 404.html
// renders the right page, but with HTTP 404: a person sees the page, every crawler, link checker and preview is told
// it does not exist. That is how the site shipped until 0.09.001. Each route now gets its own index.html, so it
// answers 200; 404.html stays for any other path. Root-absolute asset paths (base '/') resolve from any depth, so a
// straight copy is correct. Runs as `postbuild`, after the hashed asset references in index.html are final.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, 'dist');
const index = resolve(dist, 'index.html');
if (!existsSync(index)) {
  console.error('[spa-404] dist/index.html not found, run after `vite build`');
  process.exit(1);
}
copyFileSync(index, resolve(dist, '404.html'));

// The shell's routes, and one focus view per case, read from the sources so a new route or case is covered.
const main = readFileSync(resolve(here, 'src/main.tsx'), 'utf-8');
const routes = [...main.matchAll(/\{ path: '\/([a-z-]+)'/g)].map((m) => m[1]);
const cases = readFileSync(resolve(here, 'src/lane/cases.ts'), 'utf-8');
const caseIds = [...cases.matchAll(/id: '([A-Z]+-[A-Z]+)'/g)].map((m) => m[1]);
const paths = [...routes, ...caseIds.map((id) => `focus/${id}`)];
for (const path of paths) {
  mkdirSync(resolve(dist, path), { recursive: true });
  copyFileSync(index, resolve(dist, path, 'index.html'));
}
if (routes.length < 5 || caseIds.length < 10) {
  console.error(`[spa-404] expected the 5 content routes and 10 cases, found ${routes.length} and ${caseIds.length}`);
  process.exit(1);
}
console.log(`[spa-404] 404.html + ${paths.length} route documents (${routes.length} pages, ${caseIds.length} focus views) for 200 responses`);
