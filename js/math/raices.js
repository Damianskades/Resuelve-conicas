// Números exactos de la forma a + b·√r (a y b fracciones, r entero libre de cuadrados).
// Cubren todo lo que aparece en la unidad: h ± c, a²/c, c/a, pendientes a/b, etc.
// Funciones puras. Si un resultado no cabe en esta forma, la operación devuelve null
// y quien llama usa el valor decimal.

import { fr, CERO, UNO, suma, resta, multiplica, divide, neg, esCero, aNumero } from './fracciones.js';

const LIMITE_RADICANDO = 1e12;

// n = coef² · rad, con rad libre de cuadrados. simplificarRaiz(20) → { coef: 2, rad: 5 }
export function simplificarRaiz(n) {
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError('Radicando inválido');
  if (n > LIMITE_RADICANDO) throw new RangeError('Radicando demasiado grande');
  if (n === 0) return { coef: 0, rad: 1 };
  let coef = 1;
  let rad = n;
  for (let i = 2; i * i <= rad; i++) {
    const c = i * i;
    while (rad % c === 0) {
      rad /= c;
      coef *= i;
    }
  }
  return { coef, rad };
}

const crear = (a, b, r) => Object.freeze({ a, b, r });

export function ex(a = CERO, b = CERO, r = 1) {
  if (!Number.isSafeInteger(r) || r < 0) throw new RangeError('Radicando inválido');
  if (esCero(b) || r === 0) return crear(a, CERO, 1);
  if (r === 1) return crear(suma(a, b), CERO, 1);
  const { coef, rad } = simplificarRaiz(r);
  const b2 = multiplica(b, fr(coef));
  return rad === 1 ? crear(suma(a, b2), CERO, 1) : crear(a, b2, rad);
}

export const exEsRacional = (x) => x.r === 1;
export const exEsCero = (x) => esCero(x.a) && esCero(x.b);
export const exValor = (x) => aNumero(x.a) + aNumero(x.b) * Math.sqrt(x.r);
export const exNeg = (x) => crear(neg(x.a), neg(x.b), x.r);

export function exSuma(x, y) {
  if (x.r === 1) return ex(suma(x.a, y.a), y.b, y.r);
  if (y.r === 1) return ex(suma(x.a, y.a), x.b, x.r);
  if (x.r === y.r) return ex(suma(x.a, y.a), suma(x.b, y.b), x.r);
  return null;
}

export const exResta = (x, y) => exSuma(x, exNeg(y));

export function exMul(x, y) {
  if (x.r === 1) return ex(multiplica(x.a, y.a), multiplica(x.a, y.b), y.r);
  if (y.r === 1) return ex(multiplica(x.a, y.a), multiplica(y.a, x.b), x.r);
  if (x.r === y.r) {
    return ex(
      suma(multiplica(x.a, y.a), multiplica(multiplica(x.b, y.b), fr(x.r))),
      suma(multiplica(x.a, y.b), multiplica(x.b, y.a)),
      x.r,
    );
  }
  if (esCero(x.a) && esCero(y.a)) {
    const r = x.r * y.r;
    if (!Number.isSafeInteger(r)) throw new RangeError('Radicando demasiado grande');
    return ex(CERO, multiplica(x.b, y.b), r);
  }
  return null;
}

// 1/(a + b√r) = (a − b√r)/(a² − b²r)
export function exInv(x) {
  if (exEsCero(x)) throw new RangeError('División entre cero');
  if (x.r === 1) return crear(divide(UNO, x.a), CERO, 1);
  const den = resta(multiplica(x.a, x.a), multiplica(multiplica(x.b, x.b), fr(x.r)));
  return ex(divide(x.a, den), divide(neg(x.b), den), x.r);
}

export const exDiv = (x, y) => exMul(x, exInv(y));

// √(p/q) = √(p·q)/q, ya simplificada y racionalizada: √(4/5) = 2√5/5
export function exRaiz(x) {
  if (x.r !== 1) return null;
  if (x.a.n < 0) throw new RangeError('Raíz cuadrada de un número negativo');
  const prod = x.a.n * x.a.d;
  if (!Number.isSafeInteger(prod)) throw new RangeError('Radicando demasiado grande');
  const { coef, rad } = simplificarRaiz(prod);
  return ex(CERO, fr(coef, x.a.d), rad);
}

export const exIgual = (x, y) =>
  x.r === y.r && x.a.n === y.a.n && x.a.d === y.a.d && x.b.n === y.b.n && x.b.d === y.b.d;
