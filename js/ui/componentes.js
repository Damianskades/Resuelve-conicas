// Componentes de interfaz reutilizables: fórmulas con fracciones apiladas, interruptores,
// leyenda de la gráfica, tarjetas de elementos, mensajes de error, teclas extra para el
// celular y copiar al portapapeles. Solo este directorio (y main.js) toca el DOM.

import { aTexto, grupoLlaves } from '../math/formato.js';
import { estaVisible } from '../graficador/plano.js';

export function escaparHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Marcado \frac{a}{b} → fracción apilada en HTML; el resto se escapa. Pura (sin DOM).
export function mathAHtml(s) {
  let out = '';
  let i = 0;
  const t = String(s);
  while (i < t.length) {
    if (t.startsWith('\\frac{', i)) {
      const [num, j] = grupoLlaves(t, i + 5);
      const [den, k] = grupoLlaves(t, j);
      out += `<span class="frac"><span class="frac-num">${mathAHtml(num)}</span><span class="frac-den">${mathAHtml(den)}</span></span>`;
      i = k;
    } else if (t[i] === '\n') {
      out += '<br>';
      i++;
    } else {
      out += escaparHtml(t[i]);
      i++;
    }
  }
  return out;
}

// HTML accesible: el lector de pantalla lee el texto plano, la vista muestra las fracciones.
export function matHtml(s) {
  return `<span class="sr-only">${escaparHtml(aTexto(String(s)))}</span><span aria-hidden="true">${mathAHtml(s)}</span>`;
}

export function crear(tag, attrs = {}, html) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k === 'texto') el.textContent = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  if (html !== undefined) el.innerHTML = html;
  return el;
}

// ---------- Interruptores de la gráfica ----------

export const OPCIONES_VISIBLES = [
  ['focos', 'Focos'],
  ['directrices', 'Directrices'],
  ['ladoRecto', 'Lado recto'],
  ['asintotas', 'Asíntotas'],
  ['ejeFocal', 'Eje focal'],
  ['coordenadas', 'Coordenadas'],
];

export function crearInterruptores(contenedor, visibles, alCambiar) {
  contenedor.innerHTML = '';
  for (const [clave, nombre] of OPCIONES_VISIBLES) {
    const etiqueta = crear('label', { class: 'interruptor' });
    const input = crear('input', { type: 'checkbox', 'data-grupo': clave });
    input.checked = visibles[clave] !== false;
    etiqueta.classList.toggle('activo', input.checked);
    etiqueta.append(input, crear('span', { texto: nombre }));
    input.addEventListener('change', () => {
      visibles[clave] = input.checked;
      etiqueta.classList.toggle('activo', input.checked);
      alCambiar();
    });
    contenedor.append(etiqueta);
  }
}

// ---------- Leyenda ----------

const G = '#8A8A8A';
const linea = (color, ancho, guiones = '', cap = 'butt') =>
  `<line x1="2" y1="10" x2="34" y2="10" stroke="${color}" stroke-width="${ancho}" stroke-dasharray="${guiones}" stroke-linecap="${cap}"/>`;

const SIMBOLOS = {
  curva: ['Curva', linea('#1F4FE0', 3)],
  centro: ['Centro', '<rect x="13" y="5" width="10" height="10" fill="#000"/>'],
  vertice: ['Vértice', '<circle cx="18" cy="10" r="5.5" fill="#000"/>'],
  foco: ['Foco', '<circle cx="18" cy="10" r="5.5" fill="#fff" stroke="#000" stroke-width="2"/>'],
  guia: ['Punto guía', '<circle cx="18" cy="10" r="3.5" fill="#000"/>'],
  directriz: ['Directriz', linea('#000', 2, '7 4')],
  asintota: ['Asíntota', linea(G, 1.5, '6 4')],
  auxiliar: ['Recta o rectángulo auxiliar', linea(G, 1.5, '3 3')],
  'lado-recto': ['Lado recto', linea('#000', 1.5)],
  eje: ['Eje focal', linea(G, 1.5, '1 4', 'round')],
  dato: ['Dato (punto o recta dados)', '<path d="M12 4 L24 16 M24 4 L12 16" stroke="#000" stroke-width="2.5"/>'],
  corte: ['Punto calculado (corte, tangencia)', '<path d="M18 2 L26 10 L18 18 L10 10 Z" fill="#000"/>'],
};
const ORDEN_LEYENDA = Object.keys(SIMBOLOS);

