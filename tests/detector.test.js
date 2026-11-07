// Fase 4: detector de enunciados en texto libre y verificación de alternativas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectar, normalizar } from '../js/problemas/detector.js';
import { separarAlternativas, compararAlternativas, interpretarParte } from '../js/problemas/alternativas.js';
import { resolverPregunta } from '../js/problemas/solucionador.js';
import { fmtDecimal } from '../js/math/formato.js';

// Detecta, resuelve con el formulario llenado y compara las alternativas.
function flujo(texto) {
  const d = detectar(texto);
  assert.ok(d.ok, d.mensaje);
  assert.ok(d.tipo, `no eligió tipo para: ${texto}`);
  const r = resolverPregunta(d.tipo, d.crudos);
  assert.ok(r.ok, `${d.tipo}: ${r.error} — datos ${JSON.stringify(d.crudos)}`);
  const alt = d.alternativas.length ? compararAlternativas(d.alternativas, r) : null;
  return { d, r, alt };
}

// ---------- Los 8 enunciados con alternativas ----------

const CON_ALTERNATIVAS = [
  [
    'Determina la ecuación general de la circunferencia que tiene su centro en el punto C=(−1; 4) y es tangente a la recta que pasa por los puntos A = (3; −2) y B = (−9; 3). a. x²+y²+2x−8y+1=0 b. x²+y²+4x−8y+5=0 c. x²+y²+4x−8y+1=0 d. x²+y²+4x−8y+12=0',
    'circ-centro-tangente-ab', 'a',
  ],
  [
    'Se tiene la circunferencia x² + y² – 4x – 6y + 8 = 0. Hallar la ecuación de la recta tangente a la circunferencia en el punto A = (3, 1). a. −x+y+1=0 b. x−2y−1=0 c. x+y−1=0 d. x−y+1=0',
    'circ-recta-tangente', 'b',
  ],
  [
    'Determine el centro y la longitud del eje menor de E: 9x² + 25y² − 36x −50y + 60 = 0. a. C(1; 2); em=2/3 b. C(−2; 1); em=2/3 c. C(2; −1); em=1/25 d. C(2; 1); em=2/5',
    'ecuacion', 'd',
  ],
  [
    'Obtener la ecuación canónica de la elipse cuyos focos son: F1=(3,0) y F2=(−3,0); y cuyos vértices son: V1=(5,0) y V2=(−5,0). a. x²/36+y²/16=1 b. x²/16+y²/36=1 c. x²/16+y²/25=1 d. x²/25+y²/16=1',
    'eli-focos-vertices', 'd',
  ],
  [
    'Determinar la ecuación de la hipérbola con vértices (±3, 0) y el lado recto es 24. a. x²/9−y²/36=1 b. x²/36−y²/9=1 c. x²/16−y²/36=1 d. y²/36−x²/9=1',
    'hip-vertices-lado-recto', 'a',
  ],
  [
    'Determina la ecuación general de la hipérbola. Vértices: (2, 0) y (6, 0); Focos: (0, 0) y (8, 0). a. 3x²−y²−24x+36=0 b. 3x²−4y²−24x+36=0 c. 3x²−6y²−24x+36=0 d. 3x²−2y²−24x+36=0',
    'hip-vertices-focos', 'a',
  ],
  [
    'Determine la ecuación general de la parábola. Vértice: (−1, 2); Foco: (−1, 0). a. x²−2x+8y+15=0 b. x²−2x+8y−15=0 c. x²+2x−8y−15=0 d. x²+2x+8y−15=0',
    'par-vertice-foco', 'd',
  ],
  [
    'Determina la forma estándar de la ecuación de la parábola. Vértice: (4, 3); Foco: (9, 3). a. (y−3)²=20(x−4) b. (y−3)²=10(x−4) c. (y−3)²=16(x−4) d. (x−3)²=20(y−4)',
    'par-vertice-foco', 'a',
  ],
];

for (const [texto, tipo, correcta] of CON_ALTERNATIVAS) {
  test(`alternativas → ${correcta}: ${texto.slice(0, 60)}…`, () => {
    const { d, alt } = flujo(texto);
    assert.equal(d.tipo, tipo);
    assert.equal(d.confianza, 'alta');
    assert.equal(d.alternativas.length, 4);
    assert.deepEqual(alt.correctas, [correcta]);
    for (const a of alt.alternativas.filter((x) => !x.coincide)) assert.ok(a.motivo.length > 5, `sin explicación en ${a.letra}`);
  });
}

