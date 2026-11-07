// Rectas ax + by + c = 0 con coeficientes Num (enteros simplificados cuando son racionales).
// Lectura ("2x − y + 1 = 0", "y = 2x + 1", "x = 3"), recta por dos puntos, perpendicular,
// intersección, distancia de un punto a una recta y formato. Funciones puras.

import { Num } from './numeros.js';
import { CERO } from './fracciones.js';
import { parsearEcuacion } from './parser.js';
import { normalizarGeneral, fmtGeneral, fmtGeneralAprox } from './general.js';
import { fmtCorto } from './formato.js';
import { pt } from './puntos.js';
import { rectaPendienteOrdenada } from '../conicas/comun.js';

export function crearRecta(a, b, c) {
  let [A, B, C] = [a, b, c].map((n) => Num.de(n));
  if (A.esCero() && B.esCero()) throw new RangeError('Una recta necesita x o y');
  if ([A, B, C].every((n) => n.esRacional())) {
    try {
      const k = normalizarGeneral({ A: CERO, B: CERO, C: CERO, D: A.fr, E: B.fr, F: C.fr });
      return Object.freeze({ a: Num.de(k.D), b: Num.de(k.E), c: Num.de(k.F) });
    } catch (e) {
      if (!(e instanceof RangeError)) throw e;
    }
  }
  if (A.signo() < 0 || (A.esCero() && B.signo() < 0)) [A, B, C] = [A.neg(), B.neg(), C.neg()];
  return Object.freeze({ a: A, b: B, c: C });
}

const AYUDA = 'Escribe una recta como 2x − y + 1 = 0, y = 2x + 1 o x = 3.';

export function leerRecta(texto) {
  const r = parsearEcuacion(texto);
  if (!r.ok) return { error: r.error, posicion: r.posicion, longitud: r.longitud };
  const { A, C, D, E, F } = r.coef;
  if (A.n !== 0 || C.n !== 0) return { error: `Esto no es una recta: tiene x² o y². ${AYUDA}` };
  if (D.n === 0 && E.n === 0) return { error: `La ecuación no tiene x ni y, así que no es una recta. ${AYUDA}` };
  return { recta: crearRecta(Num.de(D), Num.de(E), Num.de(F)) };
}

// (y₁ − y₂)x + (x₂ − x₁)y + (x₁y₂ − x₂y₁) = 0
export function rectaPorDosPuntos(P, Q) {
  return crearRecta(P.y.menos(Q.y), Q.x.menos(P.x), P.x.por(Q.y).menos(Q.x.por(P.y)));
}

// y − y₀ = m(x − x₀)  →  mx − y + (y₀ − m·x₀) = 0
export function rectaPuntoPendiente(P, m) {
  return crearRecta(m, -1, P.y.menos(m.por(P.x)));
}

export const rectaVertical = (x) => crearRecta(1, 0, Num.de(x).neg());
export const rectaHorizontal = (y) => crearRecta(0, 1, Num.de(y).neg());

export const esVertical = (r) => r.b.esCero();
export const esHorizontal = (r) => r.a.esCero();

// Pendiente −a/b, o null si la recta es vertical
export const pendiente = (r) => (r.b.esCero() ? null : r.a.neg().entre(r.b));

// Perpendicular a r por P: b(x − x₀) − a(y − y₀) = 0
export function perpendicularPor(r, P) {
  return crearRecta(r.b, r.a.neg(), r.a.por(P.y).menos(r.b.por(P.x)));
}

export function interseccion(r, s) {
  const det = r.a.por(s.b).menos(s.a.por(r.b));
  if (det.esCero()) return null;
  return pt(r.b.por(s.c).menos(s.b.por(r.c)).entre(det), s.a.por(r.c).menos(r.a.por(s.c)).entre(det));
}

export const evaluar = (r, P) => r.a.por(P.x).mas(r.b.por(P.y)).mas(r.c);
export const contiene = (r, P) => evaluar(r, P).esCero();

export function distanciaPuntoRecta(P, r) {
  return evaluar(r, P).abs().entre(r.a.cuadrado().mas(r.b.cuadrado()).raiz());
}

// "5x + 12y + 9 = 0"
export function fmtRecta(r) {
  if ([r.a, r.b, r.c].every((n) => n.esRacional())) {
    return fmtGeneral({ D: r.a.fr, E: r.b.fr, F: r.c.fr });
  }
  return fmtGeneralAprox({ D: r.a.v, E: r.b.v, F: r.c.v });
}

// "y = 2x + 1" o "x = 3"
export function fmtExplicita(r) {
  if (r.b.esCero()) return `x = ${fmtCorto(r.c.neg().entre(r.a))}`;
  return rectaPendienteOrdenada(r.a.neg().entre(r.b), r.c.neg().entre(r.b));
}

// Para el graficador: un punto de la recta y su dirección
export function escenaDeRecta(r) {
  const P = r.b.esCero() ? [r.c.neg().entre(r.a).v, 0] : [0, r.c.neg().entre(r.b).v];
  return { punto: P, direccion: [r.b.v, -r.a.v] };
}
