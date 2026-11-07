// Circunferencia: centro y recta tangente que pasa por dos puntos dados.
import { Solucion, fallar } from '../solucion.js';
import { pasoRectaDosPuntos, pasoDistanciaPuntoRecta, terminarCircunferencia, R } from '../comunes.js';

export default {
  id: 'circ-centro-tangente-ab',
  conica: 'circunferencia',
  titulo: 'Conozco el centro y la tangente pasa por dos puntos A y B',
  descripcion: 'Primero se halla la recta AB y luego el radio como distancia del centro a esa recta.',
  palabras: 'centro tangente dos puntos recta ab distancia',
  campos: [
    { id: 'C', tipo: 'punto', etiqueta: 'Centro C', ejemplo: '(−1; 4)' },
    { id: 'A', tipo: 'punto', etiqueta: 'Punto A de la tangente', ejemplo: '(3; −2)' },
    { id: 'B', tipo: 'punto', etiqueta: 'Punto B de la tangente', ejemplo: '(−9; 3)' },
  ],
  resolver({ C, A, B }) {
    const sol = new Solucion('Circunferencia tangente a la recta AB');
    const L = pasoRectaDosPuntos(sol, A, B, { campo: 'B' });
    if (R.contiene(L, C)) fallar('El centro está sobre la recta AB: el radio sería 0.', 'C');
    const r = pasoDistanciaPuntoRecta(sol, C, L, {
      simbolo: 'r',
      titulo: 'Calculamos el radio',
      texto: 'La recta AB es tangente, así que el radio es la distancia del centro a esa recta.',
    });
    terminarCircunferencia(sol, C, r);
    sol.valor('recta', L);
    sol.respuesta('Recta tangente AB', R.fmtRecta(L));
    sol.recta('L', L).punto('A', A).punto('B', B);
    return sol;
  },
};
