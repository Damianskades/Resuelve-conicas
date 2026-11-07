// Pasos que comparten varios tipos de pregunta: distancia, punto medio, recta por dos puntos,
// distancia punto-recta, eje de dos puntos, sistemas de ecuaciones, cortes recta-circunferencia
// y construcción de cónicas. Cada función agrega sus pasos a la Solucion. Funciones puras.

import { Num } from '../math/numeros.js';
import { MENOS, aTexto, fmtCorto } from '../math/formato.js';
import {
  mValor, mPunto, mParen, mBase, mRaiz, mAprox, mSuma, mTermino, mCuadrado, mPorBinomio, igualdades,
} from '../math/expresiones.js';
import { pt, igualesP, puntoMedio } from '../math/puntos.js';
import * as R from '../math/rectas.js';
import { resolverDesdeEcuacion } from './desde-general.js';
import { fallar } from './solucion.js';
import * as circunferencia from '../conicas/circunferencia.js';
import * as parabola from '../conicas/parabola.js';
import * as elipse from '../conicas/elipse.js';
import * as hiperbola from '../conicas/hiperbola.js';

const MODULOS = { circunferencia, parabola, elipse, hiperbola };

export const mP = (P) => mPunto(P.x, P.y);

// Construye una cónica desde sus parámetros; si los datos no la permiten, error claro.
export function construir(tipo, params, orientacion, campo) {
  const m = MODULOS[tipo].resolver(params, orientacion);
  if (m.error) fallar(m.error, campo);
  return m;
}

// "y − 3" o "y" (sin paréntesis)
export function mResta(v, c) {
  const n = Num.de(c);
  if (n.esCero()) return v;
  return `${v} ${n.signo() > 0 ? MENOS : '+'} ${mValor(n.abs())}`;
}

// " + 4·(−1)" con signo del coeficiente
function prod(coef, valor, primero = false) {
  const c = Num.de(coef);
  if (c.esCero()) return '';
  const cuerpo = `${c.abs().igual(1) ? '' : `${mValor(c.abs())}·`}${mParen(valor)}`;
  if (primero) return (c.signo() < 0 ? MENOS : '') + cuerpo;
  return ` ${c.signo() < 0 ? MENOS : '+'} ${cuerpo}`;
}

// ---------- Distancias y puntos ----------

export function pasoDistancia(sol, P, Q, { simbolo = 'd', titulo, texto } = {}) {
  const dx = Q.x.menos(P.x);
  const dy = Q.y.menos(P.y);
  const d2 = dx.cuadrado().mas(dy.cuadrado());
  const d = d2.raiz();
  sol.paso(titulo ?? 'Calculamos la distancia entre los dos puntos', texto ?? 'Usamos la fórmula de distancia entre dos puntos.', {
    formula: 'd = √((x₂ − x₁)² + (y₂ − y₁)²)',
    mat: [
      `${igualdades(
        `${simbolo} = √((${mValor(Q.x)} − ${mParen(P.x)})² + (${mValor(Q.y)} − ${mParen(P.y)})²)`,
        `√(${mBase(dx)}² + ${mBase(dy)}²)`,
        mRaiz(d2),
        mValor(d),
      )}${mAprox(d)}`,
    ],
  });
  return d;
}

export function pasoPuntoMedio(sol, A, B, { simbolo = 'M', titulo, texto } = {}) {
  const M = puntoMedio(A, B);
  sol.paso(titulo ?? `Calculamos el punto medio ${simbolo}`, texto ?? 'El punto medio promedia las coordenadas de los extremos.', {
    formula: 'M = (\\frac{x₁ + x₂}{2}; \\frac{y₁ + y₂}{2})',
    mat: [`${simbolo} = (\\frac{${mValor(A.x)} + ${mParen(B.x)}}{2}; \\frac{${mValor(A.y)} + ${mParen(B.y)}}{2}) = ${mP(M)}`],
  });
  return M;
}

