import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { atlasVersion } from '../src/content/product';
import { repoStats } from './repo-stats';

const root = 'dist';
const base = (process.env.ATLAS_BASE || '/atlas').replace(/\/$/, '');
const deploySha = execFileSync('git', ['rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim();
const dirty = Boolean(
  execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(),
);
await writeFile(
  'dist/release.json',
  JSON.stringify({
    deploySha,
    dirty,
    version: atlasVersion,
    stats: repoStats(),
    base: base + '/',
  }),
);
await mkdir('dist/icons', { recursive: true });
const svg = await readFile('public/icon.svg');
for (const size of [192, 512])
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(`dist/icons/icon-${size}.png`);
const assets: string[] = [];
async function walk(dir: string) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else if (e.name !== 'sw.js' && !e.name.startsWith('.')) assets.push(p);
  }
}
await walk(root);
const h = createHash('sha256');
for (const p of assets.sort()) h.update(p).update(await readFile(p));
const version = h.digest('hex').slice(0, 16);
const urls = assets.map(
  (p) =>
    `${base}/${relative(root, p)
      .replace(/\\/g, '/')
      .replace(/index\.html$/, '')}`,
);
const sw = `/* Generated static-only cache; API responses are never cached. */
const CACHE='atlas-${version}';
const BASE=${JSON.stringify(base + '/')};
const PRECACHE=${JSON.stringify(urls)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE))));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('atlas-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(BASE))return;
 if(url.pathname.includes('/api/'))return;
 if(event.request.mode==='navigate')event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   try{const response=await fetch(event.request,{signal:AbortSignal.timeout(3500)});if(response.ok)await cache.put(url.pathname,response.clone());return response;}
   catch{return await cache.match(url.pathname,{ignoreVary:true})||await cache.match(BASE+'404.html',{ignoreVary:true})||await cache.match(BASE,{ignoreVary:true})||Response.error();}
 })());
 else event.respondWith(caches.open(CACHE).then(async cache=>await cache.match(url.pathname,{ignoreVary:true})||fetch(event.request)));
});
`;
await writeFile('dist/sw.js', sw);
await writeFile('dist/.nojekyll', '');
let bytes = 0;
for (const p of assets) bytes += (await readFile(p)).length;
console.log(
  `Offline cache: ${urls.length} static assets, ${(bytes / 1048576).toFixed(1)} MiB, version ${version}.`,
);
