// Detector de enunciados en texto libre, solo con reglas (sin IA ni servicios externos).
// 1) Normaliza el texto sin cambiar su longitud (así las posiciones sirven para resaltar).
// 2) Extrae datos: ecuaciones de cónicas, rectas, puntos con nombre (y ± expandido), números
//    con palabra clave (radio, lado recto, excentricidad, ejes…) y palabras clave del tema.
// 3) Cada regla da un puntaje a un tipo de pregunta de la Fase 3 y sabe llenar su formulario.
//    Para ampliar: agrega una regla a REGLAS.
// Funciones puras.

import { separarAlternativas } from './alternativas.js';
import { parsearEcuacion } from '../math/parser.js';
import { leerPunto, pt, fmtP } from '../math/puntos.js';
import { leerRecta, esVertical, esHorizontal, fmtRecta } from '../math/rectas.js';
import { leerNumero } from '../math/numeros.js';
import { fmtCorto } from '../math/formato.js';
import { resolverDesdeEcuacion, NOMBRES } from './desde-general.js';
import { tipoPorId } from './tipos.js';

// ---------- Normalización (misma longitud que el original) ----------

const MAPA = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', Á: 'a', É: 'e', Í: 'i', Ó: 'o', Ú: 'u', Ü: 'u', Ñ: 'ñ',
  '−': '-', '–': '-', '—': '-', ' ': ' ', '\t': ' ', '\n': ' ', '\r': ' ', '×': '*', '·': '*',
};

export function normalizar(texto) {
  const t = String(texto ?? '');
  let s = '';
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (MAPA[ch]) s += MAPA[ch];
    else {
      const l = ch.toLowerCase();
      s += l.length === 1 ? l : ch;
    }
  }
  return s;
}

// ---------- Palabras clave ----------

const PALABRAS = {
  circunferencia: /circunferencia|circulo|circular/,
  parabola: /parabola|parabolic/,
  elipse: /elipse|eliptic|semielip/,
  hiperbola: /hiperbola|hiperbolic/,
  centro: /\bcentro\b/,
  radio: /\bradio\b/,
  foco: /\bfocos?\b/,
  vertice: /\bvertices?\b/,
  directriz: /\bdirectriz\b/,
  tangente: /\btangente/,
  pasaPor: /\bpasan? por\b|\bcontiene\b/,
  puntoTangencia: /punto de tangencia/,
  posicion: /posicion relativa|se cortan|interseccion|intersecta|corta a|secante|exterior/,
  ladoRecto: /lado recto/,
  excentricidad: /excentricidad/,
  asintota: /asintota/,
  ejeMayor: /eje mayor/,
  ejeMenor: /eje menor/,
  general: /ecuacion general|forma general/,
  ordinaria: /forma (?:ordinaria|estandar|canonica|reducida)|ecuacion (?:ordinaria|estandar|canonica|reducida)/,
  longitudEje: /longitud del eje/,
  diametro: /diametro/,
  ejeX: /eje (?:x|horizontal|de (?:las )?abscisas)\b/,
  ejeY: /eje (?:y|vertical|de (?:las )?ordenadas)\b/,
  rueda: /rueda|noria|fortuna/,
  puente: /puente|cable|torres?\b|colgante|arco parabolico/,
  arco: /\barco\b/,
  trayectoria: /\bdron|trayectoria|proyectil|lanza|lanzad/,
  tunel: /tunel|semielip|arco eliptico/,
  orbita: /orbita|planeta|perihelio|afelio|pluton/,
  loran: /loran|estaciones|senal|barco/,
};

const CONICAS = ['circunferencia', 'parabola', 'elipse', 'hiperbola'];
const APLICACIONES = ['rueda', 'puente', 'trayectoria', 'tunel', 'orbita', 'loran'];
const FUERA_DE_TEMA = /derivad|integral|limite|matriz|matrices|determinante|vector|logaritm|probabilidad|estadistic|trigonometr|seno|coseno|progresion|funcion exponencial/;

// ---------- Extracción ----------

const esLetra = (c) => c !== undefined && /[a-zñ]/.test(c);
const MATEMATICA = /[0-9+\-*/^²=().,\s√[\]]/;

function noEspacio(n, i, paso) {
  let j = i + paso;
  while (n[j] === ' ') j += paso;
  return n[j];
}

// ¿La x o la y en la posición i es una variable (y no parte de una palabra o la conjunción «y»)?
function esVariable(n, i) {
  const c = n[i];
  if (c !== 'x' && c !== 'y') return false;
  if (esLetra(n[i - 1]) && !'xy'.includes(n[i - 1])) return false;
  if (esLetra(n[i + 1]) && !'xy'.includes(n[i + 1])) return false;
  if (c === 'y' && n[i - 1] === ' ' && n[i + 1] === ' ') {
    const ant = noEspacio(n, i, -1);
    const sig = noEspacio(n, i, 1);
    return ant === undefined || '=+-*/(^'.includes(ant) || (sig !== undefined && '=+-*/^²)'.includes(sig));
  }
  return true;
}

