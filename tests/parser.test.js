// Parser de ecuaciones: muchas formas de escribir la misma cónica y entradas inválidas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsearEcuacion } from '../js/math/parser.js';
import { normalizarGeneral, fmtGeneral } from '../js/math/general.js';

function general(texto) {
  const r = parsearEcuacion(texto);
  assert.ok(r.ok, `«${texto}» debería ser válida, pero dio: ${r.error}`);
  return fmtGeneral(normalizarGeneral(r.coef));
}

const ELIPSE = '4x² + 9y² + 32x − 18y + 37 = 0';

const VALIDAS = [
  ['4x^2+9y^2+32x-18y+37=0', ELIPSE],
  ['4x² + 9y² = 18y − 32x − 37', ELIPSE],
  ['37 + 32x + 9y^2 - 18y + 4x^2 = 0', ELIPSE],
  ['(x+4)^2/9 + (y-1)^2/4 = 1', ELIPSE],
  ['8x² + 18y² + 64x − 36y + 74 = 0', ELIPSE],
  ['(y+3)^2 = -4(x-1)', 'y² + 4x + 6y + 5 = 0'],
  ['y² + 6y + 4x + 5 = 0', 'y² + 4x + 6y + 5 = 0'],
  ['x² + y² = 25', 'x² + y² − 25 = 0'],
  ['X^2 + Y^2 = 4', 'x² + y² − 4 = 0'],
  ['2·x² + 2*y² = 8', 'x² + y² − 4 = 0'],
  ['0.5x^2 + 0,5y^2 = 2', 'x² + y² − 4 = 0'],
  ['−y² + x = 0', 'y² − x = 0'],
  ['x^2/4 - y^2/9 = 1', '9x² − 4y² − 36 = 0'],
  ['(x - 1)(x + 1) + y^2 = 0', 'x² + y² − 1 = 0'],
  ['y = x^2', 'x² − y = 0'],
  ['  x ²  +  y ² = 1 ', 'x² + y² − 1 = 0'],
  ['x^(2) + y^2 = 1', 'x² + y² − 1 = 0'],
  ['-(x - 2)^2 = 8(y + 1)', 'x² − 4x + 8y + 12 = 0'],
  ['[x+1]^2 + y^2 = 9', 'x² + y² + 2x − 8 = 0'],
  ['x² = (51200/19)y', '19x² − 51200y = 0'],
  ['x^2/8649 - y^2/13851 = 1', '1539x² − 961y² − 13310811 = 0'],
  ['3x – 2 = −y² ', 'y² + 3x − 2 = 0'],
];

for (const [entrada, esperado] of VALIDAS) {
  test(`válida: ${entrada}`, () => {
    assert.equal(general(entrada), esperado);
  });
}

const INVALIDAS = [
  ['', /Escribe una ecuación/],
  ['x^2 + y^2', /Falta el signo «=»/],
  ['x^2 + y^2 = = 4', /más de un signo «=»/],
  ['x^2 + 3xy + y^2 = 1', /término xy/],
  ['x^3 + y = 1', /grado 3/],
  ['sen(x) + y = 0', /función/],
  ['x^2 + z^2 = 1', /«z».*no se reconoce/],
  ['(x+1^2 + y^2 = 4', /Falta cerrar el paréntesis/],
  ['x^2 + y^2 = 4)', /Sobra el paréntesis/],
  ['x^2 / y = 1', /dividir entre una expresión con x o y/],
  ['x^2 + y^2 = 1/0', /División entre 0/],
  ['x2 + y2 = 1', /x\^2/],
  ['x^2 + y^2 # 1', /símbolo «#»/],
  ['x^1.5 + y = 0', /exponente entero/],
  ['√2x^2 + y^2 = 1', /raíz/],
  ['x^2 + y^2 = x^2 + y^2', /0 = 0/],
];

for (const [entrada, patron] of INVALIDAS) {
  test(`inválida: «${entrada}»`, () => {
    const r = parsearEcuacion(entrada);
    assert.equal(r.ok, false);
    assert.match(r.error, patron);
  });
}

test('el error señala la posición del problema', () => {
  const r = parsearEcuacion('x^2 + z^2 = 1');
  assert.equal(r.posicion, 6);
  assert.equal(r.longitud, 1);
  const r2 = parsearEcuacion('x^2 + y^2 + = 4');
  assert.equal(r2.posicion, 12);
  assert.match(r2.error, /Falta un término antes del signo «=» \(posición 13\)/);
});
