// Fase 3: catálogo de tipos de pregunta, casos de clase resueltos por su tipo y datos inválidos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIPOS_PREGUNTA, validarTipo, buscarTipos, agrupar, tipoPorId } from '../js/problemas/tipos.js';
import { resolverPregunta } from '../js/problemas/solucionador.js';
import { leerPunto } from '../js/math/puntos.js';
import { leerRecta, fmtRecta, fmtExplicita } from '../js/math/rectas.js';
import { fmtExacto, fmtDecimal, aTexto } from '../js/math/formato.js';

function resolver(id, crudos) {
  const r = resolverPregunta(id, crudos);
  assert.ok(r.ok, `${id}: ${r.error}`);
  return r;
}
const ex = (n) => fmtExacto(n.ex);
const elem = (r, k) => r.porClave[k].exacto;
const aprox = (n) => fmtDecimal(n.v);
const respuesta = (r) => r.respuestaTexto;
const todosLosPasos = (r) => r.pasos.flatMap((p) => [p.texto ?? '', ...(p.mat ?? [])]).map(aTexto).join('\n');

// ---------- Catálogo ----------

test('catálogo: todos los tipos están bien definidos y sus ejemplos se resuelven', () => {
  assert.equal(TIPOS_PREGUNTA.length, 35);
  for (const t of TIPOS_PREGUNTA) {
    assert.deepEqual(validarTipo(t), [], t.id);
    const r = resolverPregunta(t.id, Object.fromEntries(t.campos.map((c) => [c.id, c.ejemplo])));
    assert.ok(r.ok, `${t.id}: ${r.error}`);
    assert.ok(r.datos.length && r.formulas.length && r.pasos.length && r.respuesta.lineas.length, `${t.id}: faltan partes`);
    assert.ok(r.escena, `${t.id}: falta la gráfica`);
  }
});

test('catálogo: agrupado por cónica y buscador sin tildes', () => {
  assert.deepEqual(agrupar().map((g) => g.id), ['general', 'circunferencia', 'parabola', 'elipse', 'hiperbola', 'aplicacion']);
  assert.ok(buscarTipos('tres puntos').some((t) => t.id === 'circ-tres-puntos'));
  assert.ok(buscarTipos('orbita').some((t) => t.id === 'app-orbita'));
  assert.ok(buscarTipos('ÓRBITA plutón').some((t) => t.id === 'app-orbita'));
  assert.equal(buscarTipos('zzzz').length, 0);
});

test('catálogo: cada paso con fórmula y los datos dados marcados en la gráfica', () => {
  const r = resolver('circ-centro-tangente-ab', { C: '(−1; 4)', A: '(3; −2)', B: '(−9; 3)' });
  assert.ok(r.pasos.some((p) => p.formula));
  assert.ok(r.escena.rectas.some((x) => x.tipo === 'dato' && x.etiqueta === 'L'));
  assert.ok(r.escena.puntos.some((p) => p.tipo === 'dato' && p.etiqueta.nombre === 'A'));
  assert.equal(r.datos[0].etiqueta, 'Centro C');
});

// ---------- Lectura de puntos y rectas ----------

test('puntos: (−1; 4), (−1, 4), −1 4 y con nombre', () => {
  for (const t of ['(−1; 4)', '(−1, 4)', '−1 4', 'P(−1; 4)', 'A = (−1; 4)', '(-1;4)', '(−1,4)']) {
    const r = leerPunto(t);
    assert.ok(r.punto, `${t}: ${r.error}`);
    assert.equal(`${ex(r.punto.x)};${ex(r.punto.y)}`, '−1;4', t);
  }
  assert.equal(ex(leerPunto('(−1,25; −3)').punto.x), '−5/4');
  assert.equal(ex(leerPunto('(1; 2√2)').punto.y), '2√2');
  assert.match(leerPunto('(1; 2; 3)').error, /no es un punto válido/);
  assert.match(leerPunto('(1; 2').error, /Falta cerrar/);
  assert.match(leerPunto('(a; 2)').error, /abscisa/);
});

