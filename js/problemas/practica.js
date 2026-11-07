// Modo práctica: ejercicios aleatorios con números "amigables" (enteros pequeños, raíces y
// fracciones simples), alternativas con distractores que imitan errores típicos y la gráfica
// paso a paso para "Grafica tú". Funciones puras: el azar viene de una semilla.

import { Num } from '../math/numeros.js';
import { fr, CERO } from '../math/fracciones.js';
import { fmtCorto } from '../math/formato.js';
import { pt, fmtP } from '../math/puntos.js';
import { crearRecta, fmtRecta } from '../math/rectas.js';
import { normalizarGeneral, fmtGeneral, ORDEN_COEF } from '../math/general.js';
import { igual as igualFr } from '../math/fracciones.js';
import { resolverPregunta } from './solucionador.js';
import { tipoPorId, TIPOS_PREGUNTA } from './tipos.js';
import * as circunferencia from '../conicas/circunferencia.js';
import * as parabola from '../conicas/parabola.js';
import * as elipse from '../conicas/elipse.js';
import * as hiperbola from '../conicas/hiperbola.js';

// ---------- Azar con semilla ----------

export function crearAzar(semilla = Date.now()) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const entero = (rnd, min, max) => min + Math.floor(rnd() * (max - min + 1));
const uno = (rnd, lista) => lista[Math.floor(rnd() * lista.length)];
const signo = (rnd) => (rnd() < 0.5 ? -1 : 1);
function noCero(rnd, min, max) {
  let v = 0;
  while (v === 0) v = entero(rnd, min, max);
  return v;
}
function mezclar(rnd, lista) {
  const l = [...lista];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

// ---------- Formato de datos ----------

const P = (x, y) => fmtP(pt(Num.de(x), Num.de(y)));
const N = (v) => fmtCorto(Num.de(v));
const L = (a, b, c) => fmtRecta(crearRecta(a, b, c));

// Puntos enteros sobre circunferencias de radio² dado: r² → desplazamientos (dx, dy)
const RADIOS = { 5: [1, 2], 10: [1, 3], 13: [2, 3], 25: [3, 4], 17: [1, 4], 20: [2, 4] };
function desplazamientos(r2) {
  const [p, q] = RADIOS[r2];
  const out = [];
  for (const [a, b] of [[p, q], [q, p]]) for (const s of [1, -1]) for (const t of [1, -1]) out.push([s * a, t * b]);
  if (r2 === 25) out.push([5, 0], [-5, 0], [0, 5], [0, -5]);
  return out.filter((d, i) => out.findIndex((e) => e[0] === d[0] && e[1] === d[1]) === i);
}

// Ternas enteras (a, b, c)
const TERNAS_ELIPSE = [[5, 4, 3], [5, 3, 4], [10, 8, 6], [10, 6, 8], [13, 12, 5], [13, 5, 12]];
const TERNAS_HIPERBOLA = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13]];
const ORIENT = ['horizontal', 'vertical'];

// Desplaza d sobre el eje (horizontal: x; vertical: y)
const sobre = (eje, h, k, d) => (eje === 'horizontal' ? [h + d, k] : [h, k + d]);
const perp = (eje, h, k, d) => (eje === 'horizontal' ? [h, k + d] : [h + d, k]);
const ejeTxt = (eje) => (eje === 'horizontal' ? 'horizontal' : 'vertical');

// ---------- Cónicas aleatorias ----------

const PARES_ELIPSE = [[25, 16], [25, 9], [9, 4], [16, 4], [9, 5], [36, 20], [16, 7], [4, 1], [16, 9], [100, 64]];
const PARES_HIPERBOLA = [[9, 16], [16, 9], [4, 5], [4, 3], [9, 4], [1, 3], [4, 12], [25, 144], [36, 64], [1, 1]];

export function conicaAleatoria(rnd, tipo = uno(rnd, ['circunferencia', 'parabola', 'elipse', 'hiperbola'])) {
  if (tipo === 'circunferencia') {
    return circunferencia.resolver({ h: entero(rnd, -6, 6), k: entero(rnd, -6, 6), r: Num.de(uno(rnd, [4, 9, 16, 25, 5, 10, 13, 20])).raiz() });
  }
  if (tipo === 'parabola') {
    return parabola.resolver({ h: entero(rnd, -5, 5), k: entero(rnd, -5, 5), p: Num.de(uno(rnd, [1, 2, 3, -1, -2, -3, 0.5, -0.5])) }, uno(rnd, ['vertical', 'horizontal']));
  }
  const [A2, B2] = uno(rnd, tipo === 'elipse' ? PARES_ELIPSE : PARES_HIPERBOLA);
  const mod = tipo === 'elipse' ? elipse : hiperbola;
  return mod.resolver({ h: entero(rnd, -4, 4), k: entero(rnd, -4, 4), a: Num.de(A2).raiz(), b: Num.de(B2).raiz() }, uno(rnd, ORIENT));
}

// ---------- Generadores por tipo de pregunta ----------
// Cada uno devuelve { crudos, enunciado } con datos que dan una solución válida.

