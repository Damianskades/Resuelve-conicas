// Fase 5: la app funciona sin internet (service worker y manifest) y con rutas relativas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, relative } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');

function archivos(dir) {
  return readdirSync(join(raiz, dir)).flatMap((f) => {
    const ruta = join(raiz, dir, f);
    return statSync(ruta).isDirectory() ? archivos(join(dir, f)) : [relative(raiz, ruta).replace(/\\/g, '/')];
  });
}

const sw = leer('service-worker.js');
const precache = [...sw.matchAll(/^\s+'\.\/([^']*)',$/gm)].map((m) => m[1]);

test('service worker: guarda en caché todos los archivos de la app', () => {
  const necesarios = ['index.html', 'manifest.webmanifest', ...archivos('css'), ...archivos('js'), ...archivos('iconos')];
  if (existsSync(join(raiz, 'vendor'))) necesarios.push(...archivos('vendor'));
  for (const f of necesarios) assert.ok(precache.includes(f), `falta en el service worker: ${f}`);
  for (const f of precache.filter(Boolean)) assert.ok(existsSync(join(raiz, f)), `el service worker lista un archivo que no existe: ${f}`);
  assert.ok(precache.includes(''), 'falta la ruta ./');
});

test('service worker: versión de caché y limpieza de cachés viejas', () => {
  assert.match(sw, /const VERSION = 'v\d+\.\d+\.\d+'/);
  assert.match(sw, /caches\.delete/);
  assert.match(sw, /skipWaiting/);
});

test('manifest: nombre, colores, rutas relativas e íconos que existen', () => {
  const m = JSON.parse(leer('manifest.webmanifest'));
  assert.equal(m.name, 'Resolvedor de Cónicas');
  assert.equal(m.start_url, './');
  assert.equal(m.scope, './');
  assert.equal(m.display, 'standalone');
  assert.equal(m.theme_color, '#FFD400');
  for (const i of m.icons) {
    assert.ok(!i.src.startsWith('/'), `ruta absoluta: ${i.src}`);
    assert.ok(existsSync(join(raiz, i.src)), `no existe ${i.src}`);
  }
  assert.ok(m.icons.some((i) => i.sizes === '192x192' && i.type === 'image/png'));
  assert.ok(m.icons.some((i) => i.sizes === '512x512' && i.purpose === 'maskable'));
});

test('íconos PNG válidos con el tamaño declarado', () => {
  for (const [f, tam] of [['iconos/icono-192.png', 192], ['iconos/icono-512.png', 512], ['iconos/icono-maskable-512.png', 512], ['iconos/apple-touch-icon.png', 180]]) {
    const b = readFileSync(join(raiz, f));
    assert.equal(b.toString('hex', 0, 8), '89504e470d0a1a0a', `${f} no es PNG`);
    assert.equal(b.readUInt32BE(16), tam);
    assert.equal(b.readUInt32BE(20), tam);
  }
});

test('rutas relativas: nada empieza con «/» y todo lo enlazado existe', () => {
  const html = leer('index.html');
  for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const url = m[1];
    if (url.startsWith('data:')) continue;
    assert.ok(!url.startsWith('/') && !/^https?:/.test(url), `ruta no relativa en index.html: ${url}`);
    assert.ok(existsSync(join(raiz, url)), `index.html enlaza un archivo que no existe: ${url}`);
  }
  assert.match(html, /rel="manifest" href="manifest\.webmanifest"/);
  for (const f of archivos('js')) {
    for (const m of leer(f).matchAll(/from '([^']+)'/g)) {
      assert.ok(m[1].startsWith('.'), `${f} importa con ruta no relativa: ${m[1]}`);
      assert.ok(existsSync(join(raiz, dirname(f), m[1])), `${f} importa un archivo que no existe: ${m[1]}`);
    }
  }
  assert.match(leer('js/main.js'), /register\('\.\/service-worker\.js'\)/);
});
