// Piezas comunes de las cuatro cónicas: lectura de parámetros, ecuación general desde la
// ordinaria, elementos con su fórmula y construcción de la escena para el graficador.
// Funciones puras.

import { Num, leerNumero } from '../math/numeros.js';
import { CERO } from '../math/fracciones.js';
import {
  MENOS, fmtCorto, fmtConAprox, fmtPunto, fmtPuntoCompleto, fmtExacto, fmtAproxCorto, fmtDecimal,
} from '../math/formato.js';
import { normalizarGeneral, fmtGeneral, fmtGeneralAprox } from '../math/general.js';
import { mValor, mAprox, mRaiz, igualdades } from '../math/expresiones.js';

export const N = (x) => Num.de(x);

// ---------- Cálculos mostrados (marcado) ----------

export const calculoC = (signo, a2, b2, c2, c) => igualdades('c', `√(${mValor(a2)} ${signo} ${mValor(b2)})`, mRaiz(c2), mValor(c));

export const calculoE = (c, a, e) => `${igualdades('e', `\\frac{${mValor(c)}}{${mValor(a)}}`, mValor(e))}${mAprox(e)}`;

export const calculoLR = (b2, a, lr) => igualdades('LR', `\\frac{2·${mValor(b2)}}{${mValor(a)}}`, mValor(lr));

// "x = −4 ± \frac{9}{√5} = −4 ± \frac{9√5}{5}  →  x = … ≈ −8,02;  x = … ≈ 0,02"
export function calculoDirectrices(v, centro, a2, c, aSobreC, d1, d2) {
  const pm = centro.esCero() ? '±' : `${mValor(centro)} ± `;
  const f1 = `${pm}\\frac{${mValor(a2)}}{${mValor(c)}}`;
  const f2 = `${pm}${mValor(aSobreC)}`;
  return `${igualdades(`${v} = ${f1}`, f2 === f1 ? '' : f2)}  →  ${v} = ${mValor(d1)}${mAprox(d1)};  ${v} = ${mValor(d2)}${mAprox(d2)}`;
}

// { h: '−1', k: 0, a: Num } → { valores: { h: Num, ... } } o { error, campo }
export function leerParametros(params, nombres) {
  const valores = {};
  for (const nombre of nombres) {
    const crudo = params?.[nombre];
    if (crudo === undefined || crudo === null || (typeof crudo === 'string' && crudo.trim() === '')) {
      return { error: `Falta el valor de ${nombre}.`, campo: nombre };
    }
    if (typeof crudo === 'string') {
      const r = leerNumero(crudo);
      if (r.error) return { error: `${nombre}: ${r.error}`, campo: nombre };
      valores[nombre] = r.num;
    } else {
      try {
        valores[nombre] = Num.de(crudo);
      } catch {
        return { error: `${nombre} no es un número válido.`, campo: nombre };
      }
    }
    if (!Number.isFinite(valores[nombre].v)) return { error: `${nombre} no es un número válido.`, campo: nombre };
  }
  return { valores };
}

// sx·(x − h)²/dx + sy·(y − k)²/dy = 1  →  coeficientes A, C, D, E, F (sin normalizar)
export function coefDesdeOrdinaria(h, k, dx, dy, sx, sy) {
  const A = dy.por(sx);
  const C = dx.por(sy);
  return {
    A,
    C,
    D: h.por(-2).por(A),
    E: k.por(-2).por(C),
    F: A.por(h.cuadrado()).mas(C.por(k.cuadrado())).menos(dx.por(dy)),
  };
}

// Coeficientes Num → ecuación general con enteros simplificados (o aproximada si son irracionales)
export function ecuacionGeneral(c) {
  const claves = ['A', 'C', 'D', 'E', 'F'];
  if (claves.every((k) => c[k].esRacional())) {
    try {
      const coef = normalizarGeneral({ A: c.A.fr, B: CERO, C: c.C.fr, D: c.D.fr, E: c.E.fr, F: c.F.fr });
      return { coef, texto: fmtGeneral(coef), exacta: true };
    } catch (e) {
      if (!(e instanceof RangeError)) throw e;
    }
  }
  return { coef: null, texto: fmtGeneralAprox(Object.fromEntries(claves.map((k) => [k, c[k].v]))), exacta: false };
}

