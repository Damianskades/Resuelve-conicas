// Elipse: conozco el centro, un vértice y un foco.
import { Solucion, fallar } from '../solucion.js';
import { ejeEntre, pasoSemieje, pasoB2, terminarElipse, fmtCorto } from '../comunes.js';

export default {
  id: 'eli-centro-vertice-foco',
  conica: 'elipse',
  titulo: 'Conozco el centro, un vértice y un foco',
  descripcion: 'a = distancia centro-vértice, c = distancia centro-foco y b² = a² − c².',
  palabras: 'centro vertice foco a b c',
  campos: [
    { id: 'C', tipo: 'punto', etiqueta: 'Centro C', ejemplo: '(2; −1)' },
    { id: 'V', tipo: 'punto', etiqueta: 'Vértice V', ejemplo: '(2; 4)' },
    { id: 'F', tipo: 'punto', etiqueta: 'Foco F', ejemplo: '(2; 3)' },
  ],
  resolver({ C, V, F }) {
    const eje = ejeEntre(C, V, ['C', 'V'], 'V');
    if (ejeEntre(C, F, ['C', 'F'], 'F') !== eje) fallar('El foco debe estar sobre el mismo eje que el vértice (la recta que pasa por C y V).', 'F');
    const sol = new Solucion('Elipse con centro, vértice y foco');
    const a = pasoSemieje(sol, C, V, eje, 'a', { titulo: 'Calculamos a', texto: 'a es la distancia del centro al vértice.' });
    const c = pasoSemieje(sol, C, F, eje, 'c', { titulo: 'Calculamos c', texto: 'c es la distancia del centro al foco.' });
    if (a.comparar(c) <= 0) fallar(`En la elipse el foco está entre el centro y el vértice, así que a > c. Aquí a = ${fmtCorto(a)} y c = ${fmtCorto(c)}.`, 'F');
    const b2 = pasoB2(sol, 'elipse', a, c);
    terminarElipse(sol, C, a.cuadrado(), b2, eje);
    sol.punto('V', V).punto('F', F);
    return sol;
  },
};