export const GENERADORES = {
  ecuacion: (rnd) => {
    const m = conicaAleatoria(rnd);
    return { crudos: { ecuacion: m.general }, enunciado: `Identifica la cónica, escribe su forma ordinaria y halla sus elementos: ${m.general}` };
  },
  'circ-centro-radio': (rnd) => {
    const [h, k, r] = [entero(rnd, -6, 6), entero(rnd, -6, 6), uno(rnd, ['2', '3', '4', '5', '6', '√5', '√10', '2√3'])];
    return { crudos: { C: P(h, k), r }, enunciado: `Halla la ecuación ordinaria y general de la circunferencia de centro C${P(h, k)} y radio ${r}.` };
  },
  'circ-centro-punto': (rnd) => {
    const [h, k] = [entero(rnd, -5, 5), entero(rnd, -5, 5)];
    const [dx, dy] = uno(rnd, desplazamientos(uno(rnd, [5, 10, 13, 25])));
    return { crudos: { C: P(h, k), P: P(h + dx, k + dy) }, enunciado: `Halla la ecuación de la circunferencia de centro C${P(h, k)} que pasa por el punto P${P(h + dx, k + dy)}.` };
  },
  'circ-diametro': (rnd) => {
    const [h, k, dx, dy] = [entero(rnd, -4, 4), entero(rnd, -4, 4), noCero(rnd, -4, 4), entero(rnd, -4, 4)];
    return { crudos: { A: P(h - dx, k - dy), B: P(h + dx, k + dy) }, enunciado: `Los extremos de un diámetro de una circunferencia son A${P(h - dx, k - dy)} y B${P(h + dx, k + dy)}. Halla su ecuación.` };
  },
  'circ-tres-puntos': (rnd) => {
    const [h, k] = [entero(rnd, -4, 4), entero(rnd, -4, 4)];
    const [a, b, c] = mezclar(rnd, desplazamientos(uno(rnd, [5, 10, 13, 25]))).slice(0, 3).map(([dx, dy]) => P(h + dx, k + dy));
    return { crudos: { P: a, Q: b, R: c }, enunciado: `Halla la ecuación de la circunferencia que pasa por los puntos P${a}, Q${b} y R${c}.` };
  },
  'circ-centro-tangente': (rnd) => {
    const [h, k] = [entero(rnd, -4, 4), entero(rnd, -4, 4)];
    const [a, b] = uno(rnd, [[3, 4], [4, 3], [5, 12], [1, 0], [0, 1], [4, -3], [3, -4]]);
    const n = Math.hypot(a, b);
    const c = signo(rnd) * entero(rnd, 1, 4) * n - (a * h + b * k);
    return { crudos: { C: P(h, k), L: L(a, b, c) }, enunciado: `Halla la ecuación de la circunferencia de centro C${P(h, k)} que es tangente a la recta ${L(a, b, c)}.` };
  },
  'circ-centro-tangente-ab': (rnd) => {
    const [h, k] = [entero(rnd, -4, 4), entero(rnd, -4, 4)];
    const [a, b] = uno(rnd, [[3, 4], [4, 3], [5, 12], [12, 5], [4, -3]]);
    const n = Math.hypot(a, b);
    const c = signo(rnd) * entero(rnd, 1, 4) * n - (a * h + b * k);
    let base = null;
    for (let x = -30; x <= 30 && !base; x++) if ((-c - a * x) % b === 0) base = [x, (-c - a * x) / b];
    const t1 = entero(rnd, -1, 0);
    const t2 = t1 + entero(rnd, 1, 2);
    const A = [base[0] + t1 * b, base[1] - t1 * a];
    const B = [base[0] + t2 * b, base[1] - t2 * a];
    return {
      crudos: { C: P(h, k), A: P(...A), B: P(...B) },
      enunciado: `Determina la ecuación general de la circunferencia de centro C${P(h, k)} que es tangente a la recta que pasa por A${P(...A)} y B${P(...B)}.`,
    };
  },
  'circ-tangente-centro-en-recta': (rnd) => {
    const [h, k] = [entero(rnd, -4, 4), entero(rnd, -4, 4)];
    const [dx, dy] = uno(rnd, desplazamientos(uno(rnd, [5, 10, 13])));
    const T = [h + dx, k + dy];
    const opciones = [[1, 1], [1, -1], [1, 0], [0, 1], [2, 1], [1, 2]].filter(([p, q]) => q * dy + p * dx !== 0);
    const [p, q] = uno(rnd, opciones.length ? opciones : [[1, 0]]);
    const Lt = L(dx, dy, -(dx * T[0] + dy * T[1]));
    const M = L(p, q, -(p * h + q * k));
    return {
      crudos: { L: Lt, T: P(...T), M },
      enunciado: `Halla la ecuación de la circunferencia tangente a la recta ${Lt} en el punto ${P(...T)} y cuyo centro está sobre la recta ${M}.`,
    };
  },
  'circ-recta-tangente': (rnd) => {
    const [h, k] = [entero(rnd, -4, 4), entero(rnd, -4, 4)];
    const r2 = uno(rnd, [5, 10, 13, 25]);
    const [dx, dy] = uno(rnd, desplazamientos(r2));
    const m = circunferencia.resolver({ h, k, r: Num.de(r2).raiz() });
    return { crudos: { ecuacion: m.general, A: P(h + dx, k + dy) }, enunciado: `Halla la recta tangente a la circunferencia ${m.general} en el punto A${P(h + dx, k + dy)}.` };
  },
  'circ-posicion-recta': (rnd) => {
    const [h, k] = [entero(rnd, -3, 3), entero(rnd, -3, 3)];
    const r = uno(rnd, [2, 3, 4, 5]);
    const m = circunferencia.resolver({ h, k, r });
    const [a, b] = uno(rnd, [[1, -1], [2, -1], [1, 1], [0, 1], [1, 0], [3, 4]]);
    const c = -(a * h + b * k) + entero(rnd, -2 * r, 2 * r);
    return { crudos: { L: L(a, b, c), ecuacion: m.general }, enunciado: `Determina la posición relativa de la recta ${L(a, b, c)} y la circunferencia ${m.general}.` };
  },
  'circ-posicion-circunferencias': (rnd) => {
    const m1 = circunferencia.resolver({ h: 0, k: 0, r: uno(rnd, [2, 3, 4, 5]) });
    const m2 = circunferencia.resolver({ h: entero(rnd, -6, 6), k: entero(rnd, -6, 6), r: uno(rnd, [1, 2, 3, 4]) });
    return { crudos: { ec1: m1.general, ec2: m2.general }, enunciado: `Determina la posición relativa de las circunferencias ${m1.general} y ${m2.general}.` };
  },
  'circ-punto-tangente-en-punto': (rnd) => {
    const [h, k] = [entero(rnd, -3, 3), entero(rnd, -3, 3)];
    const [d1, d2] = mezclar(rnd, desplazamientos(uno(rnd, [5, 10, 13, 25]))).slice(0, 2);
    const T = [h + d1[0], k + d1[1]];
    const Pp = [h + d2[0], k + d2[1]];
    const Lt = L(d1[0], d1[1], -(d1[0] * T[0] + d1[1] * T[1]));
    return {
      crudos: { P: P(...Pp), L: Lt, T: P(...T) },
      enunciado: `Halla la ecuación de la circunferencia que pasa por P${P(...Pp)} y es tangente a la recta ${Lt} en el punto T${P(...T)}.`,
    };
  },
  'par-vertice-foco': (rnd) => {
    const [h, k, p, eje] = [entero(rnd, -5, 5), entero(rnd, -5, 5), noCero(rnd, -4, 4), uno(rnd, ORIENT)];
    const F = sobre(eje === 'vertical' ? 'vertical' : 'horizontal', h, k, p);
    return { crudos: { V: P(h, k), F: P(...F) }, enunciado: `Determina la ecuación general de la parábola con vértice V${P(h, k)} y foco F${P(...F)}.` };
  },
  'par-foco-directriz': (rnd) => {
    const [h, k, p, eje] = [entero(rnd, -5, 5), entero(rnd, -5, 5), noCero(rnd, -3, 3), uno(rnd, ORIENT)];
    const F = sobre(eje, h, k, p);
    const d = eje === 'vertical' ? `y = ${N(k - p)}` : `x = ${N(h - p)}`;
    return { crudos: { F: P(...F), d }, enunciado: `Halla la ecuación de la parábola cuyo foco es F${P(...F)} y cuya directriz es ${d}.` };
  },
  'par-vertice-directriz': (rnd) => {
    const [h, k, p, eje] = [entero(rnd, -5, 5), entero(rnd, -5, 5), noCero(rnd, -4, 4), uno(rnd, ORIENT)];
    const d = eje === 'vertical' ? `y = ${N(k - p)}` : `x = ${N(h - p)}`;
    return { crudos: { V: P(h, k), d }, enunciado: `Halla la ecuación de la parábola de vértice V${P(h, k)} y directriz ${d}.` };
  },
  'par-vertice-punto': (rnd) => {
    const [h, k, eje] = [entero(rnd, -4, 4), entero(rnd, -4, 4), uno(rnd, ORIENT)];
    const t = uno(rnd, [2, -2, 4, -4]);
    const cuatroP = uno(rnd, [1, 2, 4, 8, -1, -2, -4, -8]);
    const avance = (t * t) / cuatroP;
    const Pp = eje === 'vertical' ? [h + t, k + avance] : [h + avance, k + t];
    return {
      crudos: { V: P(h, k), eje, P: P(...Pp) },
      enunciado: `Halla la ecuación de la parábola de vértice V${P(h, k)}, eje ${ejeTxt(eje)} (paralelo al eje ${eje === 'vertical' ? 'Y' : 'X'}), que pasa por P${P(...Pp)}.`,
    };
  },
  'par-tres-puntos': (rnd) => {
    const [a, b, c] = [uno(rnd, [1, -1, 2, -2]), entero(rnd, -4, 4), entero(rnd, -5, 5)];
    const xs = mezclar(rnd, [-3, -2, -1, 0, 1, 2, 3]).slice(0, 3).sort((u, v) => u - v);
    const [p1, p2, p3] = xs.map((x) => P(x, a * x * x + b * x + c));
    return { crudos: { P: p1, Q: p2, R: p3 }, enunciado: `Halla la parábola de eje vertical y = ax² + bx + c que pasa por P${p1}, Q${p2} y R${p3}.` };
  },
  'par-ecuacion': (rnd) => {
    const m = conicaAleatoria(rnd, 'parabola');
    return { crudos: { ecuacion: m.general }, enunciado: `Halla el vértice, el foco, la directriz y el lado recto de la parábola ${m.general}.` };
  },
  'eli-focos-vertices': (rnd) => {
    const [[a, , c], h, k, eje] = [uno(rnd, TERNAS_ELIPSE), entero(rnd, -3, 3), entero(rnd, -3, 3), uno(rnd, ORIENT)];
    const [F1, F2, V1, V2] = [-c, c, -a, a].map((d) => P(...sobre(eje, h, k, d)));
    return { crudos: { F1, F2, V1, V2 }, enunciado: `Obtén la ecuación de la elipse cuyos focos son F₁${F1} y F₂${F2}, y cuyos vértices son V₁${V1} y V₂${V2}.` };
  },
  'eli-centro-vertice-foco': (rnd) => {
    const [[a, , c], h, k, eje] = [uno(rnd, TERNAS_ELIPSE), entero(rnd, -3, 3), entero(rnd, -3, 3), uno(rnd, ORIENT)];
    const V = P(...sobre(eje, h, k, signo(rnd) * a));
    const F = P(...sobre(eje, h, k, signo(rnd) * c));
    return { crudos: { C: P(h, k), V, F }, enunciado: `Halla la ecuación de la elipse de centro C${P(h, k)}, con un vértice en ${V} y un foco en ${F}.` };
  },
  'eli-vertices-excentricidad': (rnd) => {
    const [A2, B2] = uno(rnd, [[25, 16], [25, 9], [9, 4], [9, 5], [16, 7], [36, 20], [100, 64]]);
    const a = Math.sqrt(A2);
    const [h, k, eje] = [entero(rnd, -3, 3), entero(rnd, -3, 3), uno(rnd, ORIENT)];
    const e = N(Num.de(A2 - B2).raiz().entre(a));
    const [V1, V2] = [-a, a].map((d) => P(...sobre(eje, h, k, d)));
    return { crudos: { V1, V2, e }, enunciado: `Halla la ecuación de la elipse con vértices ${V1} y ${V2} y excentricidad ${e}.` };
  },
  'eli-vertices-lado-recto': (rnd) => {
    const [A2, B2] = uno(rnd, [[25, 16], [25, 9], [9, 4], [16, 4], [36, 20], [100, 64]]);
    const a = Math.sqrt(A2);
    const [h, k, eje] = [entero(rnd, -3, 3), entero(rnd, -3, 3), uno(rnd, ORIENT)];
    const LR = N(Num.fr(2 * B2, a));
    const [V1, V2] = [-a, a].map((d) => P(...sobre(eje, h, k, d)));
    return { crudos: { V1, V2, LR }, enunciado: `Halla la ecuación de la elipse con vértices ${V1} y ${V2} cuyo lado recto mide ${LR}.` };
  },
  'eli-vertices-eje-menor': (rnd) => {
    const [[a, b], h, k, eje] = [uno(rnd, TERNAS_ELIPSE), entero(rnd, -3, 3), entero(rnd, -3, 3), uno(rnd, ORIENT)];
    const [V1, V2] = [-a, a].map((d) => P(...sobre(eje, h, k, d)));
    if (rnd() < 0.5) {
      const B = P(...perp(eje, h, k, b));
      return { crudos: { V1, V2, B, L: '' }, enunciado: `Halla la ecuación de la elipse con vértices ${V1} y ${V2}, si un extremo del eje menor es ${B}.` };
    }
    return { crudos: { V1, V2, B: '', L: N(2 * b) }, enunciado: `Halla la ecuación de la elipse con vértices ${V1} y ${V2} y eje menor de longitud ${2 * b}.` };
  },
  'eli-focos-eje': (rnd) => {
    const [[a, b, c], h, k, eje] = [uno(rnd, TERNAS_ELIPSE), entero(rnd, -3, 3), entero(rnd, -3, 3), uno(rnd, ORIENT)];
    const [F1, F2] = [-c, c].map((d) => P(...sobre(eje, h, k, d)));
    const cual = uno(rnd, ['mayor', 'menor']);
    const Lg = cual === 'mayor' ? 2 * a : 2 * b;
    return { crudos: { F1, F2, cual, L: N(Lg) }, enunciado: `Halla la ecuación de la elipse con focos ${F1} y ${F2} y eje ${cual} de longitud ${Lg}.` };
  },
  'hip-vertices-focos': (rnd) => {
    const [[a, , c], h, k, eje] = [uno(rnd, TERNAS_HIPERBOLA), entero(rnd, -3, 3), entero(rnd, -3, 3), uno(rnd, ORIENT)];
    const [V1, V2, F1, F2] = [-a, a, -c, c].map((d) => P(...sobre(eje, h, k, d)));
    return { crudos: { V1, V2, F1, F2 }, enunciado: `Determina la ecuación general de la hipérbola con vértices ${V1} y ${V2}, y focos ${F1} y ${F2}.` };
  },
  'hip-vertices-lado-recto': (rnd) => {
    const [a, b2, h, k, eje] = [uno(rnd, [1, 2, 3, 4]), uno(rnd, [1, 3, 4, 5, 9, 16]), entero(rnd, -3, 3), entero(rnd, -3, 3), uno(rnd, ORIENT)];
    const LR = N(Num.fr(2 * b2, a));
    const [V1, V2] = [-a, a].map((d) => P(...sobre(eje, h, k, d)));
    return { crudos: { V1, V2, LR }, enunciado: `Determina la ecuación de la hipérbola con vértices ${V1} y ${V2} y lado recto ${LR}.` };
  },
  'hip-vertices-asintota': (rnd) => {
    const [a, b, h, k, eje] = [uno(rnd, [1, 2, 3, 4]), uno(rnd, [1, 2, 3, 4, 6]), entero(rnd, -3, 3), entero(rnd, -3, 3), uno(rnd, ORIENT)];
    const [V1, V2] = [-a, a].map((d) => P(...sobre(eje, h, k, d)));
    // Asíntota con pendiente b/a (eje horizontal) o a/b (eje vertical), por el centro
    const [num, den] = eje === 'horizontal' ? [b, a] : [a, b];
    const A = L(num, -den, den * k - num * h);
    return { crudos: { V1, V2, A }, enunciado: `Halla la ecuación de la hipérbola con vértices ${V1} y ${V2}, si una de sus asíntotas es ${A}.` };
  },
  'hip-focos-excentricidad': (rnd) => {
    const [[a, , c], h, k, eje] = [uno(rnd, TERNAS_HIPERBOLA), entero(rnd, -3, 3), entero(rnd, -3, 3), uno(rnd, ORIENT)];
    const [F1, F2] = [-c, c].map((d) => P(...sobre(eje, h, k, d)));
    const e = N(Num.fr(c, a));
    return { crudos: { F1, F2, e }, enunciado: `Halla la ecuación de la hipérbola con focos ${F1} y ${F2} y excentricidad ${e}.` };
  },
  'hip-centro-vertice-foco': (rnd) => {
    const [[a, , c], h, k, eje] = [uno(rnd, TERNAS_HIPERBOLA), entero(rnd, -3, 3), entero(rnd, -3, 3), uno(rnd, ORIENT)];
    const V = P(...sobre(eje, h, k, signo(rnd) * a));
    const F = P(...sobre(eje, h, k, signo(rnd) * c));
    return { crudos: { C: P(h, k), V, F }, enunciado: `Halla la ecuación de la hipérbola de centro C${P(h, k)}, con un vértice en ${V} y un foco en ${F}.` };
  },
  'app-rueda': (rnd) => {
    const r = uno(rnd, [6, 7, 8, 9, 10]);
    const k = r + uno(rnd, [1, 2, 3]);
    const x = entero(rnd, -r + 1, r - 1);
    const y = k + entero(rnd, -r + 1, r - 1);
    return {
      crudos: { C: P(0, k), r: N(r), xs: N(x), ys: N(y) },
      enunciado: `Una rueda de la fortuna tiene su centro a ${k} m del suelo y un radio de ${r} m (centro en (0; ${k})). Halla su ecuación, la altura de una cabina cuando x = ${N(x)} y la posición x cuando la cabina está a ${y} m de altura.`,
    };
  },
  'app-puente': (rnd) => {
    const Lg = uno(rnd, [200, 300, 400, 600, 800, 1000]);
    const H = uno(rnd, [40, 50, 60, 80, 100]);
    const forma = uno(rnd, ['colgante', 'arco']);
    const xs = [Lg / 8, Lg / 4, (3 * Lg) / 8];
    const enunciado = forma === 'colgante'
      ? `El cable de un puente colgante cuelga entre dos torres separadas ${Lg} m que se elevan ${H} m sobre el punto más bajo del cable. Halla la ecuación del cable y las alturas en x = ${xs.join(', ')}.`
      : `Un arco parabólico tiene ${Lg} m de base y ${H} m de altura. Halla su ecuación y las alturas en x = ${xs.join(', ')}.`;
    return { crudos: { forma, L: N(Lg), H: N(H), xs: xs.map(N).join('; ') }, enunciado };
  },
  'app-trayectoria': (rnd) => {
    const [alfa, a, b] = [uno(rnd, [-1, -2]), uno(rnd, [4, 6, 8, 10, 12]), uno(rnd, [0, 1, 2, 5])];
    const [t1, t2] = mezclar(rnd, [1, 2, 3, 4, 5, 6]).slice(0, 2).sort((u, v) => u - v);
    const y = (t) => a * t + alfa * t * t + b;
    return {
      crudos: { alfa: N(alfa), P1: P(t1, y(t1)), P2: P(t2, y(t2)) },
      enunciado: `Un drone sigue la trayectoria y = at ${alfa === -1 ? '−' : '− 2'}t² + b y pasa por ${P(t1, y(t1))} y ${P(t2, y(t2))}. Halla a, b y la altura máxima.`,
    };
  },
  'app-tunel': (rnd) => {
    let [W, H] = [uno(rnd, [10, 12, 16, 20, 30]), uno(rnd, [3, 4, 5, 6, 8])];
    if (H * 2 === W) H += 1;
    const x = W / 4;
    return { crudos: { W: N(W), H: N(H), xs: N(x) }, enunciado: `Un túnel tiene forma de semielipse de ${W} m de ancho y ${H} m de altura. ¿Qué altura tiene a ${x} m del centro?` };
  },
  'app-orbita': (rnd) => {
    const [e, cual, Lg] = [uno(rnd, ['0,1', '0,2', '0,25', '0,5']), uno(rnd, ['mayor', 'menor']), uno(rnd, [100, 200, 1000])];
    return { crudos: { e, cual, L: N(Lg) }, enunciado: `La órbita de un planeta tiene excentricidad ${e} y su eje ${cual} mide ${Lg} millones de km. Halla el perihelio y el afelio.` };
  },
  'app-loran': (rnd) => {
    const c = uno(rnd, [50, 100, 150]);
    const a = uno(rnd, [0.3, 0.4, 0.5, 0.6]) * c;
    const v = 1000;
    const dt = N((2 * a) / v);
    const y = uno(rnd, [10, 20, 30, 40]);
    return {
      crudos: { S1: P(-c, 0), S2: P(c, 0), dt, v: N(v), cual: 'y', valor: N(y) },
      enunciado: `Dos estaciones LORAN están en ${P(-c, 0)} y ${P(c, 0)}. La diferencia de tiempos es ${dt} s y la señal viaja a ${v} km/s. Si el barco está en y = ${y}, halla x.`,
    };
  },
};