// Ecuaciones (de cónicas) y rectas: tramos de texto matemático que contienen «=» y x o y.
function extraerEcuaciones(t, n) {
  const encontradas = [];
  let i = 0;
  while (i < n.length) {
    if (!(MATEMATICA.test(n[i]) || esVariable(n, i))) {
      i++;
      continue;
    }
    let j = i;
    while (j < n.length && (MATEMATICA.test(n[j]) || esVariable(n, j))) j++;
    const tramo = n.slice(i, j);
    if (tramo.includes('=') && /[xy]/.test(tramo)) {
      const ini = i + (tramo.length - tramo.replace(/^[\s.,=)]+/, '').length);
      const recortado = n.slice(ini, j).replace(/[\s.,;:=(]+$/, '');
      for (const cand of [recortado, recortado.split(/,\s/)[0].replace(/[\s.]+$/, '')]) {
        const r = parsearEcuacion(cand);
        if (r.ok && r.grado >= 1 && /[xy]/.test(cand.split('=')[0] + cand.split('=')[1])) {
          const texto = t.slice(ini, ini + cand.length);
          encontradas.push({ texto, pos: ini, len: cand.length, grado: r.grado });
          break;
        }
      }
    }
    i = j;
  }
  return encontradas;
}

const solapa = (a, b) => a.pos < b.pos + b.len && b.pos < a.pos + a.len;

function extraerPuntos(t, n, ocupado) {
  const puntos = [];
  for (const m of n.matchAll(/\(([^()]{1,40})\)/g)) {
    const contenido = m[1];
    if (!/^[\s\d.,;√/±+\-]+$/.test(contenido) || !/\d/.test(contenido)) continue;
    const rango = { pos: m.index, len: m[0].length };
    if (ocupado.some((o) => solapa(o, rango))) continue;
    // Nombre del punto (en el texto original): "C=(", "F1 = (", "A("
    const antes = t.slice(Math.max(0, m.index - 6), m.index);
    const nm = /(?:^|[^A-Za-zÁÉÍÓÚáéíóúñ])([A-Z][0-9₀-₉]?)\s*[=:]?\s*$/.exec(antes);
    const nombre = nm ? nm[1] : null;
    const pos = nm ? m.index - (antes.length - antes.lastIndexOf(nm[1])) : m.index;
    const variantes = contenido.includes('±') ? [contenido.replace(/±/g, ''), contenido.replace(/±/g, '-')] : [contenido];
    for (const v of variantes) {
      const r = leerPunto(`(${v})`);
      if (r.punto) puntos.push({ nombre, P: r.punto, pos, len: m.index + m[0].length - pos, texto: t.slice(pos, m.index + m[0].length) });
    }
  }
  return puntos;
}

const NUM = '([-+]?\\d*√\\d+(?:/\\d+)?|[-+]?(?:\\d{1,3}(?: \\d{3})+|\\d+)(?:[.,]\\d+)?(?:/\\d+)?)';
const RE_NUM_TRAS = new RegExp(`^[^\\d√()±]{0,25}?${NUM}`);

const NUMEROS_TRAS = [
  ['radio', /\bradio\b|(?<![a-z0-9])r\s*(?==)/g],
  ['ladoRecto', /lado recto|(?<![a-z])lr\s*(?==)/g],
  ['excentricidad', /excentricidad|(?<![a-z0-9])e\s*(?==)/g],
  ['ejeMenor', /eje menor|(?<![a-z0-9])2b\s*(?==)/g],
  ['ejeMayor', /eje mayor|(?<![a-z0-9])2a\s*(?==)/g],
  ['luz', /separad[oa]s?|distancia entre (?:las |los )?(?:torres|apoyos|pilares)|entre (?:las )?torres|(?<![a-z])luz\b|\bancho\b|\bbase\b|\bclaro\b/g],
  ['altura', /\baltura\b|\balto\b/g],
  ['tiempo', /diferencia de (?:los )?tiempos?|δt|delta t/g],
  ['velocidad', /velocidad/g],
];
const NUMEROS_ANTES = [
  ['altura', new RegExp(`${NUM}\\s*(?:m|metros|cm|km|pies)?\\s+de\\s+(?:altura|alto)`, 'g')],
  ['luz', new RegExp(`${NUM}\\s*(?:m|metros|cm|km|pies)?\\s+de\\s+(?:ancho|luz|largo|claro)`, 'g')],
];

function extraerNumeros(t, n, ocupado) {
  const numeros = {};
  const guardar = (clave, ini, texto) => {
    const rango = { pos: ini, len: texto.length };
    if (numeros[clave] || ocupado.some((o) => solapa(o, rango))) return;
    const sig = n[ini + texto.length];
    if (sig !== undefined && /[a-zñ²^]/.test(sig)) return;
    if (!leerNumero(texto).num) return;
    numeros[clave] = { texto: t.slice(ini, ini + texto.length), pos: ini, len: texto.length };
    ocupado.push(rango);
  };
  for (const [clave, re] of NUMEROS_ANTES) {
    for (const m of n.matchAll(re)) guardar(clave, m.index, m[1]);
  }
  for (const [clave, re] of NUMEROS_TRAS) {
    for (const m of n.matchAll(re)) {
      const desde = m.index + m[0].length;
      const r = RE_NUM_TRAS.exec(n.slice(desde));
      if (r) guardar(clave, desde + r[0].length - r[1].length, r[1]);
    }
  }
  return numeros;
}

