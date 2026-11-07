// Resolución paso a paso desde una ecuación (general u ordinaria) de una cónica.
// Clasifica por A y C, completa cuadrados como en clase, detecta casos degenerados y devuelve
// la solución con sus 5 partes: datos, fórmulas, pasos, respuesta final y escena para la gráfica.
// Funciones puras, sin DOM.

import { parsearEcuacion } from '../math/parser.js';
import { normalizarGeneral, fmtGeneral } from '../math/general.js';
import { Num } from '../math/numeros.js';
import { MENOS, aTexto, fmtCorto } from '../math/formato.js';
import {
  mValor, mTermino, mSuma, mCuadrado, mCoefCuadrado, mPorBinomio, mPunto, mParen, mAprox, mBase, mRaiz, igualdades,
} from '../math/expresiones.js';

// Elementos cuyo cálculo ya se mostró en un paso propio.
const YA_CALCULADOS = new Set(['c', 'radio']);
import * as circunferencia from '../conicas/circunferencia.js';
import * as parabola from '../conicas/parabola.js';
import * as elipse from '../conicas/elipse.js';
import * as hiperbola from '../conicas/hiperbola.js';
import { escenaVacia, punto, rectaVertical, rectaHorizontal, rectaPuntoPendiente } from '../conicas/comun.js';

export const NOMBRES = {
  circunferencia: 'Circunferencia',
  parabola: 'Parábola',
  elipse: 'Elipse',
  hiperbola: 'Hipérbola',
};

const COMPLETAR = 'x² + bx = (x + \\frac{b}{2})² − (\\frac{b}{2})²';
const REGLA =
  'Comparamos A (coeficiente de x²) y C (coeficiente de y²): si A = C es una circunferencia; si solo uno de los dos es 0, una parábola; si tienen el mismo signo y son distintos, una elipse; si tienen signos distintos, una hipérbola.';

// ---------- Ayudas de escritura ----------

// (4, 32, 'x') → "(4x² + 32x)" ; (−3, 0, 'y') → "−3y²"
function grupoSinFactor(P, Q, v) {
  if (Q.esCero()) return mTermino(P, `${v}²`, true);
  return `(${mTermino(P, `${v}²`, true)}${mTermino(Q, v)})`;
}

// (4, 8, 'x', 16) → "4(x² + 8x + 16)"
function grupoConFactor(P, q, v, extra) {
  const hayExtra = extra && !extra.esCero();
  if (q.esCero() && !hayExtra) return mTermino(P, `${v}²`, true);
  const dentro = `${v}²${mTermino(q, v)}${hayExtra ? mTermino(extra) : ''}`;
  const a = P.abs();
  const pref = (P.signo() < 0 ? MENOS : '') + (a.igual(1) ? '' : mValor(a));
  return `${pref}(${dentro})`;
}

function juntar(g1, g2) {
  return g2.startsWith(MENOS) ? `${g1} − ${g2.slice(1)}` : `${g1} + ${g2}`;
}

// " + 4·16", " − 3·1", " + 16" (si P = 1)
function sumandoProducto(P, s) {
  if (P.igual(1)) return mTermino(s);
  return ` ${P.signo() < 0 ? MENOS : '+'} ${mValor(P.abs())}·${mParen(s)}`;
}

const normalizarEscritura = (s) =>
  s.toLowerCase().replace(/\s+/g, '').replace(/[-–—]/g, '−').replace(/\^2/g, '²').replace(/\*/g, '');

function unicas(lista) {
  return [...new Set(lista.filter(Boolean))];
}

// ---------- Entrada principal ----------

