// Aplicación: trayectoria parabólica y = at + αt² + b con dos puntos conocidos (a y b desconocidos).
import { Solucion, fallar } from '../solucion.js';
import { pasoSistema2, construir, mValor, mParen, mSuma, mTermino, mAprox, mPunto, Num, pt } from '../comunes.js';

export default {
  id: 'app-trayectoria',
  conica: 'aplicacion',
  titulo: 'Trayectoria parabólica con dos puntos (a y b desconocidos)',
  descripcion: 'Como el drone: y = at − t² + b. Con dos puntos se hallan a y b, y luego el vértice (altura máxima).',
  palabras: 'trayectoria drone proyectil altura maxima vertice coeficientes a b aplicacion',
  campos: [
    { id: 'alfa', tipo: 'numero', etiqueta: 'Coeficiente conocido de t² (en y = at + □t² + b)', ejemplo: '−1', noCero: true },
    { id: 'P1', tipo: 'punto', etiqueta: 'Primer punto (t; y)', ejemplo: '(1; 7)' },
    { id: 'P2', tipo: 'punto', etiqueta: 'Segundo punto (t; y)', ejemplo: '(6; 12)' },
  ],
  resolver({ alfa, P1, P2 }) {
    if (P1.x.igual(P2.x)) fallar('Los dos puntos tienen el mismo t: necesitamos dos instantes distintos.', 'P2');
    const sol = new Solucion('Trayectoria parabólica');
    const forma = `y = at${mTermino(alfa, 't²')} + b`;
    const filas = [P1, P2].map((P) => [P.x, Num.de(1), P.y.menos(alfa.por(P.x.cuadrado()))]);
    sol.paso('Planteamos las ecuaciones', 'Cada punto (t; y) cumple la ecuación; las incógnitas son a y b.', {
      formula: forma,
      mat: [P1, P2].map((P, i) => `${mValor(P.y)} = a·${mParen(P.x)}${mTermino(alfa.por(P.x.cuadrado()))} + b   →   ${mSuma([[filas[i][0], 'a'], [1, 'b']])} = ${mValor(filas[i][2])}`),
    });
    const [a, b] = pasoSistema2(sol, filas, ['a', 'b']);
    const ecuacion = `y = ${mSuma([[a, 't'], [alfa, 't²'], [b, '']])}`;
    const tv = a.neg().entre(alfa.por(2));
    const yv = b.menos(a.cuadrado().entre(alfa.por(4)));
    const maximo = alfa.signo() < 0;
    sol.paso(`Hallamos el vértice (altura ${maximo ? 'máxima' : 'mínima'})`, `En y = αt² + at + b el vértice está en t = −a/(2α). Como α ${maximo ? '<' : '>'} 0, es un ${maximo ? 'máximo' : 'mínimo'}.`, {
      formula: ['t_V = −\\frac{a}{2α}', 'y_V = b − \\frac{a²}{4α}'],
      mat: [ecuacion, `t_V = −\\frac{${mValor(a)}}{2·${mParen(alfa)}} = ${mValor(tv)}${mAprox(tv)}`, `y_V = ${mValor(yv)}${mAprox(yv)}`],
    });
    const m = construir('parabola', { h: tv, k: yv, p: Num.de(1).entre(alfa.por(4)) }, 'vertical');
    sol.conica(m, { respuesta: false });
    sol.tituloRespuesta = 'Trayectoria';
    sol.respuesta('Coeficientes', `a = ${mValor(a)};   b = ${mValor(b)}`);
    sol.respuesta('Ecuación', ecuacion);
    sol.respuesta(`Vértice (altura ${maximo ? 'máxima' : 'mínima'})`, `${mPunto(tv, yv)}`);
    sol.respuesta('Forma ordinaria (con x = t)', m.ordinaria);
    sol.valor('a', a).valor('b', b).valor('vertice', pt(tv, yv));
    sol.punto('', P1).punto('', P2);
    return sol;
  },
};
