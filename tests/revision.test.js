// Fase 5, revisión final: ningún resultado muestra errores de coma flotante, puntos decimales
// en inglés, NaN/undefined ni textos en inglés. Se revisan todos los ejemplos y muchos ejercicios
// aleatorios.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIPOS_PREGUNTA } from '../js/problemas/tipos.js';
import { resolverPregunta } from '../js/problemas/solucionador.js';
import { generarEjercicio, ejercicioGrafica } from '../js/problemas/practica.js';
import { resolverDesdeEcuacion } from '../js/problemas/desde-general.js';
import { EJEMPLOS_ECUACIONES } from '../js/problemas/ejemplos.js';
import { aTexto } from '../js/math/formato.js';

// Todos los textos que ve el estudiante en una solución (menos lo que él mismo escribió)
function textos(res) {
  const out = [];
  for (const d of res.datos ?? []) if (d.mat !== undefined) out.push(d.mat);
  out.push(...(res.formulas ?? []));
  for (const p of res.pasos ?? []) {
    out.push(p.titulo, p.texto ?? '', p.formula ?? '', ...(p.mat ?? []));
    for (const e of p.tabla ?? []) out.push(e.nombre, e.valor, e.formula ?? '');
  }
  out.push(res.respuestaTexto ?? '', res.mensaje ?? '');
  return out.map((t) => aTexto(String(t)));
}

const PROBLEMAS = [
  [/\d\.\d/, 'punto decimal (debe ser coma)'],
  [/\d[,]\d{4,}/, 'demasiados decimales (posible error de coma flotante)'],
  [/NaN|undefined|Infinity|\[object|null/, 'valor inválido'],
  [/\d(?:,\d+)?e[+-]?\d/, 'notación científica'],
  [/(?<![\w])-\d/, 'signo menos con guion en vez de “−”'],
  [/\b(?:the|and|line|circle|point|error:|value|equation)\b/i, 'texto en inglés'],
];

function revisar(nombre, res) {
  for (const t of textos(res)) {
    for (const [re, que] of PROBLEMAS) assert.ok(!re.test(t), `${nombre}: ${que} en «${t}»`);
  }
}

test('ejemplos de todos los tipos: sin errores de formato', () => {
  for (const t of TIPOS_PREGUNTA) {
    const r = resolverPregunta(t.id, Object.fromEntries(t.campos.map((c) => [c.id, c.ejemplo])));
    assert.ok(r.ok);
    revisar(t.id, r);
  }
  for (const e of EJEMPLOS_ECUACIONES) revisar(e.nombre, resolverDesdeEcuacion(e.ecuacion));
});

test('300 ejercicios aleatorios: sin errores de formato', () => {
  for (let s = 1; s <= 300; s++) {
    const e = generarEjercicio({ semilla: s * 977 });
    assert.ok(e.ok, e.error);
    revisar(`${e.tipo} (semilla ${s * 977})`, e.res);
  }
});

test('Grafica tú: ecuaciones y pasos sin errores de formato', () => {
  for (let s = 1; s <= 60; s++) {
    const g = ejercicioGrafica({ semilla: s });
    for (const [re, que] of PROBLEMAS) {
      assert.ok(!re.test(g.ecuacion), `${que} en ${g.ecuacion}`);
      for (const p of g.pasos) assert.ok(!re.test(p.titulo), `${que} en «${p.titulo}»`);
    }
    revisar(g.ecuacion, resolverDesdeEcuacion(g.ecuacion));
  }
});

test('mensajes de error en español y sin valores inválidos', () => {
  const malos = [
    ['circ-centro-radio', { C: '(1; 2', r: '3' }],
    ['par-vertice-foco', { V: '(1; 1)', F: '(1; 1)' }],
    ['ecuacion', { ecuacion: 'x^3 + y = 2' }],
    ['eli-vertices-excentricidad', { V1: '(0; 0)', V2: '(4; 0)', e: '2' }],
  ];
  for (const [id, crudos] of malos) {
    const r = resolverPregunta(id, crudos);
    assert.equal(r.ok, false);
    for (const [re, que] of PROBLEMAS.slice(3)) assert.ok(!re.test(r.error), `${id}: ${que} en «${r.error}»`);
  }
});
