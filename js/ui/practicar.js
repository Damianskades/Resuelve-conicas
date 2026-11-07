// Sección "Practicar": ejercicios aleatorios para resolver en papel, modo alternativas con
// errores típicos, "Grafica tú" paso a paso y contador de aciertos (localStorage).

import { Plano, VISIBLES_POR_DEFECTO } from '../graficador/plano.js';
import { generarEjercicio, ejercicioGrafica, tiposDisponibles } from '../problemas/practica.js';
import { resolverDesdeEcuacion } from '../problemas/desde-general.js';
import { GRUPOS } from '../problemas/tipos.js';
import { crear, escaparHtml, renderLeyenda, ocultarError, mostrarError } from './componentes.js';
import { renderSolucion, limpiarSolucion } from './vista-solucion.js';
import { conectarZoom } from './graficar.js';

const CLAVE_MARCADOR = 'resolvedor-conicas:marcador';

function leerMarcador() {
  try {
    const m = JSON.parse(localStorage.getItem(CLAVE_MARCADOR) ?? '{}');
    const intentos = Number.isSafeInteger(m.intentos) && m.intentos >= 0 ? m.intentos : 0;
    const aciertos = Number.isSafeInteger(m.aciertos) && m.aciertos >= 0 ? Math.min(m.aciertos, intentos) : 0;
    return { aciertos, intentos };
  } catch {
    return { aciertos: 0, intentos: 0 };
  }
}

function guardarMarcador(m) {
  try {
    localStorage.setItem(CLAVE_MARCADOR, JSON.stringify(m));
  } catch {
    // sin almacenamiento: el contador dura hasta cerrar la página
  }
}

const semillaNueva = () => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;