export function resolverDesdeEcuacion(texto) {
  const entrada = String(texto ?? '').trim();
  const r = parsearEcuacion(entrada);
  if (!r.ok) return { ok: false, error: r.error, posicion: r.posicion, longitud: r.longitud, entrada };

  let coef;
  try {
    coef = normalizarGeneral(r.coef);
  } catch (e) {
    if (!(e instanceof RangeError)) throw e;
    return { ok: false, entrada, error: 'Los coeficientes son demasiado grandes para calcular de forma exacta. Simplifica la ecuación.' };
  }
  const general = fmtGeneral(coef);
  const c = Object.fromEntries(['A', 'C', 'D', 'E', 'F'].map((k) => [k, Num.de(coef[k])]));

  if (c.A.esCero() && c.C.esCero()) {
    const sinVariables = c.D.esCero() && c.E.esCero();
    return {
      ok: false,
      entrada,
      error: sinVariables
        ? 'La ecuación no tiene x ni y, así que no representa ninguna curva. Escribe una ecuación con x² o y², por ejemplo x² + y² = 9.'
        : `La ecuación ${general} es de primer grado: representa una recta, no una cónica. Para que sea una cónica debe tener x² o y² (por ejemplo x² + y² = 9).`,
    };
  }

  const pasos = [];
  if (normalizarEscritura(entrada) !== normalizarEscritura(general)) {
    pasos.push({
      titulo: 'Escribimos la ecuación en forma general',
      texto: 'Pasamos todos los términos al lado izquierdo, reducimos términos semejantes y simplificamos: coeficientes enteros, sin factor común y con el primero positivo.',
      mat: [general],
    });
  }

  const datos = [
    { etiqueta: 'Ecuación ingresada', texto: entrada },
    { etiqueta: 'Forma general', mat: general },
    {
      etiqueta: 'Coeficientes',
      mat: ['A', 'C', 'D', 'E', 'F'].map((k) => `${k} = ${fmtCorto(c[k])}`).join('  ·  '),
    },
  ];

  const tipo = clasificar(c, pasos);
  const ctx = { entrada, general, coef, c, pasos, datos };
  if (tipo === 'circunferencia') return circunferenciaDesdeGeneral(ctx);
  if (tipo === 'parabola') return parabolaDesdeGeneral(ctx);
  if (tipo === 'elipse') return elipseDesdeGeneral(ctx);
  return hiperbolaDesdeGeneral(ctx);
}

function clasificar({ A, C }, pasos) {
  let tipo;
  let motivo;
  const f = fmtCorto;
  if (A.igual(C)) {
    tipo = 'circunferencia';
    motivo = `A = C = ${f(A)}  →  circunferencia`;
  } else if (A.esCero() || C.esCero()) {
    tipo = 'parabola';
    motivo = A.esCero()
      ? `A = 0 y C = ${f(C)} ≠ 0 (solo aparece y²)  →  parábola`
      : `C = 0 y A = ${f(A)} ≠ 0 (solo aparece x²)  →  parábola`;
  } else if (A.signo() === C.signo()) {
    tipo = 'elipse';
    motivo = `A = ${f(A)} y C = ${f(C)}: mismo signo y distintos  →  elipse`;
  } else {
    tipo = 'hiperbola';
    motivo = `A = ${f(A)} y C = ${f(C)}: signos distintos  →  hipérbola`;
  }
  pasos.push({ titulo: 'Identificamos el tipo de cónica', texto: REGLA, mat: [motivo] });
  return tipo;
}

// ---------- Armado del resultado ----------

function armar(ctx, tipo, m, clavesRespuesta) {
  const { pasos } = ctx;
  const calculos = m.elementos.filter((e) => e.calculo && !YA_CALCULADOS.has(e.clave)).map((e) => e.calculo);
  if (calculos.length) {
    pasos.push({ titulo: 'Calculamos los demás elementos', texto: 'Reemplazamos los valores en las fórmulas de la cónica.', mat: calculos });
  }
  pasos.push({ titulo: 'Tabla de elementos', texto: 'Todos los elementos, con su valor exacto y su aproximación.', tabla: m.elementos });
  const porClave = Object.fromEntries(m.elementos.map((e) => [e.clave, e]));
  const lineas = [
    { etiqueta: 'Ecuación ordinaria', mat: m.ordinaria },
    { etiqueta: 'Ecuación general', mat: ctx.general },
    ...clavesRespuesta.map((k) => ({ etiqueta: porClave[k].nombre, mat: porClave[k].valor })),
  ];
  const nombre = NOMBRES[tipo];
  return {
    ok: true,
    tipo,
    nombre,
    degenerada: false,
    orientacion: m.orientacion,
    entrada: ctx.entrada,
    general: ctx.general,
    ordinaria: m.ordinaria,
    ordinariaTexto: aTexto(m.ordinaria),
    datos: ctx.datos,
    formulas: unicas([...m.formulas, COMPLETAR, ...m.elementos.map((e) => e.formula)]).filter((f) => f.includes('=') && !/^[abr] = √\([abr]²\)/.test(f)),
    pasos,
    elementos: m.elementos,
    porClave,
    valores: m.valores,
    respuesta: { titulo: nombre, lineas },
    respuestaTexto: textoRespuesta(nombre, lineas),
    escena: m.escena,
  };
}

