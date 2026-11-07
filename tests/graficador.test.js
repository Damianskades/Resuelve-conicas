// Partes puras del graficador y de la interfaz (sin DOM).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Plano, pasoCuadricula, formatoEje, estaVisible } from '../js/graficador/plano.js';
import { mathAHtml } from '../js/ui/componentes.js';

test('paso de cuadrícula 1-2-5 según el zoom', () => {
  assert.equal(pasoCuadricula(70), 1);
  assert.equal(pasoCuadricula(40), 2);
  assert.equal(pasoCuadricula(20), 5);
  assert.equal(pasoCuadricula(7), 10);
  assert.equal(pasoCuadricula(700), 0.1);
  assert.equal(pasoCuadricula(0.07), 1000);
});

test('números de los ejes sin errores de coma flotante', () => {
  assert.equal(formatoEje(0.1 + 0.2, 0.1), '0,3');
  assert.equal(formatoEje(-2, 1), '−2');
  assert.equal(formatoEje(3 * 0.05, 0.05), '0,15');
  assert.equal(formatoEje(5000, 1000), '5000');
});

test('interruptores: un elemento sin grupo siempre se ve', () => {
  assert.equal(estaVisible({}, { focos: false }), true);
  assert.equal(estaVisible({ grupo: 'focos' }, { focos: false }), false);
  assert.equal(estaVisible({ grupo: 'focos' }, { focos: true }), true);
});

test('fracciones apiladas en HTML y texto escapado', () => {
  assert.equal(
    mathAHtml('\\frac{(x + 4)²}{9}'),
    '<span class="frac"><span class="frac-num">(x + 4)²</span><span class="frac-den">9</span></span>',
  );
  assert.equal(mathAHtml('a < b'), 'a &lt; b');
});

test('descartar una gráfica libera observadores y eventos sin volver a dibujarla', (t) => {
  const ventana = new EventTarget();
  ventana.devicePixelRatio = 1;
  const pendientes = [];
  let desconectado = false;
  let mediciones = 0;
  const anteriores = { window: globalThis.window, ResizeObserver: globalThis.ResizeObserver, requestAnimationFrame: globalThis.requestAnimationFrame };
  globalThis.requestAnimationFrame = (f) => pendientes.push(f);
  globalThis.window = ventana;
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() { desconectado = true; }
  };
  t.after(() => {
    for (const [nombre, valor] of Object.entries(anteriores)) {
      if (valor === undefined) delete globalThis[nombre];
      else globalThis[nombre] = valor;
    }
  });
  const canvas = new EventTarget();
  canvas.getContext = () => ({});
  canvas.getBoundingClientRect = () => { mediciones++; return { width: 0, height: 0 }; };
  const plano = new Plano(canvas);
  plano.dibujar({ puntos: [] });
  plano.destruir();
  const inicial = plano.escala;
  ventana.dispatchEvent(new Event('resize'));
  const evento = new Event('keydown');
  evento.key = '+';
  canvas.dispatchEvent(evento);
  assert.equal(plano.escala, inicial);
  assert.equal(mediciones, 1);
  assert.ok(desconectado);
  assert.equal(plano.escena, null);
  plano._render = () => assert.fail('una gráfica descartada no debe dibujarse');
  for (const f of pendientes) f();
});
