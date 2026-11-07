// Parábola de eje vertical y = ax² + bx + c que pasa por tres puntos.
import { Solucion, fallar } from '../solucion.js';
import { pasoSistema3, terminarParabola, mSuma, mTermino, mCuadrado, mPorBinomio, Num, pt } from '../comunes.js';
import { mCoefCuadrado } from '../../math/expresiones.js';

export default {
  id: 'par-tres-puntos',
  conica: 'parabola',
  titulo: 'Eje vertical y pasa por tres puntos (y = ax² + bx + c)',
  descripcion: 'Se plantea un sistema con a, b y c y luego se completa el cuadrado.',
  palabras: 'tres puntos sistema a b c eje vertical cuadratica',
  campos: [
    { id: 'P', tipo: 'punto', etiqueta: 'Punto P', ejemplo: '(0; 1)' },
    { id: 'Q', tipo: 'punto', etiqueta: 'Punto Q', ejemplo: '(1; 0)' },
    { id: 'R', tipo: 'punto', etiqueta: 'Punto R', ejemplo: '(3; 4)' },
  ],
  resolver({ P, Q, R }) {
    const pts = [P, Q, R];
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        if (pts[i].x.igual(pts[j].x)) {
          fallar(`${'PQR'[i]} y ${'PQR'[j]} tienen la misma abscisa: una parábola y = ax² + bx + c no puede pasar por dos puntos con el mismo x.`, 'PQR'[j]);
        }
      }
    }
    const sol = new Solucion('Parábola por tres puntos');
    sol.formula('y = ax² + bx + c');
    const [a, b, c] = pasoSistema3(sol, pts.map((X) => [X.x.cuadrado(), X.x, X.y]), ['a', 'b', 'c'], {
      textoPlanteo: 'Reemplazamos cada punto en y = ax² + bx + c.',
      campo: 'R',
    });
    if (a.esCero()) fallar('Los tres puntos están alineados (a = 0): no hay parábola que pase por ellos.', 'R');
    const h = b.neg().entre(a.por(2));
    const k = c.menos(b.cuadrado().entre(a.por(4)));
    const p = Num.de(1).entre(a.por(4));
    sol.paso('Completamos el cuadrado', 'Escribimos y = a(x − h)² + k con h = −b/(2a) y k = c − b²/(4a), y despejamos (x − h)².', {
      formula: ['h = −\\frac{b}{2a}', 'k = c − \\frac{b²}{4a}'],
      mat: [
        `y = ${mSuma([[a, 'x²'], [b, 'x'], [c, '']])}`,
        `y = ${mCoefCuadrado(a, 'x', h)}${mTermino(k)}`,
        `${mCuadrado('x', h)} = ${mPorBinomio(Num.de(1).entre(a), 'y', k)}`,
      ],
    });
    terminarParabola(sol, pt(h, k), p, 'vertical');
    sol.respuesta('Forma y = ax² + bx + c', `y = ${mSuma([[a, 'x²'], [b, 'x'], [c, '']])}`);
    sol.valor('a', a).valor('b', b).valor('c', c);
    sol.punto('P', P).punto('Q', Q).punto('R', R);
    return sol;
  },
};