test('alternativas: la explicación dice qué coeficiente está mal', () => {
  const { alt } = flujo(CON_ALTERNATIVAS[0][0]);
  assert.equal(alt.alternativas[1].motivo, 'el coeficiente de x es 4, debería ser 2; el término independiente es 5, debería ser 1');
  const p = flujo(CON_ALTERNATIVAS[7][0]).alt;
  assert.match(p.alternativas[3].motivo, /vértice es \(3; 4\), debería ser \(4; 3\)/);
  const e = flujo(CON_ALTERNATIVAS[2][0]).alt;
  assert.match(e.alternativas[0].motivo, /centro es \(1; 2\), debería ser \(2; 1\); em = 2\/3, debería ser 2\/5/);
  const h = flujo(CON_ALTERNATIVAS[4][0]).alt;
  assert.match(h.alternativas[3].motivo, /eje transverso es vertical, debería ser horizontal/);
});

// ---------- Casos de clase redactados como en un examen ----------

const EXAMEN = [
  ['Halla la ecuación ordinaria y general de la circunferencia de centro C(3; −7) y radio 4.', 'circ-centro-radio', (r) => assert.equal(r.general, 'x² + y² − 6x + 14y + 42 = 0')],
  ['Determina la ecuación de la circunferencia que pasa por los puntos P(1; −2), Q(5; 4) y R(10; 5).', 'circ-tres-puntos', (r) => assert.equal(r.general, 'x² + y² − 18x + 6y + 25 = 0')],
  ['Halla la ecuación de la circunferencia tangente a la recta 2x − y + 1 = 0 en el punto (2; 5) y cuyo centro está sobre la recta x + y = 9.', 'circ-tangente-centro-en-recta', (r) => assert.equal(r.ordinariaTexto, '(x − 6)² + (y − 3)² = 20')],
  ['Determina la posición relativa de la recta y = 2x + 1 y la circunferencia x² + (y − 1)² = 4.', 'circ-posicion-recta', (r) => assert.equal(r.valores.posicion, 'secante')],
  ['Una matriz de punzonado tiene un agujero circular de centro B(−1,25; −3) y radio 0,25. Halla su ecuación general.', 'circ-centro-radio', (r) => assert.equal(r.general, '2x² + 2y² + 5x + 12y + 21 = 0')],
  [
    'La rueda de la fortuna tiene por ecuación x² + (y − 10)² = 81. ¿A qué altura está una cabina cuando x = −3? ¿Y en qué posición x está cuando su altura es y = 12?',
    'app-rueda',
    (r) => {
      assert.deepEqual(r.valores.resultados.y[0].y.map((n) => fmtDecimal(n.v)), ['18,49', '1,51']);
      assert.deepEqual(r.valores.resultados.x[0].x.map((n) => fmtDecimal(n.v)), ['8,77', '−8,77']);
    },
  ],
  ['Halla el vértice, el foco y la directriz de la parábola x² + 2x + 16y − 31 = 0.', 'par-ecuacion', (r) => assert.equal(r.porClave.directriz.exacto, 'y = 6')],
  ['Encuentra los elementos de la parábola y² + 6y + 4x + 5 = 0.', 'par-ecuacion', (r) => assert.equal(r.porClave.foco.exacto, '(0; −3)')],
  ['Halla la ecuación de la parábola con vértice en el origen y eje X que pasa por el punto A(1; 2√2).', 'par-vertice-punto', (r) => assert.equal(r.ordinariaTexto, 'y² = 8x')],
  [
    'El cable del puente Golden Gate cuelga entre dos torres separadas 1280 m y de 152 m de altura. Halla su ecuación y las alturas en x = 100, 250, 400 y 500.',
    'app-puente',
    (r) => {
      assert.equal(r.ordinariaTexto, 'x² = (51200/19)y');
      assert.deepEqual(r.valores.tabla.map((f) => fmtDecimal(f.y.v)), ['3,71', '23,19', '59,38', '92,77']);
    },
  ],
  ['Un drone sigue la trayectoria y = at − t² + b y pasa por los puntos (1; 7) y (6; 12). Halla a, b y la altura máxima.', 'app-trayectoria', (r) => assert.match(r.respuestaTexto, /y = 8t − t²/)],
  ['Halla los elementos de la elipse 4x² + 9y² + 32x − 18y + 37 = 0.', 'ecuacion', (r) => assert.equal(r.porClave.e.exacto, '√5/3')],
  [
    'La órbita de Plutón tiene excentricidad 0,25 y su eje menor mide 10 000 millones de km. Halla el afelio y el perihelio.',
    'app-orbita',
    (r) => {
      assert.equal(fmtDecimal(r.valores.afelio.v), '6454,97');
      assert.equal(fmtDecimal(r.valores.perihelio.v), '3872,98');
    },
  ],
  ['Halla los elementos de la hipérbola 4x² − 3y² + 8x + 16 = 0.', 'ecuacion', (r) => assert.equal(r.ordinariaTexto, 'y²/4 − (x + 1)²/3 = 1')],
  [
    'Dos estaciones LORAN están en (−150; 0) y (150; 0). La diferencia de tiempos es 0,001 s y la velocidad de la señal es 186000 millas/s. Si el barco está en y = 75, halla x.',
    'app-loran',
    (r) => assert.deepEqual(r.valores.coordenada.map((n) => fmtDecimal(n.v)), ['−110,28', '110,28']),
  ],
];

