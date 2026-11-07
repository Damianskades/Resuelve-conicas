// Sección "Resolver": buscador y lista de tipos de pregunta agrupados por cónica, formulario
// generado a partir de los campos del tipo elegido y solución con sus 5 partes
// (datos, fórmulas, pasos, respuesta final resaltada y gráfica con los datos marcados).
// No conoce ningún tipo en particular: todo sale del catálogo (js/problemas/tipos.js).

import { Plano, VISIBLES_POR_DEFECTO } from '../graficador/plano.js';
import { resolverPregunta } from '../problemas/solucionador.js';
import { TIPOS_PREGUNTA, tipoPorId, buscarTipos, agrupar } from '../problemas/tipos.js';
import { EJEMPLOS_ECUACIONES, EJEMPLOS_ENUNCIADOS } from '../problemas/ejemplos.js';
import { detectar } from '../problemas/detector.js';
import { compararAlternativas } from '../problemas/alternativas.js';
import {
  crear, escaparHtml, matHtml, crearInterruptores, renderLeyenda, renderElementos, mostrarError, ocultarError,
  conectarTeclas, copiarTexto,
} from './componentes.js';
import { conectarZoom } from './graficar.js';

const CLAVE_TIPO = 'resolvedor-conicas:tipo';

function leerGuardado() {
  try {
    return localStorage.getItem(CLAVE_TIPO);
  } catch {
    return null;
  }
}

function guardar(id) {
  try {
    localStorage.setItem(CLAVE_TIPO, id);
  } catch {
    // sin almacenamiento: no pasa nada
  }
}