test('rectas: 2x − y + 1 = 0, y = 2x + 1 y x = 3', () => {
  assert.equal(fmtRecta(leerRecta('2x − y + 1 = 0').recta), '2x − y + 1 = 0');
  assert.equal(fmtRecta(leerRecta('y = 2x + 1').recta), '2x − y + 1 = 0');
  assert.equal(fmtExplicita(leerRecta('2x − y + 1 = 0').recta), 'y = 2x + 1');
  assert.equal(fmtExplicita(leerRecta('2x − 6 = 0').recta), 'x = 3');
  assert.match(leerRecta('x^2 = y').error, /no es una recta/);
  assert.match(leerRecta('3 = 3').error, /0 = 0/);
});

// ---------- Casos de clase: circunferencia ----------

test('clase circ. 1 (centro y radio): C(3; −7), r = 4', () => {
  const r = resolver('circ-centro-radio', { C: '(3; −7)', r: '4' });
  assert.equal(r.ordinariaTexto, '(x − 3)² + (y + 7)² = 16');
  assert.equal(r.general, 'x² + y² − 6x + 14y + 42 = 0');
});

test('clase circ. 2 (tres puntos): P(1; −2), Q(5; 4), R(10; 5)', () => {
  const r = resolver('circ-tres-puntos', { P: '(1; −2)', Q: '(5; 4)', R: '(10; 5)' });
  assert.equal(r.general, 'x² + y² − 18x + 6y + 25 = 0');
  assert.equal(elem(r, 'centro'), '(9; −3)');
  assert.equal(elem(r, 'radio'), '√65');
  assert.deepEqual([r.valores.D, r.valores.E, r.valores.F].map(ex), ['−18', '6', '25']);
  assert.ok(r.pasos.some((p) => p.titulo === 'Eliminamos F'));
});

test('clase circ. 3 (tangente en un punto y centro sobre una recta)', () => {
  const r = resolver('circ-tangente-centro-en-recta', { L: '2x − y + 1 = 0', T: '(2; 5)', M: 'x + y = 9' });
  assert.equal(elem(r, 'centro'), '(6; 3)');
  assert.equal(r.ordinariaTexto, '(x − 6)² + (y − 3)² = 20');
});

test('clase circ. 4 (centro y tangente por A y B)', () => {
  const r = resolver('circ-centro-tangente-ab', { C: '(−1; 4)', A: '(3; −2)', B: '(−9; 3)' });
  assert.equal(fmtRecta(r.valores.recta), '5x + 12y + 9 = 0');
  assert.equal(elem(r, 'radio'), '4');
  assert.equal(r.general, 'x² + y² + 2x − 8y + 1 = 0');
});

test('clase circ. 5 (recta tangente en A(3; 1))', () => {
  const r = resolver('circ-recta-tangente', { ecuacion: 'x² + y² − 4x − 6y + 8 = 0', A: '(3; 1)' });
  assert.equal(fmtRecta(r.valores.tangente), 'x − 2y − 1 = 0');
});

test('clase circ. 6 (posición relativa de y = 2x + 1 y x² + (y − 1)² = 4)', () => {
  const r = resolver('circ-posicion-recta', { L: 'y = 2x + 1', ecuacion: 'x² + (y − 1)² = 4' });
  assert.equal(r.valores.posicion, 'secante');
  assert.deepEqual(r.valores.puntos.map((P) => ex(P.x)), ['−2√5/5', '2√5/5']);
  assert.match(todosLosPasos(r), /x = ±√\(4\/5\) = ±2√5\/5/);
  assert.match(respuesta(r), /Secante/);
});

test('clase circ. 7 (matriz de punzonado): B(−1,25; −3), r = 0,25', () => {
  const r = resolver('circ-centro-radio', { C: '(−1,25; −3)', r: '0,25' });
  assert.equal(r.general, '2x² + 2y² + 5x + 12y + 21 = 0');
});

test('clase circ. 8 (rueda de la fortuna): x = −3 → y ≈ 18,49 o 1,51; y = 12 → x ≈ ±8,77', () => {
  const r = resolver('app-rueda', { C: '(0; 10)', r: '9', xs: '−3', ys: '12' });
  assert.equal(r.ordinariaTexto, 'x² + (y − 10)² = 81');
  assert.deepEqual(r.valores.resultados.y[0].y.map(aprox), ['18,49', '1,51']);
  assert.deepEqual(r.valores.resultados.x[0].x.map(aprox), ['8,77', '−8,77']);
});