function textoRespuesta(titulo, lineas) {
  return [titulo, ...lineas.map((l) => `${l.etiqueta}: ${aTexto(l.mat).replace(/\n/g, '; ')}`)].join('\n');
}

function degenerada(ctx, tipo, mensaje, escena) {
  ctx.pasos.push({ titulo: 'Conclusión: caso degenerado', texto: mensaje });
  const nombre = NOMBRES[tipo];
  const lineas = [{ etiqueta: 'Resultado', mat: mensaje }];
  const titulo = `Caso degenerado (${nombre.toLowerCase()})`;
  return {
    ok: true,
    tipo,
    nombre,
    degenerada: true,
    mensaje,
    entrada: ctx.entrada,
    general: ctx.general,
    ordinaria: null,
    ordinariaTexto: null,
    datos: ctx.datos,
    formulas: [COMPLETAR],
    pasos: ctx.pasos,
    elementos: [],
    porClave: {},
    valores: {},
    respuesta: { titulo, lineas },
    respuestaTexto: textoRespuesta(titulo, lineas),
    escena,
  };
}

function escenaPunto(h, k) {
  const e = escenaVacia();
  e.puntos.push(punto('P', h, k, 'centro'));
  e.encuadre.push([h.v - 3, k.v - 3], [h.v + 3, k.v + 3]);
  return e;
}

// ---------- Circunferencia ----------

