// Hipérbola: conozco los vértices y los focos.
import { Solucion, fallar } from '../solucion.js';
import { ejeEntre, mismoCentro, sobreEje, pasoPuntoMedio, pasoSemieje, pasoB2, terminarHiperbola, fmtCorto } from '../comunes.js';

export default {
  id: 'hip-vertices-focos',
  conica: 'hiperbola',
  titulo: 'Conozco los vértices y los focos',
  descripcion: 'El centro es el punto medio; a y c salen de las distancias al centro y b² = c² − a².',
  palabras: 'vertices focos centro a b c',
  campos: [
    { id: 'V1', tipo: 'punto', etiqueta: 'Vértice V₁', ejemplo: '(2; 0)' },
    { id: 'V2', tipo: 'punto', etiqueta: 'Vértice V₂', ejemplo: '(6; 0)' },
    { id: 'F1', tipo: 'punto', etiqueta: 'Foco F₁', ejemplo: '(0; 0)' },
    { id: 'F2', tipo: 'punto', etiqueta: 'Foco F₂', ejemplo: '(8; 0)' },
  ],
  resolver({ V1, V2, F1, F2 }) {
    const eje = ejeEntre(V1, V2, ['V₁', 'V₂'], 'V2');
    if (ejeEntre(F1, F2, ['F₁', 'F₂'], 'F2') !== eje) fallar('Los focos y los vértices deben estar sobre el mismo eje.', 'F2');
    mismoCentro([V1, V2], [F1, F2], ['los vértices', 'los focos'], 'F2');
    sobreEje(V1, F1, eje, 'Los focos y los vértices deben estar sobre la misma recta (el eje transverso).', 'F1');
    const sol = new Solucion('Hipérbola con vértices y focos');
    const C = pasoPuntoMedio(sol, V1, V2, { simbolo: 'C', titulo: 'Hallamos el centro', texto: 'El centro es el punto medio de los vértices (y también de los focos).' });
    const a = pasoSemieje(sol, C, V2, eje, 'a', { titulo: 'Calculamos a', texto: 'a es la distancia del centro a un vértice.' });
    const c = pasoSemieje(sol, C, F2, eje, 'c', { titulo: 'Calculamos c', texto: 'c es la distancia del centro a un foco.' });
    if (c.comparar(a) <= 0) fallar(`En la hipérbola los focos están más lejos del centro que los vértices: c > a. Aquí a = ${fmtCorto(a)} y c = ${fmtCorto(c)}.`, 'F2');
    const b2 = pasoB2(sol, 'hiperbola', a, c);
    terminarHiperbola(sol, C, a.cuadrado(), b2, eje);
    for (const [n, P] of [['V₁', V1], ['V₂', V2], ['F₁', F1], ['F₂', F2]]) sol.punto(n, P);
    return sol;
  },
};