// ---------- Casos de clase: parábola ----------

test('clase par. 1 y 2 (desde la ecuación)', () => {
  const r1 = resolver('par-ecuacion', { ecuacion: 'x² + 2x + 16y − 31 = 0' });
  assert.equal(r1.ordinariaTexto, '(x + 1)² = −16(y − 2)');
  assert.deepEqual(['vertice', 'p', 'foco', 'directriz', 'ladoRecto', 'abre'].map((k) => elem(r1, k)), ['(−1; 2)', '−4', '(−1; −2)', 'y = 6', '16', 'abajo']);
  const r2 = resolver('par-ecuacion', { ecuacion: 'y² + 6y + 4x + 5 = 0' });
  assert.equal(r2.ordinariaTexto, '(y + 3)² = −4(x − 1)');
  assert.deepEqual(['vertice', 'p', 'foco', 'directriz', 'ladoRecto'].map((k) => elem(r2, k)), ['(1; −3)', '−1', '(0; −3)', 'x = 2', '4']);
});

test('clase par. 3 y 4 (vértice y foco)', () => {
  assert.equal(resolver('par-vertice-foco', { V: '(−1; 2)', F: '(−1; 0)' }).general, 'x² + 2x + 8y − 15 = 0');
  assert.equal(resolver('par-vertice-foco', { V: '(4; 3)', F: '(9; 3)' }).ordinariaTexto, '(y − 3)² = 20(x − 4)');
});

test('clase par. 5 (AO = AF ⇒ A(1; 2√2)): vértice en el origen, eje X → p = 2, y² = 8x', () => {
  const r = resolver('par-vertice-punto', { V: '(0; 0)', eje: 'horizontal', P: '(1; 2√2)' });
  assert.equal(elem(r, 'p'), '2');
  assert.equal(r.ordinariaTexto, 'y² = 8x');
});

test('clase par. 6 (puente Golden Gate): x² = (51200/19)y y alturas', () => {
  const r = resolver('app-puente', { forma: 'colgante', L: '1280', H: '152', xs: '100; 250; 400; 500' });
  assert.equal(r.ordinariaTexto, 'x² = (51200/19)y');
  assert.deepEqual(r.valores.tabla.map((f) => aprox(f.y)), ['3,71', '23,19', '59,38', '92,77']);
});

test('clase par. 7 (drone): a = 8, b = 0, y = 8t − t², vértice (4; 16)', () => {
  const r = resolver('app-trayectoria', { alfa: '−1', P1: '(1; 7)', P2: '(6; 12)' });
  assert.equal(ex(r.valores.a), '8');
  assert.equal(ex(r.valores.b), '0');
  assert.match(respuesta(r), /Ecuación: y = 8t − t²/);
  assert.equal(`${ex(r.valores.vertice.x)};${ex(r.valores.vertice.y)}`, '4;16');
});

// ---------- Casos de clase: elipse ----------

test('clase eli. 1 (desde la ecuación y desde vértices + excentricidad)', () => {
  for (const r of [
    resolver('ecuacion', { ecuacion: '4x² + 9y² + 32x − 18y + 37 = 0' }),
    resolver('eli-vertices-excentricidad', { V1: '(−7; 1)', V2: '(−1; 1)', e: '√5/3' }),
  ]) {
    assert.equal(r.ordinariaTexto, '(x + 4)²/9 + (y − 1)²/4 = 1');
    assert.deepEqual(['centro', 'a', 'b', 'c', 'v1', 'v2', 'ladoRecto', 'e'].map((k) => elem(r, k)), ['(−4; 1)', '3', '2', '√5', '(−7; 1)', '(−1; 1)', '8/3', '√5/3']);
    assert.deepEqual(r.valores.directrices.map(aprox), ['−8,02', '0,02']);
  }
});

test('clase eli. 2 (9x² + 25y² − 36x − 50y + 60 = 0): C(2; 1), eje menor 2/5', () => {
  const r = resolver('ecuacion', { ecuacion: '9x² + 25y² − 36x − 50y + 60 = 0' });
  assert.equal(elem(r, 'centro'), '(2; 1)');
  assert.equal(elem(r, 'ejeMenor'), '2/5');
});