function circunferenciaDesdeGeneral(ctx) {
  const { c, pasos } = ctx;
  const { A } = c;
  const D = c.D.entre(A);
  const E = c.E.entre(A);
  const F = c.F.entre(A);
  if (!A.igual(1)) {
    pasos.push({
      titulo: `Dividimos toda la ecuación entre ${fmtCorto(A)}`,
      texto: 'Así x² e y² quedan con coeficiente 1.',
      mat: [`${mSuma([[1, 'x²'], [1, 'y²'], [D, 'x'], [E, 'y'], [F, '']])} = 0`],
    });
  }
  pasos.push({
    titulo: 'Agrupamos términos',
    texto: 'Juntamos los términos con x, los términos con y y pasamos el término independiente al lado derecho.',
    mat: [`${juntar(grupoSinFactor(Num.de(1), D, 'x'), grupoSinFactor(Num.de(1), E, 'y'))} = ${mValor(F.neg())}`],
  });
  const mx = D.entre(2);
  const my = E.entre(2);
  const sx = mx.cuadrado();
  const sy = my.cuadrado();
  const h = mx.neg();
  const k = my.neg();
  const R = F.neg().mas(sx).mas(sy);
  if (!D.esCero() || !E.esCero()) {
    const expl = [];
    if (!D.esCero()) expl.push(`En x: la mitad de ${mValor(D)} es ${mValor(mx)} y su cuadrado es ${mValor(sx)}.`);
    if (!E.esCero()) expl.push(`En y: la mitad de ${mValor(E)} es ${mValor(my)} y su cuadrado es ${mValor(sy)}.`);
    expl.push('Sumamos esos números a ambos lados para no alterar la igualdad.');
    pasos.push({
      titulo: 'Completamos cuadrados',
      texto: expl.join(' '),
      mat: [
        `${juntar(grupoConFactor(Num.de(1), D, 'x', sx), grupoConFactor(Num.de(1), E, 'y', sy))} = ${mValor(F.neg())}${mTermino(sx)}${mTermino(sy)}`,
      ],
    });
    pasos.push({
      titulo: 'Escribimos cada trinomio como un cuadrado',
      texto: 'Cada paréntesis es un trinomio cuadrado perfecto.',
      mat: [`${mCuadrado('x', h)} + ${mCuadrado('y', k)} = ${mValor(R)}`],
    });
  }
  if (R.signo() < 0) {
    return degenerada(
      ctx, 'circunferencia',
      `El lado derecho es ${mValor(R)}, un número negativo. Una suma de cuadrados nunca es negativa, así que la ecuación no tiene puntos reales: es una circunferencia imaginaria y no tiene gráfica.`,
      null,
    );
  }
  if (R.esCero()) {
    return degenerada(
      ctx, 'circunferencia',
      `El lado derecho es 0. La única solución es x = ${mValor(h)} e y = ${mValor(k)}: la ecuación representa solo el punto ${mPunto(h, k)} (circunferencia de radio cero).`,
      escenaPunto(h, k),
    );
  }
  const r = R.raiz();
  pasos.push({
    titulo: 'Identificamos el centro y el radio',
    texto: 'Comparamos con (x − h)² + (y − k)² = r².',
    mat: [`h = ${mValor(h)};  k = ${mValor(k)}  →  C${mPunto(h, k)}`, `r² = ${mValor(R)}  →  r = ${mValor(r)}${mAprox(r)}`],
  });
  pasos.push({
    titulo: 'Verificamos con las fórmulas',
    texto: `Con la ecuación en la forma x² + y² + Dx + Ey + F = 0 (aquí D = ${mValor(D)}, E = ${mValor(E)}, F = ${mValor(F)}): C = (−D/2; −E/2) y r = √(D²/4 + E²/4 − F).`,
    mat: [
      `C = (−\\frac{${mValor(D)}}{2}; −\\frac{${mValor(E)}}{2}) = ${mPunto(h, k)}`,
      igualdades(`r = √(\\frac{${mBase(D)}²}{4} + \\frac{${mBase(E)}²}{4} − ${mParen(F)})`, mRaiz(R), mValor(r)),
    ],
  });
  const m = circunferencia.resolver({ h, k, r });
  return armar(ctx, 'circunferencia', m, ['centro', 'radio', 'diametro']);
}

// ---------- Parábola ----------

