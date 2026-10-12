import { mkdir, copyFile, readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
const policies = ['privacy-policy.html', 'terms-of-service.html', 'cookie-policy.html', 'data-processing.html'];
const files = ['index.html', ...policies, 'styles.css', 'script.js', 'site-config.js', 'favicon.svg', 'booking.js', 'booking-utils.js'];
const html = await readFile('index.html', 'utf8');
if ((html.match(/<section\b/g) || []).length !== 4) throw new Error('Expected exactly four sections.');
if (/\$\s*\d|\b350\b/.test(html)) throw new Error('Public page must not include pricing.');
// Catch broken policy navigation and missing local assets before deployment.
const documents = new Map(await Promise.all(['index.html', ...policies].map(async file => [file, await readFile(file, 'utf8')])));
for (const [file, content] of documents) {
  for (const policy of policies) {
    if (!content.includes(`href="./${policy}"`)) throw new Error(`${file} is missing a link to ${policy}.`);
  }
  for (const [, link] of content.matchAll(/(?:href|src)="([^\"]+)"/g)) {
    if (/^(?:https?:|mailto:)/.test(link)) continue;
    const [path, fragment] = link.split('#');
    const target = path.replace(/^\.\//, '') || file;
    if (!files.includes(target)) throw new Error(`${file} links to unknown asset ${target}.`);
    if (fragment && documents.has(target) && !documents.get(target).includes(`id="${fragment}"`)) {
      throw new Error(`${file} links to missing anchor ${link}.`);
    }
  }
}
for (const file of ['script.js', 'site-config.js']) new Script(await readFile(file, 'utf8'), { filename: file });
const { execFileSync } = await import('node:child_process');
for (const file of ['booking.js', 'booking-utils.js', 'api/consultation.js']) execFileSync(process.execPath, ['--check', file]);
await mkdir('dist', { recursive: true });
await Promise.all(files.map(file => copyFile(file, `dist/${file}`)));
console.log(`Built ${files.length} static assets in dist/. No runtime dependencies.`);
