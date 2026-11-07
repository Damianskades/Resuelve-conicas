// Aplicación: órbitas elípticas. Con la excentricidad y un eje: perihelio a − c y afelio a + c.
import { Solucion } from '../solucion.js';
import { terminarElipse, pasoB2, mValor, mAprox, Num, pt } from '../comunes.js';

export default {
  id: 'app-orbita',
  conica: 'aplicacion',
  titulo: 'Órbita de un planeta (perihelio y afelio)',
  descripcion: 'Con la excentricidad y la longitud de un eje: a, c, perihelio a − c y afelio a + c.',
  palabras: 'orbita planeta pluton sol perihelio afelio excentricidad aplicacion',
  campos: [
    { id: 'e', tipo: 'numero', etiqueta: 'Excentricidad e', ejemplo: '0,25', mayorQue: 0, menorQue: 1 },
    {
      id: 'cual',
      tipo: 'opcion',
      etiqueta: '¿Qué eje conoces?',
      opciones: [{ valor: 'menor', texto: 'Eje menor (2b)' }, { valor: 'mayor', texto: 'Eje mayor (2a)' }],
      ejemplo: 'menor',
    },
    { id: 'L', tipo: 'numero', etiqueta: 'Longitud del eje (en las unidades del enunciado)', ejemplo: '10000', positivo: true },
  ],
  resolver({ e, cual, L }) {
    const sol = new Solucion('Órbita elíptica');
    let a;
    let c;
    let b2;
    if (cual === 'mayor') {
      a = L.entre(2);
      c = a.por(e);
      sol.paso('Calculamos a y c', 'El eje mayor mide 2a; con e = c/a, c = a·e.', {
        formula: 'e = \\frac{c}{a}',
        mat: [`a = \\frac{${mValor(L)}}{2} = ${mValor(a)}`, `c = a·e = ${mValor(c)}${mAprox(c)}`],
      });
      b2 = pasoB2(sol, 'elipse', a, c);
    } else {
      const b = L.entre(2);
      b2 = b.cuadrado();
      const a2 = b2.entre(Num.de(1).menos(e.cuadrado()));
      a = a2.raiz();
      c = a.por(e);
      sol.paso('Calculamos a y c', 'El eje menor mide 2b. Como c = a·e y b² = a² − c² = a²(1 − e²), despejamos a² = b²/(1 − e²).', {
        formula: ['b² = a²(1 − e²)', 'c = a·e'],
        mat: [
          `b = \\frac{${mValor(L)}}{2} = ${mValor(b)}`,
          `a² = \\frac{${mValor(b2)}}{1 − ${mValor(e.cuadrado())}} = ${mValor(a2)}  →  a = ${mValor(a)}${mAprox(a)}`,
          `c = a·e = ${mValor(c)}${mAprox(c)}`,
        ],
      });
    }
    const peri = a.menos(c);
    const afe = a.mas(c);
    sol.paso('Calculamos el perihelio y el afelio', 'El Sol está en un foco: la menor distancia al Sol es a − c y la mayor es a + c.', {
      formula: ['perihelio = a − c', 'afelio = a + c'],
      mat: [`perihelio = ${mValor(peri)}${mAprox(peri)}`, `afelio = ${mValor(afe)}${mAprox(afe)}`],
    });
    terminarElipse(sol, pt(0, 0), a.cuadrado(), b2, 'horizontal', { texto: 'Ponemos el centro de la órbita en el origen y el eje mayor horizontal; el Sol queda en el foco (c; 0).' });
    sol.tituloRespuesta = 'Órbita';
    sol.lineas.unshift({ etiqueta: 'Afelio (a + c)', mat: `${mValor(afe)}${mAprox(afe)}` }, { etiqueta: 'Perihelio (a − c)', mat: `${mValor(peri)}${mAprox(peri)}` });
    sol.valor('perihelio', peri).valor('afelio', afe);
    return sol;
  },
};
