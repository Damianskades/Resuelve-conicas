// Circunferencia: conozco el centro y el radio.
import { Solucion } from '../solucion.js';
import { terminarCircunferencia } from '../comunes.js';

export default {
  id: 'circ-centro-radio',
  conica: 'circunferencia',
  titulo: 'Conozco el centro y el radio',
  descripcion: 'Ecuación ordinaria y general a partir de C(h; k) y r.',
  palabras: 'centro radio ecuacion',
  campos: [
    { id: 'C', tipo: 'punto', etiqueta: 'Centro C', ejemplo: '(3; −7)' },
    { id: 'r', tipo: 'numero', etiqueta: 'Radio r', ejemplo: '4', positivo: true },
  ],
  resolver({ C, r }) {
    const sol = new Solucion('Circunferencia con centro y radio');
    terminarCircunferencia(sol, C, r, { campo: 'r' });
    return sol;
  },
};
