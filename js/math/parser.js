// Parser de ecuaciones de segundo grado en x e y (forma general u ordinaria).
// Acepta términos en cualquier orden y en ambos lados, coeficientes implícitos (x², −y),
// "^2" o "²", "−" unicode, decimales con punto o coma, fracciones y paréntesis al cuadrado:
//   "4x^2+9y^2+32x-18y+37=0", "4x² + 9y² = 18y − 32x − 37", "(x+4)^2/9 + (y-1)^2/4 = 1"
// Devuelve { ok: true, coef: { A, B, C, D, E, F } } (fracciones del lado izquierdo − derecho)
// o { ok: false, error, posicion, longitud } con un mensaje que dice dónde está el problema.
// Funciones puras.

import { CERO, UNO, suma, neg, multiplica, inversa, esCero, desdeDecimal } from './fracciones.js';

export class ErrorEcuacion extends Error {
  constructor(mensaje, posicion, longitud = 1) {
    super(mensaje);
    this.posicion = posicion;
    this.longitud = longitud;
  }
}

// ---------- Polinomios en x e y: Map "i,j" (x^i·y^j) → fracción ----------

const clave = (i, j) => `${i},${j}`;
const exps = (k) => k.split(',').map(Number);

function pConst(f) {
  return esCero(f) ? new Map() : new Map([['0,0', f]]);
}

const pVar = (v) => new Map([[v === 'x' ? '1,0' : '0,1', UNO]]);

function pSuma(p, q) {
  const m = new Map(p);
  for (const [k, f] of q) {
    const s = suma(m.get(k) ?? CERO, f);
    if (esCero(s)) m.delete(k);
    else m.set(k, s);
  }
  return m;
}

const pNeg = (p) => new Map([...p].map(([k, f]) => [k, neg(f)]));
const pResta = (p, q) => pSuma(p, pNeg(q));
const pEscalar = (p, c) => (esCero(c) ? new Map() : new Map([...p].map(([k, f]) => [k, multiplica(f, c)])));

function pMul(p, q) {
  let m = new Map();
  for (const [k1, f1] of p) {
    const [i1, j1] = exps(k1);
    for (const [k2, f2] of q) {
      const [i2, j2] = exps(k2);
      m = pSuma(m, new Map([[clave(i1 + i2, j1 + j2), multiplica(f1, f2)]]));
    }
  }
  return m;
}

function pGrado(p) {
  let g = 0;
  for (const k of p.keys()) {
    const [i, j] = exps(k);
    g = Math.max(g, i + j);
  }
  return g;
}

const pEsConstante = (p) => [...p.keys()].every((k) => k === '0,0');
const pConstante = (p) => p.get('0,0') ?? CERO;

// ---------- Tokens ----------

const FUNCIONES = new Set(['sen', 'sin', 'cos', 'tan', 'tg', 'cot', 'ctg', 'sec', 'csc', 'log', 'ln', 'exp', 'abs']);
const SIMBOLOS = {
  '+': '+', '-': '-', '−': '-', '–': '-', '—': '-',
  '*': '*', '·': '*', '×': '*', '⋅': '*', '/': '/', '÷': '/', '^': '^', '=': '=',
  '(': '(', '[': '(', '{': '(', ')': ')', ']': ')', '}': ')',
};
const SUPERINDICES = { '²': 2, '³': 3, '⁴': 4 };

