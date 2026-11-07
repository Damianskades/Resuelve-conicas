// Alternativas de opción múltiple: separarlas del enunciado (a., b), c., d) …) y compararlas
// matemáticamente con la respuesta calculada. Las ecuaciones se comparan por sus coeficientes
// normalizados (equivalentes aunque estén multiplicadas, ordenadas distinto o en forma
// ordinaria/canónica); puntos y números con tolerancia si están escritos con decimales.
// Funciones puras.

import { parsearEcuacion } from '../math/parser.js';
import { normalizarGeneral, ORDEN_COEF } from '../math/general.js';
import { leerNumero, Num } from '../math/numeros.js';
import { leerPunto, pt } from '../math/puntos.js';
import { fmtCorto, fmtFr } from '../math/formato.js';
import { CERO, igual as igualFr } from '../math/fracciones.js';
import { resolverDesdeEcuacion, NOMBRES } from './desde-general.js';

// ---------- Separar ----------

const MARCA = /(^|[\s.;:,])([a-eA-E])[.)]\s+/g;

export function separarAlternativas(texto) {
  const t = String(texto ?? '');
  const marcas = [];
  for (const m of t.matchAll(MARCA)) {
    marcas.push({ letra: m[2], inicio: m.index + m[1].length, fin: m.index + m[0].length });
  }
  let mejor = [];
  for (let i = 0; i < marcas.length; i++) {
    if (marcas[i].letra.toLowerCase() !== 'a') continue;
    const mayus = marcas[i].letra === 'A';
    const cadena = [marcas[i]];
    let esperada = 'b';
    for (let j = i + 1; j < marcas.length; j++) {
      if (marcas[j].letra === (mayus ? esperada.toUpperCase() : esperada)) {
        cadena.push(marcas[j]);
        esperada = String.fromCharCode(esperada.charCodeAt(0) + 1);
      }
    }
    if (cadena.length > mejor.length) mejor = cadena;
  }
  if (mejor.length < 2) return { enunciado: t.trim(), alternativas: [], inicio: t.length };
  const alternativas = mejor.map((m, i) => {
    const fin = i + 1 < mejor.length ? mejor[i + 1].inicio : t.length;
    return { letra: m.letra.toLowerCase(), texto: t.slice(m.fin, fin).trim().replace(/[\s.;,]+$/, ''), pos: m.inicio };
  });
  return { enunciado: t.slice(0, mejor[0].inicio).trim(), alternativas, inicio: mejor[0].inicio };
}

// ---------- Interpretar una alternativa ----------

// Divide en partes por «;» fuera de paréntesis: "C(2; 1); em=2/5" → ["C(2; 1)", "em=2/5"]
export function dividirPartes(texto) {
  const partes = [];
  let prof = 0;
  let actual = '';
  for (const ch of texto) {
    if (ch === '(' || ch === '[') prof++;
    if (ch === ')' || ch === ']') prof--;
    if (ch === ';' && prof === 0) {
      partes.push(actual);
      actual = '';
    } else actual += ch;
  }
  partes.push(actual);
  return partes.map((p) => p.trim()).filter(Boolean);
}

const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '');

// Nombre escrito → clave de elemento
const CLAVES_NUMERO = {
  em: ['ejeMenor'], ejemenor: ['ejeMenor'], '2b': ['ejeMenor', 'ejeConjugado'],
  ejemayor: ['ejeMayor'], '2a': ['ejeMayor', 'ejeTransverso'],
  r: ['radio'], radio: ['radio'], d: ['diametro'], diametro: ['diametro'],
  e: ['e'], excentricidad: ['e'], lr: ['ladoRecto'], ladorecto: ['ladoRecto'],
  p: ['p'], '4p': ['cuatroP'], a: ['a'], b: ['b'], c: ['c'],
  '2c': ['distanciaFocal'], distanciafocal: ['distanciaFocal'],
  ejetransverso: ['ejeTransverso'], ejeconjugado: ['ejeConjugado'],
};
const CLAVES_PUNTO = { c: ['centro'], v: ['vertice', 'v1', 'v2'], f: ['foco', 'f1', 'f2'] };