// Listas de valores: "x = 100, 250, 400 y 500", "a 4 m del centro"
function extraerListas(t, n) {
  const listas = { x: [], y: [] };
  const sep = `(?:\\s*(?:,\\s|;|\\sy\\s)\\s*${NUM})*`;
  for (const v of ['x', 'y']) {
    const re = new RegExp(`(?<![a-z])${v}\\s*=\\s*${NUM}${sep}`, 'g');
    for (const m of n.matchAll(re)) {
      const sig = n[m.index + m[0].length];
      if (sig !== undefined && /[a-zñ²^]/.test(sig)) continue;
      for (const x of m[0].slice(m[0].indexOf('=') + 1).split(/,\s|;|\sy\s/)) {
        if (leerNumero(x.trim()).num) listas[v].push(x.trim());
      }
    }
  }
  for (const m of n.matchAll(new RegExp(`a\\s+${NUM}\\s*(?:m|metros|cm|km)?\\s+del\\s+centro`, 'g'))) listas.x.push(m[1]);
  return listas;
}

// ---------- Roles (qué es cada punto o recta según las palabras que lo preceden) ----------

const ROLES_PUNTO = [
  ['centro', /centro/g], ['foco', /focos?\b/g], ['vertice', /vertices?\b/g], ['tangencia', /tangencia/g],
  ['extremo', /extremos?|diametro/g], ['estacion', /estacion/g],
];
const ROLES_PUNTO_GENERICOS = [['pasa', /pasan? por|contiene/g], ['punto', /puntos?\b/g]];
const ROLES_RECTA = [['tangente', /tangente/g], ['directriz', /directriz/g], ['asintota', /asintota/g], ['centro', /centro/g]];
const POR_NOMBRE = { C: 'centro', F: 'foco', V: 'vertice', T: 'tangencia', S: 'estacion' };

function ultimoRol(region, tabla) {
  let mejor = null;
  let pos = -1;
  for (const [rol, re] of tabla) {
    for (const m of region.matchAll(re)) {
      if (m.index > pos) {
        pos = m.index;
        mejor = rol;
      }
    }
  }
  return mejor;
}

// ---------- Contexto ----------

export function analizarTexto(enunciado) {
  const t = String(enunciado ?? '');
  const n = normalizar(t);
  const palabras = new Set(Object.keys(PALABRAS).filter((k) => PALABRAS[k].test(n)));

  const ecuacionesYRectas = extraerEcuaciones(t, n);
  const ecuaciones = [];
  const rectas = [];
  for (const e of ecuacionesYRectas) {
    if (e.grado === 2) {
      const res = resolverDesdeEcuacion(e.texto);
      ecuaciones.push({ ...e, res, tipo: res.ok ? res.tipo : null });
    } else {
      const r = leerRecta(e.texto);
      if (r.recta) rectas.push({ ...e, recta: r.recta });
    }
  }
  const ocupado = ecuacionesYRectas.map((e) => ({ pos: e.pos, len: e.len }));
  const puntos = extraerPuntos(t, n, ocupado);
  for (const m of n.matchAll(/(vertice|centro)\s+(?:esta\s+|ubicado\s+)?en\s+el\s+origen/g)) {
    const pos = m.index + m[0].lastIndexOf('origen');
    puntos.push({ nombre: null, P: pt(0, 0), pos, len: 6, texto: t.slice(pos, pos + 6), rolFijo: m[1] });
  }
  puntos.sort((a, b) => a.pos - b.pos);
  ocupado.push(...puntos.map((p) => ({ pos: p.pos, len: p.len })));
  const numeros = extraerNumeros(t, n, ocupado);
  const listas = extraerListas(t, n);

  // Roles: se mira el texto entre el dato anterior y este.
  const todos = [...puntos.map((p) => ({ ...p, clase: 'punto' })), ...rectas.map((r) => ({ ...r, clase: 'recta' })), ...ecuaciones.map((e) => ({ ...e, clase: 'ecuacion' }))]
    .sort((a, b) => a.pos - b.pos);
  let finAnterior = 0;
  let rolAnterior = null;
  const conRol = new Map();
  for (const d of todos) {
    const region = n.slice(finAnterior, d.pos);
    if (d.clase === 'punto') {
      let rol = d.rolFijo ?? ultimoRol(region, ROLES_PUNTO);
      if (!rol && rolAnterior && region.trim().length <= 4) rol = rolAnterior;
      if (!rol && d.nombre && POR_NOMBRE[d.nombre[0]]) rol = POR_NOMBRE[d.nombre[0]];
      if (!rol) rol = ultimoRol(region, ROLES_PUNTO_GENERICOS) ?? (rolAnterior === 'pasa' || rolAnterior === 'punto' ? rolAnterior : null);
      conRol.set(d.pos + ':' + fmtP(d.P), rol);
      rolAnterior = rol;
    } else if (d.clase === 'recta') {
      d.rol = ultimoRol(region, ROLES_RECTA);
      conRol.set(`r${d.pos}`, d.rol);
      rolAnterior = null;
    } else rolAnterior = null;
    finAnterior = Math.max(finAnterior, d.pos + d.len);
  }
  for (const p of puntos) p.rol = conRol.get(p.pos + ':' + fmtP(p.P)) ?? null;
  for (const r of rectas) r.rol = conRol.get(`r${r.pos}`) ?? null;

  // Coeficiente de t² en trayectorias: "y = at − t² + b"
  let alfa = null;
  const ma = /([+-]?)\s*(\d+(?:[.,]\d+)?)?\s*\*?\s*t\s*(?:\^\s*2|²)/.exec(n);
  if (ma) alfa = `${ma[1] === '-' ? '−' : ''}${ma[2] ?? '1'}`;

  const pide = [];
  if (palabras.has('general')) pide.push('ecuación general');
  if (palabras.has('ordinaria')) pide.push(/canonica/.test(n) ? 'ecuación canónica' : 'forma ordinaria (estándar)');
  if (/(?:determin|hall|calcul|encuentr|obten|indica)\w*[^.]*\bcentro\b/.test(n) && !puntos.some((p) => p.rol === 'centro')) pide.push('centro');
  if (/longitud del eje menor|(?:determin|hall|calcul)\w*[^.]*eje menor/.test(n) && !numeros.ejeMenor) pide.push('longitud del eje menor');
  if (/recta tangente/.test(n)) pide.push('recta tangente');
  if (palabras.has('posicion')) pide.push('posición relativa');
  if (/elementos/.test(n)) pide.push('elementos');
  if (/altura|alturas/.test(n) && APLICACIONES.some((a) => palabras.has(a))) pide.push('alturas');
  if (/perihelio|afelio/.test(n)) pide.push('perihelio y afelio');

  return { texto: t, norm: n, palabras, ecuaciones, rectas, puntos, numeros, listas, alfa, pide };
}