export function iniciarResolver(raiz) {
  const $ = (s) => raiz.querySelector(s);
  const selector = $('#selector-tipo');
  const lista = $('#lista-tipos');
  const buscador = $('#buscar-tipo');
  const form = $('#form-resolver');
  const camposCont = $('#campos-tipo');
  const error = $('#error-resolver');
  const solucion = $('#solucion');
  const visibles = { ...VISIBLES_POR_DEFECTO };
  const plano = new Plano($('#lienzo-resolver'));
  let tipo = null;
  let actual = null;
  let ultimoCampo = null;
  let indiceEjemplo = 0;
  let indiceEnunciado = 0;
  let modo = 'pegar';
  let alternativas = [];

  // ---------- Modos: pegar pregunta / elegir tipo ----------

  function mostrarModo(m) {
    modo = m;
    for (const b of raiz.querySelectorAll('[data-modo]')) b.setAttribute('aria-pressed', String(b.dataset.modo === m));
    $('#modo-pegar').hidden = m !== 'pegar';
    selector.hidden = m !== 'elegir';
    solucion.hidden = true;
    ocultarError(error);
    if (m === 'elegir') {
      alternativas = [];
      plegarSelector(Boolean(tipo));
      form.hidden = !tipo;
      if (!tipo) {
        const guardado = leerGuardado();
        if (guardado && tipoPorId(guardado)) elegir(guardado, { enfocar: false });
      }
    } else {
      form.hidden = $('#deteccion').hidden || !tipo;
    }
  }

  // Texto pegado con los datos encontrados resaltados
  function textoMarcado(texto, marcas) {
    let html = '';
    let i = 0;
    for (const m of marcas) {
      html += escaparHtml(texto.slice(i, m.pos));
      html += `<mark class="m-${m.clase}">${escaparHtml(texto.slice(m.pos, m.pos + m.len))}</mark>`;
      i = m.pos + m.len;
    }
    return (html + escaparHtml(texto.slice(i))).replace(/\n/g, '<br>');
  }

  function aplicarOpcion(op) {
    elegir(op.tipo, { enfocar: false, conservarAlternativas: true });
    ponerValores(op.crudos);
    $('#nombre-ejemplo-tipo').textContent = 'Llené los datos desde el enunciado: revísalos (puedes corregirlos) y pulsa Resolver.';
    for (const b of $('#det-opciones').querySelectorAll('[data-opcion-tipo]')) {
      b.setAttribute('aria-pressed', String(b.dataset.opcionTipo === op.tipo));
    }
  }

  function analizar() {
    const texto = $('#pregunta').value;
    const d = detectar(texto);
    const panel = $('#deteccion');
    solucion.hidden = true;
    if (!d.ok) {
      panel.hidden = true;
      form.hidden = true;
      alternativas = [];
      mostrarError($('#error-pegar'), d.mensaje);
      return;
    }
    ocultarError($('#error-pegar'));
    alternativas = d.alternativas;
    panel.hidden = false;
    $('#det-titulo').textContent = d.tipo ? `Detecté: ${tipoPorId(d.tipo).titulo}` : 'No pude elegir el tipo de pregunta';
    $('#det-confianza').textContent = d.tipo
      ? d.confianza === 'alta'
        ? `${agrupar([tipoPorId(d.tipo)])[0].nombre}. Confianza alta.`
        : 'Confianza baja: revisa si es el tipo correcto o elige otro de estas opciones.'
      : d.mensaje ?? 'Elige una de estas opciones o usa «Elegir tipo».';
    const opciones = $('#det-opciones');
    opciones.innerHTML = '';
    if (d.confianza === 'baja' || !d.tipo) {
      for (const o of d.opciones) {
        opciones.append(crear('button', { type: 'button', class: 'boton tipo-item', 'data-opcion-tipo': o.tipo, 'aria-pressed': 'false', texto: o.titulo }));
      }
      opciones.onclick = (ev) => {
        const b = ev.target.closest('[data-opcion-tipo]');
        if (b) aplicarOpcion(d.opciones.find((o) => o.tipo === b.dataset.opcionTipo));
      };
    }
    $('#det-texto').innerHTML = textoMarcado(texto, d.marcas);
    const datos = $('#det-datos');
    datos.innerHTML = '';
    for (const x of d.datos) {
      datos.append(crear('dt', { texto: x.etiqueta }));
      datos.append(crear('dd', { class: 'mat' }, escaparHtml(x.valor)));
    }
    if (!d.datos.length) datos.append(crear('dd', { texto: 'No encontré puntos, rectas, ecuaciones ni números con nombre.' }));
    $('#det-pide').textContent = d.pide.length ? `Se pide: ${d.pide.join(', ')}.` : '';
    $('#det-alternativas').textContent = d.alternativas.length
      ? `Encontré ${d.alternativas.length} alternativas (${d.alternativas.map((a) => a.letra).join(', ')}): las compararé con la respuesta calculada.`
      : '';
    if (d.tipo) aplicarOpcion(d.opciones.find((o) => o.tipo === d.tipo));
    else form.hidden = true;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function mostrarAlternativas(res) {
    const tarjeta = $('#sol-alternativas-tarjeta');
    if (!alternativas.length) {
      tarjeta.hidden = true;
      return;
    }
    const c = compararAlternativas(alternativas, res);
    tarjeta.hidden = false;
    $('#sol-alt-resumen').textContent = c.ninguna
      ? 'Ninguna alternativa coincide con la respuesta calculada. Revisa los datos o el enunciado; la respuesta calculada está arriba.'
      : `La alternativa correcta es ${c.correctas.map((l) => `«${l}»`).join(' y ')}.`;
    const ol = $('#sol-alternativas');
    ol.innerHTML = '';
    for (const a of c.alternativas) {
      const li = crear('li', { class: `alternativa${a.coincide ? ' correcta' : ''}` });
      li.append(crear('span', { class: 'alt-letra', texto: `${a.letra})` }));
      li.append(crear('span', { class: 'alt-texto mat', texto: a.texto }));
      li.append(crear('span', { class: 'alt-motivo', texto: a.coincide ? 'Coincide con la respuesta calculada.' : `No coincide: ${a.motivo}.` }));
      ol.append(li);
    }
  }

  // ---------- Lista de tipos ----------

  function pintarLista() {
    const encontrados = buscarTipos(buscador.value);
    lista.innerHTML = '';
    $('#conteo-tipos').textContent = buscador.value.trim()
      ? `${encontrados.length} ${encontrados.length === 1 ? 'tipo encontrado' : 'tipos encontrados'}`
      : `${TIPOS_PREGUNTA.length} tipos de pregunta`;
    if (!encontrados.length) {
      lista.append(crear('p', { class: 'nota', texto: 'No hay tipos con esas palabras. Prueba con «foco», «tangente», «vértices»…' }));
      return;
    }
    for (const g of agrupar(encontrados)) {
      const grupo = crear('section', { class: 'grupo-tipos' });
      grupo.append(crear('h3', { texto: g.nombre }));
      const ul = crear('ul', { class: 'tipos' });
      for (const t of g.tipos) {
        const li = crear('li');
        const b = crear('button', { type: 'button', class: 'boton tipo-item', 'data-tipo': t.id, 'aria-pressed': String(t.id === tipo?.id) });
        b.append(crear('span', { class: 'tipo-item-titulo', texto: t.titulo }));
        if (t.descripcion) b.append(crear('span', { class: 'tipo-item-desc', texto: t.descripcion }));
        li.append(b);
        ul.append(li);
      }
      grupo.append(ul);
      lista.append(grupo);
    }
  }

  function plegarSelector(plegar) {
    selector.classList.toggle('plegado', plegar);
  }

  // ---------- Formulario ----------

  function elegir(id, { enfocar = true, conservarAlternativas = false } = {}) {
    if (!conservarAlternativas) alternativas = [];
    tipo = tipoPorId(id) ?? tipoPorId('ecuacion');
    guardar(tipo.id);
    indiceEjemplo = 0;
    $('#tipo-grupo').textContent = agrupar([tipo])[0].nombre;
    $('#tipo-titulo').textContent = tipo.titulo;
    $('#tipo-descripcion').textContent = tipo.descripcion ?? '';
    $('#nombre-ejemplo-tipo').textContent = '';
    construirCampos();
    ocultarError(error);
    solucion.hidden = true;
    form.hidden = false;
    plegarSelector(true);
    pintarLista();
    if (enfocar) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      camposCont.querySelector('input')?.focus({ preventScroll: true });
    }
  }

  function construirCampos() {
    camposCont.innerHTML = '';
    for (const c of tipo.campos) {
      const fila = crear('div', { class: 'campo-tipo', 'data-campo-fila': c.id });
      if (c.tipo === 'opcion') {
        const fs = crear('fieldset', { class: 'segmentado', 'data-campo': c.id });
        fs.append(crear('legend', { texto: c.etiqueta }));
        for (const o of c.opciones) {
          fs.append(crear('button', { type: 'button', class: 'boton', 'data-opcion': o.valor, 'aria-pressed': String(o.valor === c.ejemplo), texto: o.texto }));
        }
        fs.dataset.valor = c.ejemplo;
        fila.append(fs);
      } else {
        const id = `campo-${c.id}`;
        fila.append(crear('label', { for: id, class: 'etiqueta', texto: c.etiqueta }));
        const input = crear('input', {
          id,
          class: `campo${c.tipo === 'ecuacion' ? ' campo-ecuacion' : ''}`,
          type: 'text',
          inputmode: c.tipo === 'numero' ? 'decimal' : 'text',
          autocomplete: 'off',
          autocapitalize: 'off',
          spellcheck: 'false',
          placeholder: c.ejemplo || '',
          'data-campo': c.id,
        });
        input.value = c.ejemplo ?? '';
        fila.append(input);
        if (c.ayuda) fila.append(crear('p', { class: 'ayuda', texto: c.ayuda }));
      }
      camposCont.append(fila);
    }
    ultimoCampo = camposCont.querySelector('input');
  }

  function leerFormulario() {
    const crudos = {};
    for (const el of camposCont.querySelectorAll('[data-campo]')) {
      crudos[el.dataset.campo] = el.tagName === 'FIELDSET' ? el.dataset.valor : el.value;
    }
    return crudos;
  }

  function ponerValores(valores) {
    for (const el of camposCont.querySelectorAll('[data-campo]')) {
      const v = valores[el.dataset.campo] ?? '';
      if (el.tagName === 'FIELDSET') {
        el.dataset.valor = v;
        for (const b of el.querySelectorAll('[data-opcion]')) b.setAttribute('aria-pressed', String(b.dataset.opcion === v));
      } else el.value = v;
    }
  }

  // ---------- Resolver y mostrar ----------

  function resolver() {
    for (const el of camposCont.querySelectorAll('[aria-invalid]')) el.removeAttribute('aria-invalid');
    const res = resolverPregunta(tipo.id, leerFormulario());
    if (!res.ok) {
      mostrarError(error, res.error, { entrada: res.entrada, posicion: res.posicion, longitud: res.longitud });
      if (res.campo) {
        const el = camposCont.querySelector(`[data-campo="${res.campo}"]`);
        el?.setAttribute('aria-invalid', 'true');
        el?.focus?.({ preventScroll: true });
      }
      solucion.hidden = true;
      actual = null;
      error.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    ocultarError(error);
    actual = res;
    mostrarSolucion(res);
    mostrarAlternativas(res);
  }

  function mostrarSolucion(res) {
    // 1) Datos
    const datos = $('#sol-datos');
    datos.innerHTML = '';
    for (const d of res.datos) {
      datos.append(crear('dt', { texto: d.etiqueta }));
      datos.append(crear('dd', { class: d.texto !== undefined ? 'mat entrada-eco' : 'mat' }, d.texto !== undefined ? escaparHtml(d.texto) : matHtml(d.mat)));
    }
    // 2) Fórmulas
    const formulas = $('#sol-formulas');
    formulas.innerHTML = '';
    for (const f of res.formulas) formulas.append(crear('li', { class: 'mat' }, matHtml(f)));
    // 3) Pasos
    const pasos = $('#sol-pasos');
    pasos.innerHTML = '';
    for (const p of res.pasos) {
      const li = crear('li', { class: 'paso' });
      li.append(crear('h3', { texto: p.titulo }));
      if (p.texto) li.append(crear('p', {}, matHtml(p.texto)));
      if (p.formula) li.append(crear('p', { class: 'paso-formula' }, `<span class="paso-formula-etiqueta">Fórmula:</span> <span class="mat">${matHtml(p.formula)}</span>`));
      if (p.mat?.length) {
        const bloque = crear('div', { class: 'mat-bloque' });
        for (const m of p.mat) bloque.append(crear('div', { class: 'mat' }, matHtml(m)));
        li.append(bloque);
      }
      if (p.tabla) {
        const cont = crear('div', { class: 'elementos' });
        renderElementos(cont, p.tabla);
        li.append(cont);
      }
      pasos.append(li);
    }
    // 4) Respuesta
    $('#sol-respuesta-titulo').textContent = res.respuesta.titulo;
    const lineas = $('#sol-respuesta');
    lineas.innerHTML = '';
    for (const l of res.respuesta.lineas) {
      const p = crear('p', { class: 'respuesta-linea' });
      p.append(crear('strong', { texto: `${l.etiqueta}: ` }));
      p.append(crear('span', { class: 'mat' }, matHtml(l.mat)));
      lineas.append(p);
    }
    $('#copiado').textContent = '';
    // 5) Gráfica
    const hay = Boolean(res.escena);
    $('#sin-grafica').hidden = hay;
    $('#sin-grafica').textContent = hay ? '' : 'No hay gráfica: la ecuación no tiene puntos reales.';
    $('#envoltura-resolver').hidden = !hay;
    solucion.hidden = false;
    if (hay) {
      plano.dibujar(res.escena, visibles);
      plano.encuadrar(res.escena.encuadre);
    }
    renderLeyenda($('#leyenda-resolver'), res.escena, visibles);
    solucion.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------- Eventos ----------

  buscador.addEventListener('input', () => {
    plegarSelector(false);
    pintarLista();
  });

  lista.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-tipo]');
    // Las alternativas pegadas se conservan si se corrige el tipo detectado.
    if (b) elegir(b.dataset.tipo, { conservarAlternativas: true });
  });

  $('#btn-cambiar-tipo').addEventListener('click', () => {
    if (modo === 'pegar') {
      const guardadas = alternativas;
      mostrarModo('elegir');
      alternativas = guardadas;
      form.hidden = false;
    }
    plegarSelector(false);
    selector.scrollIntoView({ behavior: 'smooth', block: 'start' });
    buscador.focus({ preventScroll: true });
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    resolver();
  });

  camposCont.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-opcion]');
    if (!b) return;
    const fs = b.closest('fieldset');
    fs.dataset.valor = b.dataset.opcion;
    for (const x of fs.querySelectorAll('[data-opcion]')) x.setAttribute('aria-pressed', String(x === b));
  });

  camposCont.addEventListener('focusin', (ev) => {
    if (ev.target.matches('input')) ultimoCampo = ev.target;
  });

  camposCont.addEventListener('input', (ev) => ev.target.removeAttribute?.('aria-invalid'));

  conectarTeclas($('#teclas-tipo'), () => ultimoCampo);

  $('#btn-ejemplo-tipo').addEventListener('click', () => {
    if (tipo.id === 'ecuacion') {
      const ej = EJEMPLOS_ECUACIONES[indiceEjemplo % EJEMPLOS_ECUACIONES.length];
      $('#nombre-ejemplo-tipo').textContent = `Ejemplo ${(indiceEjemplo % EJEMPLOS_ECUACIONES.length) + 1} de ${EJEMPLOS_ECUACIONES.length}: ${ej.nombre}`;
      indiceEjemplo++;
      ponerValores({ ecuacion: ej.ecuacion });
    } else {
      ponerValores(Object.fromEntries(tipo.campos.map((c) => [c.id, c.ejemplo])));
    }
    resolver();
  });

  $('#btn-limpiar').addEventListener('click', () => {
    ponerValores(Object.fromEntries(tipo.campos.map((c) => [c.id, c.tipo === 'opcion' ? c.ejemplo : ''])));
    ocultarError(error);
    camposCont.querySelector('input')?.focus();
  });

  $('#btn-copiar').addEventListener('click', async () => {
    if (!actual) return;
    const ok = await copiarTexto(actual.respuestaTexto);
    $('#copiado').textContent = ok ? '¡Copiado!' : 'No se pudo copiar: selecciona el texto y cópialo a mano.';
  });

  crearInterruptores($('#int-resolver'), visibles, () => {
    plano.dibujar(undefined, visibles);
    renderLeyenda($('#leyenda-resolver'), actual?.escena, visibles);
  });

  conectarZoom($('.grafica-fija'), plano);

  raiz.querySelector('.modos-resolver').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-modo]');
    if (b && b.dataset.modo !== modo) mostrarModo(b.dataset.modo);
  });

  $('#btn-analizar').addEventListener('click', analizar);

  $('#pregunta').addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) analizar();
  });

  $('#btn-ejemplo-enunciado').addEventListener('click', () => {
    const i = indiceEnunciado % EJEMPLOS_ENUNCIADOS.length;
    indiceEnunciado++;
    $('#pregunta').value = EJEMPLOS_ENUNCIADOS[i];
    $('#nombre-ejemplo-enunciado').textContent = `Ejemplo ${i + 1} de ${EJEMPLOS_ENUNCIADOS.length}`;
    analizar();
  });

  $('#btn-limpiar-pregunta').addEventListener('click', () => {
    $('#pregunta').value = '';
    $('#deteccion').hidden = true;
    $('#nombre-ejemplo-enunciado').textContent = '';
    ocultarError($('#error-pegar'));
    form.hidden = true;
    solucion.hidden = true;
    alternativas = [];
    $('#pregunta').focus();
  });

  pintarLista();
  mostrarModo('pegar');
  return { plano };
}