// ¿Está escrito con decimales? Entonces se compara con tolerancia.
const conDecimales = (s) => /\d[.,]\d/.test(s) && !/[/√]/.test(s);
const conDecimalesPunto = (s) => (s.includes(';') ? /\d[.,]\d/.test(s) : /\d\.\d/.test(s)) && !/[/√]/.test(s);

function decimales(s) {
  const m = s.match(/\d[.,](\d+)/g);
  return m ? Math.max(...m.map((x) => x.length - 2)) : 0;
}

export function interpretarParte(texto) {
  const s = texto.trim().replace(/\.+$/, '');
  let m = /^([A-Za-z][A-Za-z0-9₀-₉']*)?\s*=?\s*(\([^()]*\))$/u.exec(s);
  if (m) {
    const r = leerPunto(m[2]);
    if (r.punto) {
      const tol = conDecimalesPunto(m[2]) ? 0.5 * 10 ** -decimales(m[2]) + 1e-9 : 1e-9;
      return { tipo: 'punto', nombre: m[1] ?? null, P: r.punto, tol, texto: s };
    }
  }
  m = /^([0-9]?[A-Za-zÁÉÍÓÚáéíóúñ][A-Za-zÁÉÍÓÚáéíóúñ0-9 ]*?)\s*[=:]\s*([^=]+)$/u.exec(s);
  if (m && !['x', 'y'].includes(sinTildes(m[1]))) {
    const r = leerNumero(m[2]);
    if (r.num) return { tipo: 'numero', nombre: m[1].trim(), num: r.num, tol: conDecimales(m[2]) ? 0.5 * 10 ** -decimales(m[2]) + 1e-9 : 1e-9, texto: s };
  }
  const rn = leerNumero(s);
  if (rn.num) return { tipo: 'numero', nombre: null, num: rn.num, tol: conDecimales(s) ? 0.5 * 10 ** -decimales(s) + 1e-9 : 1e-9, texto: s };
  const re = parsearEcuacion(s);
  if (re.ok && re.grado >= 1) {
    return { tipo: 'ecuacion', coef: normalizarGeneral(re.coef), grado: re.grado, forma: /[(/]/.test(s) ? 'ordinaria' : 'general', texto: s };
  }
  return { tipo: 'desconocido', texto: s, error: re.ok ? 'no es una ecuación de una cónica ni de una recta' : re.error };
}

// ---------- Lo que se espera (sale de la solución calculada) ----------

const coefDeRecta = (r) => {
  if (![r.a, r.b, r.c].every((n) => n.esRacional())) return null;
  return normalizarGeneral({ A: CERO, B: CERO, C: CERO, D: r.a.fr, E: r.b.fr, F: r.c.fr });
};

export function esperados(res) {
  const ecuaciones = [];
  const agregar = (texto, extra = {}) => {
    const p = parsearEcuacion(texto ?? '');
    if (p.ok) ecuaciones.push({ coef: normalizarGeneral(p.coef), grado: p.grado, texto, ...extra });
  };
  const conicas = res.conicas?.length ? res.conicas : res.general ? [{ general: res.general, tipo: res.tipo }] : [];
  for (const m of conicas) agregar(m.general, { conica: m.tipo });
  for (const k of ['tangente', 'recta']) {
    const r = res.valores?.[k];
    if (r?.a) {
      const coef = coefDeRecta(r);
      if (coef) ecuaciones.push({ coef, grado: 1, texto: k });
    }
  }
  const puntos = [];
  const numeros = [];
  const elementos = [...(res.elementos ?? []), ...(res.conicas ?? []).slice(1).flatMap((m) => m.elementos)];
  for (const e of elementos) {
    if (e.tipo === 'punto') puntos.push({ clave: e.clave, nombre: e.nombre, P: pt(e.x, e.y) });
    if ((e.tipo === 'valor' || e.tipo === 'recta') && e.num) numeros.push({ clave: e.clave, nombre: e.nombre, num: e.num });
  }
  for (const [k, v] of Object.entries(res.valores ?? {})) {
    if (v instanceof Num) numeros.push({ clave: k, nombre: k, num: v });
    else if (Array.isArray(v)) {
      for (const x of v) {
        if (x instanceof Num) numeros.push({ clave: k, nombre: k, num: x });
        else if (x?.x instanceof Num) puntos.push({ clave: k, nombre: 'punto', P: x });
        else if (x?.y instanceof Num) numeros.push({ clave: k, nombre: k, num: x.y });
      }
    } else if (v?.x instanceof Num && v?.y instanceof Num) puntos.push({ clave: k, nombre: k, P: v });
  }
  return { ecuaciones, puntos, numeros, res };
}

// ---------- Comparar ----------

const cerca = (a, b, tol) => a.igual(b) || Math.abs(a.v - b.v) <= tol;
const fmtP = (P) => `(${fmtCorto(P.x)}; ${fmtCorto(P.y)})`;
const NOMBRE_COEF = { A: 'x²', B: 'xy', C: 'y²', D: 'x', E: 'y' };

function diferenciasCoef(alt, esp) {
  const out = [];
  for (const k of ORDEN_COEF) {
    if (igualFr(alt[k], esp[k])) continue;
    const quien = k === 'F' ? 'el término independiente' : `el coeficiente de ${NOMBRE_COEF[k]}`;
    out.push(`${quien} es ${fmtFr(alt[k])}, debería ser ${fmtFr(esp[k])}`);
  }
  return out;
}

const igualesCoef = (a, b) => ORDEN_COEF.every((k) => igualFr(a[k], b[k]));

const nombreConica = (t) => (NOMBRES[t] ?? t ?? '').toLowerCase();

// Explica en qué se diferencia una cónica escrita en forma ordinaria o canónica.
function explicarConica(texto, res) {
  const r = resolverDesdeEcuacion(texto);
  if (!r.ok) return 'no es una ecuación válida';
  if (r.degenerada) return 'no es una cónica real (es un caso degenerado)';
  if (res.tipo && r.tipo !== res.tipo) return `es una ${nombreConica(r.tipo)}; la respuesta es una ${nombreConica(res.tipo)}`;
  const A = r.valores;
  const E = res.valores ?? {};
  const out = [];
  const punto = (etq, h1, k1, h2, k2) => {
    if (h2 && k2 && !(h1.igual(h2) && k1.igual(k2))) out.push(`su ${etq} es (${fmtCorto(h1)}; ${fmtCorto(k1)}), debería ser (${fmtCorto(h2)}; ${fmtCorto(k2)})`);
  };
  const valor = (etq, n1, n2) => {
    if (n1 && n2 && !n1.igual(n2)) out.push(`${etq} = ${fmtCorto(n1)}, debería ser ${fmtCorto(n2)}`);
  };
  const eje = (etq) => {
    if (res.orientacion && r.orientacion !== res.orientacion) out.push(`${etq} es ${r.orientacion}, debería ser ${res.orientacion}`);
  };
  if (r.tipo === 'circunferencia') {
    punto('centro', A.h, A.k, E.h, E.k);
    valor('r²', A.r2, E.r2);
  } else if (r.tipo === 'parabola') {
    punto('vértice', A.h, A.k, E.h, E.k);
    eje('el eje');
    valor('4p', A.cuatroP, E.cuatroP);
  } else {
    punto('centro', A.h, A.k, E.h, E.k);
    eje(r.tipo === 'elipse' ? 'el eje mayor' : 'el eje transverso');
    valor('a²', A.a2, E.a2);
    valor('b²', A.b2, E.b2);
  }
  return out.slice(0, 2).join('; ');
}

function compararEcuacion(parte, esp) {
  const candidatas = esp.ecuaciones.filter((e) => e.grado === parte.grado);
  if (candidatas.some((e) => igualesCoef(parte.coef, e.coef))) return { ok: true };
  if (!candidatas.length) {
    const hay = esp.ecuaciones[0];
    if (!hay) return { ok: false, motivo: 'la solución no tiene una ecuación para comparar' };
    return { ok: false, motivo: parte.grado === 1 ? 'es una recta; la respuesta es una cónica' : 'es una cónica; la respuesta es una recta' };
  }
  const e = candidatas[0];
  let motivo = '';
  if (parte.grado === 2 && parte.forma === 'ordinaria') motivo = explicarConica(parte.texto, esp.res);
  if (!motivo) motivo = diferenciasCoef(parte.coef, e.coef).slice(0, 3).join('; ');
  return { ok: false, motivo: motivo || 'no es equivalente a la respuesta' };
}

function compararPunto(parte, esp) {
  const inicial = sinTildes(parte.nombre ?? '').replace(/[0-9₀-₉']/g, '');
  const claves = CLAVES_PUNTO[inicial];
  const candidatos = claves ? esp.puntos.filter((p) => claves.includes(p.clave)) : esp.puntos;
  if (!candidatos.length) return { ok: false, motivo: `la respuesta no tiene un punto «${parte.nombre ?? ''}» para comparar` };
  const igualP = (Q) => cerca(parte.P.x, Q.x, parte.tol) && cerca(parte.P.y, Q.y, parte.tol);
  if (candidatos.some((c) => igualP(c.P))) return { ok: true };
  const c = candidatos[0];
  return { ok: false, motivo: `${c.nombre ? `el ${c.nombre.toLowerCase()}` : 'el punto'} es ${fmtP(parte.P)}, debería ser ${fmtP(c.P)}` };
}

function compararNumero(parte, esp) {
  const claves = parte.nombre ? CLAVES_NUMERO[sinTildes(parte.nombre)] : null;
  if (parte.nombre && !claves) return { ok: false, motivo: `no reconozco «${parte.nombre}»` };
  const candidatos = claves ? esp.numeros.filter((n) => claves.includes(n.clave)) : esp.numeros;
  if (!candidatos.length) return { ok: false, motivo: `la respuesta no tiene «${parte.nombre}» para comparar` };
  if (candidatos.some((c) => cerca(parte.num, c.num, parte.tol))) return { ok: true };
  const c = candidatos[0];
  return { ok: false, motivo: `${parte.nombre ?? 'el valor'} = ${fmtCorto(parte.num)}, debería ser ${fmtCorto(c.num)}` };
}

export function compararAlternativa(texto, esp) {
  const partes = dividirPartes(texto).map(interpretarParte);
  if (!partes.length) return { coincide: false, motivo: 'está vacía' };
  const motivos = [];
  for (const p of partes) {
    let r;
    if (p.tipo === 'ecuacion') r = compararEcuacion(p, esp);
    else if (p.tipo === 'punto') r = compararPunto(p, esp);
    else if (p.tipo === 'numero') r = compararNumero(p, esp);
    else r = { ok: false, motivo: `no pude interpretar «${p.texto}»` };
    if (!r.ok) motivos.push(r.motivo);
  }
  return { coincide: motivos.length === 0, motivo: motivos.join('; ') };
}

// alternativas: [{ letra, texto }], res: solución calculada (ok: true)
export function compararAlternativas(alternativas, res) {
  const esp = esperados(res);
  const lista = alternativas.map((a) => ({ ...a, ...compararAlternativa(a.texto, esp) }));
  const correctas = lista.filter((a) => a.coincide).map((a) => a.letra);
  return { alternativas: lista, correctas, ninguna: correctas.length === 0 };
}
