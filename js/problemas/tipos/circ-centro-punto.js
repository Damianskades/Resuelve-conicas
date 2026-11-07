// Circunferencia: conozco el centro y un punto por donde pasa.
import { Solucion, fallar } from '../solucion.js';
import { pasoDistancia, terminarCircunferencia, igualesP } from '../comunes.js';

export default {
  id: 'circ-centro-punto',
  conica: 'circunferencia',
  titulo: 'Conozco el centro y un punto por donde pasa',
  descripcion: 'El radio es la distancia del centro al punto.',
  palabras: 'centro punto pasa radio distancia',
  campos: [
    { id: 'C', tipo: 'punto', etiqueta: 'Centro C', ejemplo: '(−1; 4)' },
    { id: 'P', tipo: 'punto', etiqueta: 'Punto P de la circunferencia', ejemplo: '(3; 1)' },
  ],
  resolver({ C, P }) {
    if (igualesP(C, P)) fallar('El punto P no puede ser el centro: el radio sería 0.', 'P');
    const sol = new Solucion('Circunferencia con centro y un punto');
    const r = pasoDistancia(sol, C, P, {
      simbolo: 'r',
      titulo: 'Calculamos el radio',
      texto: 'El radio es la distancia del centro C al punto P, porque P está en la circunferencia.',
    });
    terminarCircunferencia(sol, C, r);
    sol.punto('P', P);
    return sol;
  },
};
