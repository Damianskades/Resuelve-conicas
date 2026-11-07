// Fase 5: modo práctica (ejercicios aleatorios, alternativas con errores típicos y gráfica paso a paso).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generarEjercicio, tiposDisponibles, ejercicioGrafica, pasosGrafica, conicaAleatoria, crearAzar, ADMITE_ALTERNATIVAS,
} from '../js/problemas/practica.js';
import { compararAlternativas } from '../js/problemas/alternativas.js';
import { TIPOS_PREGUNTA } from '../js/problemas/tipos.js';
import { resolver as resolverCircunferencia } from '../js/conicas/circunferencia.js';

test('hay generador para los 35 tipos de pregunta', () => {
  assert.equal(tiposDisponibles().length, TIPOS_PREGUNTA.length);
});

test('cada tipo genera ejercicios válidos con 25 semillas distintas', () => {
  for (const t of tiposDisponibles()) {
    for (let s = 1; s <= 25; s++) {
      const e = generarEjercicio({ tipo: t.id, semilla: s * 7919 });
      assert.ok(e.ok, `${t.id} (semilla ${s}): ${e.error}`);
      assert.ok(e.enunciado.length > 20);
      assert.ok(e.res.ok && e.res.respuesta.lineas.length);
    }
  }
});

test('la misma semilla da el mismo ejercicio', () => {
  const a = generarEjercicio({ semilla: 12345 });
  const b = generarEjercicio({ semilla: 12345 });
  assert.equal(a.enunciado, b.enunciado);
  assert.notEqual(generarEjercicio({ semilla: 54321 }).enunciado, '');
});

test('filtros: solo da tipos de la cónica elegida', () => {
  for (const conica of ['circunferencia', 'parabola', 'elipse', 'hiperbola', 'aplicacion']) {
    for (let s = 1; s <= 15; s++) {
      const e = generarEjercicio({ conica, semilla: s });
      assert.ok(e.ok);
      assert.equal(e.grupo, conica);
    }
  }
  assert.equal(generarEjercicio({ tipo: 'par-vertice-foco', semilla: 3 }).tipo, 'par-vertice-foco');
});

test('modo alternativas: 4 distintas, una correcta y cada distractor explica su error', () => {
  let probados = 0;
  for (let s = 1; s <= 120; s++) {
    const e = generarEjercicio({ semilla: s * 101, alternativas: true });
    assert.ok(e.ok, e.error);
    assert.ok(ADMITE_ALTERNATIVAS.has(e.tipo));
    const alts = e.alternativas;
    assert.equal(alts.length, 4);
    assert.deepEqual(alts.map((a) => a.letra), ['a', 'b', 'c', 'd']);
    assert.equal(alts.filter((a) => a.correcta).length, 1);
    assert.equal(new Set(alts.map((a) => a.texto)).size, 4);
    for (const a of alts.filter((x) => !x.correcta)) assert.ok(a.error.length > 10);
    // Verificación cruzada: el comparador de la Fase 4 solo acepta la correcta
    const c = compararAlternativas(alts, e.res);
    assert.deepEqual(c.correctas, [alts.find((a) => a.correcta).letra], `semilla ${s}: ${JSON.stringify(alts)}`);
    probados++;
  }
  assert.equal(probados, 120);
});

test('distractores con errores típicos de clase', () => {
  const errores = new Set();
  for (let s = 1; s <= 300; s++) {
    const e = generarEjercicio({ semilla: s, alternativas: true });
    for (const a of e.alternativas) if (a.error) errores.add(a.error.split(':')[0].split(' (')[0]);
  }
  const todos = [...errores].join(' | ');
  assert.match(todos, /Signo del centro cambiado/);
  assert.match(todos, /Se confundió a con a²/);
  assert.match(todos, /Se usó c² = a² \+ b²/);
  assert.match(todos, /Se usó p en lugar de 4p/);
  assert.match(todos, /Se olvidó multiplicar por el coeficiente al completar cuadrados/);
});