function parabolaDesdeGeneral(ctx) {
  const { c, pasos } = ctx;
  const { A, C, D, E, F } = c;
  const vert = !A.esCero();
  const u = vert ? 'x' : 'y';
  const w = vert ? 'y' : 'x';
  const P = vert ? A : C;
  const Q = vert ? D : E;
  const R = vert ? E : D;
  if (R.esCero()) return parabolaDegenerada(ctx, { u, w, P, Q, F, vert });

  const q = Q.entre(P);
  const rr = R.entre(P);
  const f = F.entre(P);
  if (!P.igual(1)) {
    const orden = vert ? [[1, 'x²'], [q, 'x'], [rr, 'y'], [f, '']] : [[1, 'y²'], [rr, 'x'], [q, 'y'], [f, '']];
    pasos.push({
      titulo: `Dividimos toda la ecuación entre ${fmtCorto(P)}`,
      texto: `Así ${u}² queda con coeficiente 1.`,
      mat: [`${mSuma(orden)} = 0`],
    });
  }
  pasos.push({
    titulo: `Dejamos los términos con ${u} a la izquierda`,
    texto: `Pasamos el término con ${w} y el término independiente al lado derecho.`,
    mat: [`${mSuma([[1, `${u}²`], [q, u]])} = ${mSuma([[rr.neg(), w], [f.neg(), '']])}`],
  });
  const mitad = q.entre(2);
  const s = mitad.cuadrado();
  const centroU = mitad.neg();
  const G = f.neg().mas(s);
  if (!q.esCero()) {
    pasos.push({
      titulo: 'Completamos el cuadrado',
      texto: `La mitad de ${mValor(q)} es ${mValor(mitad)} y su cuadrado es ${mValor(s)}. Lo sumamos a ambos lados.`,
      mat: [
        `${mSuma([[1, `${u}²`], [q, u], [s, '']])} = ${mSuma([[rr.neg(), w], [f.neg(), ''], [s, '']])}`,
        `${mCuadrado(u, centroU)} = ${mSuma([[rr.neg(), w], [G, '']])}`,
      ],
    });
  }
  const cuatroP = rr.neg();
  const desplaz = G.entre(rr);
  if (!G.esCero()) {
    pasos.push({
      titulo: 'Factorizamos el lado derecho',
      texto: `Sacamos factor común ${mValor(cuatroP)} para obtener la forma 4p(${w} − ${vert ? 'k' : 'h'}).`,
      mat: [`${mCuadrado(u, centroU)} = ${mPorBinomio(cuatroP, w, desplaz)}`],
    });
  }
  const p = cuatroP.entre(4);
  const [h, k] = vert ? [centroU, desplaz] : [desplaz, centroU];
  const m = parabola.resolver({ h, k, p }, vert ? 'vertical' : 'horizontal');
  const abre = m.elementos.find((e) => e.clave === 'abre').valor;
  pasos.push({
    titulo: 'Identificamos el vértice, 4p y p',
    texto: `Comparamos con ${parabola.FORMULAS[vert ? 'vertical' : 'horizontal'][0]}. Como p ${p.signo() > 0 ? '>' : '<'} 0 y el eje es ${vert ? 'vertical' : 'horizontal'}, la parábola abre hacia ${abre}.`,
    mat: [`V${mPunto(h, k)}`, `4p = ${mValor(cuatroP)}  →  p = \\frac{${mValor(cuatroP)}}{4} = ${mValor(p)}${mAprox(p)}`],
  });
  return armar(ctx, 'parabola', m, ['vertice', 'p', 'foco', 'directriz', 'eje', 'ladoRecto', 'abre']);
}

function parabolaDegenerada(ctx, { u, w, P, Q, F, vert }) {
  const disc = Q.cuadrado().menos(P.por(F).por(4));
  const ecuacion = `${mSuma([[P, `${u}²`], [Q, u], [F, '']])} = 0`;
  const inicio = `Falta el término con ${w}, así que no es una parábola: queda ${ecuacion}, una ecuación solo en ${u}. Su discriminante es Δ = ${mValor(disc)}.`;
  const recta = (val) => (vert ? rectaVertical(val, 'curva', undefined) : rectaHorizontal(val, 'curva', undefined));
  if (disc.signo() < 0) {
    return degenerada(ctx, 'parabola', `${inicio} Como Δ < 0 no hay soluciones reales: la ecuación no tiene puntos y no tiene gráfica.`, null);
  }
  const dosP = P.por(2);
  if (disc.esCero()) {
    const r0 = Q.neg().entre(dosP);
    const e = escenaVacia();
    e.rectas.push(recta(r0));
    e.encuadre.push(vert ? [r0.v - 3, -3] : [-3, r0.v - 3], vert ? [r0.v + 3, 3] : [3, r0.v + 3]);
    return degenerada(ctx, 'parabola', `${inicio} Como Δ = 0 hay una sola solución: la ecuación representa la recta ${u} = ${mValor(r0)}${mAprox(r0)}.`, e);
  }
  const raiz = disc.raiz();
  const r1 = Q.neg().menos(raiz).entre(dosP);
  const r2 = Q.neg().mas(raiz).entre(dosP);
  const [m1, m2] = r1.comparar(r2) < 0 ? [r1, r2] : [r2, r1];
  const e = escenaVacia();
  e.rectas.push(recta(m1), recta(m2));
  const lo = m1.v - 2;
  const hi = m2.v + 2;
  e.encuadre.push(vert ? [lo, -3] : [-3, lo], vert ? [hi, 3] : [3, hi]);
  return degenerada(
    ctx, 'parabola',
    `${inicio} Como Δ > 0 hay dos soluciones: la ecuación representa dos rectas paralelas, ${u} = ${mValor(m1)}${mAprox(m1)} y ${u} = ${mValor(m2)}${mAprox(m2)}.`,
    e,
  );
}

