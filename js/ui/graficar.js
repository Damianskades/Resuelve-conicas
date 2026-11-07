// Sección "Graficar": pestañas de cónica, orientación, campos de parámetros con − / +,
// teclas extra, interruptores, ejemplo de clase, gráfica, ecuaciones y elementos.

import { Plano, VISIBLES_POR_DEFECTO } from '../graficador/plano.js';
import * as circunferencia from '../conicas/circunferencia.js';
import * as parabola from '../conicas/parabola.js';
import * as elipse from '../conicas/elipse.js';
import * as hiperbola from '../conicas/hiperbola.js';
import { leerNumero, aEntrada } from '../math/numeros.js';
import { EJEMPLOS_PARAMETROS } from '../problemas/ejemplos.js';
import {
  crear, matHtml, crearInterruptores, renderLeyenda, renderElementos, mostrarError, ocultarError, conectarTeclas,
} from './componentes.js';

const CONICAS = {
  circunferencia: {
    modulo: circunferencia,
    campos: [['h', 'Abscisa del centro'], ['k', 'Ordenada del centro'], ['r', 'Radio (r > 0)']],
    inicial: { h: '0', k: '0', r: '3' },
    modelo: () => '(x − h)² + (y − k)² = r²',
  },
  parabola: {
    modulo: parabola,
    campos: [['h', 'Abscisa del vértice'], ['k', 'Ordenada del vértice'], ['p', 'Distancia con signo del vértice al foco (p ≠ 0)']],
    inicial: { h: '0', k: '0', p: '1' },
    orientacion: 'vertical',
    tituloOrientacion: 'Eje de la parábola',
    modelo: (o) => parabola.FORMULAS[o][0],
  },
  elipse: {
    modulo: elipse,
    campos: [['h', 'Abscisa del centro'], ['k', 'Ordenada del centro'], ['a', 'Semieje mayor'], ['b', 'Semieje menor (b < a)']],
    inicial: { h: '0', k: '0', a: '5', b: '3' },
    orientacion: 'horizontal',
    tituloOrientacion: 'Eje mayor',
    modelo: (o) => elipse.FORMULAS[o][0],
  },
  hiperbola: {
    modulo: hiperbola,
    campos: [['h', 'Abscisa del centro'], ['k', 'Ordenada del centro'], ['a', 'Semieje transverso'], ['b', 'Semieje conjugado']],
    inicial: { h: '0', k: '0', a: '3', b: '2' },
    orientacion: 'horizontal',
    tituloOrientacion: 'Eje transverso',
    modelo: (o) => hiperbola.FORMULAS[o][0],
  },
};

