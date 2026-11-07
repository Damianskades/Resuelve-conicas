// Service worker del Resolvedor de Cónicas: guarda en caché todos los archivos de la app para
// que funcione sin internet. Al publicar cambios, sube VERSION: el navegador descarga la nueva
// versión y la app ofrece «Actualizar». Las rutas son relativas (sirve en una subcarpeta).

const VERSION = 'v5.0.1';
const CACHE = `resolvedor-conicas-${VERSION}`;

// Todos los archivos que usa la app (la prueba tests/pwa.test.js verifica que no falte ninguno).
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './iconos/apple-touch-icon.png',
  './iconos/icono-192.png',
  './iconos/icono-512.png',
  './iconos/icono-maskable-512.png',
  './iconos/icono.svg',
  './js/conicas/circunferencia.js',
  './js/conicas/comun.js',
  './js/conicas/elipse.js',
  './js/conicas/hiperbola.js',
  './js/conicas/parabola.js',
  './js/graficador/plano.js',
  './js/main.js',
  './js/math/expresiones.js',
  './js/math/formato.js',
  './js/math/fracciones.js',
  './js/math/general.js',
  './js/math/numeros.js',
  './js/math/parser.js',
  './js/math/puntos.js',
  './js/math/raices.js',
  './js/math/rectas.js',
  './js/problemas/alternativas.js',
  './js/problemas/campos.js',
  './js/problemas/comunes.js',
  './js/problemas/desde-general.js',
  './js/problemas/detector.js',
  './js/problemas/ejemplos.js',
  './js/problemas/practica.js',
  './js/problemas/solucion.js',
  './js/problemas/solucionador.js',
  './js/problemas/tipos.js',
  './js/problemas/tipos/app-loran.js',
  './js/problemas/tipos/app-orbita.js',
  './js/problemas/tipos/app-puente.js',
  './js/problemas/tipos/app-rueda.js',
  './js/problemas/tipos/app-trayectoria.js',
  './js/problemas/tipos/app-tunel.js',
  './js/problemas/tipos/circ-centro-punto.js',
  './js/problemas/tipos/circ-centro-radio.js',
  './js/problemas/tipos/circ-centro-tangente-ab.js',
  './js/problemas/tipos/circ-centro-tangente.js',
  './js/problemas/tipos/circ-diametro.js',
  './js/problemas/tipos/circ-posicion-circunferencias.js',
  './js/problemas/tipos/circ-posicion-recta.js',
  './js/problemas/tipos/circ-punto-tangente-en-punto.js',
  './js/problemas/tipos/circ-recta-tangente.js',
  './js/problemas/tipos/circ-tangente-centro-en-recta.js',
  './js/problemas/tipos/circ-tres-puntos.js',
  './js/problemas/tipos/ecuacion.js',
  './js/problemas/tipos/eli-centro-vertice-foco.js',
  './js/problemas/tipos/eli-focos-eje.js',
  './js/problemas/tipos/eli-focos-vertices.js',
  './js/problemas/tipos/eli-vertices-eje-menor.js',
  './js/problemas/tipos/eli-vertices-excentricidad.js',
  './js/problemas/tipos/eli-vertices-lado-recto.js',
  './js/problemas/tipos/hip-centro-vertice-foco.js',
  './js/problemas/tipos/hip-focos-excentricidad.js',
  './js/problemas/tipos/hip-vertices-asintota.js',
  './js/problemas/tipos/hip-vertices-focos.js',
  './js/problemas/tipos/hip-vertices-lado-recto.js',
  './js/problemas/tipos/par-ecuacion.js',
  './js/problemas/tipos/par-foco-directriz.js',
  './js/problemas/tipos/par-tres-puntos.js',
  './js/problemas/tipos/par-vertice-directriz.js',
  './js/problemas/tipos/par-vertice-foco.js',
  './js/problemas/tipos/par-vertice-punto.js',
  './js/ui/componentes.js',
  './js/ui/graficar.js',
  './js/ui/practicar.js',
  './js/ui/resolver.js',
  './js/ui/vista-solucion.js',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS)));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c.startsWith('resolvedor-conicas-') && c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

// La página pide activar la versión nueva cuando el usuario toca «Actualizar».
self.addEventListener('message', (ev) => {
  if (ev.data === 'actualizar') self.skipWaiting();
});

// Primero la caché; si no está, la red (y se guarda). Sin red, las páginas abren index.html.
self.addEventListener('fetch', (ev) => {
  const { request } = ev;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  ev.respondWith(
    caches.match(request, { ignoreSearch: true }).then((guardada) => {
      if (guardada) return guardada;
      return fetch(request)
        .then((resp) => {
          if (resp.ok && resp.type === 'basic') {
            const copia = resp.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copia));
          }
          return resp;
        })
        .catch(() => (request.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    }),
  );
});
