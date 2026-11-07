// Cónicas desde sus parámetros: ecuaciones, elementos, validaciones y escena.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as circunferencia from '../js/conicas/circunferencia.js';
import * as parabola from '../js/conicas/parabola.js';
import * as elipse from '../js/conicas/elipse.js';
import * as hiperbola from '../js/conicas/hiperbola.js';

const elem = (res, clave) => res.elementos.find((e) => e.clave === clave);

test('circunferencia h = 3, k = −7, r = 4', () => {
  const r = circunferencia.resolver({ h: '3', k: '−7', r: '4' });
  assert.equal(r.ordinariaTexto, '(x − 3)² + (y + 7)² = 16');
  assert.equal(r.general, 'x² + y² − 6x + 14y + 42 = 0');
  assert.equal(elem(r, 'centro').exacto, '(3; −7)');
});

test('circunferencia de la matriz de punzonado: B(−1,25; −3), r = 0,25', () => {
  const r = circunferencia.resolver({ h: '−1,25', k: '−3', r: '0,25' });
  assert.equal(r.general, '2x² + 2y² + 5x + 12y + 21 = 0');
});

test('parábola vertical h = −1, k = 2, p = −4', () => {
  const r = parabola.resolver({ h: '−1', k: '2', p: '−4' }, 'vertical');
  assert.equal(r.ordinariaTexto, '(x + 1)² = −16(y − 2)');
  assert.equal(r.general, 'x² + 2x + 16y − 31 = 0');
  assert.equal(elem(r, 'foco').exacto, '(−1; −2)');
  assert.equal(elem(r, 'directriz').exacto, 'y = 6');
  assert.equal(elem(r, 'ladoRecto').exacto, '16');
  assert.equal(elem(r, 'abre').valor, 'abajo');
});

test('parábola horizontal V(4; 3), p = 5 → (y − 3)² = 20(x − 4)', () => {
  const r = parabola.resolver({ h: '4', k: '3', p: '5' }, 'horizontal');
  assert.equal(r.ordinariaTexto, '(y − 3)² = 20(x − 4)');
  assert.equal(elem(r, 'foco').exacto, '(9; 3)');
});

test('parábola del puente Golden Gate: x² = (51200/19)y', () => {
  const r = parabola.resolver({ h: '0', k: '0', p: '12800/19' }, 'vertical');
  assert.equal(r.ordinariaTexto, 'x² = (51200/19)y');
});

test('elipse horizontal h = −4, k = 1, a = 3, b = 2', () => {
  const r = elipse.resolver({ h: '−4', k: '1', a: '3', b: '2' }, 'horizontal');
  assert.equal(r.ordinariaTexto, '(x + 4)²/9 + (y − 1)²/4 = 1');
  assert.equal(r.general, '4x² + 9y² + 32x − 18y + 37 = 0');
  assert.equal(elem(r, 'c').exacto, '√5');
  assert.equal(elem(r, 'e').exacto, '√5/3');
});

test('elipse con focos (±3; 0) y vértices (±5; 0)', () => {
  const r = elipse.resolver({ h: 0, k: 0, a: 5, b: 4 }, 'horizontal');
  assert.equal(r.ordinariaTexto, 'x²/25 + y²/16 = 1');
  assert.equal(elem(r, 'f1').exacto, '(−3; 0)');
  assert.equal(elem(r, 'f2').exacto, '(3; 0)');
});

test('hipérbola vertical h = −1, k = 0, a = 2, b = √3', () => {
  const r = hiperbola.resolver({ h: '−1', k: '0', a: '2', b: '√3' }, 'vertical');
  assert.equal(r.general, '4x² − 3y² + 8x + 16 = 0');
  assert.equal(r.ordinariaTexto, 'y²/4 − (x + 1)²/3 = 1');
  assert.equal(elem(r, 'c').exacto, '√7');
});

test('hipérbola con vértices (2; 0) y (6; 0) y focos (0; 0) y (8; 0)', () => {
  const r = hiperbola.resolver({ h: '4', k: '0', a: '2', b: '2√3' }, 'horizontal');
  assert.equal(r.general, '3x² − y² − 24x + 36 = 0');
});

test('validaciones con mensaje claro', () => {
  assert.match(circunferencia.resolver({ h: 0, k: 0, r: '0' }).error, /radio debe ser mayor que 0/);
  assert.match(circunferencia.resolver({ h: 0, k: 0, r: '' }).error, /Falta el valor de r/);
  assert.match(circunferencia.resolver({ h: 'abc', k: 0, r: 2 }).error, /h: «abc» no es un número válido/);
  assert.match(parabola.resolver({ h: 0, k: 0, p: 0 }).error, /p no puede ser 0/);
  assert.match(elipse.resolver({ h: 0, k: 0, a: 2, b: 3 }).error, /a debe ser mayor que b/);
  assert.match(elipse.resolver({ h: 0, k: 0, a: 2, b: 2 }).error, /circunferencia/);
  assert.match(hiperbola.resolver({ h: 0, k: 0, a: -1, b: 2 }).error, /a debe ser mayor que 0/);
  assert.match(hiperbola.resolver({ h: 0, k: 0, a: 1, b: 2 }, 'diagonal').error, /horizontal/);
});

test('escena: la parábola llega hasta el borde de la vista con cualquier zoom', () => {
  const r = parabola.resolver({ h: 0, k: 0, p: 1 }, 'vertical');
  for (const L of [10, 1000, 1e5]) {
    const vista = { xmin: -L, xmax: L, ymin: -L, ymax: L, escala: 400 / L };
    const [linea] = r.escena.curvas[0].muestrear(vista);
    const ultimo = linea[linea.length - 1];
    assert.ok(ultimo[0] >= L || ultimo[1] >= L, `con L = ${L} la curva no sale de la vista`);
  }
});

test('escena: las dos ramas de la hipérbola salen de la vista', () => {
  const r = hiperbola.resolver({ h: 0, k: 0, a: 2, b: 1 }, 'horizontal');
  const L = 500;
  const ramas = r.escena.curvas[0].muestrear({ xmin: -L, xmax: L, ymin: -L, ymax: L, escala: 1 });
  assert.equal(ramas.length, 2);
  for (const rama of ramas) {
    const maxAbs = Math.max(...rama.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))));
    assert.ok(maxAbs >= L);
  }
});

test('escena: elementos con su tipo y grupo para los interruptores', () => {
  const r = elipse.resolver({ h: '−4', k: '1', a: '3', b: '2' }, 'horizontal');
  const focos = r.escena.puntos.filter((p) => p.tipo === 'foco');
  assert.equal(focos.length, 2);
  assert.ok(focos.every((p) => p.grupo === 'focos'));
  assert.equal(r.escena.rectas.filter((x) => x.tipo === 'directriz').length, 2);
  assert.equal(r.escena.segmentos.filter((s) => s.grupo === 'ladoRecto').length, 2);
  assert.equal(focos[0].etiqueta.nombre, 'F₁');
});
