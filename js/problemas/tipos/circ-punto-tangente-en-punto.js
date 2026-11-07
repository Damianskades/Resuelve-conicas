// Circunferencia que pasa por un punto P y es tangente a una recta L en un punto T.
import { Solucion, fallar } from '../solucion.js';
import { pasoPerpendicular, pasoPuntoMedio, pasoInterseccion, pasoDistancia, terminarCircunferencia, igualesP, R } from '../comunes.js';

export default {
  id: 'circ-punto-tangente-en-punto',
  conica: 'circunferencia',
  titulo: 'Pasa por un punto y es tangente a una recta en otro punto',
  descripcion: 'El centro está en la perpendicular a la tangente por T y en la mediatriz del segmento TP.',
  palabras: 'pasa por punto tangente recta punto de tangencia mediatriz perpendicular',
  campos: [
    { id: 'P', tipo: 'punto', etiqueta: 'Punto P por donde pasa', ejemplo: '(3; 11)' },
    { id: 'L', tipo: 'recta', etiqueta: 'Recta tangente L', ejemplo: 'x − 2y + 4 = 0' },
    { id: 'T', tipo: 'punto', etiqueta: 'Punto de tangencia T (sobre L)', ejemplo: '(2; 3)' },
  ],
  resolver({ P, L, T }) {
    if (!R.contiene(L, T)) fallar('El punto de tangencia T no está sobre la recta L.', 'T');
    if (igualesP(P, T)) fallar('P y T son el mismo punto: con un solo punto de la recta hay infinitas circunferencias tangentes.', 'P');
    if (R.contiene(L, P)) fallar('P está sobre la recta tangente y es distinto de T: ninguna circunferencia puede tocar la tangente en dos puntos.', 'P');
    const sol = new Solucion('Circunferencia por un punto y tangente en otro');
    const N = pasoPerpendicular(sol, L, T, {
      nombre: 'N',
      nombreR: 'L',
      nombreP: 'T',
      texto: 'El radio CT es perpendicular a la tangente, así que el centro está en esta recta.',
    });
    const M = pasoPuntoMedio(sol, T, P, { simbolo: 'M', titulo: 'Hallamos el punto medio de TP', texto: 'T y P están en la circunferencia, así que el centro equidista de ambos: está en la mediatriz de TP.' });
    const TP = R.rectaPorDosPuntos(T, P);
    const mediatriz = pasoPerpendicular(sol, TP, M, { nombre: 'Med', nombreR: 'TP', nombreP: 'M', texto: 'La mediatriz es la perpendicular a TP por su punto medio.' });
    const C = pasoInterseccion(sol, N, mediatriz, { nombres: ['N', 'Med'], simbolo: 'C', titulo: 'Hallamos el centro', texto: 'El centro está en las dos rectas: es su intersección.' });
    const r = pasoDistancia(sol, C, T, { simbolo: 'r', titulo: 'Calculamos el radio', texto: 'El radio es la distancia del centro al punto de tangencia.' });
    terminarCircunferencia(sol, C, r);
    sol.recta('L', L).recta('N', N, 'auxiliar').recta('Med', mediatriz, 'auxiliar').punto('P', P).punto('T', T);
    return sol;
  },
};