// ---------- Ejercicios ----------

const GRUPO = Object.fromEntries(TIPOS_PREGUNTA.map((t) => [t.id, t.conica]));

export function tiposDisponibles(conica = 'todas', { soloAlternativas = false } = {}) {
  return TIPOS_PREGUNTA.filter((t) => GENERADORES[t.id])
    .filter((t) => conica === 'todas' || t.conica === conica)
    .filter((t) => !soloAlternativas || ADMITE_ALTERNATIVAS.has(t.id));
}

// Genera un ejercicio válido (reintenta si los números no dan una solución).
export function generarEjercicio({ conica = 'todas', tipo = 'todos', semilla = Date.now(), alternativas = false } = {}) {
  const rnd = crearAzar(semilla);
  const candidatos = tipo !== 'todos' ? [tipoPorId(tipo)] : tiposDisponibles(conica, { soloAlternativas: alternativas });
  if (!candidatos.length || !candidatos[0]) return { ok: false, error: 'No hay ejercicios con esos filtros.' };
  for (let intento = 0; intento < 30; intento++) {
    const t = uno(rnd, candidatos);
    const { crudos, enunciado } = GENERADORES[t.id](rnd);
    const res = resolverPregunta(t.id, crudos);
    if (!res.ok || res.degenerada) continue;
    const ejercicio = { ok: true, tipo: t.id, grupo: GRUPO[t.id], titulo: t.titulo, crudos, enunciado, res, semilla };
    if (alternativas) {
      const alt = crearAlternativas(res, rnd);
      if (!alt) continue;
      ejercicio.alternativas = alt;
    }
    return ejercicio;
  }
  return { ok: false, error: 'No pude generar un ejercicio con esos filtros. Intenta de nuevo.' };
}