// ---------- Reglas ----------

const de = (c, ...roles) => c.puntos.filter((p) => roles.includes(p.rol));
const sin = (c, ...roles) => c.puntos.filter((p) => !roles.includes(p.rol));
const tiene = (c, k) => c.palabras.has(k);
const esConica = (c, nombre) => tiene(c, nombre) || c.ecuaciones.some((e) => e.tipo === nombre);
const ecDe = (c, nombre) => c.ecuaciones.filter((e) => e.tipo === nombre && e.res.ok && !e.res.degenerada);
// El punto tal como lo escribió el estudiante (si tenía ±, ya expandido)
const txtP = (p) => {
  if (!p) return '';
  if (p.texto.includes('±') || !p.texto.includes('(')) return fmtP(p.P);
  return p.texto.replace(/^[A-Z][0-9₀-₉]?\s*[=:]?\s*/, '');
};
const num = (c, k) => c.numeros[k]?.texto ?? '';
const rectaCon = (c, rol) => c.rectas.find((r) => r.rol === rol);
const puntaje = (...pares) => pares.reduce((s, [cond, peso]) => s + (cond ? peso : 0), 0);
const dos = (lista) => lista.length === 2;

function directriz(c) {
  return c.rectas.find((r) => r.rol === 'directriz' && (esVertical(r.recta) || esHorizontal(r.recta))) ??
    (tiene(c, 'directriz') ? c.rectas.find((r) => esVertical(r.recta) || esHorizontal(r.recta)) : undefined);
}

function constantes(c, cual) {
  return c.rectas
    .filter((r) => (cual === 'x' ? esVertical(r.recta) : esHorizontal(r.recta)))
    .map((r) => fmtCorto((cual === 'x' ? r.recta.c.neg().entre(r.recta.a) : r.recta.c.neg().entre(r.recta.b))));
}

const lista = (...grupos) => [...new Set(grupos.flat().map((s) => s.replace(/\s/g, '').replace(/-/g, '−')))].join('; ');