export function pasoDistanciaPuntoRecta(sol, P, r, { simbolo = 'd', titulo, texto } = {}) {
  const num = R.evaluar(r, P);
  const den2 = r.a.cuadrado().mas(r.b.cuadrado());
  const d = num.abs().entre(den2.raiz());
  sol.paso(titulo ?? 'Calculamos la distancia del punto a la recta', texto ?? 'Usamos la fórmula de distancia de un punto a una recta Ax + By + C = 0.', {
    formula: 'd = \\frac{|Ax₀ + By₀ + C|}{√(A² + B²)}',
    mat: [
      `${R.fmtRecta(r)}:  A = ${mValor(r.a)};  B = ${mValor(r.b)};  C = ${mValor(r.c)}`,
      `${igualdades(
        `${simbolo} = \\frac{|${prod(r.a, P.x, true)}${prod(r.b, P.y)}${mTermino(r.c)}|}{√(${mBase(r.a)}² + ${mBase(r.b)}²)}`,
        `\\frac{${mValor(num.abs())}}{${mRaiz(den2)}}`,
        mValor(d),
      )}${mAprox(d)}`,
    ],
  });
  return d;
}

// Ecuación de la recta que pasa por A y B, con su pendiente.
export function pasoRectaDosPuntos(sol, A, B, { nombre = 'L', nombres = ['A', 'B'], campo } = {}) {
  if (igualesP(A, B)) fallar(`${nombres[0]} y ${nombres[1]} son el mismo punto: por un solo punto pasan infinitas rectas.`, campo);
  const r = R.rectaPorDosPuntos(A, B);
  if (A.x.igual(B.x)) {
    sol.paso(`Hallamos la recta ${nombre} que pasa por ${nombres[0]} y ${nombres[1]}`, 'Los dos puntos tienen la misma abscisa, así que la recta es vertical.', {
      formula: 'x = x₁',
      mat: [`${nombre}: x = ${mValor(A.x)}  →  ${R.fmtRecta(r)}`],
    });
    return r;
  }
  const m = B.y.menos(A.y).entre(B.x.menos(A.x));
  sol.paso(`Hallamos la recta ${nombre} que pasa por ${nombres[0]} y ${nombres[1]}`, 'Primero la pendiente; luego la ecuación punto-pendiente, que pasamos a la forma general.', {
    formula: ['m = \\frac{y₂ − y₁}{x₂ − x₁}', 'y − y₁ = m(x − x₁)'],
    mat: [
      igualdades(`m = \\frac{${mValor(B.y)} − ${mParen(A.y)}}{${mValor(B.x)} − ${mParen(A.x)}}`, `\\frac{${mValor(B.y.menos(A.y))}}{${mValor(B.x.menos(A.x))}}`, mValor(m)),
      `${mResta('y', A.y)} = ${mPorBinomio(m, 'x', A.x)}`,
      `${nombre}: ${R.fmtRecta(r)}`,
    ],
  });
  return r;
}

// Perpendicular a r por P, explicada con pendientes.
export function pasoPerpendicular(sol, r, P, { nombre = 'N', nombreR = 'L', nombreP = 'P', texto } = {}) {
  const n = R.perpendicularPor(r, P);
  const m = R.pendiente(r);
  let mat;
  if (m === null) mat = [`${nombreR} es vertical, así que ${nombre} es horizontal: y = ${mValor(P.y)}`];
  else if (m.esCero()) mat = [`${nombreR} es horizontal, así que ${nombre} es vertical: x = ${mValor(P.x)}`];
  else {
    const mp = Num.de(-1).entre(m);
    mat = [
      `m_${nombreR} = −\\frac{A}{B} = ${mValor(m)}  →  m_${nombre} = −\\frac{1}{m_${nombreR}} = ${mValor(mp)}`,
      `${mResta('y', P.y)} = ${mPorBinomio(mp, 'x', P.x)}`,
    ];
  }
  mat.push(`${nombre}: ${R.fmtRecta(n)}`);
  sol.paso(`Trazamos la perpendicular ${nombre} a ${nombreR} por ${nombreP}`, texto ?? 'Dos rectas son perpendiculares cuando el producto de sus pendientes es −1.', {
    formula: 'm₁·m₂ = −1',
    mat,
  });
  return n;
}