// ---------- Alternativas con errores típicos ----------

// Tipos cuya respuesta es la ecuación de la cónica (se puede preguntar por la ecuación general)
export const ADMITE_ALTERNATIVAS = new Set(
  TIPOS_PREGUNTA.filter((t) => ['circunferencia', 'parabola', 'elipse', 'hiperbola'].includes(t.conica))
    .map((t) => t.id)
    .filter((id) => !['circ-recta-tangente', 'circ-posicion-recta', 'circ-posicion-circunferencias', 'par-ecuacion'].includes(id)),
);

const n = (x) => Num.de(x);

// Coeficientes de la general desde la ordinaria: sx(x − h)²/dx + sy(y − k)²/dy = 1
function coefCentrada(h, k, dx, dy, sx, sy) {
  const A = n(dy).por(sx);
  const C = n(dx).por(sy);
  return { A, C, D: n(h).por(-2).por(A), E: n(k).por(-2).por(C), F: A.por(n(h).cuadrado()).mas(C.por(n(k).cuadrado())).menos(n(dx).por(dy)) };
}

function coefParabola(h, k, p, eje) {
  const cuatroP = n(p).por(4);
  return eje === 'vertical'
    ? { A: n(1), C: n(0), D: n(h).por(-2), E: cuatroP.neg(), F: n(h).cuadrado().mas(cuatroP.por(k)) }
    : { A: n(0), C: n(1), D: cuatroP.neg(), E: n(k).por(-2), F: n(k).cuadrado().mas(cuatroP.por(h)) };
}