// ---------- Elipse e hipérbola: completar cuadrados en x y en y ----------

function completarDos(ctx) {
  const { A, C, D, E, F } = ctx.c;
  const { pasos } = ctx;
  pasos.push({
    titulo: 'Agrupamos términos',
    texto: 'Juntamos los términos con x, los términos con y y pasamos el término independiente al lado derecho.',
    mat: [`${juntar(grupoSinFactor(A, D, 'x'), grupoSinFactor(C, E, 'y'))} = ${mValor(F.neg())}`],
  });
  const qx = D.entre(A);
  const qy = E.entre(C);
  const factorX = !A.igual(1) && !D.esCero();
  const factorY = !C.igual(1) && !E.esCero();
  if (factorX || factorY) {
    const partes = [];
    if (factorX) partes.push(`${mValor(A)} en los términos con x`);
    if (factorY) partes.push(`${mValor(C)} en los términos con y`);
    pasos.push({
      titulo: 'Sacamos factor común',
      texto: `Factorizamos ${partes.join(' y ')}, para que x² e y² queden con coeficiente 1 dentro del paréntesis.`,
      mat: [`${juntar(grupoConFactor(A, qx, 'x'), grupoConFactor(C, qy, 'y'))} = ${mValor(F.neg())}`],
    });
  }
  const mx = qx.entre(2);
  const my = qy.entre(2);
  const sx = mx.cuadrado();
  const sy = my.cuadrado();
  const h = mx.neg();
  const k = my.neg();
  const M = F.neg().mas(A.por(sx)).mas(C.por(sy));
  if (!D.esCero() || !E.esCero()) {
    const expl = [];
    const explicar = (P, q, m2, s, v) => {
      const lado = P.igual(1)
        ? 'Lo sumamos también al lado derecho.'
        : `Como el paréntesis está multiplicado por ${mValor(P)}, al lado derecho sumamos ${mValor(P)}·${mParen(s)} = ${mValor(P.por(s))}.`;
      expl.push(`En ${v}: la mitad de ${mValor(q)} es ${mValor(m2)} y su cuadrado es ${mValor(s)}. ${lado}`);
    };
    if (!D.esCero()) explicar(A, qx, mx, sx, 'x');
    if (!E.esCero()) explicar(C, qy, my, sy, 'y');
    const derecha = `${mValor(F.neg())}${D.esCero() ? '' : sumandoProducto(A, sx)}${E.esCero() ? '' : sumandoProducto(C, sy)}`;
    pasos.push({
      titulo: 'Completamos cuadrados',
      texto: expl.join(' '),
      mat: [`${juntar(grupoConFactor(A, qx, 'x', sx), grupoConFactor(C, qy, 'y', sy))} = ${derecha}`],
    });
    pasos.push({
      titulo: 'Escribimos cada trinomio como un cuadrado',
      texto: 'Cada paréntesis es un trinomio cuadrado perfecto; el lado derecho se reduce a un solo número.',
      mat: [`${juntar(mCoefCuadrado(A, 'x', h), mCoefCuadrado(C, 'y', k))} = ${mValor(M)}`],
    });
  }
  return { h, k, M };
}

