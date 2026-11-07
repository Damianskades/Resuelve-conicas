// Ecuación general Ax² + Bxy + Cy² + Dx + Ey + F = 0: normalización a enteros simplificados
// con el primer coeficiente positivo, y escritura con la notación de clase. Funciones puras.

import { fr, CERO, mcd, mcm, abs } from './fracciones.js';
import { fmtFr, fmtDecimalCorto, MENOS } from './formato.js';

export const ORDEN_COEF = ['A', 'B', 'C', 'D', 'E', 'F'];
const VARIABLE = { A: 'x²', B: 'xy', C: 'y²', D: 'x', E: 'y', F: '' };

// Coeficientes fracción → enteros divididos entre su MCD, primer coeficiente positivo.
export function normalizarGeneral(coef) {
  const fs = ORDEN_COEF.map((k) => coef[k] ?? CERO);
  let den = 1;
  for (const f of fs) den = mcm(den, f.d);
  let nums = fs.map((f) => {
    const v = f.n * (den / f.d);
    if (!Number.isSafeInteger(v)) throw new RangeError('Coeficientes demasiado grandes');
    return v;
  });
  const g = nums.reduce((acc, n) => mcd(acc, n), 0);
  if (g === 0) return Object.fromEntries(ORDEN_COEF.map((k) => [k, CERO]));
  nums = nums.map((n) => n / g);
  if (nums.find((n) => n !== 0) < 0) nums = nums.map((n) => -n);
  return Object.fromEntries(ORDEN_COEF.map((k, i) => [k, fr(nums[i])]));
}

// { A: 4, C: 9, D: 32, E: −18, F: 37 } → "4x² + 9y² + 32x − 18y + 37 = 0"
export function fmtGeneral(coef) {
  let s = '';
  for (const k of ORDEN_COEF) {
    const f = coef[k];
    if (!f || f.n === 0) continue;
    const v = VARIABLE[k];
    const a = abs(f);
    const t = fmtFr(a);
    const cuerpo = !v ? t : t === '1' ? v : a.d !== 1 ? `(${t})${v}` : t + v;
    s += s ? ` ${f.n < 0 ? MENOS : '+'} ${cuerpo}` : `${f.n < 0 ? MENOS : ''}${cuerpo}`;
  }
  return `${s || '0'} = 0`;
}

// Para coeficientes irracionales: se divide entre el primero y se muestran 2 decimales.
export function fmtGeneralAprox(valores) {
  const primero = ORDEN_COEF.map((k) => valores[k] ?? 0).find((v) => Math.abs(v) > 1e-12) ?? 1;
  let s = '';
  for (const k of ORDEN_COEF) {
    const v = (valores[k] ?? 0) / primero;
    const t = fmtDecimalCorto(Math.abs(v), 2);
    if (t === '0') continue;
    const cuerpo = VARIABLE[k] && t === '1' ? VARIABLE[k] : t + VARIABLE[k];
    s += s ? ` ${v < 0 ? MENOS : '+'} ${cuerpo}` : `${v < 0 ? MENOS : ''}${cuerpo}`;
  }
  return `${s || '0'} = 0 (coeficientes aproximados)`;
}
