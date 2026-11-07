// Casos de clase (docs/casos-de-clase.md) que empiezan con una ecuación, resueltos paso a paso.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolverDesdeEcuacion } from '../js/problemas/desde-general.js';
import { fmtDecimal } from '../js/math/formato.js';

function resolver(texto) {
  const r = resolverDesdeEcuacion(texto);
  assert.ok(r.ok, `«${texto}» dio error: ${r.error}`);
  assert.equal(r.degenerada, false, `«${texto}» salió degenerada`);
  return r;
}
const ex = (r, clave) => r.porClave[clave].exacto;
const aprox = (r, clave) => fmtDecimal(r.porClave[clave].num.v);

function cincoPartes(r) {
  assert.ok(r.datos.length > 0, 'faltan los datos');
  assert.ok(r.formulas.length > 0, 'faltan las fórmulas');
  assert.ok(r.pasos.length >= 3, 'faltan pasos');
  assert.ok(r.respuesta.lineas.length > 0, 'falta la respuesta');
  assert.ok(r.respuestaTexto.length > 0);
  assert.ok(r.escena && r.escena.curvas.length > 0, 'falta la gráfica');
}

// ---------- Circunferencia ----------

test('circunferencia: x² + y² − 6x + 14y + 42 = 0 → C(3; −7), r = 4', () => {
  const r = resolver('x² + y² − 6x + 14y + 42 = 0');
  assert.equal(r.tipo, 'circunferencia');
  assert.equal(r.ordinariaTexto, '(x − 3)² + (y + 7)² = 16');
  assert.equal(ex(r, 'centro'), '(3; −7)');
  assert.equal(ex(r, 'radio'), '4');
  cincoPartes(r);
});

test('circunferencia por P, Q, R: x² + y² − 18x + 6y + 25 = 0 → C(9; −3), r = √65', () => {
  const r = resolver('x^2 + y^2 - 18x + 6y + 25 = 0');
  assert.equal(r.ordinariaTexto, '(x − 9)² + (y + 3)² = 65');
  assert.equal(ex(r, 'centro'), '(9; −3)');
  assert.equal(ex(r, 'radio'), '√65');
});

test('circunferencia tangente: x² + y² + 2x − 8y + 1 = 0 → C(−1; 4), r = 4', () => {
  const r = resolver('x^2 + y^2 + 2x - 8y + 1 = 0');
  assert.equal(ex(r, 'centro'), '(−1; 4)');
  assert.equal(ex(r, 'radio'), '4');
});

test('circunferencia x² + y² − 4x − 6y + 8 = 0 → C(2; 3), r = √5', () => {
  const r = resolver('x² + y² − 4x − 6y + 8 = 0');
  assert.equal(ex(r, 'centro'), '(2; 3)');
  assert.equal(ex(r, 'radio'), '√5');
});

test('matriz de punzonado: 2x² + 2y² + 5x + 12y + 21 = 0 → B(−1,25; −3), r = 0,25', () => {
  const r = resolver('2x^2 + 2y^2 + 5x + 12y + 21 = 0');
  assert.equal(ex(r, 'centro'), '(−5/4; −3)');
  assert.match(r.porClave.centro.valor, /\(−1,25; −3\)/);
  assert.equal(ex(r, 'radio'), '1/4');
  assert.match(r.porClave.radio.valor, /0,25/);
  assert.equal(r.pasos.find((p) => p.titulo.startsWith('Dividimos')).titulo, 'Dividimos toda la ecuación entre 2');
});

test('rueda de la fortuna: x² + (y − 10)² = 81 → C(0; 10), r = 9', () => {
  const r = resolver('x^2 + (y - 10)^2 = 81');
  assert.equal(r.general, 'x² + y² − 20y + 19 = 0');
  assert.equal(ex(r, 'centro'), '(0; 10)');
  assert.equal(ex(r, 'radio'), '9');
});

// ---------- Parábola ----------

test('parábola x² + 2x + 16y − 31 = 0', () => {
  const r = resolver('x^2 + 2x + 16y - 31 = 0');
  assert.equal(r.tipo, 'parabola');
  assert.equal(r.ordinariaTexto, '(x + 1)² = −16(y − 2)');
  assert.equal(ex(r, 'vertice'), '(−1; 2)');
  assert.equal(ex(r, 'cuatroP'), '−16');
  assert.equal(ex(r, 'p'), '−4');
  assert.equal(ex(r, 'foco'), '(−1; −2)');
  assert.equal(ex(r, 'directriz'), 'y = 6');
  assert.equal(ex(r, 'ladoRecto'), '16');
  assert.equal(ex(r, 'abre'), 'abajo');
  assert.equal(ex(r, 'e'), '1');
  cincoPartes(r);
});