export const REGLAS = [
  {
    tipo: 'ecuacion',
    puntaje: (c) => (c.ecuaciones.length === 1 && !c.puntos.length && !c.rectas.length ? (c.ecuaciones[0].tipo === 'parabola' ? 5 : 8) : 0),
    llenar: (c) => ({ ecuacion: c.ecuaciones[0].texto }),
  },
  {
    tipo: 'par-ecuacion',
    puntaje: (c) => (c.ecuaciones.length === 1 && c.ecuaciones[0].tipo === 'parabola' && !c.puntos.length && !c.rectas.length ? 8 : 0),
    llenar: (c) => ({ ecuacion: c.ecuaciones[0].texto }),
  },
  // ----- Circunferencia -----
  {
    tipo: 'circ-centro-radio',
    puntaje: (c) => puntaje([esConica(c, 'circunferencia'), 3], [de(c, 'centro').length === 1, 4], [c.numeros.radio, 4], [c.rectas.length, -3], [sin(c, 'centro').length, -2]),
    llenar: (c) => ({ C: txtP(de(c, 'centro')[0] ?? c.puntos[0]), r: num(c, 'radio') }),
  },
  {
    tipo: 'circ-centro-punto',
    puntaje: (c) => puntaje([esConica(c, 'circunferencia'), 3], [de(c, 'centro').length === 1, 4], [sin(c, 'centro').length === 1, 3], [tiene(c, 'pasaPor'), 1], [c.numeros.radio, -3], [c.rectas.length, -3]),
    llenar: (c) => ({ C: txtP(de(c, 'centro')[0]), P: txtP(sin(c, 'centro')[0]) }),
  },
  {
    tipo: 'circ-diametro',
    puntaje: (c) => puntaje([esConica(c, 'circunferencia'), 3], [tiene(c, 'diametro'), 4], [dos(c.puntos), 3]),
    llenar: (c) => ({ A: txtP(c.puntos[0]), B: txtP(c.puntos[1]) }),
  },
  {
    tipo: 'circ-tres-puntos',
    puntaje: (c) => puntaje([esConica(c, 'circunferencia'), 3], [sin(c, 'centro').length === 3 && !de(c, 'centro').length, 6], [tiene(c, 'pasaPor'), 1]),
    llenar: (c) => ({ P: txtP(c.puntos[0]), Q: txtP(c.puntos[1]), R: txtP(c.puntos[2]) }),
  },
  {
    tipo: 'circ-centro-tangente',
    puntaje: (c) => puntaje([esConica(c, 'circunferencia'), 3], [de(c, 'centro').length === 1, 3], [c.rectas.length === 1, 3], [tiene(c, 'tangente'), 2], [sin(c, 'centro').length >= 2, -4]),
    llenar: (c) => ({ C: txtP(de(c, 'centro')[0]), L: c.rectas[0]?.texto ?? '' }),
  },
  {
    tipo: 'circ-centro-tangente-ab',
    puntaje: (c) => puntaje([esConica(c, 'circunferencia'), 3], [de(c, 'centro').length === 1, 3], [tiene(c, 'tangente'), 2], [dos(sin(c, 'centro')), 4], [!c.rectas.length, 1]),
    llenar: (c) => ({ C: txtP(de(c, 'centro')[0]), A: txtP(sin(c, 'centro')[0]), B: txtP(sin(c, 'centro')[1]) }),
  },
  {
    tipo: 'circ-tangente-centro-en-recta',
    puntaje: (c) => puntaje([esConica(c, 'circunferencia'), 3], [tiene(c, 'tangente'), 2], [dos(c.rectas), 4], [c.puntos.length === 1, 2], [rectaCon(c, 'centro'), 2]),
    llenar: (c) => {
      const centro = rectaCon(c, 'centro') ?? c.rectas[1];
      const tang = c.rectas.find((r) => r !== centro);
      return { L: tang?.texto ?? '', T: txtP(c.puntos[0]), M: centro?.texto ?? '' };
    },
  },
  {
    tipo: 'circ-recta-tangente',
    puntaje: (c) => puntaje([ecDe(c, 'circunferencia').length === 1, 4], [c.puntos.length === 1, 3], [tiene(c, 'tangente'), 3], [c.rectas.length, -2]),
    llenar: (c) => ({ ecuacion: ecDe(c, 'circunferencia')[0].texto, A: txtP(c.puntos[0]) }),
  },
  {
    tipo: 'circ-posicion-recta',
    puntaje: (c) => puntaje([ecDe(c, 'circunferencia').length === 1, 4], [c.rectas.length >= 1, 3], [tiene(c, 'posicion'), 3]),
    llenar: (c) => ({ L: c.rectas[0]?.texto ?? '', ecuacion: ecDe(c, 'circunferencia')[0].texto }),
  },
  {
    tipo: 'circ-posicion-circunferencias',
    puntaje: (c) => puntaje([ecDe(c, 'circunferencia').length === 2, 8], [tiene(c, 'posicion'), 2]),
    llenar: (c) => ({ ec1: ecDe(c, 'circunferencia')[0].texto, ec2: ecDe(c, 'circunferencia')[1].texto }),
  },
  {
    tipo: 'circ-punto-tangente-en-punto',
    puntaje: (c) => puntaje([esConica(c, 'circunferencia'), 3], [tiene(c, 'tangente'), 2], [c.rectas.length === 1, 2], [dos(c.puntos) && !de(c, 'centro').length, 3], [tiene(c, 'pasaPor'), 1]),
    llenar: (c) => {
      const T = de(c, 'tangencia')[0] ?? c.puntos[1];
      const P = c.puntos.find((p) => p !== T);
      return { P: txtP(P), L: c.rectas[0]?.texto ?? '', T: txtP(T) };
    },
  },
  // ----- Parábola -----
  {
    tipo: 'par-vertice-foco',
    puntaje: (c) => puntaje([esConica(c, 'parabola'), 3], [de(c, 'vertice').length === 1, 3], [de(c, 'foco').length === 1, 3], [directriz(c), -3]),
    llenar: (c) => ({ V: txtP(de(c, 'vertice')[0]), F: txtP(de(c, 'foco')[0]) }),
  },
  {
    tipo: 'par-foco-directriz',
    puntaje: (c) => puntaje([esConica(c, 'parabola'), 3], [de(c, 'foco').length === 1, 3], [directriz(c), 4], [de(c, 'vertice').length, -2]),
    llenar: (c) => ({ F: txtP(de(c, 'foco')[0]), d: directriz(c)?.texto ?? '' }),
  },
  {
    tipo: 'par-vertice-directriz',
    puntaje: (c) => puntaje([esConica(c, 'parabola'), 3], [de(c, 'vertice').length === 1, 3], [directriz(c), 4], [de(c, 'foco').length, -2]),
    llenar: (c) => ({ V: txtP(de(c, 'vertice')[0]), d: directriz(c)?.texto ?? '' }),
  },
  {
    tipo: 'par-vertice-punto',
    puntaje: (c) => puntaje([esConica(c, 'parabola'), 3], [de(c, 'vertice').length === 1, 3], [sin(c, 'vertice', 'foco').length === 1, 3], [tiene(c, 'ejeX') || tiene(c, 'ejeY'), 1], [de(c, 'foco').length, -3]),
    llenar: (c) => ({ V: txtP(de(c, 'vertice')[0]), eje: tiene(c, 'ejeX') ? 'horizontal' : 'vertical', P: txtP(sin(c, 'vertice', 'foco')[0]) }),
  },
  {
    tipo: 'par-tres-puntos',
    puntaje: (c) => puntaje([esConica(c, 'parabola'), 3], [sin(c, 'vertice', 'foco').length === 3, 6]),
    llenar: (c) => ({ P: txtP(c.puntos[0]), Q: txtP(c.puntos[1]), R: txtP(c.puntos[2]) }),
  },
  // ----- Elipse -----
  {
    tipo: 'eli-focos-vertices',
    puntaje: (c) => puntaje([esConica(c, 'elipse'), 3], [dos(de(c, 'foco')), 3], [dos(de(c, 'vertice')), 3]),
    llenar: (c) => ({ F1: txtP(de(c, 'foco')[0]), F2: txtP(de(c, 'foco')[1]), V1: txtP(de(c, 'vertice')[0]), V2: txtP(de(c, 'vertice')[1]) }),
  },
  {
    tipo: 'eli-centro-vertice-foco',
    puntaje: (c) => puntaje([esConica(c, 'elipse'), 3], [de(c, 'centro').length === 1, 3], [de(c, 'vertice').length === 1, 2], [de(c, 'foco').length === 1, 2]),
    llenar: (c) => ({ C: txtP(de(c, 'centro')[0]), V: txtP(de(c, 'vertice')[0]), F: txtP(de(c, 'foco')[0]) }),
  },
  {
    tipo: 'eli-vertices-excentricidad',
    puntaje: (c) => puntaje([esConica(c, 'elipse'), 3], [dos(de(c, 'vertice')), 3], [c.numeros.excentricidad, 4]),
    llenar: (c) => ({ V1: txtP(de(c, 'vertice')[0]), V2: txtP(de(c, 'vertice')[1]), e: num(c, 'excentricidad') }),
  },
  {
    tipo: 'eli-vertices-lado-recto',
    puntaje: (c) => puntaje([esConica(c, 'elipse'), 3], [dos(de(c, 'vertice')), 3], [c.numeros.ladoRecto, 4]),
    llenar: (c) => ({ V1: txtP(de(c, 'vertice')[0]), V2: txtP(de(c, 'vertice')[1]), LR: num(c, 'ladoRecto') }),
  },
  {
    tipo: 'eli-vertices-eje-menor',
    puntaje: (c) => puntaje([esConica(c, 'elipse'), 3], [dos(de(c, 'vertice')), 3], [c.numeros.ejeMenor || de(c, 'extremo').length, 4]),
    llenar: (c) => ({ V1: txtP(de(c, 'vertice')[0]), V2: txtP(de(c, 'vertice')[1]), B: txtP(de(c, 'extremo')[0]), L: de(c, 'extremo').length ? '' : num(c, 'ejeMenor') }),
  },
  {
    tipo: 'eli-focos-eje',
    puntaje: (c) => puntaje([esConica(c, 'elipse'), 3], [dos(de(c, 'foco')), 3], [c.numeros.ejeMayor || c.numeros.ejeMenor, 4], [de(c, 'vertice').length, -2]),
    llenar: (c) => ({ F1: txtP(de(c, 'foco')[0]), F2: txtP(de(c, 'foco')[1]), cual: c.numeros.ejeMayor ? 'mayor' : 'menor', L: num(c, 'ejeMayor') || num(c, 'ejeMenor') }),
  },
  // ----- Hipérbola -----
  {
    tipo: 'hip-vertices-focos',
    puntaje: (c) => puntaje([esConica(c, 'hiperbola'), 3], [dos(de(c, 'foco')), 3], [dos(de(c, 'vertice')), 3]),
    llenar: (c) => ({ V1: txtP(de(c, 'vertice')[0]), V2: txtP(de(c, 'vertice')[1]), F1: txtP(de(c, 'foco')[0]), F2: txtP(de(c, 'foco')[1]) }),
  },
  {
    tipo: 'hip-vertices-lado-recto',
    puntaje: (c) => puntaje([esConica(c, 'hiperbola'), 3], [dos(de(c, 'vertice')), 3], [c.numeros.ladoRecto, 4]),
    llenar: (c) => ({ V1: txtP(de(c, 'vertice')[0]), V2: txtP(de(c, 'vertice')[1]), LR: num(c, 'ladoRecto') }),
  },
  {
    tipo: 'hip-vertices-asintota',
    puntaje: (c) => puntaje([esConica(c, 'hiperbola'), 3], [dos(de(c, 'vertice')), 3], [rectaCon(c, 'asintota') || (tiene(c, 'asintota') && c.rectas.length === 1), 4]),
    llenar: (c) => ({ V1: txtP(de(c, 'vertice')[0]), V2: txtP(de(c, 'vertice')[1]), A: (rectaCon(c, 'asintota') ?? c.rectas[0])?.texto ?? '' }),
  },
  {
    tipo: 'hip-focos-excentricidad',
    puntaje: (c) => puntaje([esConica(c, 'hiperbola'), 3], [dos(de(c, 'foco')), 3], [c.numeros.excentricidad, 4]),
    llenar: (c) => ({ F1: txtP(de(c, 'foco')[0]), F2: txtP(de(c, 'foco')[1]), e: num(c, 'excentricidad') }),
  },
  {
    tipo: 'hip-centro-vertice-foco',
    puntaje: (c) => puntaje([esConica(c, 'hiperbola'), 3], [de(c, 'centro').length === 1, 3], [de(c, 'vertice').length === 1, 2], [de(c, 'foco').length === 1, 2]),
    llenar: (c) => ({ C: txtP(de(c, 'centro')[0]), V: txtP(de(c, 'vertice')[0]), F: txtP(de(c, 'foco')[0]) }),
  },
  // ----- Aplicaciones -----
  {
    tipo: 'app-rueda',
    puntaje: (c) => puntaje([tiene(c, 'rueda'), 6], [ecDe(c, 'circunferencia').length === 1 || (de(c, 'centro').length && c.numeros.radio), 3]),
    llenar: (c) => {
      const ec = ecDe(c, 'circunferencia')[0];
      const C = ec ? fmtP(pt(ec.res.valores.h, ec.res.valores.k)) : txtP(de(c, 'centro')[0]);
      const r = ec ? fmtCorto(ec.res.valores.r) : num(c, 'radio');
      return { C, r, xs: lista(constantes(c, 'x'), c.listas.x), ys: lista(constantes(c, 'y'), c.listas.y) };
    },
  },
  {
    tipo: 'app-puente',
    puntaje: (c) => puntaje([tiene(c, 'puente') || (tiene(c, 'arco') && tiene(c, 'parabola')), 6], [c.numeros.luz, 2], [c.numeros.altura, 2]),
    llenar: (c) => ({
      forma: tiene(c, 'arco') && !/cable|colgante/.test(c.norm) ? 'arco' : 'colgante',
      L: num(c, 'luz'),
      H: num(c, 'altura'),
      xs: lista(c.listas.x),
    }),
  },
  {
    tipo: 'app-trayectoria',
    puntaje: (c) => puntaje([tiene(c, 'trayectoria'), 5], [c.alfa, 2], [dos(c.puntos), 2]),
    llenar: (c) => ({ alfa: c.alfa ?? '−1', P1: txtP(c.puntos[0]), P2: txtP(c.puntos[1]) }),
  },
  {
    tipo: 'app-tunel',
    puntaje: (c) => puntaje([tiene(c, 'tunel'), 6], [c.numeros.luz, 2], [c.numeros.altura, 2]),
    llenar: (c) => ({ W: num(c, 'luz'), H: num(c, 'altura'), xs: lista(c.listas.x) }),
  },
  {
    tipo: 'app-orbita',
    puntaje: (c) => puntaje([tiene(c, 'orbita'), 6], [c.numeros.excentricidad, 2], [c.numeros.ejeMayor || c.numeros.ejeMenor, 2]),
    llenar: (c) => ({ e: num(c, 'excentricidad'), cual: c.numeros.ejeMayor ? 'mayor' : 'menor', L: num(c, 'ejeMayor') || num(c, 'ejeMenor') }),
  },
  {
    tipo: 'app-loran',
    puntaje: (c) => puntaje([tiene(c, 'loran'), 6], [dos(c.puntos), 2], [c.numeros.tiempo, 1], [c.numeros.velocidad, 1]),
    llenar: (c) => {
      const ys = constantes(c, 'y');
      const xs = constantes(c, 'x');
      return {
        S1: txtP(c.puntos[0]),
        S2: txtP(c.puntos[1]),
        dt: num(c, 'tiempo'),
        v: num(c, 'velocidad'),
        cual: xs.length && !ys.length ? 'x' : 'y',
        valor: (xs.length && !ys.length ? xs[0] : ys[0]) ?? '',
      };
    },
  },
];

