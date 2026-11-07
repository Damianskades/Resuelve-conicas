// Circunferencia: conozco el centro y una recta tangente.
import { Solucion, fallar } from '../solucion.js';
import { pasoDistanciaPuntoRecta, terminarCircunferencia, R } from '../comunes.js';

export default {
  id: 'circ-centro-tangente',
  conica: 'circunferencia',
  titulo: 'Conozco el centro y una recta tangente',
  descripcion: 'El radio es la distancia del centro a la recta tangente.',
  palabras: 'centro tangente recta distancia punto recta',
  campos: [
    { id: 'C', tipo: 'punto', etiqueta: 'Centro C', ejemplo: '(−1; 4)' },
    { id: 'L', tipo: 'recta', etiqueta: 'Recta tangente L', ejemplo: '5x + 12y + 9 = 0' },
  ],
  resolver({ C, L }) {
    if (R.contiene(L, C)) fallar('El centro está sobre la recta: el radio sería 0. Una recta tangente no pasa por el centro.', 'L');
    const sol = new Solucion('Circunferencia con centro y recta tangente');
    const r = pasoDistanciaPuntoRecta(sol, C, L, {
      simbolo: 'r',
      titulo: 'Calculamos el radio',
      texto: 'Una tangente está a distancia r del centro, así que r es la distancia de C a la recta.',
    });
    terminarCircunferencia(sol, C, r);
    sol.recta('L', L);
    return sol;
  },
};
