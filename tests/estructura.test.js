// Verifica que la estructura del proyecto existe.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

const archivos = [
  'index.html',
  'css/styles.css',
  'js/main.js',
  'js/math/numeros.js',
  'js/math/fracciones.js',
  'js/math/raices.js',
  'js/math/formato.js',
  'js/math/parser.js',
  'js/math/general.js',
  'js/math/expresiones.js',
  'js/math/puntos.js',
  'js/math/rectas.js',
  'js/conicas/comun.js',
  'js/conicas/circunferencia.js',
  'js/conicas/parabola.js',
  'js/conicas/elipse.js',
  'js/conicas/hiperbola.js',
  'js/graficador/plano.js',
  'js/problemas/tipos.js',
  'js/problemas/solucionador.js',
  'js/problemas/desde-general.js',
  'js/problemas/ejemplos.js',
  'js/problemas/campos.js',
  'js/problemas/solucion.js',
  'js/problemas/comunes.js',
  'js/problemas/detector.js',
  'js/problemas/alternativas.js',
  'js/ui/componentes.js',
  'js/ui/graficar.js',
  'js/ui/resolver.js',
  'docs/casos-de-clase.md',
  'README.md',
  'CLAUDE.md',
];

for (const archivo of archivos) {
  test(`existe ${archivo}`, () => {
    assert.ok(existsSync(join(raiz, archivo)), `Falta el archivo ${archivo}`);
  });
}