test('Grafica tú: pasos acumulativos que terminan con la curva', () => {
  for (const tipo of ['circunferencia', 'parabola', 'elipse', 'hiperbola']) {
    const m = conicaAleatoria(crearAzar(7), tipo);
    const pasos = pasosGrafica(m);
    assert.ok(pasos.length >= 3, `${tipo}: ${pasos.length} pasos`);
    assert.ok(['centro', 'vertice'].includes(pasos[0].escena.puntos[0].tipo));
    assert.equal(pasos.at(-1).escena.curvas.length, m.escena.curvas.length);
    for (let i = 1; i < pasos.length; i++) {
      const antes = pasos[i - 1].escena;
      const ahora = pasos[i].escena;
      const total = (e) => e.puntos.length + e.rectas.length + e.segmentos.length + e.curvas.length;
      assert.ok(total(ahora) > total(antes), `${tipo}: el paso ${i + 1} no agrega nada`);
    }
    assert.ok(pasos.every((p) => p.titulo.length > 10));
  }
  const g = ejercicioGrafica({ conica: 'elipse', semilla: 9 });
  assert.equal(g.conica.tipo, 'elipse');
  assert.match(g.ecuacion, /= 0$/);
  assert.match(g.pasos.map((p) => p.titulo).join(' '), /focos/);
});

test('Grafica tú: los cuatro puntos guía son reales y están sobre la circunferencia', () => {
  for (const r of ['√5', '√10', '2√3', '3/2', '3']) {
    const m = resolverCircunferencia({ h: '−2', k: '1/2', r });
    const guias = pasosGrafica(m)[1].escena.puntos.filter((p) => p.tipo === 'guia');
    assert.equal(guias.length, 4);
    assert.equal(new Set(guias.map((p) => `${p.x};${p.y}`)).size, 4);
    for (const p of guias) {
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `radio ${r}: punto inválido`);
      assert.ok(Math.abs((p.x - m.valores.h.v) ** 2 + (p.y - m.valores.k.v) ** 2 - m.valores.r2.v) < 1e-10);
    }
  }
});

test('práctica desde la ecuación general respeta el filtro de cada cónica', () => {
  for (const conica of ['circunferencia', 'parabola', 'elipse', 'hiperbola']) {
    assert.ok(tiposDisponibles(conica).some((t) => t.id === 'ecuacion'));
    for (let semilla = 1; semilla <= 40; semilla++) {
      const e = generarEjercicio({ conica, tipo: 'ecuacion', semilla });
      assert.ok(e.ok, e.error);
      assert.equal(e.res.tipo, conica);
      assert.equal(e.grupo, conica);
    }
  }
});

test('filtros incompatibles o tipos sin alternativas devuelven un error claro', () => {
  for (const filtros of [
    { tipo: 'no-existe' },
    { conica: 'elipse', tipo: 'par-vertice-foco' },
    { tipo: 'circ-posicion-recta', alternativas: true },
    { tipo: 'ecuacion', alternativas: true },
  ]) {
    const e = generarEjercicio(filtros);
    assert.equal(e.ok, false);
    assert.match(e.error, /filtros/);
  }
});

test('todos los tipos admitidos generan cuatro alternativas con una única solución matemática', () => {
  for (const tipo of ADMITE_ALTERNATIVAS) {
    for (let s = 1; s <= 40; s++) {
      const e = generarEjercicio({ tipo, semilla: s * 1009, alternativas: true });
      assert.ok(e.ok, `${tipo}, semilla ${s}: ${e.error}`);
      assert.equal(e.alternativas.length, 4);
      const correctas = e.alternativas.filter((a) => a.correcta).map((a) => a.letra);
      assert.equal(correctas.length, 1);
      assert.deepEqual(compararAlternativas(e.alternativas, e.res).correctas, correctas, `${tipo}, semilla ${s}`);
    }
  }
});

test('las curvas generadas satisfacen sus ecuaciones generales', () => {
  const vista = { xmin: -30, xmax: 30, ymin: -30, ymax: 30, escala: 30 };
  for (const { id: tipo } of tiposDisponibles()) {
    for (let semilla = 1; semilla <= 30; semilla++) {
      const e = generarEjercicio({ tipo, semilla: semilla * 1009 });
      assert.ok(e.ok, e.error);
      for (const m of e.res.conicas ?? []) {
        assert.ok(m.coef, `${tipo}: la ecuación debería ser exacta`);
        const c = Object.fromEntries(Object.entries(m.coef).map(([k, f]) => [k, f.n / f.d]));
        for (const curva of m.escena.curvas) {
          for (const tramo of curva.muestrear(vista)) {
            for (const [x, y] of tramo) {
              assert.ok(Number.isFinite(x) && Number.isFinite(y));
              const terminos = [c.A * x * x, c.B * x * y, c.C * y * y, c.D * x, c.E * y, c.F];
              const residual = terminos.reduce((s, t) => s + t, 0);
              assert.ok(Math.abs(residual) <= 1e-8 * Math.max(1, ...terminos.map(Math.abs)), `${tipo}: ${m.general}, punto (${x}; ${y})`);
            }
          }
        }
      }
    }
  }
});
