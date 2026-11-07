// Circunferencia tangente a una recta en un punto dado, con el centro sobre otra recta.
import { Solucion, fallar } from '../solucion.js';
import { pasoPerpendicular, pasoInterseccion, pasoDistancia, terminarCircunferencia, R } from '../comunes.js';

export default {
  id: 'circ-tangente-centro-en-recta',
  conica: 'circunferencia',
  titulo: 'Es tangente a una recta en un punto y su centro está sobre otra recta',
  descripcion: 'El centro está en la perpendicular a la tangente por el punto de tangencia y también en la otra recta.',
  palabras: 'tangente punto de tangencia centro sobre recta perpendicular interseccion',
  campos: [
    { id: 'L', tipo: 'recta', etiqueta: 'Recta tangente L', ejemplo: '2x − y + 1 = 0' },
    { id: 'T', tipo: 'punto', etiqueta: 'Punto de tangencia T', ejemplo: '(2; 5)' },
    { id: 'M', tipo: 'recta', etiqueta: 'Recta M donde está el centro', ejemplo: 'x + y = 9' },
  ],
  resolver({ L, T, M }) {
    if (!R.contiene(L, T)) fallar('El punto de tangencia T no está sobre la recta L: T debe cumplir la ecuación de L.', 'T');
    const sol = new Solucion('Circunferencia tangente en un punto con centro sobre una recta');
    const N = pasoPerpendicular(sol, L, T, {
      nombre: 'N',
      nombreR: 'L',
      nombreP: 'T',
      texto: 'El radio que llega al punto de tangencia es perpendicular a la tangente, así que el centro está en esta perpendicular.',
    });
    const C = pasoInterseccion(sol, N, M, {
      nombres: ['N', 'M'],
      simbolo: 'C',
      titulo: 'Hallamos el centro',
      texto: 'El centro está en N y en M a la vez: es su punto de intersección.',
      campo: 'M',
    });
    const r = pasoDistancia(sol, C, T, { simbolo: 'r', titulo: 'Calculamos el radio', texto: 'El radio es la distancia del centro al punto de tangencia.' });
    terminarCircunferencia(sol, C, r);
    sol.recta('L', L).recta('M', M).recta('N', N, 'auxiliar').punto('T', T);
    return sol;
  },
};