export function pasoInterseccion(sol, r, s, { nombres = ['L₁', 'L₂'], simbolo = 'P', titulo, texto, campo } = {}) {
  const P = R.interseccion(r, s);
  if (!P) fallar(`Las rectas ${nombres[0]} y ${nombres[1]} son paralelas: no se cortan, así que no hay solución.`, campo);
  sol.paso(titulo ?? `Intersecamos ${nombres[0]} y ${nombres[1]}`, texto ?? 'Resolvemos el sistema formado por las dos ecuaciones.', {
    mat: [`${nombres[0]}: ${R.fmtRecta(r)}`, `${nombres[1]}: ${R.fmtRecta(s)}`, `${simbolo} = ${mP(P)}`],
  });
  return P;
}

// ---------- Ejes ----------

// Dos puntos sobre un eje paralelo a X (horizontal) o a Y (vertical).
export function ejeEntre(P, Q, nombres, campo) {
  if (igualesP(P, Q)) fallar(`${nombres[0]} y ${nombres[1]} no pueden ser el mismo punto.`, campo);
  if (P.y.igual(Q.y)) return 'horizontal';
  if (P.x.igual(Q.x)) return 'vertical';
  fallar(
    `${nombres[0]} y ${nombres[1]} no están en una misma recta horizontal ni vertical. En esta unidad el eje de la cónica es paralelo al eje X o al eje Y.`,
    campo,
  );
}

// Distancia con signo de P a Q a lo largo del eje
export const desplazamiento = (P, Q, eje) => (eje === 'horizontal' ? Q.x.menos(P.x) : Q.y.menos(P.y));

export const textoEje = (eje) => (eje === 'horizontal' ? 'horizontal (paralelo al eje X)' : 'vertical (paralelo al eje Y)');

// Los dos puntos de un par son simétricos respecto al centro (mismo punto medio).
export function mismoCentro(par1, par2, nombres, campo) {
  const M1 = puntoMedio(...par1);
  const M2 = puntoMedio(...par2);
  if (!igualesP(M1, M2)) {
    fallar(`El punto medio de ${nombres[0]} ${mValorP(M1)} no coincide con el de ${nombres[1]} ${mValorP(M2)}: no pueden ser de la misma cónica.`, campo);
  }
  return M1;
}

const mValorP = (P) => `(${fmtCorto(P.x)}; ${fmtCorto(P.y)})`;

// ---------- Sistemas ----------

// Sistema 2×2: [[a, b, r], [a, b, r]] con incógnitas [u, v], por la regla de Cramer.
export function pasoSistema2(sol, filas, [u, v], { titulo, texto, errorParalelas, campo } = {}) {
  const [[a1, b1, r1], [a2, b2, r2]] = filas.map((f) => f.map((n) => Num.de(n)));
  const det = a1.por(b2).menos(a2.por(b1));
  if (det.esCero()) fallar(errorParalelas ?? 'El sistema no tiene solución única.', campo);
  const x = r1.por(b2).menos(r2.por(b1)).entre(det);
  const y = a1.por(r2).menos(a2.por(r1)).entre(det);
  const p = (n) => `(${mValor(n)})`;
  sol.paso(titulo ?? `Resolvemos el sistema para ${u} y ${v}`, texto ?? 'Usamos la regla de Cramer: cada incógnita es un cociente de determinantes.', {
    formula: `${u} = \\frac{r₁b₂ − r₂b₁}{a₁b₂ − a₂b₁}`,
    mat: [
      `Δ = ${p(a1)}${p(b2)} − ${p(a2)}${p(b1)} = ${mValor(det)}`,
      igualdades(`${u} = \\frac{${p(r1)}${p(b2)} − ${p(r2)}${p(b1)}}{${mValor(det)}}`, mValor(x)),
      igualdades(`${v} = \\frac{${p(a1)}${p(r2)} − ${p(a2)}${p(r1)}}{${mValor(det)}}`, mValor(y)),
    ],
  });
  return [x, y];
}

