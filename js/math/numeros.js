// Números de la app. Num guarda el valor exacto (a + b√r) cuando se puede y siempre su decimal,
// así las respuestas salen exactas y los cálculos que no caben en forma exacta siguen funcionando.
// También: lectura de números escritos por el usuario (3, −2,5, 3/4, √3, 2√5) y formateo rápido.
// Funciones puras, sin DOM.

import { fr, UNO, desdeDecimal, desdeNumero, esFraccion, esCero, divide } from './fracciones.js';
import { ex, exValor, exSuma, exResta, exMul, exDiv, exNeg, exRaiz, exEsCero } from './raices.js';
import { fmtExacto, fmtCorto, fmtDecimalCorto, fmtPunto } from './formato.js';

function intentar(f) {
  try {
    return f();
  } catch (e) {
    if (e instanceof RangeError) return null;
    throw e;
  }
}

export class Num {
  constructor(exacto, aprox) {
    this.ex = exacto ?? null;
    this.v = this.ex ? exValor(this.ex) : aprox;
    Object.freeze(this);
  }

  static de(x) {
    if (x instanceof Num) return x;
    if (typeof x === 'number') {
      const f = desdeNumero(x);
      return f ? new Num(ex(f)) : new Num(null, x);
    }
    if (esFraccion(x)) return new Num(ex(x));
    if (x && typeof x === 'object' && 'r' in x && 'a' in x && 'b' in x) return new Num(x);
    if (typeof x === 'string') {
      const r = leerNumero(x);
      if (r.error) throw new Error(r.error);
      return r.num;
    }
    throw new TypeError('Valor no numérico');
  }

  static fr(n, d = 1) {
    return new Num(ex(fr(n, d)));
  }

  static aprox(v) {
    return new Num(null, v);
  }

  esRacional() {
    return this.ex !== null && this.ex.r === 1;
  }

  esEntero() {
    return this.esRacional() && this.ex.a.d === 1;
  }

  get fr() {
    return this.esRacional() ? this.ex.a : null;
  }

  esCero() {
    return this.ex ? exEsCero(this.ex) : Math.abs(this.v) < 1e-12;
  }

  signo() {
    return this.esCero() ? 0 : Math.sign(this.v);
  }

  _op(otro, fEx, fV) {
    const o = Num.de(otro);
    const e = this.ex && o.ex ? intentar(() => fEx(this.ex, o.ex)) : null;
    return new Num(e, fV(this.v, o.v));
  }

  mas(o) {
    return this._op(o, exSuma, (a, b) => a + b);
  }

  menos(o) {
    return this._op(o, exResta, (a, b) => a - b);
  }

  por(o) {
    return this._op(o, exMul, (a, b) => a * b);
  }

  entre(o) {
    const d = Num.de(o);
    if (d.esCero()) throw new RangeError('División entre cero');
    return this._op(d, exDiv, (a, b) => a / b);
  }

  neg() {
    return new Num(this.ex ? exNeg(this.ex) : null, -this.v);
  }

  abs() {
    return this.signo() < 0 ? this.neg() : this;
  }

  cuadrado() {
    return this.por(this);
  }

  raiz() {
    if (this.signo() < 0) throw new RangeError('Raíz cuadrada de un número negativo');
    const e = this.ex ? intentar(() => exRaiz(this.ex)) : null;
    return new Num(e, Math.sqrt(Math.max(0, this.v)));
  }

  comparar(o) {
    return this.menos(o).signo();
  }

  igual(o) {
    return this.comparar(o) === 0;
  }

  toString() {
    return fmtCorto(this);
  }
}

// ---------- Lectura de números escritos por el usuario ----------

const D = '(\\d+(?:[.,]\\d+)?|[.,]\\d+)';
const RE_RACIONAL = new RegExp(`^([+-]?)${D}(?:\\/${D})?$`);
const RE_RAIZ = new RegExp(`^([+-]?)${D}?\\*?√(?:${D}|\\(${D}(?:\\/${D})?\\))(?:\\/${D})?$`);

function decimal(t) {
  const f = desdeDecimal(t);
  if (!f) throw new RangeError('Demasiados dígitos');
  return f;
}

// Acepta: 3, −2,5, 2.5, 3/4, √3, 2√5, −√3, 3√2/2, √(4/5). Devuelve { num } o { error }.
export function leerNumero(texto) {
  const original = String(texto ?? '').trim();
  if (!original) return { error: 'Escribe un número.' };
  const t = original
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, '')
    .replace(/[·×]/g, '*')
    .replace(/sqrt|raíz|raiz/gi, '√');
  if (/√\(?-/.test(t)) return { error: 'No existe la raíz cuadrada real de un número negativo.' };
  try {
    let m = RE_RACIONAL.exec(t);
    if (m) {
      const d = m[3] ? decimal(m[3]) : UNO;
      if (esCero(d)) return { error: 'El denominador no puede ser 0.' };
      const num = new Num(ex(divide(decimal(m[2]), d)));
      return { num: m[1] === '-' ? num.neg() : num };
    }
    m = RE_RAIZ.exec(t);
    if (m) {
      const coef = m[2] ? decimal(m[2]) : UNO;
      let rad;
      if (m[3]) rad = decimal(m[3]);
      else {
        const dr = m[5] ? decimal(m[5]) : UNO;
        if (esCero(dr)) return { error: 'El denominador no puede ser 0.' };
        rad = divide(decimal(m[4]), dr);
      }
      const den = m[6] ? decimal(m[6]) : UNO;
      if (esCero(den)) return { error: 'El denominador no puede ser 0.' };
      const num = Num.de(coef).por(Num.de(rad).raiz()).entre(Num.de(den));
      return { num: m[1] === '-' ? num.neg() : num };
    }
  } catch (e) {
    if (e instanceof RangeError) return { error: 'El número tiene demasiados dígitos.' };
    throw e;
  }
  return {
    error: `«${original}» no es un número válido. Puedes escribir enteros (3), decimales (−2,5 o 2.5), fracciones (3/4) o raíces (√3, 2√5).`,
  };
}

// Número o NaN (para usos rápidos).
export function parseNum(texto) {
  const r = leerNumero(texto);
  return r.error ? NaN : r.num.v;
}

// Texto que se puede volver a escribir en un campo: "−5/4", "2√5/5"; si es mixto, decimal.
export function aEntrada(num) {
  const n = Num.de(num);
  if (n.ex && (n.ex.r === 1 || n.ex.a.n === 0)) return fmtExacto(n.ex);
  return fmtDecimalCorto(n.v, 4);
}

// Formato rápido: exacto si se puede; los números sueltos se redondean sin errores de coma flotante.
export function fmt(n, dec = 3) {
  if (typeof n === 'number') return fmtDecimalCorto(n, dec);
  return fmtCorto(Num.de(n));
}

export function punto(x, y) {
  return typeof x === 'number' && typeof y === 'number' ? `(${fmt(x)}; ${fmt(y)})` : fmtPunto(Num.de(x), Num.de(y));
}