// ---------- Datos legibles y marcas para resaltar ----------

const ROL_TEXTO = {
  centro: 'Centro', foco: 'Foco', vertice: 'Vértice', tangencia: 'Punto de tangencia', extremo: 'Extremo',
  estacion: 'Estación', pasa: 'Punto por donde pasa', punto: 'Punto',
};
const NUM_TEXTO = {
  radio: 'Radio', ladoRecto: 'Lado recto', excentricidad: 'Excentricidad', ejeMenor: 'Eje menor', ejeMayor: 'Eje mayor',
  luz: 'Distancia / ancho', altura: 'Altura', tiempo: 'Diferencia de tiempos', velocidad: 'Velocidad',
};
const RECTA_TEXTO = { tangente: 'Recta tangente', directriz: 'Directriz', asintota: 'Asíntota', centro: 'Recta del centro' };

function datosLegibles(c) {
  const out = [];
  for (const e of c.ecuaciones) out.push({ etiqueta: e.tipo ? `Ecuación (${NOMBRES[e.tipo].toLowerCase()})` : 'Ecuación', valor: e.texto });
  for (const r of c.rectas) out.push({ etiqueta: RECTA_TEXTO[r.rol] ?? 'Recta', valor: fmtRecta(r.recta) });
  for (const p of c.puntos) out.push({ etiqueta: `${ROL_TEXTO[p.rol] ?? 'Punto'}${p.nombre ? ` ${p.nombre}` : ''}`, valor: fmtP(p.P) });
  for (const [k, v] of Object.entries(c.numeros)) out.push({ etiqueta: NUM_TEXTO[k] ?? k, valor: v.texto });
  return out;
}

