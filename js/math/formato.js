// Formateo con la notación de clase: signo “−”, coma decimal, puntos (x; y), fracciones y raíces
// exactas con su decimal aproximado al lado (√5 ≈ 2,24). Nunca muestra errores de coma flotante.
//
// Marcado matemático: las fracciones apiladas se escriben \frac{numerador}{denominador}.
// La interfaz las dibuja apiladas; aTexto() las convierte a texto plano: (x + 4)²/9.
//
// Las funciones que reciben un "num" usan sus campos { ex, v } (ver numeros.js).

export const MENOS = '−';

export function fmtEntero(n) {
  return (n < 0 ? MENOS : '') + Math.abs(n);
}

export function fmtFr(f) {
  const s = f.n < 0 ? MENOS : '';
  const n = Math.abs(f.n);
  return f.d === 1 ? `${s}${n}` : `${s}${n}/${f.d}`;
}

function radicalAbs(b, r) {
  const p = Math.abs(b.n);
  const base = `${p === 1 ? '' : p}√${r}`;
  return b.d === 1 ? base : `${base}/${b.d}`;
}

// Exacto a + b√r → "−4 − 9√5/5", "2√5/5", "√7", "−5/4"
export function fmtExacto(x) {
  if (x.r === 1) return fmtFr(x.a);
  const rad = radicalAbs(x.b, x.r);
  if (x.a.n === 0) return (x.b.n < 0 ? MENOS : '') + rad;
  return `${fmtFr(x.a)} ${x.b.n < 0 ? MENOS : '+'} ${rad}`;
}

function redondear(v, dec) {
  const f = 10 ** dec;
  return Math.round(Math.abs(v) * f * (1 + 1e-12)) / f;
}

// Decimal con cifras fijas: 2.2360679 → "2,24"; −0.004 → "0,00" (sin "−0")
export function fmtDecimal(v, dec = 2) {
  if (!Number.isFinite(v)) return v > 0 ? '∞' : v < 0 ? `${MENOS}∞` : 'indefinido';
  const r = redondear(v, dec);
  return (v < 0 && r !== 0 ? MENOS : '') + r.toFixed(dec).replace('.', ',');
}

// Decimal sin ceros sobrantes: 0.30000000000000004 → "0,3"; 1.25 → "1,25"; 3 → "3"
export function fmtDecimalCorto(v, dec = 2) {
  if (!Number.isFinite(v)) return fmtDecimal(v, dec);
  const r = redondear(v, dec);
  let s = r.toFixed(dec);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return (v < 0 && r !== 0 ? MENOS : '') + s.replace('.', ',');
}

export const fmtNumero = (v) => fmtDecimalCorto(v, 10);

export function esDecimalExacto(v, dec = 2) {
  const m = v * 10 ** dec;
  return Math.abs(m - Math.round(m)) < 1e-9 * Math.max(1, Math.abs(m));
}

const esEnteroExacto = (num) => num.ex !== null && num.ex.r === 1 && num.ex.a.d === 1;
const esRacionalExacto = (num) => num.ex !== null && num.ex.r === 1;

// Forma corta: exacta si se conoce ("√5"), si no el decimal ("2,24").
export const fmtCorto = (num) => (num.ex ? fmtExacto(num.ex) : fmtDecimal(num.v));

// Decimal corto para coordenadas aproximadas: enteros sin decimales.
export function fmtAproxCorto(num) {
  if (esEnteroExacto(num)) return fmtExacto(num.ex);
  const r = Math.round(num.v);
  if (Math.abs(num.v - r) < 1e-9) return fmtEntero(r);
  return fmtDecimal(num.v);
}

// "√5 ≈ 2,24", "2/5 = 0,4", "4", "≈ 1,73" (si no hay valor exacto)
export function fmtConAprox(num) {
  if (!num.ex) return `≈ ${fmtDecimal(num.v)}`;
  const s = fmtExacto(num.ex);
  if (esEnteroExacto(num)) return s;
  if (esRacionalExacto(num) && esDecimalExacto(num.v)) return `${s} = ${fmtDecimalCorto(num.v)}`;
  return `${s} ≈ ${fmtDecimal(num.v)}`;
}

export const fmtPunto = (x, y) => `(${fmtCorto(x)}; ${fmtCorto(y)})`;
export const fmtPuntoAprox = (x, y) => `(${fmtAproxCorto(x)}; ${fmtAproxCorto(y)})`;

// "(−4 − √5; 1) ≈ (−6,24; 1)", "(−5/4; −3) = (−1,25; −3)", "(3; −7)"
export function fmtPuntoCompleto(x, y) {
  if (!x.ex || !y.ex) return `≈ ${fmtPuntoAprox(x, y)}`;
  const base = fmtPunto(x, y);
  if (esEnteroExacto(x) && esEnteroExacto(y)) return base;
  const exactoDecimal = [x, y].every((n) => esRacionalExacto(n) && esDecimalExacto(n.v));
  if (exactoDecimal) return `${base} = (${fmtDecimalCorto(x.v)}; ${fmtDecimalCorto(y.v)})`;
  return `${base} ≈ ${fmtPuntoAprox(x, y)}`;
}

// ---------- Marcado \frac{}{} ----------

// s[i] debe ser '{'. Devuelve [contenido, índice siguiente a la llave de cierre].
export function grupoLlaves(s, i) {
  let prof = 0;
  let j = i;
  for (; j < s.length; j++) {
    if (s[j] === '{') prof++;
    else if (s[j] === '}') {
      prof--;
      if (prof === 0) break;
    }
  }
  return [s.slice(i + 1, j), j + 1];
}

function envolverSi(t, re) {
  let prof = 0;
  for (const ch of t) {
    if (ch === '(') prof++;
    else if (ch === ')') prof--;
    else if (prof === 0 && re.test(ch)) return `(${t})`;
  }
  return t;
}

// \frac{(x + 4)²}{9} → (x + 4)²/9 ; \frac{51200}{19}y → (51200/19)y ; \frac{1}{\frac{1}{9}} → 1/(1/9)
export function aTexto(s) {
  let out = '';
  let i = 0;
  while (i < s.length) {
    if (s.startsWith('\\frac{', i)) {
      const [num, j] = grupoLlaves(s, i + 5);
      const [den, k] = grupoLlaves(s, j);
      let t = `${envolverSi(aTexto(num), /[\s/]/)}/${envolverSi(aTexto(den), /[\s/·]/)}`;
      if (/[\p{L}(√]/u.test(s[k] ?? '')) t = `(${t})`;
      out += t;
      i = k;
    } else {
      out += s[i];
      i++;
    }
  }
  return out;
}

export function mFr(f) {
  if (f.d === 1) return fmtFr(f);
  return `${f.n < 0 ? MENOS : ''}\\frac{${Math.abs(f.n)}}{${f.d}}`;
}

// Exacto como marcado: 2√5/5 → \frac{2√5}{5}
export function mExacto(x) {
  if (x.r === 1) return mFr(x.a);
  const p = Math.abs(x.b.n);
  const base = `${p === 1 ? '' : p}√${x.r}`;
  const rad = x.b.d === 1 ? base : `\\frac{${base}}{${x.b.d}}`;
  if (x.a.n === 0) return (x.b.n < 0 ? MENOS : '') + rad;
  return `${mFr(x.a)} ${x.b.n < 0 ? MENOS : '+'} ${rad}`;
}
