// Fracciones exactas { n, d }: enteros simplificados, d > 0 y el signo en el numerador.
// Funciones puras. Si un cálculo excede los enteros seguros de JavaScript se lanza RangeError,
// y quien llama puede pasar a un valor aproximado.

export const CERO = Object.freeze({ n: 0, d: 1 });
export const UNO = Object.freeze({ n: 1, d: 1 });

function seguro(x) {
  if (!Number.isSafeInteger(x)) throw new RangeError('Número demasiado grande para un cálculo exacto');
  return x;
}
const mul = (a, b) => seguro(a * b);

export function mcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function mcm(a, b) {
  if (a === 0 || b === 0) return 0;
  return mul(Math.abs(a / mcd(a, b)), Math.abs(b));
}

export function fr(n, d = 1) {
  if (!Number.isInteger(n) || !Number.isInteger(d)) {
    throw new TypeError('Una fracción necesita numerador y denominador enteros');
  }
  seguro(n);
  seguro(d);
  if (d === 0) throw new RangeError('División entre cero');
  if (n === 0) return CERO;
  const g = mcd(n, d);
  const s = d < 0 ? -1 : 1;
  return Object.freeze({ n: (s * n) / g, d: (s * d) / g });
}

export function esFraccion(x) {
  return typeof x === 'object' && x !== null && Number.isInteger(x.n) && Number.isInteger(x.d) && x.d > 0;
}

export function suma(a, b) {
  const g = mcd(a.d, b.d);
  return fr(seguro(mul(a.n, b.d / g) + mul(b.n, a.d / g)), mul(a.d / g, b.d));
}

export const neg = (a) => fr(-a.n, a.d);
export const resta = (a, b) => suma(a, neg(b));

export function multiplica(a, b) {
  if (a.n === 0 || b.n === 0) return CERO;
  const g1 = mcd(a.n, b.d);
  const g2 = mcd(b.n, a.d);
  return fr(mul(a.n / g1, b.n / g2), mul(a.d / g2, b.d / g1));
}

export function inversa(a) {
  if (a.n === 0) throw new RangeError('División entre cero');
  return fr(a.d, a.n);
}

export const divide = (a, b) => multiplica(a, inversa(b));

export function potencia(a, k) {
  let r = UNO;
  for (let i = 0; i < k; i++) r = multiplica(r, a);
  return r;
}

export const abs = (a) => (a.n < 0 ? neg(a) : a);
export const signo = (a) => Math.sign(a.n);
export const esCero = (a) => a.n === 0;
export const esEntero = (a) => a.d === 1;
export const igual = (a, b) => a.n === b.n && a.d === b.d;
export const comparar = (a, b) => Math.sign(resta(a, b).n);
export const aNumero = (a) => a.n / a.d;

// "−1,25" → −5/4. Acepta punto o coma decimal. Devuelve null si el texto no es un decimal.
export function desdeDecimal(texto) {
  const t = String(texto).trim().replace(/[−–—]/g, '-');
  const m = /^([+-]?)(\d*)(?:[.,](\d+))?$/.exec(t);
  if (!m || (m[2] === '' && m[3] === undefined)) return null;
  const decimales = m[3] ?? '';
  if (m[2].length + decimales.length > 15) return null;
  const f = fr(Number((m[2] || '0') + decimales), 10 ** decimales.length);
  return m[1] === '-' ? neg(f) : f;
}

// 0.30000000000000004 → 3/10. Solo números con hasta 9 decimales; si no, null.
export function desdeNumero(x) {
  if (!Number.isFinite(x)) return null;
  if (Number.isInteger(x)) return Number.isSafeInteger(x) ? fr(x) : null;
  for (let k = 1; k <= 9; k++) {
    const m = x * 10 ** k;
    const r = Math.round(m);
    if (Math.abs(m - r) < 1e-6) {
      try {
        return fr(r, 10 ** k);
      } catch {
        return null;
      }
    }
  }
  return null;
}