function normalizar(c) {
  if (!['A', 'C', 'D', 'E', 'F'].every((k) => c[k].esRacional())) return null;
  try {
    return normalizarGeneral({ A: c.A.fr, B: CERO, C: c.C.fr, D: c.D.fr, E: c.E.fr, F: c.F.fr });
  } catch {
    return null;
  }
}

const igualesCoef = (a, b) => ORDEN_COEF.every((k) => igualFr(a[k], b[k]));

function distractores(res) {
  const v = res.valores;
  const { h, k } = v;
  const out = [];
  const add = (error, c) => out.push({ error, c });
  if (res.tipo === 'circunferencia') {
    const r2 = v.r2;
    add('Signo del centro cambiado: se usó (x + h)² + (y + k)² en lugar de (x − h)² + (y − k)².', coefCentrada(h.neg(), k.neg(), r2, r2, 1, 1));
    if (v.r.esRacional()) add('Se confundió r con r²: se igualó a r en lugar de r².', coefCentrada(h, k, v.r, v.r, 1, 1));
    add('Se sumó r² en lugar de restarlo al pasar a la forma general (F = h² + k² + r²).', { A: n(1), C: n(1), D: h.por(-2), E: k.por(-2), F: h.cuadrado().mas(k.cuadrado()).mas(r2) });
    add('Se olvidó el 2 al desarrollar (x − h)²: D = −h y E = −k.', { A: n(1), C: n(1), D: h.neg(), E: k.neg(), F: h.cuadrado().mas(k.cuadrado()).menos(r2) });
  } else if (res.tipo === 'parabola') {
    const { p } = v;
    const eje = res.orientacion;
    add('Signo del vértice cambiado: se usó (x + h) y (y + k).', coefParabola(h.neg(), k.neg(), p, eje));
    add('Se usó p en lugar de 4p en la ecuación ordinaria.', coefParabola(h, k, p.entre(4), eje));
    add('Se cambió el signo de p (la parábola abriría hacia el otro lado).', coefParabola(h, k, p.neg(), eje));
    add('Se confundió el eje: se escribió la parábola con el otro eje.', coefParabola(h, k, p, eje === 'vertical' ? 'horizontal' : 'vertical'));
  } else {
    const { a2, b2 } = v;
    const hor = res.orientacion === 'horizontal';
    const eli = res.tipo === 'elipse';
    // Ecuación con A2 bajo el eje (mayor o transverso) y B2 bajo el otro; esElipse decide los signos.
    const forma = (A2, B2, esElipse, hh = h, kk = k) => {
      if (hor) return coefCentrada(hh, kk, A2, B2, 1, esElipse ? 1 : -1);
      return esElipse ? coefCentrada(hh, kk, B2, A2, 1, 1) : coefCentrada(hh, kk, B2, A2, -1, 1);
    };
    add('Signo del centro cambiado: se usó (x + h) y (y + k).', forma(a2, b2, eli, h.neg(), k.neg()));
    if (v.a.esRacional() && v.b.esRacional()) add('Se confundió a con a²: en los denominadores se puso a y b en lugar de a² y b².', forma(v.a, v.b, eli));
    if (eli) add('Se usó c² = a² + b² (relación de la hipérbola) en la elipse: salió una hipérbola.', forma(a2, b2, false));
    else add('Se usó c² = a² − b² (relación de la elipse) en la hipérbola: salió una elipse.', forma(a2, b2, true));
    const bien = forma(a2, b2, eli);
    add('Se olvidó multiplicar por el coeficiente al completar cuadrados (término independiente mal).', { ...bien, F: h.cuadrado().mas(k.cuadrado()).menos(a2.por(b2)) });
    add('Se intercambiaron a² y b² (eje equivocado).', forma(b2, a2, eli));
  }
  return out;
}