test('clase eli. 3 (focos (±3; 0), vértices (±5; 0))', () => {
  const r = resolver('eli-focos-vertices', { F1: '(−3; 0)', F2: '(3; 0)', V1: '(−5; 0)', V2: '(5; 0)' });
  assert.equal(r.ordinariaTexto, 'x²/25 + y²/16 = 1');
});

test('clase eli. 4 (Plutón): afelio ≈ 6454,97 y perihelio ≈ 3872,98', () => {
  const r = resolver('app-orbita', { e: '0,25', cual: 'menor', L: '10000' });
  assert.equal(aprox(r.valores.afelio), '6454,97');
  assert.equal(aprox(r.valores.perihelio), '3872,98');
});

// ---------- Casos de clase: hipérbola ----------

test('clase hip. 1 (desde la ecuación y desde focos + excentricidad)', () => {
  for (const r of [
    resolver('ecuacion', { ecuacion: '4x² − 3y² + 8x + 16 = 0' }),
    resolver('hip-focos-excentricidad', { F1: '(−1; −√7)', F2: '(−1; √7)', e: '√7/2' }),
  ]) {
    assert.equal(r.ordinariaTexto, 'y²/4 − (x + 1)²/3 = 1');
    assert.deepEqual(['centro', 'a', 'b', 'c', 'v1', 'v2', 'f1', 'f2', 'ladoRecto'].map((k) => elem(r, k)), ['(−1; 0)', '2', '√3', '√7', '(−1; −2)', '(−1; 2)', '(−1; −√7)', '(−1; √7)', '3']);
    assert.deepEqual(r.valores.directrices.map(aprox), ['−1,51', '1,51']);
    assert.equal(aprox(r.valores.e), '1,32');
    assert.equal(elem(r, 'asintota1'), 'y = (2√3/3)(x + 1)');
  }
});

test('clase hip. 2 (vértices (±3; 0), LR = 24)', () => {
  assert.equal(resolver('hip-vertices-lado-recto', { V1: '(−3; 0)', V2: '(3; 0)', LR: '24' }).ordinariaTexto, 'x²/9 − y²/36 = 1');
});

test('clase hip. 3 (vértices (2; 0), (6; 0) y focos (0; 0), (8; 0))', () => {
  const r = resolver('hip-vertices-focos', { V1: '(2; 0)', V2: '(6; 0)', F1: '(0; 0)', F2: '(8; 0)' });
  assert.equal(r.general, '3x² − y² − 24x + 36 = 0');
});

test('clase hip. 4 (LORAN): a = 93, b² = 13851, x ≈ 110,28 con y = 75', () => {
  const r = resolver('app-loran', { S1: '(−150; 0)', S2: '(150; 0)', dt: '0,001', v: '186000', cual: 'y', valor: '75' });
  assert.equal(elem(r, 'a'), '93');
  assert.equal(ex(r.valores.b2), '13851');
  assert.equal(r.ordinariaTexto, 'x²/8649 − y²/13851 = 1');
  assert.deepEqual(r.valores.coordenada.map(aprox), ['−110,28', '110,28']);
});

// ---------- Pruebas adicionales por tipo ----------