for (const [texto, tipo, verificar] of EXAMEN) {
  test(`examen: ${texto.slice(0, 70)}…`, () => {
    const { d, r } = flujo(texto);
    assert.equal(d.tipo, tipo);
    verificar(r);
  });
}

// ---------- Otras formas de redactar ----------

const VARIANTES = [
  ['Encuentra la ecuación de la circunferencia con centro en (2; −1) y que pasa por el punto (5; 3).', 'circ-centro-punto'],
  ['Los extremos de un diámetro de una circunferencia son A(−3; 2) y B(5; −4). Halla su ecuación.', 'circ-diametro'],
  ['Halla la ecuación de la parábola cuyo foco es F(3; 2) y cuya directriz es x = −1.', 'par-foco-directriz'],
  ['Halla la parábola de vértice V(4; 3) y directriz x = −1.', 'par-vertice-directriz'],
  ['Una hipérbola tiene vértices en (−3; 0) y (3; 0) y una de sus asíntotas es y = 2x. Encuentra su ecuación.', 'hip-vertices-asintota'],
  ['Halla la ecuación de la elipse con vértices (−7; 1) y (−1; 1) y excentricidad √5/3.', 'eli-vertices-excentricidad'],
  ['Determina la posición relativa de las circunferencias x² + y² = 25 y (x − 4)² + (y − 3)² = 4.', 'circ-posicion-circunferencias'],
  ['Hallar la ecuación de la hipérbola cuyos focos son (−1; −√7) y (−1; √7) y su excentricidad es √7/2.', 'hip-focos-excentricidad'],
  ['Escribe la ecuación de la elipse con focos (±3; 0) y eje mayor de longitud 10.', 'eli-focos-eje'],
  ['HALLA LA ECUACION DE LA CIRCUNFERENCIA DE CENTRO (0;0) Y RADIO 5', 'circ-centro-radio'],
];

for (const [texto, tipo] of VARIANTES) {
  test(`variante: ${texto}`, () => {
    const { d } = flujo(texto);
    assert.equal(d.tipo, tipo);
  });
}

// ---------- Textos que no son del tema ----------

for (const texto of [
  'Calcula la derivada de f(x) = x³ + 2x.',
  '¿Cuál es la capital del Perú?',
  'Resuelve el sistema 2x + y = 3, x − y = 0.',
  'Halla el determinante de la matriz A = [[1, 2], [3, 4]].',
]) {
  test(`fuera de tema: ${texto}`, () => {
    const d = detectar(texto);
    assert.equal(d.ok, false);
    assert.equal(d.tema, false);
    assert.match(d.mensaje, /circunferencia, parábola, elipse/);
  });
}

test('vacío o sin datos suficientes: mensaje claro', () => {
  assert.match(detectar('   ').mensaje, /Pega o escribe/);
  const d = detectar('Una elipse tiene su centro en el origen.');
  assert.equal(d.ok, true);
  assert.equal(d.confianza, 'baja');
});

test('confianza baja: muestra opciones para elegir', () => {
  const d = detectar('Una parábola tiene vértice (1; 2) y pasa por (3; 4) y (5; 6).');
  assert.ok(d.opciones.length >= 2);
  assert.ok(d.opciones.every((o) => o.titulo));
});

// ---------- Piezas ----------

test('normalizar: misma longitud, sin tildes, minúsculas y “−”', () => {
  const t = 'Vértice: (−1; 2) – Él';
  const n = normalizar(t);
  assert.equal(n.length, t.length);
  assert.equal(n, 'vertice: (-1; 2) - el');
});

