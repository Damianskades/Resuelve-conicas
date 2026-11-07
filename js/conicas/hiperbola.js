// Hipérbola desde sus parámetros h, k, a, b (> 0) y la orientación del eje transverso:
//   horizontal: (x − h)²/a² − (y − k)²/b² = 1     vertical: (y − k)²/a² − (x − h)²/b² = 1
// Ecuaciones, elementos con su fórmula (incluidas las asíntotas) y escena. Funciones puras.

import { aTexto, fmtCorto } from '../math/formato.js';
import { mCuadrado, mValor, mFraccion } from '../math/expresiones.js';
import {
  leerParametros, coefDesdeOrdinaria, ecuacionGeneral, ePunto, eValor, eRecta, eTexto, conMasMenos,
  escenaVacia, punto, rectaVertical, rectaHorizontal, curvaHiperbola,
  rectaPuntoPendiente, rectaPendienteOrdenada, rectaAprox,
  calculoC, calculoE, calculoLR, calculoDirectrices,
} from './comun.js';

export const FORMULAS = {
  horizontal: ['\\frac{(x − h)²}{a²} − \\frac{(y − k)²}{b²} = 1', 'c² = a² + b²'],
  vertical: ['\\frac{(y − k)²}{a²} − \\frac{(x − h)²}{b²} = 1', 'c² = a² + b²'],
};

