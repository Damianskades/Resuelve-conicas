// Fracciones, raíces, números exactos (Num), lectura de números y formateo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fr, suma, resta, multiplica, divide, desdeDecimal, desdeNumero } from '../js/math/fracciones.js';
import { simplificarRaiz, ex, exRaiz, exDiv } from '../js/math/raices.js';
import { Num, leerNumero, parseNum, aEntrada, fmt, punto } from '../js/math/numeros.js';
import {
  fmtFr, fmtExacto, fmtConAprox, fmtDecimal, fmtDecimalCorto, fmtNumero, fmtPuntoCompleto, aTexto,
} from '../js/math/formato.js';

const exacto = (n) => fmtExacto(Num.de(n).ex);

test('fracciones: 1/2 + 1/3 = 5/6', () => {
  assert.deepEqual(suma(fr(1, 2), fr(1, 3)), fr(5, 6));
  assert.equal(fmtFr(suma(fr(1, 2), fr(1, 3))), '5/6');
});

test('fracciones: se simplifican y el signo va en el numerador', () => {
  assert.deepEqual(fr(4, -6), { n: -2, d: 3 });
  assert.equal(fmtFr(fr(4, -6)), '−2/3');
  assert.deepEqual(fr(0, -5), { n: 0, d: 1 });
});

test('fracciones: resta, producto y cociente', () => {
  assert.deepEqual(resta(fr(3, 4), fr(5, 6)), fr(-1, 12));
  assert.deepEqual(multiplica(fr(2, 3), fr(9, 4)), fr(3, 2));
  assert.deepEqual(divide(fr(2, 5), fr(4, 15)), fr(3, 2));
  assert.throws(() => divide(fr(1), fr(0)), RangeError);
});

test('fracciones: desde decimales con punto o coma y sin errores de coma flotante', () => {
  assert.deepEqual(desdeDecimal('−1,25'), fr(-5, 4));
  assert.deepEqual(desdeDecimal('0.5'), fr(1, 2));
  assert.deepEqual(desdeNumero(0.1 + 0.2), fr(3, 10));
  assert.equal(desdeNumero(Math.SQRT2), null);
});

test('raíces: √20 = 2√5 y otras simplificaciones', () => {
  assert.deepEqual(simplificarRaiz(20), { coef: 2, rad: 5 });
  assert.equal(fmtExacto(exRaiz(ex(fr(20)))), '2√5');
  assert.equal(fmtExacto(exRaiz(ex(fr(72)))), '6√2');
  assert.equal(fmtExacto(exRaiz(ex(fr(65)))), '√65');
  assert.equal(fmtExacto(exRaiz(ex(fr(9, 4)))), '3/2');
});

test('raíces: √(4/5) = 2√5/5 (racionalizada) y 4/√7 = 4√7/7', () => {
  assert.equal(fmtExacto(exRaiz(ex(fr(4, 5)))), '2√5/5');
  const raiz7 = exRaiz(ex(fr(7)));
  assert.equal(fmtExacto(exDiv(ex(fr(4)), raiz7)), '4√7/7');
});

test('Num: operaciones exactas con raíces', () => {
  const c = Num.de(5).raiz();
  assert.equal(exacto(Num.de(-4).menos(c)), '−4 − √5');
  assert.equal(exacto(c.entre(3)), '√5/3');
  assert.equal(exacto(Num.de(2).entre(Num.de(3).raiz())), '2√3/3');
  assert.equal(exacto(Num.de(-4).menos(Num.de(9).entre(c))), '−4 − 9√5/5');
  assert.equal(exacto(Num.de(0.1).mas(0.2)), '3/10');
  assert.ok(Num.de(13851).raiz().igual(Num.de(27).por(Num.de(19).raiz())));
});

test('formato: exacto con su decimal al lado', () => {
  assert.equal(fmtConAprox(Num.de(5).raiz()), '√5 ≈ 2,24');
  assert.equal(fmtConAprox(Num.fr(2, 5)), '2/5 = 0,4');
  assert.equal(fmtConAprox(Num.fr(8, 3)), '8/3 ≈ 2,67');
  assert.equal(fmtConAprox(Num.de(4)), '4');
  assert.equal(fmtConAprox(Num.aprox(Math.PI)), '≈ 3,14');
});

test('formato: “−”, coma decimal y nunca errores de coma flotante', () => {
  assert.equal(fmtNumero(0.1 + 0.2), '0,3');
  assert.equal(fmtDecimal(-2.236), '−2,24');
  assert.equal(fmtDecimal(-0.004), '0,00');
  assert.equal(fmtDecimalCorto(1.25), '1,25');
  assert.equal(fmtDecimalCorto(100), '100');
  assert.equal(fmt(0.1 + 0.2), '0,3');
  assert.equal(punto(-1, 4), '(−1; 4)');
});

test('formato: puntos exactos con aproximación', () => {
  assert.equal(fmtPuntoCompleto(Num.de(3), Num.de(-7)), '(3; −7)');
  assert.equal(fmtPuntoCompleto(Num.fr(-5, 4), Num.de(-3)), '(−5/4; −3) = (−1,25; −3)');
  assert.equal(fmtPuntoCompleto(Num.de(-4).menos(Num.de(5).raiz()), Num.de(1)), '(−4 − √5; 1) ≈ (−6,24; 1)');
});

test('formato: fracciones apiladas a texto plano', () => {
  assert.equal(aTexto('\\frac{(x + 4)²}{9} + \\frac{(y − 1)²}{4} = 1'), '(x + 4)²/9 + (y − 1)²/4 = 1');
  assert.equal(aTexto('x² = \\frac{51200}{19}y'), 'x² = (51200/19)y');
  assert.equal(aTexto('\\frac{(x − 2)²}{\\frac{1}{9}}'), '(x − 2)²/(1/9)');
  assert.equal(aTexto('\\frac{x² + 1}{2}'), '(x² + 1)/2');
});

test('lectura de números de los campos', () => {
  const casos = {
    '3': '3',
    '−2,5': '−5/2',
    '2.5': '5/2',
    '3/4': '3/4',
    '√3': '√3',
    '2√5': '2√5',
    '−√3': '−√3',
    '3√2/2': '3√2/2',
    '√(4/5)': '2√5/5',
    '√20': '2√5',
    '4000√15/3': '4000√15/3',
  };
  for (const [entrada, esperado] of Object.entries(casos)) {
    const r = leerNumero(entrada);
    assert.ok(r.num, `${entrada} debería ser válido`);
    assert.equal(fmtExacto(r.num.ex), esperado, entrada);
  }
  assert.equal(parseNum('1,5'), 1.5);
  assert.ok(Number.isNaN(parseNum('abc')));
});

test('lectura de números: entradas inválidas con mensaje claro', () => {
  assert.match(leerNumero('').error, /Escribe un número/);
  assert.match(leerNumero('abc').error, /no es un número válido/);
  assert.match(leerNumero('3/0').error, /denominador no puede ser 0/);
  assert.match(leerNumero('√-4').error, /negativo/);
  assert.match(leerNumero('2x').error, /no es un número válido/);
});

test('aEntrada: el texto se puede volver a leer', () => {
  for (const t of ['−5/4', '2√5/5', '√3', '7']) {
    const n = leerNumero(t).num;
    assert.ok(leerNumero(aEntrada(n)).num.igual(n), t);
  }
  assert.equal(aEntrada(Num.de(3).raiz().mas(1)), '2,7321');
});