// Sistema 3×3 en el que la tercera incógnita tiene coeficiente 1 en las tres ecuaciones:
// p·U + q·V + W = r. Se elimina W restando la ecuación (1) y se resuelve el 2×2 por Cramer.
export function pasoSistema3(sol, filas, nombres, opciones = {}) {
  const F = filas.map((f) => f.map((n) => Num.de(n)));
  const [U, V, W] = nombres;
  const ec = ([p, q, r]) => `${mSuma([[p, U], [q, V], [1, W]])} = ${mValor(r)}`;
  sol.paso('Planteamos el sistema de ecuaciones', opciones.textoPlanteo ?? 'Cada punto da una ecuación al reemplazar sus coordenadas.', {
    mat: F.map((f, i) => `(${i + 1})  ${ec(f)}`),
  });
  const d2 = [F[1], F[2]].map((f) => [f[0].menos(F[0][0]), f[1].menos(F[0][1]), f[2].menos(F[0][2])]);
  const ec2 = ([p, q, r]) => `${mSuma([[p, U], [q, V]])} = ${mValor(r)}`;
  sol.paso(`Eliminamos ${W}`, `Restamos la ecuación (1) de las otras dos; así ${W} desaparece y queda un sistema de 2 × 2.`, {
    mat: [`(2) − (1):  ${ec2(d2[0])}`, `(3) − (1):  ${ec2(d2[1])}`],
  });
  const [u, v] = pasoSistema2(sol, d2, [U, V], { errorParalelas: opciones.errorSinSolucion, campo: opciones.campo });
  const w = F[0][2].menos(F[0][0].por(u)).menos(F[0][1].por(v));
  sol.paso(`Hallamos ${W}`, `Reemplazamos ${U} y ${V} en la ecuación (1).`, {
    mat: [igualdades(`${W} = ${mValor(F[0][2])}${prod(F[0][0].neg(), u)}${prod(F[0][1].neg(), v)}`, mValor(w))],
  });
  return [u, v, w];
}

// ---------- Circunferencia: de la ordinaria a la general ----------

export function pasoExpandirCircunferencia(sol, h, k, r2, m) {
  const D = h.por(-2);
  const E = k.por(-2);
  const F = h.cuadrado().mas(k.cuadrado()).menos(r2);
  const enteros = [D, E, F].every((n) => n.esEntero());
  sol.paso(
    'Pasamos a la forma general',
    enteros
      ? 'Desarrollamos los cuadrados: D = −2h, E = −2k y F = h² + k² − r².'
      : 'Desarrollamos los cuadrados: D = −2h, E = −2k y F = h² + k² − r²; luego multiplicamos por el mcm de los denominadores para tener coeficientes enteros.',
    {
      formula: 'x² + y² + Dx + Ey + F = 0',
      mat: [
        `D = −2·${mParen(h)} = ${mValor(D)};   E = −2·${mParen(k)} = ${mValor(E)}`,
        `F = ${mBase(h)}² + ${mBase(k)}² − ${mParen(r2)} = ${mValor(F)}`,
        ...(enteros ? [] : [`${mSuma([[1, 'x²'], [1, 'y²'], [D, 'x'], [E, 'y'], [F, '']])} = 0`]),
        m.general,
      ],
    },
  );
}

export function pasoOrdinariaCircunferencia(sol, C, r, m, texto) {
  sol.paso('Escribimos la ecuación ordinaria', texto ?? 'Con el centro (h; k) y el radio r reemplazamos en la ecuación ordinaria.', {
    formula: '(x − h)² + (y − k)² = r²',
    mat: [`h = ${mValor(C.x)};   k = ${mValor(C.y)};   r = ${mValor(r)}${mAprox(r)}`, m.ordinaria],
  });
}

// Centro + radio → ordinaria, general, elementos y gráfica
export function terminarCircunferencia(sol, C, r, { campo, texto } = {}) {
  const m = construir('circunferencia', { h: C.x, k: C.y, r }, undefined, campo);
  pasoOrdinariaCircunferencia(sol, C, r, m, texto);
  pasoExpandirCircunferencia(sol, C.x, C.y, r.cuadrado(), m);
  sol.conica(m);
  return m;
}

