// Ejecuta los eventos del service worker con cachés y red simuladas, incluyendo una subcarpeta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const raiz = new URL('../', import.meta.url);
const codigo = readFileSync(new URL('service-worker.js', raiz), 'utf8');

function entorno() {
  const base = 'https://ejemplo.test/resolvedor-conicas/';
  const eventos = {};
  const almacenes = new Map();
  let conectado = true;
  let activado = false;
  let reclamado = false;
  const url = (r) => new URL(typeof r === 'string' ? r : r.url, base).href;
  const clave = (r, opciones) => {
    const u = new URL(url(r));
    if (opciones?.ignoreSearch) u.search = '';
    return u.href;
  };
  const red = async (r) => {
    if (!conectado) throw new TypeError('Sin internet');
    const u = new URL(url(r));
    const archivo = u.pathname.slice('/resolvedor-conicas/'.length) || 'index.html';
    try { return new Response(readFileSync(new URL(archivo, raiz))); }
    catch { return new Response('No encontrado', { status: 404 }); }
  };
  const caches = {
    async open(nombre) {
      if (!almacenes.has(nombre)) {
        const datos = new Map();
        almacenes.set(nombre, {
          async addAll(rutas) {
            const entradas = await Promise.all(rutas.map(async (r) => {
              const respuesta = await red(r);
              if (!respuesta.ok) throw new TypeError(`No se pudo guardar ${r}`);
              return [url(r), respuesta];
            }));
            for (const [k, v] of entradas) datos.set(k, v);
          },
          async put(r, respuesta) { datos.set(url(r), respuesta.clone()); },
          async match(r, opciones) {
            for (const [k, v] of datos) if (clave(k, opciones) === clave(r, opciones)) return v.clone();
          },
        });
      }
      return almacenes.get(nombre);
    },
    async keys() { return [...almacenes.keys()]; },
    async delete(k) { return almacenes.delete(k); },
    async match(r, opciones) {
      for (const almacen of almacenes.values()) {
        const encontrado = await almacen.match(r, opciones);
        if (encontrado) return encontrado;
      }
    },
  };
  runInNewContext(codigo, {
    URL, Response, caches, fetch: red,
    self: {
      location: { origin: 'https://ejemplo.test' },
      addEventListener(tipo, manejar) { eventos[tipo] = manejar; },
      skipWaiting() { activado = true; },
      clients: { async claim() { reclamado = true; } },
    },
  });
  const enviar = async (tipo, datos = {}) => {
    const pendientes = [];
    let respuesta;
    eventos[tipo]({ ...datos, waitUntil(p) { pendientes.push(p); }, respondWith(p) { respuesta = p; } });
    const resultado = await respuesta;
    await Promise.all(pendientes);
    return resultado;
  };
  return {
    caches, enviar,
    desconectar() { conectado = false; },
    get activado() { return activado; },
    get reclamado() { return reclamado; },
    pedir(ruta, modo = 'cors', metodo = 'GET') {
      return enviar('fetch', { request: { url: new URL(ruta, base).href, method: metodo, mode: modo } });
    },
  };
}

test('sin internet: HTML, módulos, estilos e iconos siguen disponibles en una subcarpeta', async () => {
  const e = entorno();
  await e.enviar('install');
  await e.enviar('activate');
  e.desconectar();
  for (const ruta of ['', 'index.html', 'js/ui/practicar.js', 'js/problemas/practica.js', 'css/styles.css', 'manifest.webmanifest', 'iconos/icono-192.png']) {
    const respuesta = await e.pedir(ruta);
    assert.equal(respuesta?.status, 200, ruta);
    const local = readFileSync(new URL(ruta || 'index.html', raiz));
    assert.deepEqual(Buffer.from(await respuesta.arrayBuffer()), local, ruta);
  }
  const recarga = await e.pedir('index.html?origen=instalada', 'navigate');
  assert.match(await recarga.text(), /Resolvedor de Cónicas/);
  const navegacion = await e.pedir('ruta-sin-cache', 'navigate');
  assert.equal(await navegacion.text(), readFileSync(new URL('index.html', raiz), 'utf8'));
  assert.equal((await e.pedir('modulo-inexistente.js')).type, 'error');
});

test('actualización: elimina cachés antiguas y se activa solo al aceptar Actualizar', async () => {
  const e = entorno();
  await e.caches.open('resolvedor-conicas-v0.0.1');
  await e.caches.open('otra-aplicacion');
  await e.enviar('install');
  assert.equal(e.activado, false);
  await e.enviar('activate');
  assert.equal(e.reclamado, true);
  assert.ok(!(await e.caches.keys()).includes('resolvedor-conicas-v0.0.1'));
  assert.ok((await e.caches.keys()).includes('otra-aplicacion'));
  await e.enviar('message', { data: 'actualizar' });
  assert.equal(e.activado, true);
});

test('el service worker no intercepta POST ni solicitudes de otro origen', async () => {
  const e = entorno();
  assert.equal(await e.pedir('index.html', 'cors', 'POST'), undefined);
  assert.equal(await e.pedir('https://otro.test/recurso.js'), undefined);
});
