// Dibuja una solución completa (respuesta, datos, fórmulas, procedimiento y gráfica) dentro de
// un contenedor. La usa la sección Practicar; Resolver tiene su propio armado con más controles.

import { Plano, VISIBLES_POR_DEFECTO } from '../graficador/plano.js';
import { crear, escaparHtml, matHtml, renderElementos, renderLeyenda } from './componentes.js';
import { conectarZoom } from './graficar.js';

function parte(numero, titulo, clase = '') {
  const art = crear('article', { class: `tarjeta parte ${clase}` });
  art.append(crear('h2', {}, `<span class="parte-num">${numero}</span> ${escaparHtml(titulo)}`));
  return art;
}

export function renderSolucion(contenedor, res) {
  contenedor.innerHTML = '';
  // 4) Respuesta primero: es lo que se quiere comparar con lo hecho en papel
  const resp = parte('4', 'Respuesta final', 'respuesta');
  resp.append(crear('p', { class: 'respuesta-titulo', texto: res.respuesta.titulo }));
  const lineas = crear('div', { class: 'respuesta-lineas' });
  for (const l of res.respuesta.lineas) {
    const p = crear('p', { class: 'respuesta-linea' });
    p.append(crear('strong', { texto: `${l.etiqueta}: ` }), crear('span', { class: 'mat' }, matHtml(l.mat)));
    lineas.append(p);
  }
  resp.append(lineas);

  // 5) Gráfica
  let plano = null;
  const graf = parte('5', 'Gráfica', 'grafica');
  if (res.escena) {
    const env = crear('div', { class: 'lienzo-envoltura' });
    const canvas = crear('canvas', { class: 'lienzo', tabindex: '0', 'aria-label': 'Gráfica de la solución. Arrastra para mover; pellizca o usa la rueda para acercar.' });
    const zoom = crear('div', { class: 'zoom' },
      '<button type="button" class="boton" data-zoom="mas" aria-label="Acercar">+</button>' +
      '<button type="button" class="boton" data-zoom="menos" aria-label="Alejar">−</button>' +
      '<button type="button" class="boton boton-centrar" data-zoom="centrar">Centrar</button>');
    env.append(canvas, zoom);
    const leyenda = crear('ul', { class: 'leyenda', 'aria-label': 'Leyenda' });
    graf.append(env, leyenda);
    contenedor.append(resp, graf);
    plano = new Plano(canvas);
    plano.dibujar(res.escena, VISIBLES_POR_DEFECTO);
    plano.encuadrar(res.escena.encuadre);
    renderLeyenda(leyenda, res.escena, VISIBLES_POR_DEFECTO);
    conectarZoom(graf, plano);
  } else {
    graf.append(crear('p', { class: 'nota', texto: 'No hay gráfica: la ecuación no tiene puntos reales.' }));
    contenedor.append(resp, graf);
  }

  // 1) Datos, 2) Fórmulas, 3) Procedimiento (desplegable para no alargar la pantalla)
  const detalle = crear('details', { class: 'tarjeta detalle-solucion' });
  detalle.append(crear('summary', { texto: 'Ver datos, fórmulas y procedimiento paso a paso' }));
  const dl = crear('dl', { class: 'datos' });
  for (const d of res.datos) {
    dl.append(crear('dt', { texto: d.etiqueta }));
    dl.append(crear('dd', { class: 'mat' }, d.texto !== undefined ? escaparHtml(d.texto) : matHtml(d.mat)));
  }
  detalle.append(crear('h3', { texto: '1. Datos' }), dl);
  const ul = crear('ul', { class: 'formulas' });
  for (const f of res.formulas) ul.append(crear('li', { class: 'mat' }, matHtml(f)));
  detalle.append(crear('h3', { texto: '2. Fórmulas usadas' }), ul);
  const ol = crear('ol', { class: 'pasos' });
  for (const p of res.pasos) {
    const li = crear('li', { class: 'paso' });
    li.append(crear('h4', { texto: p.titulo }));
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
    ol.append(li);
  }
  detalle.append(crear('h3', { texto: '3. Procedimiento' }), ol);
  contenedor.append(detalle);
  return plano;
}