const ADICIONALES = [
  ['circ-centro-punto', { C: '(−1; 4)', P: '(3; 1)' }, (r) => assert.equal(elem(r, 'radio'), '5')],
  ['circ-diametro', { A: '(−3; 2)', B: '(5; −4)' }, (r) => assert.equal(r.ordinariaTexto, '(x − 1)² + (y + 1)² = 25')],
  ['circ-centro-tangente', { C: '(−1; 4)', L: '5x + 12y + 9 = 0' }, (r) => assert.equal(elem(r, 'radio'), '4')],
  ['circ-posicion-recta', { L: 'y = 3', ecuacion: 'x^2 + y^2 = 9' }, (r) => {
    assert.equal(r.valores.posicion, 'tangente');
    assert.equal(`${ex(r.valores.puntos[0].x)};${ex(r.valores.puntos[0].y)}`, '0;3');
  }],
  ['circ-posicion-recta', { L: 'x = 5', ecuacion: 'x^2 + y^2 = 9' }, (r) => assert.equal(r.valores.posicion, 'exterior')],
  ['circ-posicion-circunferencias', { ec1: 'x^2 + y^2 = 25', ec2: '(x - 4)^2 + (y - 3)^2 = 4' }, (r) => {
    assert.equal(r.valores.posicion, 'secantes');
    assert.equal(r.valores.puntos.length, 2);
  }],
  ['circ-posicion-circunferencias', { ec1: 'x^2 + y^2 = 4', ec2: '(x - 5)^2 + y^2 = 9' }, (r) => {
    assert.equal(r.valores.posicion, 'tangentes-exteriores');
    assert.equal(`${ex(r.valores.puntos[0].x)};${ex(r.valores.puntos[0].y)}`, '2;0');
  }],
  ['circ-posicion-circunferencias', { ec1: 'x^2 + y^2 = 25', ec2: 'x^2 + y^2 = 4' }, (r) => assert.equal(r.valores.posicion, 'concentricas')],
  ['circ-posicion-circunferencias', { ec1: 'x^2 + y^2 = 1', ec2: '(x - 10)^2 + y^2 = 1' }, (r) => assert.equal(r.valores.posicion, 'exteriores')],
  ['circ-punto-tangente-en-punto', { P: '(3; 11)', L: 'x − 2y + 4 = 0', T: '(2; 3)' }, (r) => {
    assert.equal(elem(r, 'centro'), '(−1/6; 22/3)');
    assert.equal(r.general, '3x² + 3y² + x − 44y + 91 = 0');
  }],
  ['par-foco-directriz', { F: '(3; 2)', d: 'x = −1' }, (r) => assert.equal(r.ordinariaTexto, '(y − 2)² = 8(x − 1)')],
  ['par-vertice-directriz', { V: '(4; 3)', d: 'x = −1' }, (r) => assert.equal(r.ordinariaTexto, '(y − 3)² = 20(x − 4)')],
  ['par-tres-puntos', { P: '(0; 1)', Q: '(1; 0)', R: '(3; 4)' }, (r) => {
    assert.equal(r.ordinariaTexto, '(x − 1)² = y');
    assert.match(respuesta(r), /y = x² − 2x \+ 1/);
  }],
  ['eli-centro-vertice-foco', { C: '(2; −1)', V: '(2; 4)', F: '(2; 3)' }, (r) => assert.equal(r.ordinariaTexto, '(x − 2)²/9 + (y + 1)²/25 = 1')],
  ['eli-vertices-lado-recto', { V1: '(−7; 1)', V2: '(−1; 1)', LR: '8/3' }, (r) => assert.equal(r.ordinariaTexto, '(x + 4)²/9 + (y − 1)²/4 = 1')],
  ['eli-vertices-eje-menor', { V1: '(−5; 0)', V2: '(5; 0)', B: '(0; 4)' }, (r) => assert.equal(r.ordinariaTexto, 'x²/25 + y²/16 = 1')],
  ['eli-vertices-eje-menor', { V1: '(−5; 0)', V2: '(5; 0)', L: '8' }, (r) => assert.equal(r.ordinariaTexto, 'x²/25 + y²/16 = 1')],
  ['eli-focos-eje', { F1: '(−3; 0)', F2: '(3; 0)', cual: 'mayor', L: '10' }, (r) => assert.equal(r.ordinariaTexto, 'x²/25 + y²/16 = 1')],
  ['eli-focos-eje', { F1: '(−3; 0)', F2: '(3; 0)', cual: 'menor', L: '8' }, (r) => assert.equal(r.ordinariaTexto, 'x²/25 + y²/16 = 1')],
  ['hip-vertices-asintota', { V1: '(−3; 0)', V2: '(3; 0)', A: 'y = 2x' }, (r) => assert.equal(r.ordinariaTexto, 'x²/9 − y²/36 = 1')],
  ['hip-vertices-asintota', { V1: '(−1; −2)', V2: '(−1; 2)', A: '2x − y + 2 = 0' }, (r) => assert.equal(elem(r, 'b'), '1')],
  ['hip-centro-vertice-foco', { C: '(4; 0)', V: '(6; 0)', F: '(8; 0)' }, (r) => assert.equal(r.general, '3x² − y² − 24x + 36 = 0')],
  ['app-puente', { forma: 'arco', L: '40', H: '10', xs: '10' }, (r) => {
    assert.equal(r.ordinariaTexto, 'x² = −40(y − 10)');
    assert.equal(ex(r.valores.tabla[0].y), '15/2');
  }],
  ['app-tunel', { W: '20', H: '6', xs: '8' }, (r) => {
    assert.equal(r.ordinariaTexto, 'x²/100 + y²/36 = 1');
    assert.equal(ex(r.valores.tabla[0].y), '18/5');
  }],
  ['app-orbita', { e: '1/2', cual: 'mayor', L: '20' }, (r) => {
    assert.equal(ex(r.valores.perihelio), '5');
    assert.equal(ex(r.valores.afelio), '15');
  }],
];