test('parábola y² + 6y + 4x + 5 = 0', () => {
  const r = resolver('y² + 6y + 4x + 5 = 0');
  assert.equal(r.ordinariaTexto, '(y + 3)² = −4(x − 1)');
  assert.equal(ex(r, 'vertice'), '(1; −3)');
  assert.equal(ex(r, 'p'), '−1');
  assert.equal(ex(r, 'foco'), '(0; −3)');
  assert.equal(ex(r, 'directriz'), 'x = 2');
  assert.equal(ex(r, 'ladoRecto'), '4');
  assert.equal(ex(r, 'abre'), 'la izquierda');
});

test('parábola con V(−1; 2) y F(−1; 0): x² + 2x + 8y − 15 = 0', () => {
  const r = resolver('x^2 + 2x + 8y - 15 = 0');
  assert.equal(ex(r, 'vertice'), '(−1; 2)');
  assert.equal(ex(r, 'foco'), '(−1; 0)');
});

test('parábola (y − 3)² = 20(x − 4): V(4; 3), F(9; 3)', () => {
  const r = resolver('(y - 3)^2 = 20(x - 4)');
  assert.equal(ex(r, 'vertice'), '(4; 3)');
  assert.equal(ex(r, 'foco'), '(9; 3)');
  assert.equal(r.ordinariaTexto, '(y − 3)² = 20(x − 4)');
});

test('parábola y² = 8x: p = 2', () => {
  const r = resolver('y^2 = 8x');
  assert.equal(ex(r, 'p'), '2');
  assert.equal(ex(r, 'foco'), '(2; 0)');
});

test('puente Golden Gate: x² = (51200/19)y', () => {
  const r = resolver('x^2 = (51200/19)y');
  assert.equal(r.ordinariaTexto, 'x² = (51200/19)y');
  assert.equal(r.general, '19x² − 51200y = 0');
});

test('drone: y = 8x − x² → vértice (4; 16)', () => {
  const r = resolver('y = 8x - x^2');
  assert.equal(ex(r, 'vertice'), '(4; 16)');
  assert.equal(r.ordinariaTexto, '(x − 4)² = −(y − 16)');
});

// ---------- Elipse ----------

test('elipse 4x² + 9y² + 32x − 18y + 37 = 0', () => {
  const r = resolver('4x² + 9y² + 32x − 18y + 37 = 0');
  assert.equal(r.tipo, 'elipse');
  assert.equal(r.orientacion, 'horizontal');
  assert.equal(r.ordinariaTexto, '(x + 4)²/9 + (y − 1)²/4 = 1');
  assert.equal(ex(r, 'centro'), '(−4; 1)');
  assert.equal(ex(r, 'a'), '3');
  assert.equal(ex(r, 'b'), '2');
  assert.equal(ex(r, 'c'), '√5');
  assert.equal(ex(r, 'v1'), '(−7; 1)');
  assert.equal(ex(r, 'v2'), '(−1; 1)');
  assert.equal(ex(r, 'f1'), '(−4 − √5; 1)');
  assert.equal(ex(r, 'f2'), '(−4 + √5; 1)');
  assert.equal(aprox(r, 'd1'), '−8,02');
  assert.equal(aprox(r, 'd2'), '0,02');
  assert.equal(ex(r, 'ladoRecto'), '8/3');
  assert.equal(aprox(r, 'ladoRecto'), '2,67');
  assert.equal(ex(r, 'e'), '√5/3');
  cincoPartes(r);
});

test('elipse 9x² + 25y² − 36x − 50y + 60 = 0 → C(2; 1), eje menor 2/5', () => {
  const r = resolver('9x^2 + 25y^2 - 36x - 50y + 60 = 0');
  assert.equal(ex(r, 'centro'), '(2; 1)');
  assert.equal(ex(r, 'ejeMenor'), '2/5');
  assert.equal(r.ordinariaTexto, '(x − 2)²/(1/9) + (y − 1)²/(1/25) = 1');
});

test('elipse x²/25 + y²/16 = 1 → focos (±3; 0), vértices (±5; 0)', () => {
  const r = resolver('x^2/25 + y^2/16 = 1');
  assert.equal(ex(r, 'f1'), '(−3; 0)');
  assert.equal(ex(r, 'f2'), '(3; 0)');
  assert.equal(ex(r, 'v1'), '(−5; 0)');
  assert.equal(ex(r, 'v2'), '(5; 0)');
});

// ---------- Hipérbola ----------