function pasoDividir(ctx, positivo, negativo, signo, M, ordinaria) {
  const op = signo > 0 ? '+' : '−';
  if (M.igual(1)) {
    ctx.pasos.push({
      titulo: 'Escribimos la forma ordinaria',
      texto: 'El lado derecho ya es 1. Escribimos cada coeficiente como divisor: A(x − h)² = (x − h)² / (1/A).',
      mat: [ordinaria],
    });
    return;
  }
  ctx.pasos.push({
    titulo: `Dividimos entre ${fmtCorto(M)} para igualar a 1`,
    texto: `Dividimos ambos lados entre ${mValor(M)} y simplificamos cada fracción.`,
    mat: [`\\frac{${positivo}}{${mValor(M)}} ${op} \\frac{${negativo}}{${mValor(M)}} = \\frac{${mValor(M)}}{${mValor(M)}}`, ordinaria],
  });
}

// ---------- Elipse ----------

function elipseDesdeGeneral(ctx) {
  const { A, C } = ctx.c;
  const { pasos } = ctx;
  const { h, k, M } = completarDos(ctx);
  if (M.signo() < 0) {
    return degenerada(
      ctx, 'elipse',
      `El lado derecho es ${mValor(M)}, negativo, pero el lado izquierdo es una suma de cuadrados con coeficientes positivos y nunca es negativo. La ecuación no tiene puntos reales: es una elipse imaginaria y no tiene gráfica.`,
      null,
    );
  }
  if (M.esCero()) {
    return degenerada(
      ctx, 'elipse',
      `El lado derecho es 0. Una suma de cuadrados con coeficientes positivos solo vale 0 cuando cada cuadrado es 0: x = ${mValor(h)} e y = ${mValor(k)}. La ecuación representa solo el punto ${mPunto(h, k)} (elipse degenerada).`,
      escenaPunto(h, k),
    );
  }
  const dx = M.entre(A);
  const dy = M.entre(C);
  const hor = dx.comparar(dy) > 0;
  const a2 = hor ? dx : dy;
  const b2 = hor ? dy : dx;
  const a = a2.raiz();
  const b = b2.raiz();
  const m = elipse.resolver({ h, k, a, b }, hor ? 'horizontal' : 'vertical');
  pasoDividir(ctx, mCoefCuadrado(A, 'x', h), mCoefCuadrado(C, 'y', k), 1, M, m.ordinaria);
  pasos.push({
    titulo: 'Identificamos a, b, el centro y la orientación',
    texto: `El denominador mayor es a² = ${mValor(a2)} y está debajo del término con ${hor ? 'x' : 'y'}: el eje mayor es ${hor ? 'horizontal (paralelo al eje X)' : 'vertical (paralelo al eje Y)'}. El otro denominador es b².`,
    mat: [
      `a² = ${mValor(a2)}  →  a = ${mValor(a)}${mAprox(a)}`,
      `b² = ${mValor(b2)}  →  b = ${mValor(b)}${mAprox(b)}`,
      `Centro: C${mPunto(h, k)}`,
    ],
  });
  const c2 = a2.menos(b2);
  const c = c2.raiz();
  pasos.push({
    titulo: 'Calculamos c',
    texto: 'En la elipse los focos están a una distancia c del centro, con c² = a² − b².',
    mat: [`c² = ${mValor(a2)} − ${mValor(b2)} = ${mValor(c2)}  →  c = ${mValor(c)}${mAprox(c)}`],
  });
  return armar(ctx, 'elipse', m, ['centro', 'orientacion', 'a', 'b', 'c', 'v1', 'v2', 'f1', 'f2', 'e']);
}

// ---------- Hipérbola ----------