for (const [id, crudos, verificar] of ADICIONALES) {
  test(`adicional ${id}: ${JSON.stringify(crudos)}`, () => verificar(resolver(id, crudos)));
}

// ---------- Datos inválidos (al menos uno por tipo) ----------

const INVALIDOS = [
  ['ecuacion', { ecuacion: 'x^2 + y^2' }, /Falta el signo «=»/, 'ecuacion'],
  ['circ-centro-radio', { C: '(3; −7)', r: '0' }, /mayor que 0/, 'r'],
  ['circ-centro-radio', { C: '(3; −7', r: '4' }, /Falta cerrar/, 'C'],
  ['circ-centro-punto', { C: '(1; 1)', P: '(1; 1)' }, /radio sería 0/, 'P'],
  ['circ-diametro', { A: '(1; 1)', B: '(1; 1)' }, /mismo punto/, 'B'],
  ['circ-tres-puntos', { P: '(0; 0)', Q: '(1; 1)', R: '(2; 2)' }, /alineados/, 'R'],
  ['circ-centro-tangente', { C: '(0; 0)', L: 'x + y = 0' }, /sobre la recta/, 'L'],
  ['circ-centro-tangente-ab', { C: '(0; 5)', A: '(1; 1)', B: '(1; 1)' }, /mismo punto/, 'B'],
  ['circ-tangente-centro-en-recta', { L: '2x − y + 1 = 0', T: '(0; 0)', M: 'x + y = 9' }, /no está sobre la recta L/, 'T'],
  ['circ-tangente-centro-en-recta', { L: 'y = 0', T: '(0; 0)', M: 'x = 0' }, /paralelas/, 'M'],
  ['circ-recta-tangente', { ecuacion: 'x^2 + y^2 = 25', A: '(1; 1)' }, /no está en la circunferencia/, 'A'],
  ['circ-recta-tangente', { ecuacion: 'x^2/4 + y^2 = 1', A: '(2; 0)' }, /no de una circunferencia/, 'ecuacion'],
  ['circ-posicion-recta', { L: 'x^2 + y = 1', ecuacion: 'x^2 + y^2 = 4' }, /no es una recta/, 'L'],
  ['circ-posicion-circunferencias', { ec1: 'x^2 + y^2 = 4', ec2: 'y = x^2' }, /no de una circunferencia/, 'ec2'],
  ['circ-punto-tangente-en-punto', { P: '(2; 3)', L: 'x − 2y + 4 = 0', T: '(2; 3)' }, /mismo punto/, 'P'],
  ['par-vertice-foco', { V: '(1; 1)', F: '(1; 1)' }, /no puede coincidir con el vértice/, 'F'],
  ['par-vertice-foco', { V: '(0; 0)', F: '(1; 1)' }, /horizontal ni vertical/, 'F'],
  ['par-foco-directriz', { F: '(3; 2)', d: 'y = x' }, /horizontal \(y = k\) o vertical/, 'd'],
  ['par-foco-directriz', { F: '(3; 2)', d: 'x = 3' }, /foco está sobre la directriz/, 'F'],
  ['par-vertice-directriz', { V: '(4; 3)', d: 'y = 3' }, /vértice está sobre la directriz/, 'V'],
  ['par-vertice-punto', { V: '(0; 0)', eje: 'vertical', P: '(0; 5)' }, /sobre el eje/, 'P'],
  ['par-tres-puntos', { P: '(1; 1)', Q: '(1; 2)', R: '(3; 4)' }, /misma abscisa/, 'Q'],
  ['par-tres-puntos', { P: '(0; 0)', Q: '(1; 1)', R: '(2; 2)' }, /alineados/, 'R'],
  ['par-ecuacion', { ecuacion: 'x^2 + y^2 = 4' }, /no de una parábola/, 'ecuacion'],
  ['eli-focos-vertices', { F1: '(−5; 0)', F2: '(5; 0)', V1: '(−3; 0)', V2: '(3; 0)' }, /a > c/, 'V2'],
  ['eli-focos-vertices', { F1: '(−3; 0)', F2: '(3; 0)', V1: '(−5; 1)', V2: '(5; 1)' }, /punto medio de los focos \(0; 0\) no coincide/, 'V2'],
  ['eli-centro-vertice-foco', { C: '(0; 0)', V: '(3; 0)', F: '(5; 0)' }, /a > c/, 'F'],
  ['eli-vertices-excentricidad', { V1: '(−5; 0)', V2: '(5; 0)', e: '1,5' }, /menor que 1/, 'e'],
  ['eli-vertices-lado-recto', { V1: '(−3; 0)', V2: '(3; 0)', LR: '20' }, /b < a/, 'LR'],
  ['eli-vertices-eje-menor', { V1: '(−5; 0)', V2: '(5; 0)', B: '', L: '' }, /Falta el eje menor/, 'B'],
  ['eli-vertices-eje-menor', { V1: '(−5; 0)', V2: '(5; 0)', B: '(0; 6)' }, /b < a/, 'B'],
  ['eli-focos-eje', { F1: '(−3; 0)', F2: '(3; 0)', cual: 'mayor', L: '4' }, /más largo/, 'L'],
  ['hip-vertices-focos', { V1: '(−5; 0)', V2: '(5; 0)', F1: '(−3; 0)', F2: '(3; 0)' }, /c > a/, 'F2'],
  ['hip-vertices-lado-recto', { V1: '(−3; 0)', V2: '(3; 0)', LR: '−2' }, /mayor que 0/, 'LR'],
  ['hip-vertices-asintota', { V1: '(−3; 0)', V2: '(3; 0)', A: 'y = 2x + 1' }, /no pasa por el centro/, 'A'],
  ['hip-focos-excentricidad', { F1: '(−3; 0)', F2: '(3; 0)', e: '0,5' }, /mayor que 1/, 'e'],
  ['hip-centro-vertice-foco', { C: '(0; 0)', V: '(5; 0)', F: '(3; 0)' }, /c > a/, 'F'],
  ['app-rueda', { C: '(0; 10)', r: '−9' }, /mayor que 0/, 'r'],
  ['app-puente', { forma: 'colgante', L: '1280', H: '0' }, /mayor que 0/, 'H'],
  ['app-trayectoria', { alfa: '−1', P1: '(1; 7)', P2: '(1; 9)' }, /mismo t/, 'P2'],
  ['app-tunel', { W: '20', H: '10' }, /semicircunferencia/, 'H'],
  ['app-orbita', { e: '1', cual: 'mayor', L: '10' }, /menor que 1/, 'e'],
  ['app-loran', { S1: '(−150; 0)', S2: '(150; 0)', dt: '0,01', v: '186000' }, /menor que la distancia entre estaciones/, 'dt'],
];

for (const [id, crudos, patron, campo] of INVALIDOS) {
  test(`inválido ${id}: ${JSON.stringify(crudos)}`, () => {
    const r = resolverPregunta(id, crudos);
    assert.equal(r.ok, false, `${id} debería fallar`);
    assert.match(r.error, patron);
    assert.equal(r.campo, campo);
  });
}

test('cada tipo tiene al menos una prueba con datos inválidos', () => {
  const probados = new Set(INVALIDOS.map(([id]) => id));
  for (const t of TIPOS_PREGUNTA) assert.ok(probados.has(t.id), `falta prueba inválida para ${t.id}`);
  assert.ok(tipoPorId('ecuacion'));
});
