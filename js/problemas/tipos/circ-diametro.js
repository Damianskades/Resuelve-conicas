// Circunferencia: conozco los extremos de un diámetro.
import { Solucion, fallar } from '../solucion.js';
import { pasoPuntoMedio, pasoDistancia, terminarCircunferencia, igualesP } from '../comunes.js';

export default {
  id: 'circ-diametro',
  conica: 'circunferencia',
  titulo: 'Conozco los extremos de un diámetro',
  descripcion: 'El centro es el punto medio y el radio es la mitad del diámetro.',
  palabras: 'diametro extremos punto medio',
  campos: [
    { id: 'A', tipo: 'punto', etiqueta: 'Extremo A', ejemplo: '(−3; 2)' },
    { id: 'B', tipo: 'punto', etiqueta: 'Extremo B', ejemplo: '(5; −4)' },
  ],
  resolver({ A, B }) {
    if (igualesP(A, B)) fallar('A y B son el mismo punto: un diámetro necesita dos extremos distintos.', 'B');
    const sol = new Solucion('Circunferencia con un diámetro');
    const C = pasoPuntoMedio(sol, A, B, { simbolo: 'C', titulo: 'Hallamos el centro', texto: 'El centro es el punto medio del diámetro AB.' });
    const r = pasoDistancia(sol, C, A, { simbolo: 'r', titulo: 'Calculamos el radio', texto: 'El radio es la distancia del centro a uno de los extremos.' });
    terminarCircunferencia(sol, C, r);
    sol.punto('A', A).punto('B', B);
    return sol;
  },
};
