// Construcción de expresiones en marcado matemático (con \frac{}{} para fracciones apiladas)
// a partir de valores Num: términos con signo, binomios al cuadrado, coeficiente·binomio, puntos.
// Funciones puras.

import { Num } from './numeros.js';
import { MENOS, mExacto, fmtDecimal, fmtDecimalCorto, esDecimalExacto } from './formato.js';

export function mValor(x) {
  const n = Num.de(x);
  return n.ex ? mExacto(n.ex) : fmtDecimal(n.v);
}

const esMixto = (n) => n.ex !== null && n.ex.r !== 1 && n.ex.a.n !== 0;
const coefAntes = (a) => (esMixto(a) ? `(${mValor(a)})` : mValor(a));

// (−5/2, 'x') → " − \frac{5}{2}x" ; con primero = true → "−\frac{5}{2}x"
export function mTermino(coef, variable = '', primero = false) {
  const c = Num.de(coef);
  const s = c.signo();
  if (s === 0) return '';
  const a = c.abs();
  const cuerpo = !variable ? mValor(a) : a.igual(1) ? variable : coefAntes(a) + variable;
  if (primero) return (s < 0 ? MENOS : '') + cuerpo;
  return ` ${s < 0 ? MENOS : '+'} ${cuerpo}`;
}

// [[coef, 'x²'], [coef, 'x'], [coef, '']] → "x² + 8x − 3"
export function mSuma(pares) {
  let out = '';
  for (const [c, v] of pares) out += mTermino(c, v, out === '');
  return out || '0';
}

// ('x', −4) → "(x + 4)" ; ('x', 0) → "x"
export function mBinomio(variable, h) {
  const n = Num.de(h);
  if (n.esCero()) return variable;
  return `(${variable} ${n.signo() > 0 ? MENOS : '+'} ${mValor(n.abs())})`;
}

export function mCuadrado(variable, h) {
  const n = Num.de(h);
  return n.esCero() ? `${variable}²` : `${mBinomio(variable, n)}²`;
}

const prefijo = (coef) => {
  const c = Num.de(coef);
  const a = c.abs();
  return (c.signo() < 0 ? MENOS : '') + (a.igual(1) ? '' : coefAntes(a));
};

// (−16, 'y', 2) → "−16(y − 2)" ; (−1, 'y', 16) → "−(y − 16)"
export const mPorBinomio = (coef, variable, h) => prefijo(coef) + mBinomio(variable, h);

// (4, 'x', −4) → "4(x + 4)²" ; (−3, 'y', 0) → "−3y²"
export const mCoefCuadrado = (coef, variable, h) => prefijo(coef) + mCuadrado(variable, h);

export const mPunto = (x, y) => `(${mValor(x)}; ${mValor(y)})`;

export const mFraccion = (num, den) => (den === '1' ? num : `\\frac{${num}}{${den}}`);

export const mParen = (x) => (Num.de(x).signo() < 0 ? `(${mValor(x)})` : mValor(x));

// Base de una potencia: (−18), (5/2), 6
export function mBase(x) {
  const n = Num.de(x);
  return n.signo() < 0 || !n.esEntero() ? `(${mValor(n)})` : mValor(n);
}

// √5, √(1/16)
export function mRaiz(x) {
  const n = Num.de(x);
  return n.esEntero() && n.signo() >= 0 ? `√${mValor(n)}` : `√(${mValor(n)})`;
}

// "a = b" sin repetir: igualdades('e', ['\frac{√5}{3}', '\frac{√5}{3}']) → "e = \frac{√5}{3}"
export function igualdades(...partes) {
  const out = [];
  for (const p of partes) if (p && p !== out[out.length - 1]) out.push(p);
  return out.join(' = ');
}

// Aproximación para poner al lado de un valor exacto: "" si es entero, " = 1,25", " ≈ 2,24"
export function mAprox(x) {
  const n = Num.de(x);
  if (n.esEntero()) return '';
  if (n.esRacional() && esDecimalExacto(n.v)) return ` = ${fmtDecimalCorto(n.v)}`;
  return n.ex ? ` ≈ ${fmtDecimal(n.v)}` : '';
}