test('detector: puntos con nombre, ± expandido y resaltado en el texto', () => {
  const d = detectar('Determinar la ecuación de la hipérbola con vértices (±3, 0) y el lado recto es 24.');
  const vertices = d.contexto.puntos.filter((p) => p.rol === 'vertice');
  assert.equal(vertices.length, 2);
  assert.equal(d.contexto.numeros.ladoRecto.texto, '24');
  const texto = 'Determinar la ecuación de la hipérbola con vértices (±3, 0) y el lado recto es 24.';
  assert.deepEqual(d.marcas.map((m) => texto.slice(m.pos, m.pos + m.len)), ['(±3, 0)', '24']);
  assert.ok(d.pide.length === 0 || Array.isArray(d.pide));
});

test('detector: detecta qué se pide', () => {
  assert.ok(detectar(CON_ALTERNATIVAS[0][0]).pide.includes('ecuación general'));
  assert.ok(detectar(CON_ALTERNATIVAS[2][0]).pide.includes('centro'));
  assert.ok(detectar(CON_ALTERNATIVAS[2][0]).pide.includes('longitud del eje menor'));
  assert.ok(detectar(CON_ALTERNATIVAS[3][0]).pide.includes('ecuación canónica'));
  assert.ok(detectar(CON_ALTERNATIVAS[7][0]).pide.includes('forma ordinaria (estándar)'));
  assert.ok(detectar(CON_ALTERNATIVAS[1][0]).pide.includes('recta tangente'));
});

test('separar alternativas: en una línea, una por línea y con paréntesis', () => {
  const s1 = separarAlternativas('Halla x. a. 1 b. 2 c. 3');
  assert.deepEqual(s1.alternativas.map((a) => [a.letra, a.texto]), [['a', '1'], ['b', '2'], ['c', '3']]);
  assert.equal(s1.enunciado, 'Halla x.');
  const s2 = separarAlternativas('Pregunta\na) x²+y²=4\nb) x²+y²=9\nc) x²+y²=16\nd) x²+y²=25');
  assert.equal(s2.alternativas.length, 4);
  assert.equal(s2.alternativas[3].texto, 'x²+y²=25');
  const s3 = separarAlternativas('Halla la ecuación de la recta tangente a la circunferencia.');
  assert.equal(s3.alternativas.length, 0);
  const s4 = separarAlternativas('Elige: A) 5 B) 6');
  assert.deepEqual(s4.alternativas.map((a) => a.letra), ['a', 'b']);
});

test('comparar: equivalencias de forma, escala y orden; decimales con tolerancia', () => {
  const r = resolverPregunta('circ-centro-radio', { C: '(−1; 4)', r: '4' });
  const alt = compararAlternativas(
    [
      { letra: 'a', texto: '2x²+2y²+4x−16y+2=0' },
      { letra: 'b', texto: '(x+1)²+(y−4)²=16' },
      { letra: 'c', texto: '−8y + y² + 2x + x² + 1 = 0' },
      { letra: 'd', texto: 'C(−1; 4); r = 4' },
      { letra: 'e', texto: 'C(−1,0; 4,0); r=4,00' },
    ],
    r,
  );
  assert.deepEqual(alt.correctas, ['a', 'b', 'c', 'd', 'e']);
  const t = resolverPregunta('circ-tres-puntos', { P: '(1; −2)', Q: '(5; 4)', R: '(10; 5)' });
  assert.deepEqual(compararAlternativas([{ letra: 'a', texto: 'r = 8,06' }, { letra: 'b', texto: 'r = 8,2' }], t).correctas, ['a']);
});

test('comparar: si ninguna coincide, lo dice', () => {
  const r = resolverPregunta('circ-centro-radio', { C: '(0; 0)', r: '5' });
  const alt = compararAlternativas([{ letra: 'a', texto: 'x²+y²=4' }, { letra: 'b', texto: 'x²+y²=9' }], r);
  assert.equal(alt.ninguna, true);
  assert.match(alt.alternativas[0].motivo, /término independiente es −4, debería ser −25/);
});

test('comparar: recta contra cónica y textos que no se entienden', () => {
  const r = resolverPregunta('circ-centro-radio', { C: '(0; 0)', r: '5' });
  const alt = compararAlternativas([{ letra: 'a', texto: 'y = 2x' }, { letra: 'b', texto: 'ninguna de las anteriores' }], r);
  assert.match(alt.alternativas[0].motivo, /es una recta; la respuesta es una cónica/);
  assert.match(alt.alternativas[1].motivo, /no pude interpretar/);
  assert.equal(interpretarParte('C(2; 1)').tipo, 'punto');
  assert.equal(interpretarParte('em=2/5').tipo, 'numero');
  assert.equal(interpretarParte('x²/9 − y²/36 = 1').forma, 'ordinaria');
});
