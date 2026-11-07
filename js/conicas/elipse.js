// Elipse desde sus parámetros h, k, a, b (a > b > 0) y la orientación del eje mayor:
//   horizontal: (x − h)²/a² + (y − k)²/b² = 1     vertical: (x − h)²/b² + (y − k)²/a² = 1
// Ecuaciones, elementos con su fórmula y escena para el graficador. Funciones puras.

import { aTexto, fmtCorto } from '../math/formato.js';
import { mCuadrado, mValor, mFraccion } from '../math/expresiones.js';
import {
  N, leerParametros, coefDesdeOrdinaria, ecuacionGeneral, ePunto, eValor, eRecta, eTexto,
  escenaVacia, punto, rectaVertical, rectaHorizontal, curvaElipse,
  calculoC, calculoE, calculoLR, calculoDirectrices,
} from './comun.js';

export const FORMULAS = {
  horizontal: ['\\frac{(x − h)²}{a²} + \\frac{(y − k)²}{b²} = 1', 'c² = a² − b²'],
  vertical: ['\\frac{(x − h)²}{b²} + \\frac{(y − k)²}{a²} = 1', 'c² = a² − b²'],
};

export function resolver(params = {}, orientacion = 'horizontal') {
  if (orientacion !== 'horizontal' && orientacion !== 'vertical') {
    return { error: 'El eje mayor de la elipse debe ser «horizontal» o «vertical».' };
  }
  const l = leerParametros(params, ['h', 'k', 'a', 'b']);
  if (l.error) return l;
  const { h, k, a, b } = l.valores;
  if (a.signo() <= 0) return { error: `a debe ser mayor que 0 (escribiste a = ${fmtCorto(a)}).`, campo: 'a' };
  if (b.signo() <= 0) return { error: `b debe ser mayor que 0 (escribiste b = ${fmtCorto(b)}).`, campo: 'b' };
  if (a.igual(b)) {
    return { error: 'Con a = b la curva es una circunferencia de radio a. Usa la pestaña Circunferencia o cambia los valores.', campo: 'b' };
  }
  if (a.comparar(b) < 0) {
    return {
      error: `En la elipse a es el semieje mayor, así que a debe ser mayor que b (escribiste a = ${fmtCorto(a)} y b = ${fmtCorto(b)}). Intercambia los valores y elige la orientación del eje mayor.`,
      campo: 'a',
    };
  }
  const hor = orientacion === 'horizontal';
  const a2 = a.cuadrado();
  const b2 = b.cuadrado();
  const c2 = a2.menos(b2);
  const c = c2.raiz();
  const [dx, dy] = hor ? [a2, b2] : [b2, a2];
  const ordinaria = `${mFraccion(mCuadrado('x', h), mValor(dx))} + ${mFraccion(mCuadrado('y', k), mValor(dy))} = 1`;
  const general = ecuacionGeneral(coefDesdeOrdinaria(h, k, dx, dy, 1, 1));

  const sobreEje = (d) => (hor ? [h.mas(d), k] : [h, k.mas(d)]);
  const sobreMenor = (d) => (hor ? [h, k.mas(d)] : [h.mas(d), k]);
  const [V1, V2, B1, B2, F1, F2] = [a.neg(), a, b.neg(), b, c.neg(), c].map((d, i) => (i === 2 || i === 3 ? sobreMenor(d) : sobreEje(d)));
  const centroEje = hor ? h : k;
  const aSobreC = a2.entre(c);
  const d1 = centroEje.menos(aSobreC);
  const d2 = centroEje.mas(aSobreC);
  const lr = b2.por(2).entre(a);
  const e = c.entre(a);
  const v = hor ? 'x' : 'y';
  const he = hor ? 'h' : 'k';
  const fV = hor ? 'V = (h ± a; k)' : 'V = (h; k ± a)';
  const fB = hor ? 'B = (h; k ± b)' : 'B = (h ± b; k)';
  const fF = hor ? 'F = (h ± c; k)' : 'F = (h; k ± c)';
  const fD = `${v} = ${he} ± \\frac{a²}{c}`;

  const elementos = [
    ePunto('centro', 'Centro', 'C', h, k, 'C = (h; k)'),
    eTexto('orientacion', 'Eje mayor', hor ? 'Horizontal (paralelo al eje X)' : 'Vertical (paralelo al eje Y)', 'a² es el denominador mayor'),
    eValor('a', 'Semieje mayor', 'a', a, 'a = √(a²), con a² el denominador mayor'),
    eValor('b', 'Semieje menor', 'b', b, 'b = √(b²)'),
    eValor('c', 'Semidistancia focal', 'c', c, 'c = √(a² − b²)', calculoC('−', a2, b2, c2, c)),
    ePunto('v1', 'Vértice', 'V₁', ...V1, fV),
    ePunto('v2', 'Vértice', 'V₂', ...V2, fV),
    ePunto('b1', 'Extremo del eje menor', 'B₁', ...B1, fB),
    ePunto('b2', 'Extremo del eje menor', 'B₂', ...B2, fB),
    ePunto('f1', 'Foco', 'F₁', ...F1, fF),
    ePunto('f2', 'Foco', 'F₂', ...F2, fF),
    eValor('ejeMayor', 'Eje mayor', '2a', a.por(2), 'Eje mayor = 2a'),
    eValor('ejeMenor', 'Eje menor', '2b', b.por(2), 'Eje menor = 2b'),
    eValor('distanciaFocal', 'Distancia focal', '2c', c.por(2), 'Distancia focal = 2c'),
    eValor('ladoRecto', 'Lado recto', 'LR', lr, 'LR = \\frac{2b²}{a}', calculoLR(b2, a, lr)),
    eValor('e', 'Excentricidad', 'e', e, 'e = \\frac{c}{a}', calculoE(c, a, e)),
    eRecta('d1', 'Directriz', v, d1, fD, calculoDirectrices(v, centroEje, a2, c, aSobreC, d1, d2)),
    eRecta('d2', 'Directriz', v, d2, fD),
  ];

  const escena = escenaVacia();
  escena.curvas.push(curvaElipse(h.v, k.v, hor ? a.v : b.v, hor ? b.v : a.v));
  const recta = hor ? rectaVertical : rectaHorizontal;
  escena.rectas.push(recta(d1, 'directriz', 'directrices'), recta(d2, 'directriz', 'directrices'));
  escena.rectas.push(hor ? rectaHorizontal(k, 'eje', 'ejeFocal', '') : rectaVertical(h, 'eje', 'ejeFocal', ''));
  const semiLR = b2.entre(a).v;
  for (const F of [F1, F2]) {
    const [x, y] = [F[0].v, F[1].v];
    escena.segmentos.push(
      hor
        ? { a: [x, y - semiLR], b: [x, y + semiLR], tipo: 'lado-recto', grupo: 'ladoRecto' }
        : { a: [x - semiLR, y], b: [x + semiLR, y], tipo: 'lado-recto', grupo: 'ladoRecto' },
    );
  }
  escena.puntos.push(
    punto('C', h, k, 'centro'),
    punto('V₁', ...V1, 'vertice'),
    punto('V₂', ...V2, 'vertice'),
    punto('B₁', ...B1, 'guia'),
    punto('B₂', ...B2, 'guia'),
    punto('F₁', ...F1, 'foco', 'focos'),
    punto('F₂', ...F2, 'foco', 'focos'),
  );
  for (const P of [V1, V2, B1, B2]) escena.encuadre.push([P[0].v, P[1].v]);
  if (aSobreC.v <= 3 * a.v) {
    for (const d of [d1, d2]) escena.encuadre.push(hor ? [d.v, k.v] : [h.v, d.v]);
  }

  return {
    tipo: 'elipse',
    orientacion,
    ordinaria,
    ordinariaTexto: aTexto(ordinaria),
    general: general.texto,
    coef: general.coef,
    formulas: FORMULAS[orientacion],
    elementos,
    valores: { h, k, a, b, c, a2, b2, c2, e, ladoRecto: lr, directrices: [d1, d2] },
    escena,
  };
}