test('hipérbola 4x² − 3y² + 8x + 16 = 0', () => {
  const r = resolver('4x^2 - 3y^2 + 8x + 16 = 0');
  assert.equal(r.tipo, 'hiperbola');
  assert.equal(r.orientacion, 'vertical');
  assert.equal(r.ordinariaTexto, 'y²/4 − (x + 1)²/3 = 1');
  assert.equal(ex(r, 'centro'), '(−1; 0)');
  assert.equal(ex(r, 'a'), '2');
  assert.equal(ex(r, 'b'), '√3');
  assert.equal(ex(r, 'c'), '√7');
  assert.equal(ex(r, 'v1'), '(−1; −2)');
  assert.equal(ex(r, 'v2'), '(−1; 2)');
  assert.equal(ex(r, 'f1'), '(−1; −√7)');
  assert.equal(ex(r, 'f2'), '(−1; √7)');
  assert.equal(aprox(r, 'd1'), '−1,51');
  assert.equal(aprox(r, 'd2'), '1,51');
  assert.equal(ex(r, 'ladoRecto'), '3');
  assert.equal(aprox(r, 'e'), '1,32');
  assert.equal(ex(r, 'asintota1'), 'y = (2√3/3)(x + 1)');
  assert.equal(ex(r, 'asintota2'), 'y = −(2√3/3)(x + 1)');
  assert.match(r.porClave.asintota1.valor, /y = \(2√3\/3\)x \+ 2√3\/3/);
  assert.ok(r.pasos.some((p) => p.titulo.includes('multiplicamos por −1')), 'falta el paso de multiplicar por −1');
  cincoPartes(r);
});

test('hipérbola x²/9 − y²/36 = 1 → LR = 24', () => {
  const r = resolver('x^2/9 - y^2/36 = 1');
  assert.equal(ex(r, 'a'), '3');
  assert.equal(ex(r, 'b'), '6');
  assert.equal(ex(r, 'ladoRecto'), '24');
});

test('hipérbola 3x² − y² − 24x + 36 = 0 → V(2; 0), V(6; 0), F(0; 0), F(8; 0)', () => {
  const r = resolver('3x^2 - y^2 - 24x + 36 = 0');
  assert.equal(ex(r, 'centro'), '(4; 0)');
  assert.equal(ex(r, 'v1'), '(2; 0)');
  assert.equal(ex(r, 'v2'), '(6; 0)');
  assert.equal(ex(r, 'f1'), '(0; 0)');
  assert.equal(ex(r, 'f2'), '(8; 0)');
  assert.equal(ex(r, 'asintota1'), 'y = √3(x − 4)');
});

test('LORAN: x²/8649 − y²/13851 = 1 → a = 93, b² = 13851, c = 150', () => {
  const r = resolver('x^2/8649 - y^2/13851 = 1');
  assert.equal(ex(r, 'a'), '93');
  assert.equal(r.valores.b2.v, 13851);
  assert.equal(ex(r, 'c'), '150');
});

// ---------- Casos degenerados y entradas que no son cónicas ----------

function degenerada(texto, patron, conGrafica) {
  const r = resolverDesdeEcuacion(texto);
  assert.ok(r.ok, r.error);
  assert.equal(r.degenerada, true);
  assert.match(r.mensaje, patron);
  assert.equal(Boolean(r.escena), conGrafica);
}

test('degenerados: punto, imaginaria, dos rectas, rectas paralelas', () => {
  degenerada('x^2 + y^2 + 2x + 1 = 0', /solo el punto \(−1; 0\).*radio cero/, true);
  degenerada('x^2 + y^2 + 4 = 0', /no tiene puntos reales/, false);
  degenerada('4x^2 + 9y^2 = 0', /solo el punto/, true);
  degenerada('4x^2 + 9y^2 + 36 = 0', /no tiene puntos reales/, false);
  degenerada('x^2 - y^2 = 0', /dos rectas.*«y = x» y «y = −x»/, true);
  degenerada('x^2 - 4x + 3 = 0', /dos rectas paralelas, x = 1 y x = 3/, true);
  degenerada('x^2 + 2x + 1 = 0', /la recta x = −1/, true);
  degenerada('x^2 + 1 = 0', /no tiene puntos/, false);
});

test('entradas que no son cónicas dan un error claro', () => {
  assert.match(resolverDesdeEcuacion('3x + 2y = 6').error, /primer grado: representa una recta/);
  assert.match(resolverDesdeEcuacion('5 = 0').error, /no tiene x ni y/);
  assert.match(resolverDesdeEcuacion('xy = 1').error, /término xy/);
  assert.match(resolverDesdeEcuacion('x^2 + y^2').error, /Falta el signo «=»/);
});

test('el primer paso de clasificación explica la regla de A y C', () => {
  const r = resolver('4x^2 + 9y^2 + 32x - 18y + 37 = 0');
  const paso = r.pasos.find((p) => p.titulo === 'Identificamos el tipo de cónica');
  assert.match(paso.texto, /A = C.*circunferencia.*parábola.*mismo signo.*elipse.*signos distintos.*hipérbola/);
  assert.match(paso.mat[0], /A = 4 y C = 9/);
});
