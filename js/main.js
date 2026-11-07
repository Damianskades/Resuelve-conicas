// Punto de entrada (módulo ES): navegación entre secciones, inicio de "Resolver", "Graficar" y
// "Practicar", y registro del service worker para que la app funcione sin internet.

import { iniciarResolver } from './ui/resolver.js';
import { iniciarGraficar } from './ui/graficar.js';
import { iniciarPracticar } from './ui/practicar.js';

const CLAVE_SECCION = 'resolvedor-conicas:seccion';
const SECCIONES = ['resolver', 'graficar', 'practicar'];

function leerSeccion() {
  try {
    return localStorage.getItem(CLAVE_SECCION);
  } catch {
    return null;
  }
}

function guardarSeccion(nombre) {
  try {
    localStorage.setItem(CLAVE_SECCION, nombre);
  } catch {
    // sin almacenamiento: no pasa nada
  }
}

function mostrarSeccion(nombre) {
  for (const s of document.querySelectorAll('.seccion')) s.hidden = s.id !== `seccion-${nombre}`;
  for (const b of document.querySelectorAll('.nav-boton[data-seccion]')) {
    if (b.dataset.seccion === nombre) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
  guardarSeccion(nombre);
}

// Service worker: guarda la app en caché. Si hay una versión nueva, ofrece actualizar.
function registrarServiceWorker() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  const aviso = document.getElementById('aviso-actualizacion');
  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargando) return;
    recargando = true;
    location.reload();
  });
  const ofrecer = (sw) => {
    aviso.hidden = false;
    document.getElementById('btn-actualizar').onclick = () => sw.postMessage('actualizar');
  };
  navigator.serviceWorker
    .register('./service-worker.js')
    .then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) ofrecer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const nuevo = reg.installing;
        nuevo?.addEventListener('statechange', () => {
          if (nuevo.state === 'installed' && navigator.serviceWorker.controller) ofrecer(nuevo);
        });
      });
    })
    .catch(() => {
      // Sin service worker la app igual funciona con internet.
    });
}

function iniciar() {
  iniciarResolver(document.getElementById('seccion-resolver'));
  iniciarGraficar(document.getElementById('seccion-graficar'));
  iniciarPracticar(document.getElementById('seccion-practicar'));
  document.querySelector('.nav').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-seccion]');
    if (b) mostrarSeccion(b.dataset.seccion);
  });
  const guardada = leerSeccion();
  mostrarSeccion(SECCIONES.includes(guardada) ? guardada : 'resolver');
  registrarServiceWorker();
}

iniciar();