export function renderLeyenda(ul, escena, visibles) {
  ul.innerHTML = '';
  if (!escena) return;
  const presentes = new Set();
  if ((escena.curvas ?? []).some((c) => estaVisible(c, visibles))) presentes.add('curva');
  for (const lista of [escena.rectas, escena.segmentos, escena.puntos]) {
    for (const el of lista ?? []) if (estaVisible(el, visibles)) presentes.add(el.tipo);
  }
  for (const tipo of ORDEN_LEYENDA) {
    if (!presentes.has(tipo)) continue;
    const [nombre, svg] = SIMBOLOS[tipo];
    ul.append(crear('li', {}, `<svg viewBox="0 0 36 20" aria-hidden="true">${svg}</svg><span>${nombre}</span>`));
  }
}

// ---------- Elementos ----------

export function renderElementos(contenedor, elementos) {
  contenedor.innerHTML = '';
  for (const e of elementos) {
    const tarjeta = crear('div', { class: 'elemento' });
    tarjeta.append(crear('div', { class: 'elemento-nombre', texto: e.nombre }));
    tarjeta.append(crear('div', { class: 'elemento-valor mat' }, matHtml(e.valor)));
    if (e.formula) tarjeta.append(crear('div', { class: 'elemento-formula' }, `Fórmula: ${matHtml(e.formula)}`));
    contenedor.append(tarjeta);
  }
}

// ---------- Errores ----------

// Muestra el mensaje y, si se conoce la posición, el texto con la parte señalada.
export function mostrarError(contenedor, error, { entrada, posicion, longitud, ayuda } = {}) {
  contenedor.innerHTML = '';
  contenedor.append(crear('p', { class: 'error-titulo', texto: 'Revisa lo que escribiste' }));
  contenedor.append(crear('p', { texto: error }));
  if (entrada && Number.isInteger(posicion) && longitud !== undefined && !(posicion === 0 && longitud >= entrada.length)) {
    const ini = Math.max(0, Math.min(posicion, entrada.length));
    const fin = Math.min(entrada.length, ini + Math.max(longitud, 0));
    const marca = fin > ini ? escaparHtml(entrada.slice(ini, fin)) : '&nbsp;';
    contenedor.append(
      crear('p', { class: 'error-eco' }, `${escaparHtml(entrada.slice(0, ini))}<mark>${marca}</mark>${escaparHtml(entrada.slice(fin))}`),
    );
  }
  if (ayuda) contenedor.append(crear('p', { class: 'error-ayuda' }, matHtml(ayuda)));
  contenedor.hidden = false;
}

export function ocultarError(contenedor) {
  contenedor.hidden = true;
  contenedor.innerHTML = '';
}

// ---------- Teclas extra (celular) ----------

// Inserta el texto de cada tecla en el campo que devuelve obtenerCampo(), sin quitarle el foco.
export function conectarTeclas(contenedor, obtenerCampo) {
  contenedor.addEventListener('pointerdown', (ev) => {
    if (ev.target.closest('[data-tecla]')) ev.preventDefault();
  });
  contenedor.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-tecla]');
    if (!b) return;
    const campo = obtenerCampo();
    if (!campo) return;
    const texto = b.dataset.tecla;
    const ini = campo.selectionStart ?? campo.value.length;
    const fin = campo.selectionEnd ?? campo.value.length;
    campo.value = campo.value.slice(0, ini) + texto + campo.value.slice(fin);
    const pos = ini + texto.length;
    campo.focus();
    campo.setSelectionRange?.(pos, pos);
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

// ---------- Portapapeles ----------

export async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const area = crear('textarea', { readonly: true, class: 'sr-only' });
    area.value = texto;
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}