function marcas(c, finEnunciado) {
  const lista = [
    ...c.ecuaciones.map((e) => ({ pos: e.pos, len: e.len, clase: 'ecuacion' })),
    ...c.rectas.map((r) => ({ pos: r.pos, len: r.len, clase: 'recta' })),
    ...c.puntos.map((p) => ({ pos: p.pos, len: p.len, clase: 'punto' })),
    ...Object.values(c.numeros).map((v) => ({ pos: v.pos, len: v.len, clase: 'numero' })),
  ];
  lista.sort((a, b) => a.pos - b.pos || b.len - a.len);
  const out = [];
  for (const m of lista) {
    if (m.pos + m.len > finEnunciado) continue;
    if (out.length && m.pos < out[out.length - 1].pos + out[out.length - 1].len) continue;
    out.push(m);
  }
  return out;
}

// ---------- Entrada principal ----------

export function detectar(texto) {
  const original = String(texto ?? '');
  if (!original.trim()) return { ok: false, tema: false, mensaje: 'Pega o escribe el enunciado de la pregunta.' };
  const { enunciado, alternativas, inicio } = separarAlternativas(original);
  const c = analizarTexto(original.slice(0, inicio));
  const tema = CONICAS.some((k) => tiene(c, k)) || c.ecuaciones.length > 0 || APLICACIONES.some((k) => tiene(c, k));
  if (!tema) {
    const fuera = FUERA_DE_TEMA.exec(c.norm);
    return {
      ok: false,
      tema: false,
      enunciado,
      alternativas,
      mensaje: fuera
        ? `Este enunciado parece de otro tema («${original.slice(fuera.index, fuera.index + fuera[0].length)}…»). Este resolvedor solo trabaja circunferencia, parábola, elipse e hipérbola.`
        : 'No encontré nada de circunferencia, parábola, elipse o hipérbola en el texto. Revisa que el enunciado esté completo o elige el tipo de pregunta en la lista.',
    };
  }
  const opciones = REGLAS.map((r) => ({ tipo: r.tipo, puntaje: r.puntaje(c), regla: r }))
    .filter((o) => o.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje)
    .map((o) => {
      let crudos = {};
      try {
        crudos = o.regla.llenar(c);
      } catch {
        crudos = {};
      }
      return { tipo: o.tipo, titulo: tipoPorId(o.tipo).titulo, puntaje: o.puntaje, crudos };
    });
  const mejor = opciones[0];
  const segundo = opciones[1];
  const confianza = mejor && mejor.puntaje >= 7 && (!segundo || mejor.puntaje - segundo.puntaje >= 2) ? 'alta' : 'baja';
  return {
    ok: true,
    tema: true,
    tipo: mejor && mejor.puntaje >= 5 ? mejor.tipo : null,
    crudos: mejor?.crudos ?? {},
    confianza,
    opciones: opciones.slice(0, 3).filter((o, i) => i === 0 || o.puntaje >= Math.max(3, mejor.puntaje - 4)),
    datos: datosLegibles(c),
    pide: c.pide,
    marcas: marcas(c, inicio),
    enunciado,
    alternativas,
    contexto: c,
    mensaje: mejor
      ? null
      : 'Reconozco que es de cónicas, pero no encontré datos suficientes para elegir el tipo de pregunta. Elige el tipo en la lista y escribe los datos.',
  };
}