function hiperbolaDesdeGeneral(ctx) {
  const { A, C } = ctx.c;
  const { pasos } = ctx;
  const { h, k, M } = completarDos(ctx);
  if (M.esCero()) {
    const s = A.entre(C.neg()).raiz();
    const r1 = rectaPuntoPendiente(s, h, k);
    const r2 = rectaPuntoPendiente(s.neg(), h, k);
    const e = escenaVacia();
    e.rectas.push(
      { punto: [h.v, k.v], direccion: [1, s.v], tipo: 'curva' },
      { punto: [h.v, k.v], direccion: [1, -s.v], tipo: 'curva' },
    );
    e.puntos.push(punto('P', h, k, 'centro'));
    e.encuadre.push([h.v - 4, k.v - 4], [h.v + 4, k.v + 4]);
    return degenerada(
      ctx, 'hiperbola',
      `El lado derecho es 0, así que ${mCoefCuadrado(A, 'x', h)} = ${mCoefCuadrado(C.neg(), 'y', k)}. Sacando raíz cuadrada a ambos lados, la ecuación se reduce a dos rectas que se cortan en ${mPunto(h, k)}: «${r1}» y «${r2}» (hipérbola degenerada).`,
      e,
    );
  }
  let P = A;
  let Q = C;
  let Mp = M;
  if (M.signo() < 0) {
    P = A.neg();
    Q = C.neg();
    Mp = M.neg();
    const pos = P.signo() > 0 ? 'x' : 'y';
    pasos.push({
      titulo: 'El lado derecho es negativo: multiplicamos por −1',
      texto: `Al multiplicar por −1 cambian todos los signos y el lado derecho queda positivo. Ahora el término positivo es el de ${pos}; por eso el eje transverso (donde están los vértices y los focos) es ${pos === 'x' ? 'horizontal' : 'vertical'}.`,
      mat: [`${juntar(mCoefCuadrado(P, 'x', h), mCoefCuadrado(Q, 'y', k))} = ${mValor(Mp)}`],
    });
  }
  const hor = P.signo() > 0;
  const tPos = hor ? mCoefCuadrado(P, 'x', h) : mCoefCuadrado(Q, 'y', k);
  const tNeg = hor ? mCoefCuadrado(Q.neg(), 'y', k) : mCoefCuadrado(P.neg(), 'x', h);
  if (!hor) {
    pasos.push({ titulo: 'Ordenamos', texto: 'Escribimos primero el término positivo.', mat: [`${tPos} − ${tNeg} = ${mValor(Mp)}`] });
  }
  const a2 = Mp.entre(hor ? P : Q);
  const b2 = Mp.entre(hor ? Q.neg() : P.neg());
  const a = a2.raiz();
  const b = b2.raiz();
  const m = hiperbola.resolver({ h, k, a, b }, hor ? 'horizontal' : 'vertical');
  pasoDividir(ctx, tPos, tNeg, -1, Mp, m.ordinaria);
  pasos.push({
    titulo: 'Identificamos a, b, el centro y la orientación',
    texto: `En la hipérbola, a² es el denominador del término positivo (no tiene que ser el mayor). Aquí el término positivo es el de ${hor ? 'x' : 'y'}: el eje transverso es ${hor ? 'horizontal (paralelo al eje X)' : 'vertical (paralelo al eje Y)'}.`,
    mat: [
      `a² = ${mValor(a2)}  →  a = ${mValor(a)}${mAprox(a)}`,
      `b² = ${mValor(b2)}  →  b = ${mValor(b)}${mAprox(b)}`,
      `Centro: C${mPunto(h, k)}`,
    ],
  });
  const c2 = a2.mas(b2);
  const c = c2.raiz();
  pasos.push({
    titulo: 'Calculamos c',
    texto: 'En la hipérbola los focos están a una distancia c del centro, con c² = a² + b².',
    mat: [`c² = ${mValor(a2)} + ${mValor(b2)} = ${mValor(c2)}  →  c = ${mValor(c)}${mAprox(c)}`],
  });
  const [num, den] = hor ? [b, a] : [a, b];
  const pend = m.valores.m;
  pasos.push({
    titulo: 'Calculamos la pendiente de las asíntotas',
    texto: `Con eje transverso ${hor ? 'horizontal' : 'vertical'}, las asíntotas pasan por el centro con pendiente m = ±${hor ? 'b/a' : 'a/b'}.`,
    mat: [`m = ±\\frac{${mValor(num)}}{${mValor(den)}} = ±${mValor(pend)}${mAprox(pend).replace(/([≈=]) /, '$1 ±')}`],
  });
  return armar(ctx, 'hiperbola', m, ['centro', 'orientacion', 'a', 'b', 'c', 'v1', 'v2', 'f1', 'f2', 'asintota1', 'asintota2', 'e']);
}
