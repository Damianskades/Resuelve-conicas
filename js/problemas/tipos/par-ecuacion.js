// Parábola: elementos y gráfica a partir de su ecuación (reutiliza la Fase 2).
import { resolverDesdeEcuacion } from '../desde-general.js';

export default {
  id: 'par-ecuacion',
  conica: 'parabola',
  titulo: 'Tengo la ecuación de la parábola y quiero sus elementos',
  descripcion: 'Vértice, foco, directriz, lado recto y gráfica desde la ecuación general u ordinaria.',
  palabras: 'ecuacion general ordinaria elementos vertice foco directriz',
  datosPropios: true,
  campos: [{ id: 'ecuacion', tipo: 'ecuacion', etiqueta: 'Ecuación de la parábola', ejemplo: 'x^2 + 2x + 16y - 31 = 0' }],
  resolver({ ecuacion }) {
    const r = resolverDesdeEcuacion(ecuacion);
    if (!r.ok) return { ...r, campo: 'ecuacion' };
    if (r.tipo !== 'parabola') {
      return {
        ok: false,
        campo: 'ecuacion',
        error: `Esa ecuación es de una ${r.nombre.toLowerCase()}, no de una parábola (en una parábola solo aparece x² o solo y²). Usa el tipo «Tengo la ecuación de una cónica».`,
      };
    }
    return r;
  },
};