// ---------- Parábola, elipse e hipérbola: de los parámetros a las ecuaciones ----------

export function terminarParabola(sol, V, p, eje, { campo, texto } = {}) {
  const m = construir('parabola', { h: V.x, k: V.y, p }, eje, campo);
  sol.paso('Escribimos la ecuación ordinaria', texto ?? 'Con el vértice (h; k) y p reemplazamos en la forma ordinaria (eje ' + eje + ').', {
    formula: parabola.FORMULAS[eje][0],
    mat: [`h = ${mValor(V.x)};   k = ${mValor(V.y)};   p = ${mValor(p)}  →  4p = ${mValor(p.por(4))}`, m.ordinaria],
  });
  sol.paso('Pasamos a la forma general', 'Desarrollamos el cuadrado, pasamos todo al lado izquierdo y dejamos coeficientes enteros.', {
    mat: [m.general],
  });
  sol.conica(m);
  return m;
}

function terminarConEjes(tipo, sol, C, a2, b2, eje, { campo, texto } = {}) {
  const a = a2.raiz();
  const b = b2.raiz();
  const m = construir(tipo, { h: C.x, k: C.y, a, b }, eje, campo);
  const mod = tipo === 'elipse' ? elipse : hiperbola;
  sol.paso('Escribimos la ecuación ordinaria', texto ?? `Con el centro, a² y b² reemplazamos en la forma ordinaria (eje ${tipo === 'elipse' ? 'mayor' : 'transverso'} ${eje}).`, {
    formula: mod.FORMULAS[eje][0],
    mat: [`h = ${mValor(C.x)};   k = ${mValor(C.y)};   a² = ${mValor(a2)};   b² = ${mValor(b2)}`, m.ordinaria],
  });
  sol.paso('Pasamos a la forma general', 'Multiplicamos por el mcm de los denominadores, desarrollamos los cuadrados y pasamos todo al lado izquierdo.', {
    mat: [m.general],
  });
  sol.conica(m);
  return m;
}

export const terminarElipse = (sol, C, a2, b2, eje, op) => terminarConEjes('elipse', sol, C, a2, b2, eje, op);
export const terminarHiperbola = (sol, C, a2, b2, eje, op) => terminarConEjes('hiperbola', sol, C, a2, b2, eje, op);

// Comprueba que P esté sobre el eje que pasa por C (misma y si es horizontal, misma x si es vertical).
export function sobreEje(C, P, eje, mensaje, campo) {
  const ok = eje === 'horizontal' ? P.y.igual(C.y) : P.x.igual(C.x);
  if (!ok) fallar(mensaje, campo);
}

// Semiejes desde puntos del eje: |P − C| a lo largo del eje, con su paso.
export function pasoSemieje(sol, C, P, eje, simbolo, { titulo, texto } = {}) {
  const d = desplazamiento(C, P, eje).abs();
  const c = eje === 'horizontal' ? 'x' : 'y';
  sol.paso(titulo ?? `Calculamos ${simbolo}`, texto ?? `${simbolo} es la distancia del centro al punto, medida sobre el eje.`, {
    formula: `${simbolo} = |${c}_P − ${c}_C|`,
    mat: [`${simbolo} = |${mValor(P[c])} − ${mParen(C[c])}| = ${mValor(d)}${mAprox(d)}`],
  });
  return d;
}

// b² = a² − c² (elipse) o b² = c² − a² (hipérbola)
export function pasoB2(sol, tipo, a, c) {
  const b2 = tipo === 'elipse' ? a.cuadrado().menos(c.cuadrado()) : c.cuadrado().menos(a.cuadrado());
  sol.paso('Calculamos b²', tipo === 'elipse' ? 'En la elipse a² = b² + c², así que b² = a² − c².' : 'En la hipérbola c² = a² + b², así que b² = c² − a².', {
    formula: tipo === 'elipse' ? 'b² = a² − c²' : 'b² = c² − a²',
    mat: [
      tipo === 'elipse'
        ? `b² = ${mBase(a)}² − ${mBase(c)}² = ${mValor(a.cuadrado())} − ${mParen(c.cuadrado())} = ${mValor(b2)}`
        : `b² = ${mBase(c)}² − ${mBase(a)}² = ${mValor(c.cuadrado())} − ${mParen(a.cuadrado())} = ${mValor(b2)}`,
    ],
  });
  return b2;
}