// ---------- Elementos ----------

export function ePunto(clave, nombre, simbolo, x, y, formula, calculo) {
  return { clave, nombre, tipo: 'punto', x, y, exacto: fmtPunto(x, y), valor: `${simbolo}${fmtPuntoCompleto(x, y)}`, formula, calculo };
}

export function eValor(clave, nombre, simbolo, num, formula, calculo) {
  return { clave, nombre, tipo: 'valor', num, exacto: fmtCorto(num), valor: `${simbolo} = ${fmtConAprox(num)}`, formula, calculo };
}

export function eRecta(clave, nombre, variable, num, formula, calculo) {
  return { clave, nombre, tipo: 'recta', num, exacto: `${variable} = ${fmtCorto(num)}`, valor: `${variable} = ${fmtConAprox(num)}`, formula, calculo };
}

export function eTexto(clave, nombre, texto, formula) {
  return { clave, nombre, tipo: 'texto', exacto: texto, valor: texto, formula };
}

// "±2√3/3 ≈ ±1,15"
export function conMasMenos(num) {
  return `±${fmtConAprox(num).replace(' ≈ ', ' ≈ ±').replace(' = ', ' = ±')}`;
}

// ---------- Rectas en texto plano ----------

const mixto = (n) => n.ex !== null && n.ex.r !== 1 && n.ex.a.n !== 0;

function binomioPlano(v, h) {
  if (h.esCero()) return v;
  const a = h.abs();
  return `${v} ${h.signo() > 0 ? MENOS : '+'} ${mixto(a) ? `(${fmtCorto(a)})` : fmtCorto(a)}`;
}

// Coeficiente delante de x (con paréntesis si no es entero: "(√3)x") o delante de un
// paréntesis (antesDeParentesis: "√3(x − 4)"; las fracciones siguen entre paréntesis).
function coefPlano(m, antesDeParentesis = false) {
  const a = m.abs();
  const s = m.signo() < 0 ? MENOS : '';
  if (a.igual(1)) return s;
  const t = fmtCorto(a);
  if (a.esEntero() || (antesDeParentesis && !t.includes('/') && !mixto(a))) return s + t;
  return `${s}(${t})`;
}

// y − k = m(x − h): "y = (2√3/3)(x + 1)", "y − 3 = 2(x − 1)", "y = −x"
export function rectaPuntoPendiente(m, h, k) {
  const izq = binomioPlano('y', k);
  const bx = binomioPlano('x', h);
  let der;
  if (h.esCero()) der = `${coefPlano(m)}x`;
  else {
    const c = coefPlano(m, true);
    der = c === '' ? bx : `${c}(${bx})`;
  }
  return `${izq} = ${der}`;
}

// y = mx + b: "y = (2√3/3)x + 2√3/3"
export function rectaPendienteOrdenada(m, b) {
  let s = m.esCero() ? '' : `${coefPlano(m)}x`;
  if (!b.esCero()) {
    const a = b.abs();
    const t = mixto(a) ? `(${fmtCorto(a)})` : fmtCorto(a);
    s += s ? ` ${b.signo() < 0 ? MENOS : '+'} ${t}` : `${b.signo() < 0 ? MENOS : ''}${t}`;
  }
  return `y = ${s || '0'}`;
}

export function rectaAprox(m, b) {
  const bs = Math.abs(b.v) < 0.005 ? '' : ` ${b.v < 0 ? MENOS : '+'} ${fmtDecimal(Math.abs(b.v))}`;
  return `y ≈ ${fmtDecimal(m.v)}x${bs}`;
}

// ---------- Escena ----------

export const escenaVacia = () => ({ curvas: [], rectas: [], segmentos: [], puntos: [], encuadre: [] });

function corto(n) {
  const e = n.ex ? fmtExacto(n.ex) : null;
  return e && e.length <= 6 ? e : fmtAproxCorto(n);
}

export const etiquetaCoords = (x, y) => `(${corto(x)}; ${corto(y)})`;

