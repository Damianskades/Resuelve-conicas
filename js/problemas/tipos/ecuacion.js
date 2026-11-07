// Cualquier cónica desde su ecuación general u ordinaria (Fase 2).
import { resolverDesdeEcuacion } from '../desde-general.js';

export default {
  id: 'ecuacion',
  conica: 'general',
  titulo: 'Tengo la ecuación de una cónica y quiero sus elementos',
  descripcion: 'Identifica si es circunferencia, parábola, elipse o hipérbola, la lleva a la forma ordinaria y calcula todo.',
  palabras: 'general ordinaria completar cuadrados identificar elementos grafica',
  datosPropios: true,
  campos: [
    {
      id: 'ecuacion',
      tipo: 'ecuacion',
      etiqueta: 'Ecuación',
      ejemplo: '4x^2 + 9y^2 + 32x - 18y + 37 = 0',
      ayuda: 'Forma general u ordinaria: x^2 o x², fracciones con /, por ejemplo (x+4)^2/9 + (y-1)^2/4 = 1.',
    },
  ],
  resolver({ ecuacion }) {
    const r = resolverDesdeEcuacion(ecuacion);
    return r.ok ? r : { ...r, campo: 'ecuacion' };
  },
};