// "a = 5; a² = 25"
export const mValorYCuadrado = (s, n) => `${s} = ${mValor(n)}${mAprox(n)};   ${s}² = ${mValor(n.cuadrado())}`;

// ---------- Circunferencias desde una ecuación ----------

export function circunferenciaDesdeEcuacion(sol, texto, campo, nombre = 'la circunferencia') {
  const res = resolverDesdeEcuacion(texto);
  if (!res.ok) fallar(res.error, campo, { posicion: res.posicion, longitud: res.longitud, entrada: texto });
  if (res.tipo !== 'circunferencia') fallar(`La ecuación es de una ${res.nombre.toLowerCase()}, no de una circunferencia.`, campo);
  if (res.degenerada) fallar(`La ecuación no es una circunferencia real: ${aTexto(res.mensaje)}`, campo);
  const { h, k, r, r2 } = res.valores;
  sol.paso(`Hallamos el centro y el radio de ${nombre}`, 'Completamos cuadrados para pasar a la forma ordinaria (el detalle está en «Desde la ecuación»).', {
    formula: '(x − h)² + (y − k)² = r²',
    mat: [res.general, res.ordinaria, `C${mPunto(h, k)};   r = ${mValor(r)}${mAprox(r)}`],
  });
  return { h, k, r, r2, C: pt(h, k), res };
}

// ---------- Cortes de una recta con una circunferencia ----------

