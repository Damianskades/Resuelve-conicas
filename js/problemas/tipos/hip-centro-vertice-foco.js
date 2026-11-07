// Hipérbola: conozco el centro, un vértice y un foco.
import { Solucion, fallar } from '../solucion.js';
import { ejeEntre, pasoSemieje, pasoB2, terminarHiperbola, fmtCorto } from '../comunes.js';

export default {
  id: 'hip-centro-vertice-foco',
  conica: 'hiperbola',
  titulo: 'Conozco el centro, un vértice y un foco',
  descripcion: 'a = distancia centro-vértice, c = distancia centro-foco y b² = c² − a².',
  palabras: 'centro vertice foco a b c',
  campos: [
    { id: 'C', tipo: 'punto', etiqueta: 'Centro C', ejemplo: '(4; 0)' },
    { id: 'V', tipo: 'punto', etiqueta: 'Vértice V', ejemplo: '(6; 0)' },
    { id: 'F', tipo: 'punto', etiqueta: 'Foco F', ejemplo: '(8; 0)' },
  ],
  resolver({ C, V, F }) {
    const eje = ejeEntre(C, V, ['C', 'V'], 'V');
    if (ejeEntre(C, F, ['C', 'F'], 'F') !== eje) fallar('El foco debe estar sobre el mismo eje que el vértice (la recta que pasa por C y V).', 'F');
    const sol = new Solucion('Hipérbola con centro, vértice y foco');
    const a = pasoSemieje(sol, C, V, eje, 'a', { titulo: 'Calculamos a', texto: 'a es la distancia del centro al vértice.' });
    const c = pasoSemieje(sol, C, F, eje, 'c', { titulo: 'Calculamos c', texto: 'c es la distancia del centro al foco.' });
    if (c.comparar(a) <= 0) fallar(`En la hipérbola el foco está más lejos del centro que el vértice: c > a. Aquí a = ${fmtCorto(a)} y c = ${fmtCorto(c)}.`, 'F');
    const b2 = pasoB2(sol, 'hiperbola', a, c);
    terminarHiperbola(sol, C, a.cuadrado(), b2, eje);
    sol.punto('V', V).punto('F', F);
    return sol;
  },
};