export function resolver(params = {}, orientacion = 'horizontal') {
  if (orientacion !== 'horizontal' && orientacion !== 'vertical') {
    return { error: 'El eje transverso de la hipérbola debe ser «horizontal» o «vertical».' };
  }
  const l = leerParametros(params, ['h', 'k', 'a', 'b']);
  if (l.error) return l;
  const { h, k, a, b } = l.valores;
  if (a.signo() <= 0) return { error: `a debe ser mayor que 0 (escribiste a = ${fmtCorto(a)}).`, campo: 'a' };
  if (b.signo() <= 0) return { error: `b debe ser mayor que 0 (escribiste b = ${fmtCorto(b)}).`, campo: 'b' };
  const hor = orientacion === 'horizontal';
  const a2 = a.cuadrado();
  const b2 = b.cuadrado();
  const c2 = a2.mas(b2);
  const c = c2.raiz();
  const xa = mCuadrado('x', h);
  const ya = mCuadrado('y', k);
  const ordinaria = hor
    ? `${mFraccion(xa, mValor(a2))} − ${mFraccion(ya, mValor(b2))} = 1`
    : `${mFraccion(ya, mValor(a2))} − ${mFraccion(xa, mValor(b2))} = 1`;
  const general = ecuacionGeneral(hor ? coefDesdeOrdinaria(h, k, a2, b2, 1, -1) : coefDesdeOrdinaria(h, k, b2, a2, -1, 1));

  const sobreEje = (d) => (hor ? [h.mas(d), k] : [h, k.mas(d)]);
  const sobreConj = (d) => (hor ? [h, k.mas(d)] : [h.mas(d), k]);
  const V1 = sobreEje(a.neg());
  const V2 = sobreEje(a);
  const F1 = sobreEje(c.neg());
  const F2 = sobreEje(c);
  const B1 = sobreConj(b.neg());
  const B2 = sobreConj(b);
  const centroEje = hor ? h : k;
  const aSobreC = a2.entre(c);
  const d1 = centroEje.menos(aSobreC);
  const d2 = centroEje.mas(aSobreC);
  const lr = b2.por(2).entre(a);
  const e = c.entre(a);
  const m = hor ? b.entre(a) : a.entre(b);
  const v = hor ? 'x' : 'y';
  const he = hor ? 'h' : 'k';
  const fV = hor ? 'V = (h ± a; k)' : 'V = (h; k ± a)';
  const fF = hor ? 'F = (h ± c; k)' : 'F = (h; k ± c)';
  const fB = hor ? 'B = (h; k ± b)' : 'B = (h ± b; k)';
  const fM = hor ? 'm = ±\\frac{b}{a}' : 'm = ±\\frac{a}{b}';
  const fD = `${v} = ${he} ± \\frac{a²}{c}`;

  const asintota = (pend) => {
    const b0 = k.menos(pend.por(h));
    const pp = rectaPuntoPendiente(pend, h, k);
    const po = rectaPendienteOrdenada(pend, b0);
    const lineas = [pp];
    if (po !== pp) lineas.push(po);
    if (!pend.esRacional() || !b0.esRacional()) lineas.push(rectaAprox(pend, b0));
    return { pp, valor: lineas.join('\n') };
  };
  const as1 = asintota(m);
  const as2 = asintota(m.neg());

  const elementos = [
    ePunto('centro', 'Centro', 'C', h, k, 'C = (h; k)'),
    eTexto('orientacion', 'Eje transverso', hor ? 'Horizontal (paralelo al eje X)' : 'Vertical (paralelo al eje Y)', 'a² va con el término positivo'),
    eValor('a', 'Semieje transverso', 'a', a, 'a = √(a²), con a² bajo el término positivo'),
    eValor('b', 'Semieje conjugado', 'b', b, 'b = √(b²)'),
    eValor('c', 'Semidistancia focal', 'c', c, 'c = √(a² + b²)', calculoC('+', a2, b2, c2, c)),
    ePunto('v1', 'Vértice', 'V₁', ...V1, fV),
    ePunto('v2', 'Vértice', 'V₂', ...V2, fV),
    ePunto('f1', 'Foco', 'F₁', ...F1, fF),
    ePunto('f2', 'Foco', 'F₂', ...F2, fF),
    ePunto('b1', 'Extremo del eje conjugado', 'B₁', ...B1, fB),
    ePunto('b2', 'Extremo del eje conjugado', 'B₂', ...B2, fB),
    eValor('ejeTransverso', 'Eje transverso', '2a', a.por(2), 'Eje transverso = 2a'),
    eValor('ejeConjugado', 'Eje conjugado', '2b', b.por(2), 'Eje conjugado = 2b'),
    eValor('distanciaFocal', 'Distancia focal', '2c', c.por(2), 'Distancia focal = 2c'),
    eValor('ladoRecto', 'Lado recto', 'LR', lr, 'LR = \\frac{2b²}{a}', calculoLR(b2, a, lr)),
    eValor('e', 'Excentricidad', 'e', e, 'e = \\frac{c}{a}', calculoE(c, a, e)),
    eRecta('d1', 'Directriz', v, d1, fD, calculoDirectrices(v, centroEje, a2, c, aSobreC, d1, d2)),
    eRecta('d2', 'Directriz', v, d2, fD),
    { ...eTexto('pendiente', 'Pendientes de las asíntotas', `m = ${conMasMenos(m)}`, fM), num: m },
    { ...eTexto('asintota1', 'Asíntota 1', as1.valor, 'y − k = ±m(x − h)'), exacto: as1.pp },
    { ...eTexto('asintota2', 'Asíntota 2', as2.valor, 'y − k = ±m(x − h)'), exacto: as2.pp },
  ];

  const escena = escenaVacia();
  escena.curvas.push(curvaHiperbola(h.v, k.v, a.v, b.v, hor));
  escena.rectas.push(
    { punto: [h.v, k.v], direccion: [1, m.v], tipo: 'asintota', grupo: 'asintotas' },
    { punto: [h.v, k.v], direccion: [1, -m.v], tipo: 'asintota', grupo: 'asintotas' },
  );
  const recta = hor ? rectaVertical : rectaHorizontal;
  escena.rectas.push(recta(d1, 'directriz', 'directrices'), recta(d2, 'directriz', 'directrices'));
  escena.rectas.push(hor ? rectaHorizontal(k, 'eje', 'ejeFocal', '') : rectaVertical(h, 'eje', 'ejeFocal', ''));
  // rectángulo auxiliar
  const [rx, ry] = hor ? [a.v, b.v] : [b.v, a.v];
  const esq = [[h.v - rx, k.v - ry], [h.v + rx, k.v - ry], [h.v + rx, k.v + ry], [h.v - rx, k.v + ry]];
  for (let i = 0; i < 4; i++) escena.segmentos.push({ a: esq[i], b: esq[(i + 1) % 4], tipo: 'auxiliar', grupo: 'asintotas' });
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
    punto('F₁', ...F1, 'foco', 'focos'),
    punto('F₂', ...F2, 'foco', 'focos'),
    punto('B₁', ...B1, 'guia', 'asintotas'),
    punto('B₂', ...B2, 'guia', 'asintotas'),
  );
  const ext = 1.6;
  const [tx, ty] = hor ? [c.v * ext, Math.max(ry, c.v * m.v * 0.8)] : [Math.max(rx, (c.v / m.v) * 0.8), c.v * ext];
  escena.encuadre.push([h.v - tx, k.v - ty], [h.v + tx, k.v + ty]);

  return {
    tipo: 'hiperbola',
    orientacion,
    ordinaria,
    ordinariaTexto: aTexto(ordinaria),
    general: general.texto,
    coef: general.coef,
    formulas: [...FORMULAS[orientacion], fM],
    elementos,
    valores: { h, k, a, b, c, a2, b2, c2, e, m, ladoRecto: lr, directrices: [d1, d2] },
    escena,
  };
}