export function iniciarGraficar(raiz) {
  const $ = (s) => raiz.querySelector(s);
  const estado = {
    conica: 'circunferencia',
    valores: Object.fromEntries(Object.entries(CONICAS).map(([k, d]) => [k, { ...d.inicial }])),
    orientacion: Object.fromEntries(Object.entries(CONICAS).map(([k, d]) => [k, d.orientacion ?? null])),
    ejemplo: Object.fromEntries(Object.keys(CONICAS).map((k) => [k, -1])),
    visibles: { ...VISIBLES_POR_DEFECTO },
    ultimo: null,
  };
  const plano = new Plano($('#lienzo-graficar'));
  const campos = $('#campos');
  const error = $('#error-graficar');
  let ultimoCampo = null;
  let ultimaEscena = null;

  // ---------- Construcción de la interfaz ----------

  function construirCampos() {
    const def = CONICAS[estado.conica];
    campos.innerHTML = '';
    for (const [nombre, descripcion] of def.campos) {
      const id = `param-${nombre}`;
      const fila = crear('div', { class: 'campo-fila' });
      fila.append(crear('label', { for: id }, `<span class="param">${nombre}</span> <span class="param-desc">${descripcion}</span>`));
      const menos = crear('button', { type: 'button', class: 'boton paso', 'data-paso': '-1', 'aria-label': `Restar 1 a ${nombre}`, texto: '−' });
      const input = crear('input', {
        id, class: 'campo', type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false', 'data-param': nombre,
      });
      input.value = estado.valores[estado.conica][nombre];
      const mas = crear('button', { type: 'button', class: 'boton paso', 'data-paso': '1', 'aria-label': `Sumar 1 a ${nombre}`, texto: '+' });
      fila.append(menos, input, mas);
      campos.append(fila);
    }
    ultimoCampo = campos.querySelector('input');
  }

  function actualizarPestanas() {
    for (const b of raiz.querySelectorAll('[data-conica]')) b.setAttribute('aria-selected', String(b.dataset.conica === estado.conica));
    const def = CONICAS[estado.conica];
    const fs = $('#orientacion');
    fs.hidden = !def.orientacion;
    if (def.orientacion) {
      $('#orientacion-titulo').textContent = def.tituloOrientacion;
      for (const b of fs.querySelectorAll('[data-orientacion]')) {
        b.setAttribute('aria-pressed', String(b.dataset.orientacion === estado.orientacion[estado.conica]));
      }
    }
    $('#modelo').innerHTML = `Forma ordinaria: ${matHtml(def.modelo(estado.orientacion[estado.conica]))}`;
  }

  // ---------- Cálculo ----------

  function calcular({ encuadrar = false } = {}) {
    const def = CONICAS[estado.conica];
    const valores = estado.valores[estado.conica];
    for (const input of campos.querySelectorAll('input')) input.removeAttribute('aria-invalid');
    for (const [nombre] of def.campos) {
      const r = leerNumero(valores[nombre]);
      if (r.error) return fallar(`${nombre}: ${r.error}`, nombre);
    }
    const res = def.modulo.resolver(valores, estado.orientacion[estado.conica] ?? undefined);
    if (res.error) return fallar(res.error, res.campo);
    ocultarError(error);
    raiz.querySelector('.columna-grafica').classList.remove('desactualizada');
    estado.ultimo = res;
    ultimaEscena = res.escena;
    plano.dibujar(res.escena, estado.visibles);
    if (encuadrar || !plano.contiene(res.escena.encuadre)) plano.encuadrar(res.escena.encuadre);
    renderLeyenda($('#leyenda-graficar'), res.escena, estado.visibles);
    $('#g-ordinaria').innerHTML = matHtml(res.ordinaria);
    $('#g-general').innerHTML = matHtml(res.general);
    renderElementos($('#g-elementos'), res.elementos);
    return true;
  }

  function fallar(mensaje, campo) {
    mostrarError(error, mensaje, {
      ayuda: 'Ejemplos válidos: 3, −2,5, 3/4, √3, 2√5. La gráfica muestra el último resultado válido.',
    });
    if (campo) campos.querySelector(`[data-param="${campo}"]`)?.setAttribute('aria-invalid', 'true');
    raiz.querySelector('.columna-grafica').classList.add('desactualizada');
    return false;
  }

  // ---------- Eventos ----------

  raiz.querySelector('.pestanas').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-conica]');
    if (!b || b.dataset.conica === estado.conica) return;
    estado.conica = b.dataset.conica;
    $('#nombre-ejemplo').textContent = '';
    construirCampos();
    actualizarPestanas();
    calcular({ encuadrar: true });
  });

  $('#orientacion').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-orientacion]');
    if (!b) return;
    estado.orientacion[estado.conica] = b.dataset.orientacion;
    actualizarPestanas();
    calcular({ encuadrar: true });
  });

  campos.addEventListener('focusin', (ev) => {
    if (ev.target.matches('input')) ultimoCampo = ev.target;
  });

  campos.addEventListener('input', (ev) => {
    const input = ev.target.closest('input[data-param]');
    if (!input) return;
    estado.valores[estado.conica][input.dataset.param] = input.value;
    calcular();
  });

  campos.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-paso]');
    if (!b) return;
    const input = b.parentElement.querySelector('input');
    const r = leerNumero(input.value || '0');
    if (r.error) return fallar(`${input.dataset.param}: ${r.error}`, input.dataset.param);
    input.value = aEntrada(r.num.mas(Number(b.dataset.paso)));
    estado.valores[estado.conica][input.dataset.param] = input.value;
    calcular();
  });

  conectarTeclas($('#teclas-parametros'), () => ultimoCampo);

  $('#btn-ejemplo').addEventListener('click', () => {
    const lista = EJEMPLOS_PARAMETROS[estado.conica];
    const i = (estado.ejemplo[estado.conica] + 1) % lista.length;
    estado.ejemplo[estado.conica] = i;
    const ej = lista[i];
    estado.valores[estado.conica] = { ...ej.valores };
    if (ej.orientacion) estado.orientacion[estado.conica] = ej.orientacion;
    $('#nombre-ejemplo').textContent = `Ejemplo ${i + 1} de ${lista.length}: ${ej.nombre}`;
    construirCampos();
    actualizarPestanas();
    calcular({ encuadrar: true });
  });

  crearInterruptores($('#int-graficar'), estado.visibles, () => {
    plano.dibujar(undefined, estado.visibles);
    renderLeyenda($('#leyenda-graficar'), ultimaEscena, estado.visibles);
  });

  conectarZoom(raiz.querySelector('.columna-grafica'), plano);

  construirCampos();
  actualizarPestanas();
  calcular({ encuadrar: true });
  return { plano };
}

// Botones +, − y Centrar sobre un plano
export function conectarZoom(contenedor, plano) {
  contenedor.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-zoom]');
    if (!b) return;
    if (b.dataset.zoom === 'mas') plano.zoom(1.5);
    else if (b.dataset.zoom === 'menos') plano.zoom(1 / 1.5);
    else plano.encuadrar();
  });
}
