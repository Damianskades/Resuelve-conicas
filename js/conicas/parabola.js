// Parábola desde sus parámetros h, k, p (p ≠ 0) y el eje (vertical u horizontal):
//   vertical:   (x − h)² = 4p(y − k)      horizontal: (y − k)² = 4p(x − h)
// Ecuaciones, elementos con su fórmula y escena para el graficador. Funciones puras.

import { aTexto } from '../math/formato.js';
import { mCuadrado, mPorBinomio, mValor, mParen } from '../math/expresiones.js';
import {
  N, leerParametros, ecuacionGeneral, ePunto, eValor, eRecta, eTexto, escenaVacia, punto,
  rectaVertical, rectaHorizontal, curvaParabola,
} from './comun.js';

export const FORMULAS = {
  vertical: ['(x − h)² = 4p(y − k)'],
  horizontal: ['(y − k)² = 4p(x − h)'],
};

export function resolver(params = {}, orientacion = 'vertical') {
  if (orientacion !== 'vertical' && orientacion !== 'horizontal') {
    return { error: 'El eje de la parábola debe ser «vertical» u «horizontal».' };
  }
  const l = leerParametros(params, ['h', 'k', 'p']);
  if (l.error) return l;
  const { h, k, p } = l.valores;
  if (p.esCero()) {
    return { error: 'p no puede ser 0: con p = 0 no hay parábola. Usa p > 0 o p < 0 según hacia dónde abre.', campo: 'p' };
  }
  const vert = orientacion === 'vertical';
  const cuatroP = p.por(4);
  const ordinaria = vert
    ? `${mCuadrado('x', h)} = ${mPorBinomio(cuatroP, 'y', k)}`
    : `${mCuadrado('y', k)} = ${mPorBinomio(cuatroP, 'x', h)}`;
  const uno = N(1);
  const cero = N(0);
  const general = ecuacionGeneral(
    vert
      ? { A: uno, C: cero, D: h.por(-2), E: cuatroP.neg(), F: h.cuadrado().mas(cuatroP.por(k)) }
      : { A: cero, C: uno, D: cuatroP.neg(), E: k.por(-2), F: k.cuadrado().mas(cuatroP.por(h)) },
  );

  const [fx, fy] = vert ? [h, k.mas(p)] : [h.mas(p), k];
  const dir = vert ? k.menos(p) : h.menos(p);
  const lr = cuatroP.abs();
  const dosP = p.por(2).abs();
  const [l1, l2] = vert ? [[h.menos(dosP), fy], [h.mas(dosP), fy]] : [[fx, k.menos(dosP)], [fx, k.mas(dosP)]];
  const abre = vert ? (p.signo() > 0 ? 'arriba' : 'abajo') : p.signo() > 0 ? 'la derecha' : 'la izquierda';
  const formula = FORMULAS[orientacion][0];

  const elementos = [
    ePunto('vertice', 'Vértice', 'V', h, k, 'V = (h; k)'),
    eValor('cuatroP', 'Parámetro 4p', '4p', cuatroP, formula),
    eValor('p', 'Parámetro p (distancia del vértice al foco)', 'p', p, 'p = \\frac{4p}{4}'),
    ePunto(
      'foco', 'Foco', 'F', fx, fy,
      vert ? 'F = (h; k + p)' : 'F = (h + p; k)',
      vert ? `F = (${mValor(h)}; ${mValor(k)} + ${mParen(p)}) = (${mValor(fx)}; ${mValor(fy)})`
        : `F = (${mValor(h)} + ${mParen(p)}; ${mValor(k)}) = (${mValor(fx)}; ${mValor(fy)})`,
    ),
    eRecta(
      'directriz', 'Directriz', vert ? 'y' : 'x', dir,
      vert ? 'y = k − p' : 'x = h − p',
      `${vert ? 'y' : 'x'} = ${mValor(vert ? k : h)} − ${mParen(p)} = ${mValor(dir)}`,
    ),
    eRecta('eje', 'Eje focal (eje de simetría)', vert ? 'x' : 'y', vert ? h : k, vert ? 'x = h' : 'y = k'),
    eValor('ladoRecto', 'Lado recto', 'LR', lr, 'LR = |4p|', `LR = |${mValor(cuatroP)}| = ${mValor(lr)}`),
    ePunto('lr1', 'Extremo del lado recto', 'L₁', l1[0], l1[1], vert ? 'L = (h ± 2p; k + p)' : 'L = (h + p; k ± 2p)'),
    ePunto('lr2', 'Extremo del lado recto', 'L₂', l2[0], l2[1], vert ? 'L = (h ± 2p; k + p)' : 'L = (h + p; k ± 2p)'),
    eTexto('abre', 'Abre hacia', abre, vert ? 'p > 0: arriba; p < 0: abajo' : 'p > 0: derecha; p < 0: izquierda'),
    eValor('e', 'Excentricidad', 'e', N(1), 'e = 1'),
  ];

  const escena = escenaVacia();
  escena.curvas.push(curvaParabola(h.v, k.v, p.v, vert));
  escena.rectas.push(vert ? rectaHorizontal(dir, 'directriz', 'directrices') : rectaVertical(dir, 'directriz', 'directrices'));
  escena.rectas.push(vert ? rectaVertical(h, 'eje', 'ejeFocal', '') : rectaHorizontal(k, 'eje', 'ejeFocal', ''));
  escena.segmentos.push({ a: [l1[0].v, l1[1].v], b: [l2[0].v, l2[1].v], tipo: 'lado-recto', grupo: 'ladoRecto' });
  escena.puntos.push(
    punto('V', h, k, 'vertice'),
    punto('F', fx, fy, 'foco', 'focos'),
    punto('L₁', l1[0], l1[1], 'guia', 'ladoRecto'),
    punto('L₂', l2[0], l2[1], 'guia', 'ladoRecto'),
  );
  const q = Math.abs(p.v);
  escena.encuadre.push(
    [h.v, k.v], [fx.v, fy.v], [l1[0].v, l1[1].v], [l2[0].v, l2[1].v],
    vert ? [h.v, dir.v] : [dir.v, k.v],
    vert ? [h.v - 4 * q, k.v + 4 * p.v] : [h.v + 4 * p.v, k.v - 4 * q],
    vert ? [h.v + 4 * q, k.v + 4 * p.v] : [h.v + 4 * p.v, k.v + 4 * q],
  );

  return {
    tipo: 'parabola',
    orientacion,
    ordinaria,
    ordinariaTexto: aTexto(ordinaria),
    general: general.texto,
    coef: general.coef,
    formulas: FORMULAS[orientacion],
    elementos,
    valores: { h, k, p, cuatroP, foco: [fx, fy], directriz: dir, ladoRecto: lr },
    escena,
  };
}