// circ: { h, k, r, r2 }. Devuelve { posicion: 'secante' | 'tangente' | 'exterior', puntos, d }.
export function pasoCortesRectaCircunferencia(sol, circ, recta, { nombres = ['P₁', 'P₂'], nombreRecta = 'L' } = {}) {
  const { h, k, r, r2 } = circ;
  // La recta se escribe w = m·u + n (u: variable que queda, w: la que se despeja)
  let u;
  let w;
  let m;
  let n;
  let cu;
  let cw;
  if (!recta.b.esCero()) {
    [u, w] = ['x', 'y'];
    m = recta.a.neg().entre(recta.b);
    n = recta.c.neg().entre(recta.b);
    [cu, cw] = [h, k];
  } else {
    [u, w] = ['y', 'x'];
    m = Num.de(0);
    n = recta.c.neg().entre(recta.a);
    [cu, cw] = [k, h];
  }
  const despeje = `${w} = ${mSuma([[m, u], [n, '']])}`;
  sol.paso(`Despejamos ${w} de la recta`, `Así podemos reemplazarla en la ecuación de la circunferencia.`, {
    mat: [`${nombreRecta}: ${R.fmtRecta(recta)}  →  ${despeje}`],
  });
  const s = n.menos(cw);
  const qa = Num.de(1).mas(m.cuadrado());
  const qb = cu.por(-2).mas(m.por(s).por(2));
  const qc = cu.cuadrado().mas(s.cuadrado()).menos(r2);
  const termU = mCuadrado(u, cu);
  const termW = `(${mSuma([[m, u], [s, '']])})²`;
  const ordinaria = u === 'x' ? `${termU} + ${termW}` : `${termW} + ${termU}`;
  sol.paso('Reemplazamos en la ecuación de la circunferencia', `Queda una ecuación cuadrática en ${u}.`, {
    formula: '(x − h)² + (y − k)² = r²',
    mat: [`${ordinaria} = ${mValor(r2)}`, `${mSuma([[qa, `${u}²`], [qb, u], [qc, '']])} = 0`],
  });
  const disc = qb.cuadrado().menos(qa.por(qc).por(4));
  const posicion = disc.signo() > 0 ? 'secante' : disc.esCero() ? 'tangente' : 'exterior';
  const conclusion = {
    secante: 'Δ > 0: hay dos soluciones, la recta es SECANTE (corta a la circunferencia en dos puntos).',
    tangente: 'Δ = 0: hay una sola solución, la recta es TANGENTE (toca a la circunferencia en un punto).',
    exterior: 'Δ < 0: no hay soluciones reales, la recta es EXTERIOR (no toca a la circunferencia).',
  }[posicion];
  sol.paso('Calculamos el discriminante', `El signo de Δ dice cuántos puntos tienen en común. ${conclusion}`, {
    formula: 'Δ = b² − 4ac',
    mat: [`Δ = ${mBase(qb)}² − 4·${mParen(qa)}·${mParen(qc)} = ${mValor(disc)}`],
  });
  const puntos = [];
  if (disc.signo() >= 0) {
    let us;
    let mat;
    if (qb.esCero()) {
      const cuad = qc.neg().entre(qa);
      const raiz = cuad.raiz();
      us = disc.esCero() ? [Num.de(0)] : [raiz.neg(), raiz];
      mat = [`${u}² = ${mValor(cuad)}  →  ${u} = ${disc.esCero() ? '0' : `±${mRaiz(cuad)}${mRaiz(cuad) === mValor(raiz) ? '' : ` = ±${mValor(raiz)}`}`}`];
    } else {
      const rd = disc.raiz();
      const dos = qa.por(2);
      us = disc.esCero() ? [qb.neg().entre(dos)] : [qb.neg().menos(rd).entre(dos), qb.neg().mas(rd).entre(dos)];
      us.sort((p, q) => p.v - q.v);
      mat = [`${u} = \\frac{−b ± √Δ}{2a} = \\frac{${mValor(qb.neg())} ± ${mRaiz(disc)}}{${mValor(dos)}}`];
      for (const x of us) mat.push(`${u} = ${mValor(x)}${mAprox(x)}`);
    }
    us.forEach((uv, i) => {
      const wv = m.por(uv).mas(n);
      const P = u === 'x' ? pt(uv, wv) : pt(wv, uv);
      puntos.push(P);
      mat.push(`${us.length === 1 ? 'T' : nombres[i]} = ${mP(P)}${aproxPunto(P)}`);
    });
    sol.paso(
      us.length === 1 ? 'Hallamos el punto de tangencia' : 'Hallamos los puntos de corte',
      `Resolvemos la ecuación cuadrática y reemplazamos cada ${u} en ${despeje}.`,
      { formula: `${u} = \\frac{−b ± √(b² − 4ac)}{2a}`, mat },
    );
  }
  // Comprobación con la distancia del centro a la recta
  const C = pt(h, k);
  const d = R.distanciaPuntoRecta(C, recta);
  const signo = d.comparar(r);
  const rel = signo < 0 ? '<' : signo === 0 ? '=' : '>';
  const den2 = recta.a.cuadrado().mas(recta.b.cuadrado());
  sol.paso('Comprobamos con la distancia del centro a la recta', 'Si d < r es secante, si d = r es tangente y si d > r es exterior.', {
    formula: 'd = \\frac{|Ax₀ + By₀ + C|}{√(A² + B²)}',
    mat: [
      `${igualdades(`d = \\frac{|${prod(recta.a, h, true)}${prod(recta.b, k)}${mTermino(recta.c)}|}{${mRaiz(den2)}}`, mValor(d))}${mAprox(d)}`,
      `d ${rel} r = ${mValor(r)}  →  ${posicion}`,
    ],
  });
  return { posicion, puntos, d };
}

function aproxPunto(P) {
  const exacto = [P.x, P.y].every((n) => n.esEntero());
  if (exacto) return '';
  return ` ≈ (${aTexto(mValor(Num.aprox(P.x.v)))}; ${aTexto(mValor(Num.aprox(P.y.v)))})`;
}

export {
  R, Num, pt, igualesP, mValor, mPunto, mParen, mBase, mRaiz, mAprox, mSuma, mTermino, mCuadrado, mPorBinomio, igualdades, fmtCorto,
};