// 4 alternativas: la correcta y 3 distractores distintos entre sí (ecuación general).
export function crearAlternativas(res, rnd) {
  const pBien = res.general && !res.general.includes('aprox') ? res.general : null;
  if (!pBien || !res.valores?.h) return null;
  const vistos = [];
  const lista = [];
  const agregar = (texto, coef, error) => {
    if (!coef || vistos.some((c) => igualesCoef(c, coef))) return;
    vistos.push(coef);
    lista.push({ texto, error, correcta: !error });
  };
  const coefBien = coefDeTexto(res);
  if (!coefBien) return null;
  agregar(pBien, coefBien, null);
  for (const d of mezclar(rnd, distractores(res))) {
    if (lista.length >= 4) break;
    const c = normalizar(d.c);
    if (c) agregar(fmtGeneral(c), c, d.error);
  }
  // Si faltan, un error de signo en el término independiente o en D
  for (const k of ['F', 'D', 'E']) {
    if (lista.length >= 4) break;
    const c = { ...coefBien, [k]: fr(-coefBien[k].n || 1, coefBien[k].d) };
    agregar(fmtGeneral(c), c, k === 'F' ? 'Error de signo en el término independiente.' : `Error de signo en el coeficiente de ${k === 'D' ? 'x' : 'y'}.`);
  }
  if (lista.length < 4) return null;
  return mezclar(rnd, lista).map((a, i) => ({ ...a, letra: 'abcd'[i] }));
}