export function iniciarPracticar(raiz) {
  const $ = (s) => raiz.querySelector(s);
  const estado = { modo: 'papel', conica: 'todas', tipo: 'todos', ejercicio: null, grafica: null, paso: -1, contado: false };
  let marcador = leerMarcador();
  const planoGrafica = new Plano($('#pr-lienzo'));
  conectarZoom($('#pr-grafica'), planoGrafica);
  const error = $('#pr-error');

  // ---------- Filtros ----------

  function llenarConicas() {
    const sel = $('#pr-conica');
    sel.innerHTML = '';
    sel.append(crear('option', { value: 'todas', texto: 'Todas las cónicas' }));
    for (const g of GRUPOS.filter((x) => x.id !== 'general')) {
      if (estado.modo === 'grafica' && g.id === 'aplicacion') continue;
      if (estado.modo === 'alternativas' && g.id === 'aplicacion') continue;
      sel.append(crear('option', { value: g.id, texto: g.nombre }));
    }
    if (![...sel.options].some((o) => o.value === estado.conica)) estado.conica = 'todas';
    sel.value = estado.conica;
  }

  function llenarTipos() {
    const sel = $('#pr-tipo-select');
    sel.innerHTML = '';
    sel.append(crear('option', { value: 'todos', texto: 'Todos los tipos de pregunta' }));
    for (const t of tiposDisponibles(estado.conica, { soloAlternativas: estado.modo === 'alternativas' })) {
      if (estado.conica === 'todas' && t.conica === 'aplicacion' && estado.modo !== 'papel') continue;
      sel.append(crear('option', { value: t.id, texto: t.titulo }));
    }
    if (![...sel.options].some((o) => o.value === estado.tipo)) estado.tipo = 'todos';
    sel.value = estado.tipo;
    $('#pr-fila-tipo').hidden = estado.modo === 'grafica';
  }

  // ---------- Marcador ----------

  function pintarMarcador() {
    $('#pr-marcador').textContent = `Aciertos de la sesión: ${marcador.aciertos} de ${marcador.intentos}`;
  }

  function registrar(acierto) {
    if (estado.contado) return;
    estado.contado = true;
    marcador = { aciertos: marcador.aciertos + (acierto ? 1 : 0), intentos: marcador.intentos + 1 };
    guardarMarcador(marcador);
    pintarMarcador();
  }

  // ---------- Ejercicios ----------

  function limpiar() {
    ocultarError(error);
    $('#pr-ejercicio').hidden = true;
    $('#pr-alternativas').innerHTML = '';
    $('#pr-feedback').textContent = '';
    $('#pr-feedback').className = 'pr-feedback';
    limpiarSolucion($('#pr-solucion'));
    planoGrafica.dibujar(null);
    $('#pr-autoevaluacion').hidden = true;
    $('#pr-ver').hidden = true;
    $('#pr-revelar').hidden = true;
    $('#pr-grafica').hidden = true;
    $('#pr-paso').textContent = '';
    estado.contado = false;
  }

  function nuevo() {
    limpiar();
    const semilla = semillaNueva();
    if (estado.modo === 'grafica') {
      const g = ejercicioGrafica({ conica: estado.conica, semilla });
      estado.grafica = g;
      estado.paso = -1;
      $('#pr-grupo').textContent = 'Grafica tú';
      $('#pr-enunciado').innerHTML = `Grafica en papel la cónica <span class="mat">${escaparHtml(g.ecuacion)}</span>: identifícala, halla sus elementos y dibújala. Luego toca «Revelar» para ver la gráfica paso a paso.`;
      $('#pr-revelar').hidden = false;
      $('#pr-revelar').textContent = 'Revelar';
      $('#pr-ejercicio').hidden = false;
      return;
    }
    const e = generarEjercicio({ conica: estado.conica, tipo: estado.tipo, semilla, alternativas: estado.modo === 'alternativas' });
    if (!e.ok) {
      mostrarError(error, e.error);
      return;
    }
    estado.ejercicio = e;
    $('#pr-grupo').textContent = `${GRUPOS.find((g) => g.id === e.grupo)?.nombre ?? ''} · ${e.titulo}`;
    $('#pr-enunciado').textContent = e.enunciado + (estado.modo === 'alternativas' ? ' Elige la ecuación general correcta.' : '');
    if (estado.modo === 'alternativas') pintarAlternativas(e);
    else $('#pr-ver').hidden = false;
    $('#pr-ejercicio').hidden = false;
    $('#pr-ejercicio').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function verRespuesta() {
    $('#pr-ver').hidden = true;
    renderSolucion($('#pr-solucion'), estado.ejercicio.res);
    if (estado.modo === 'papel') $('#pr-autoevaluacion').hidden = false;
  }

  // ---------- Modo alternativas ----------

  function pintarAlternativas(e) {
    const ol = $('#pr-alternativas');
    ol.innerHTML = '';
    for (const a of e.alternativas) {
      const li = crear('li');
      const b = crear('button', { type: 'button', class: 'boton alternativa-boton', 'data-letra': a.letra });
      b.append(crear('span', { class: 'alt-letra', texto: `${a.letra})` }), crear('span', { class: 'alt-texto mat', texto: a.texto }));
      li.append(b, crear('p', { class: 'alt-motivo', hidden: true }));
      ol.append(li);
    }
  }

  function elegirAlternativa(letra) {
    const e = estado.ejercicio;
    if (estado.contado) return;
    const elegida = e.alternativas.find((a) => a.letra === letra);
    registrar(elegida.correcta);
    for (const li of $('#pr-alternativas').children) {
      const b = li.querySelector('button');
      const a = e.alternativas.find((x) => x.letra === b.dataset.letra);
      b.disabled = true;
      b.classList.toggle('correcta', a.correcta);
      b.classList.toggle('elegida', a.letra === letra);
      const motivo = li.querySelector('.alt-motivo');
      motivo.hidden = false;
      motivo.textContent = a.correcta ? 'Esta es la respuesta correcta.' : `Error que representa: ${a.error}`;
    }
    const fb = $('#pr-feedback');
    fb.className = `pr-feedback ${elegida.correcta ? 'bien' : 'mal'}`;
    fb.textContent = elegida.correcta
      ? '¡Correcto! Elegiste la ecuación correcta.'
      : `No es esa. La alternativa «${letra}» corresponde a este error: ${elegida.error} La correcta es «${e.alternativas.find((a) => a.correcta).letra}».`;
    renderSolucion($('#pr-solucion'), e.res);
  }

  // ---------- Grafica tú ----------

  function siguientePaso() {
    const g = estado.grafica;
    if (!g || estado.paso >= g.pasos.length - 1) return;
    estado.paso++;
    const { pasos } = g;
    const grafica = $('#pr-grafica');
    if (grafica.hidden) {
      grafica.hidden = false;
    }
    const paso = pasos[estado.paso];
    planoGrafica.dibujar(paso.escena, VISIBLES_POR_DEFECTO);
    if (estado.paso === 0) planoGrafica.encuadrar(g.conica.escena.encuadre);
    renderLeyenda($('#pr-leyenda'), paso.escena, VISIBLES_POR_DEFECTO);
    $('#pr-paso').textContent = `Paso ${estado.paso + 1} de ${pasos.length}: ${paso.titulo}`;
    const boton = $('#pr-revelar');
    if (estado.paso < pasos.length - 1) {
      boton.textContent = 'Siguiente paso';
    } else {
      boton.hidden = true;
      $('#pr-autoevaluacion').hidden = false;
      const res = resolverDesdeEcuacion(g.ecuacion);
      if (res.ok) {
        // En "Grafica tú" la gráfica ya está arriba: se muestra solo la respuesta y el procedimiento
        renderSolucion($('#pr-solucion'), res, { mostrarGrafica: false });
      }
    }
    grafica.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ---------- Eventos ----------

  raiz.querySelector('.pr-modos').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-pr-modo]');
    if (!b) return;
    estado.modo = b.dataset.prModo;
    for (const x of raiz.querySelectorAll('[data-pr-modo]')) x.setAttribute('aria-pressed', String(x === b));
    llenarConicas();
    llenarTipos();
    limpiar();
    $('#pr-descripcion').textContent = {
      papel: 'Resuelve y grafica en papel; luego toca «Ver respuesta» y compara.',
      alternativas: 'Elige la ecuación correcta entre 4 alternativas; las incorrectas imitan errores típicos.',
      grafica: 'Solo verás la ecuación: grafícala en papel y luego revela la gráfica paso a paso.',
    }[estado.modo];
  });

  $('#pr-conica').addEventListener('change', (ev) => {
    estado.conica = ev.target.value;
    llenarTipos();
  });
  $('#pr-tipo-select').addEventListener('change', (ev) => {
    estado.tipo = ev.target.value;
  });
  $('#pr-nuevo').addEventListener('click', nuevo);
  $('#pr-ver').addEventListener('click', verRespuesta);
  $('#pr-revelar').addEventListener('click', siguientePaso);
  $('#pr-alternativas').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-letra]');
    if (b) elegirAlternativa(b.dataset.letra);
  });
  $('#pr-autoevaluacion').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-acierto]');
    if (!b) return;
    registrar(b.dataset.acierto === 'si');
    $('#pr-autoevaluacion').hidden = true;
    $('#pr-feedback').className = `pr-feedback ${b.dataset.acierto === 'si' ? 'bien' : 'mal'}`;
    $('#pr-feedback').textContent = b.dataset.acierto === 'si' ? '¡Bien! Lo sumé a tus aciertos.' : 'Anotado. Revisa el procedimiento y prueba con otro ejercicio.';
  });
  $('#pr-reiniciar').addEventListener('click', () => {
    marcador = { aciertos: 0, intentos: 0 };
    guardarMarcador(marcador);
    pintarMarcador();
  });

  llenarConicas();
  llenarTipos();
  pintarMarcador();
}