export function punto(nombre, x, y, tipo, grupo) {
  return { x: x.v, y: y.v, tipo, grupo, etiqueta: { nombre, coords: etiquetaCoords(x, y) } };
}

export function rectaVertical(x, tipo, grupo, etiqueta) {
  return { punto: [x.v, 0], direccion: [0, 1], tipo, grupo, etiqueta: etiqueta ?? `x = ${corto(x)}` };
}

export function rectaHorizontal(y, tipo, grupo, etiqueta) {
  return { punto: [0, y.v], direccion: [1, 0], tipo, grupo, etiqueta: etiqueta ?? `y = ${corto(y)}` };
}

const MARGEN = 0.1;

function extender(v) {
  const mx = (v.xmax - v.xmin) * MARGEN;
  const my = (v.ymax - v.ymin) * MARGEN;
  return { xmin: v.xmin - mx, xmax: v.xmax + mx, ymin: v.ymin - my, ymax: v.ymax + my, escala: v.escala ?? 40 };
}

// Elipse (o circunferencia) de centro (h; k) y semiejes rx (horizontal) y ry (vertical)
export function curvaElipse(h, k, rx, ry) {
  return {
    tipo: 'curva',
    muestrear(vista) {
      const escala = vista?.escala ?? 40;
      const perimetroPx = 2 * Math.PI * Math.max(rx, ry) * escala;
      const n = Math.min(4000, Math.max(180, Math.ceil(perimetroPx / 3)));
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = (i / n) * 2 * Math.PI;
        pts.push([h + rx * Math.cos(t), k + ry * Math.sin(t)]);
      }
      return [pts];
    },
  };
}

// Parábola de vértice (h; k): vertical (x − h)² = 4p(y − k) u horizontal (y − k)² = 4p(x − h).
// Se muestrea solo la parte que cae en la vista, así llega hasta el borde con cualquier zoom.
export function curvaParabola(h, k, p, vertical) {
  return {
    tipo: 'curva',
    muestrear(vista) {
      const v = extender(vista);
      // u: coordenada a lo largo del eje de simetría; w: coordenada perpendicular
      const [u0, uMin, uMax, w0, wMin, wMax] = vertical
        ? [k, v.ymin, v.ymax, h, v.xmin, v.xmax]
        : [h, v.xmin, v.xmax, k, v.ymin, v.ymax];
      const alcance = p > 0 ? uMax - u0 : u0 - uMin;
      if (alcance <= 0) return [];
      const tmax = Math.sqrt(4 * Math.abs(p) * alcance);
      const t0 = Math.max(-tmax, wMin - w0);
      const t1 = Math.min(tmax, wMax - w0);
      if (t0 >= t1) return [];
      const n = 800;
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = t0 + ((t1 - t0) * i) / n;
        const w = w0 + t;
        const u = u0 + (t * t) / (4 * p);
        pts.push(vertical ? [w, u] : [u, w]);
      }
      return [pts];
    },
  };
}

// Hipérbola de centro (h; k), semieje transverso a y conjugado b. Dos ramas hasta salir de la vista.
export function curvaHiperbola(h, k, a, b, horizontal) {
  return {
    tipo: 'curva',
    muestrear(vista) {
      const v = extender(vista);
      const X = Math.max(Math.abs(v.xmin - h), Math.abs(v.xmax - h));
      const Y = Math.max(Math.abs(v.ymin - k), Math.abs(v.ymax - k));
      const [T, C] = horizontal ? [X, Y] : [Y, X];
      const umax = Math.max(Math.asinh(C / b), Math.acosh(Math.max(1, T / a))) + 0.05;
      const n = 600;
      const ramas = [];
      for (const s of [1, -1]) {
        const pts = [];
        for (let i = 0; i <= n; i++) {
          const u = -umax + (2 * umax * i) / n;
          const t = s * a * Math.cosh(u);
          const c = b * Math.sinh(u);
          pts.push(horizontal ? [h + t, k + c] : [h + c, k + t]);
        }
        ramas.push(pts);
      }
      return ramas;
    },
  };
}