// Coeficientes normalizados de la cónica de la respuesta
const coefDeTexto = (res) => res.conicas?.[0]?.coef ?? null;

// ---------- Gráfica paso a paso ("Grafica tú") ----------

const NOMBRE = { centro: 'el centro', vertice: 'el vértice' };

// Devuelve [{ titulo, escena }] acumulando: centro o vértice, puntos guía, focos, rectas y curva.
export function pasosGrafica(m) {
  const e = m.escena;
  const vacia = () => ({ curvas: [], rectas: [], segmentos: [], puntos: [], encuadre: e.encuadre });
  const pasos = [];
  const acumulada = vacia();
  const agregar = (titulo, { puntos = [], rectas = [], segmentos = [], curvas = [] }) => {
    if (!puntos.length && !rectas.length && !segmentos.length && !curvas.length) return;
    acumulada.puntos.push(...puntos);
    acumulada.rectas.push(...rectas);
    acumulada.segmentos.push(...segmentos);
    acumulada.curvas.push(...curvas);
    pasos.push({ titulo, escena: { ...acumulada, puntos: [...acumulada.puntos], rectas: [...acumulada.rectas], segmentos: [...acumulada.segmentos], curvas: [...acumulada.curvas] } });
  };
  const nombres = (ps) => ps.map((p) => `${p.etiqueta?.nombre ?? ''}${p.etiqueta?.coords ?? ''}`).join(', ');
  const centro = e.puntos.filter((p) => p.tipo === 'centro');
  const vertices = e.puntos.filter((p) => p.tipo === 'vertice');
  if (centro.length) agregar(`Ubicamos ${NOMBRE.centro}: ${nombres(centro)}.`, { puntos: centro });
  else agregar(`Ubicamos ${NOMBRE.vertice}: ${nombres(vertices)}.`, { puntos: vertices });
  let guias = e.puntos.filter((p) => p.tipo === 'guia');
  if (m.tipo === 'circunferencia') {
    const { h, k, r } = m.valores;
    guias = [[r, 0], [-r, 0], [0, r], [0, -r]].map(([dx, dy]) => ({
      x: h.v + (dx ? Math.sign(dx) * r.v : 0),
      y: k.v + (dy ? Math.sign(dy) * r.v : 0),
      tipo: 'guia',
    }));
    agregar(`Marcamos cuatro puntos a distancia r = ${fmtCorto(r)} del centro (arriba, abajo, izquierda y derecha).`, { puntos: guias });
  } else if (centro.length) {
    agregar(`Marcamos los vértices y los extremos del otro eje: ${nombres([...vertices, ...guias])}.`, { puntos: [...vertices, ...guias] });
  } else {
    agregar(`Marcamos los extremos del lado recto (puntos guía): ${nombres(guias)}.`, { puntos: guias });
  }
  const focos = e.puntos.filter((p) => p.tipo === 'foco');
  agregar(`Marcamos ${focos.length > 1 ? 'los focos' : 'el foco'}: ${nombres(focos)}.`, { puntos: focos });
  const rectas = e.rectas;
  const segmentos = e.segmentos;
  const que = [...new Set([...rectas, ...segmentos].map((r) => ({ eje: 'eje focal', directriz: 'directriz', asintota: 'asíntotas', auxiliar: 'rectángulo auxiliar', 'lado-recto': 'lado recto' })[r.tipo]))].filter(Boolean);
  agregar(`Trazamos las rectas auxiliares: ${que.join(', ')}.`, { rectas, segmentos });
  agregar(m.tipo === 'hiperbola' ? 'Dibujamos las dos ramas: pasan por los vértices y se acercan a las asíntotas.' : 'Dibujamos la curva pasando por los puntos marcados.', { curvas: e.curvas });
  return pasos;
}

// Cónica aleatoria para "Grafica tú"
export function ejercicioGrafica({ conica = 'todas', semilla = Date.now() } = {}) {
  const rnd = crearAzar(semilla);
  const tipo = conica === 'todas' || !['circunferencia', 'parabola', 'elipse', 'hiperbola'].includes(conica) ? undefined : conica;
  const m = conicaAleatoria(rnd, tipo);
  return { ok: true, conica: m, ecuacion: m.general, pasos: pasosGrafica(m), semilla };
}