function tokenizar(texto) {
  const tokens = [];
  let i = 0;
  const n = texto.length;
  const esDigito = (c) => c !== undefined && c >= '0' && c <= '9';
  while (i < n) {
    const ch = texto[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (esDigito(ch) || ((ch === '.' || ch === ',') && esDigito(texto[i + 1]))) {
      let j = i;
      while (esDigito(texto[j])) j++;
      if ((texto[j] === '.' || texto[j] === ',') && esDigito(texto[j + 1])) {
        j++;
        while (esDigito(texto[j])) j++;
      }
      const v = desdeDecimal(texto.slice(i, j));
      if (!v) throw new ErrorEcuacion(`El número «${texto.slice(i, j)}» tiene demasiados dígitos.`, i, j - i);
      tokens.push({ t: 'num', v, pos: i, fin: j });
      i = j;
      continue;
    }
    if (/\p{L}/u.test(ch)) {
      let j = i;
      while (j < n && /\p{L}/u.test(texto[j])) j++;
      const palabra = texto.slice(i, j);
      const minus = palabra.toLowerCase();
      if (/^[xy]+$/.test(minus)) {
        for (let q = 0; q < palabra.length; q++) tokens.push({ t: 'var', v: minus[q], pos: i + q, fin: i + q + 1 });
        i = j;
        continue;
      }
      if (minus === 'sqrt' || minus === 'raiz' || minus === 'raíz') {
        throw new ErrorEcuacion(
          'Las raíces no se admiten dentro de la ecuación. Escribe los coeficientes como enteros, decimales o fracciones (por ejemplo 3/4).',
          i, j - i,
        );
      }
      if (FUNCIONES.has(minus)) {
        throw new ErrorEcuacion(
          `«${palabra}» es una función y no corresponde a esta unidad. Aquí solo se resuelven ecuaciones de segundo grado en x e y (circunferencia, parábola, elipse e hipérbola).`,
          i, j - i,
        );
      }
      throw new ErrorEcuacion(
        `«${palabra}» (posición ${i + 1}) no se reconoce. Usa solo las variables x e y, por ejemplo: 4x² + 9y² − 36 = 0.`,
        i, j - i,
      );
    }
    if (ch in SUPERINDICES) {
      tokens.push({ t: '^', pos: i, fin: i + 1 });
      tokens.push({ t: 'num', v: { n: SUPERINDICES[ch], d: 1 }, pos: i, fin: i + 1 });
      i++;
      continue;
    }
    if (ch in SIMBOLOS) {
      tokens.push({ t: SIMBOLOS[ch], pos: i, fin: i + 1 });
      i++;
      continue;
    }
    if (ch === '√') {
      throw new ErrorEcuacion(
        'La raíz «√» no se admite dentro de la ecuación. Escribe los coeficientes como enteros, decimales o fracciones (por ejemplo 3/4).',
        i, 1,
      );
    }
    throw new ErrorEcuacion(`El símbolo «${ch}» (posición ${i + 1}) no es válido en una ecuación.`, i, 1);
  }
  return tokens;
}

// ---------- Análisis sintáctico (descenso recursivo) ----------
// ecuación := expr "=" expr
// expr     := término (("+" | "−") término)*
// término  := unario (("·" | "/") unario | potencia implícita)*
// unario   := ("+" | "−") unario | potencia
// potencia := primario ("^" entero)?
// primario := número | x | y | "(" expr ")"

class Analizador {
  constructor(tokens, texto) {
    this.t = tokens;
    this.i = 0;
    this.texto = texto;
  }

  ver() {
    return this.t[this.i];
  }

  tomar() {
    return this.t[this.i++];
  }

  trozo(tk) {
    return this.texto.slice(tk.pos, tk.fin);
  }

  ecuacion() {
    const izq = this.expresion();
    const tk = this.ver();
    if (!tk || tk.t !== '=') throw this.faltaOperador(tk);
    this.tomar();
    const der = this.expresion();
    const fin = this.ver();
    if (fin) {
      if (fin.t === '=') throw new ErrorEcuacion('Hay más de un signo «=»; una ecuación lleva solo uno.', fin.pos, 1);
      throw this.faltaOperador(fin);
    }
    return pResta(izq, der);
  }

  faltaOperador(tk) {
    if (!tk) return new ErrorEcuacion('La ecuación está incompleta.', this.texto.length, 0);
    if (tk.t === ')') {
      return new ErrorEcuacion(`Sobra el paréntesis «)» de la posición ${tk.pos + 1}: no tiene su «(» de apertura.`, tk.pos, 1);
    }
    const prev = this.t[this.i - 1];
    if (tk.t === 'num' && prev && prev.t === 'var' && prev.fin === tk.pos) {
      const v = this.trozo(prev);
      const e = this.trozo(tk);
      return new ErrorEcuacion(
        `Después de «${v}» hay un «${e}» sin operador (posición ${tk.pos + 1}). Si es un exponente, escribe ${v}^${e} o ${v}².`,
        tk.pos, tk.fin - tk.pos,
      );
    }
    return new ErrorEcuacion(
      `Falta un operador (+, −, · o /) antes de «${this.trozo(tk)}» en la posición ${tk.pos + 1}.`,
      tk.pos, tk.fin - tk.pos,
    );
  }

  faltaFactor(tk) {
    if (!tk) {
      const prev = this.t[this.i - 1];
      return new ErrorEcuacion(
        prev ? `La ecuación está incompleta: falta algo después de «${this.trozo(prev)}».` : 'La ecuación está incompleta.',
        this.texto.length, 0,
      );
    }
    if (tk.t === '=') return new ErrorEcuacion(`Falta un término antes del signo «=» (posición ${tk.pos + 1}).`, tk.pos, 1);
    if (tk.t === ')') return new ErrorEcuacion(`Hay un «)» en la posición ${tk.pos + 1} donde falta un número o una variable.`, tk.pos, 1);
    return new ErrorEcuacion(
      `Se esperaba un número, x, y o «(» en la posición ${tk.pos + 1}, pero hay «${this.trozo(tk)}».`,
      tk.pos, tk.fin - tk.pos,
    );
  }

  expresion() {
    let p = this.termino();
    for (let tk = this.ver(); tk && (tk.t === '+' || tk.t === '-'); tk = this.ver()) {
      this.tomar();
      const q = this.termino();
      p = tk.t === '+' ? pSuma(p, q) : pResta(p, q);
    }
    return p;
  }

  termino() {
    let p = this.unario();
    for (;;) {
      const tk = this.ver();
      if (tk && (tk.t === '*' || tk.t === '/')) {
        this.tomar();
        const q = this.unario();
        if (tk.t === '*') p = this.multiplicar(p, q, tk);
        else {
          if (!pEsConstante(q)) {
            throw new ErrorEcuacion(
              `No se puede dividir entre una expresión con x o y (posición ${tk.pos + 1}). Solo se divide entre números.`,
              tk.pos, 1,
            );
          }
          const c = pConstante(q);
          if (esCero(c)) throw new ErrorEcuacion(`División entre 0 en la posición ${tk.pos + 1}.`, tk.pos, 1);
          p = pEscalar(p, inversa(c));
        }
      } else if (tk && (tk.t === 'var' || tk.t === '(')) {
        p = this.multiplicar(p, this.potencia(), tk);
      } else return p;
    }
  }

  multiplicar(p, q, tk) {
    const r = pMul(p, q);
    if (pGrado(r) > 4) {
      throw new ErrorEcuacion('La expresión tiene grado demasiado alto: en las cónicas el grado máximo es 2.', tk.pos, 1);
    }
    return r;
  }

  unario() {
    const tk = this.ver();
    if (tk && (tk.t === '+' || tk.t === '-')) {
      this.tomar();
      const p = this.unario();
      return tk.t === '-' ? pNeg(p) : p;
    }
    return this.potencia();
  }

  potencia() {
    const base = this.primario();
    const tk = this.ver();
    if (!tk || tk.t !== '^') return base;
    this.tomar();
    let e = this.ver();
    const conParentesis = e && e.t === '(';
    if (conParentesis) {
      this.tomar();
      e = this.ver();
    }
    if (!e || e.t !== 'num' || e.v.d !== 1) {
      throw new ErrorEcuacion(`Después de «^» debe ir un exponente entero, por ejemplo x^2 (posición ${tk.pos + 1}).`, tk.pos, 1);
    }
    this.tomar();
    if (conParentesis) {
      const c = this.ver();
      if (!c || c.t !== ')') throw new ErrorEcuacion('Falta cerrar el paréntesis del exponente.', tk.pos, 1);
      this.tomar();
    }
    const n = e.v.n;
    if (n > 4) {
      throw new ErrorEcuacion(`El exponente ${n} es demasiado grande: en las cónicas el mayor exponente es 2.`, e.pos, e.fin - e.pos);
    }
    let r = pConst(UNO);
    for (let i = 0; i < n; i++) r = this.multiplicar(r, base, tk);
    return r;
  }

  primario() {
    const tk = this.ver();
    if (!tk) throw this.faltaFactor(null);
    if (tk.t === 'num') {
      this.tomar();
      return pConst(tk.v);
    }
    if (tk.t === 'var') {
      this.tomar();
      return pVar(tk.v);
    }
    if (tk.t === '(') {
      this.tomar();
      const p = this.expresion();
      const c = this.ver();
      if (!c || c.t !== ')') {
        if (c && c.t !== '=') throw this.faltaOperador(c);
        throw new ErrorEcuacion(`Falta cerrar el paréntesis «(» de la posición ${tk.pos + 1}.`, tk.pos, 1);
      }
      this.tomar();
      return p;
    }
    throw this.faltaFactor(tk);
  }
}

export function parsearEcuacion(texto) {
  const entrada = String(texto ?? '');
  if (entrada.trim() === '') {
    return { ok: false, error: 'Escribe una ecuación, por ejemplo: x² + y² − 6x + 14y + 42 = 0.', posicion: 0, longitud: 0 };
  }
  try {
    const tokens = tokenizar(entrada);
    const iguales = tokens.filter((t) => t.t === '=');
    if (iguales.length === 0) {
      throw new ErrorEcuacion(
        'Falta el signo «=». Escribe la ecuación completa, por ejemplo: x² + y² − 25 = 0.',
        entrada.length, 0,
      );
    }
    if (iguales.length > 1) throw new ErrorEcuacion('Hay más de un signo «=»; una ecuación lleva solo uno.', iguales[1].pos, 1);
    const p = new Analizador(tokens, entrada).ecuacion();
    if (p.size === 0) {
      throw new ErrorEcuacion('Los dos lados son iguales: la ecuación se reduce a 0 = 0 y no representa ninguna curva.', 0, entrada.length);
    }
    const grado = pGrado(p);
    if (grado > 2) {
      throw new ErrorEcuacion(
        `La ecuación es de grado ${grado}. Las cónicas son de grado 2: solo pueden aparecer x², y², x, y y números.`,
        0, entrada.length,
      );
    }
    const g = (i, j) => p.get(clave(i, j)) ?? CERO;
    const coef = { A: g(2, 0), B: g(1, 1), C: g(0, 2), D: g(1, 0), E: g(0, 1), F: g(0, 0) };
    if (!esCero(coef.B)) {
      throw new ErrorEcuacion(
        'Aparece el término xy (cónica rotada). Esta unidad solo trabaja cónicas con ejes paralelos a los ejes X e Y, sin término xy.',
        0, entrada.length,
      );
    }
    return { ok: true, coef, grado };
  } catch (e) {
    if (e instanceof ErrorEcuacion) return { ok: false, error: e.message, posicion: e.posicion, longitud: e.longitud };
    if (e instanceof RangeError) {
      return { ok: false, error: 'Los números son demasiado grandes para calcular de forma exacta. Simplifica la ecuación.', posicion: 0, longitud: 0 };
    }
    throw e;
  }
}
