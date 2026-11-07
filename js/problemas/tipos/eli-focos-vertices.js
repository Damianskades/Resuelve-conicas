// Elipse: conozco los focos y los vértices.
import { Solucion, fallar } from '../solucion.js';
import { ejeEntre, mismoCentro, sobreEje, pasoPuntoMedio, pasoSemieje, pasoB2, terminarElipse, fmtCorto } from '../comunes.js';

export default {
  id: 'eli-focos-vertices',
  conica: 'elipse',
  titulo: 'Conozco los focos y los vértices',
  descripcion: 'El centro es el punto medio; a y c salen de las distancias al centro y b² = a² − c².',
  palabras: 'focos vertices centro a b c',
  campos: [
    { id: 'F1', tipo: 'punto', etiqueta: 'Foco F₁', ejemplo: '(−3; 0)' },
    { id: 'F2', tipo: 'punto', etiqueta: 'Foco F₂', ejemplo: '(3; 0)' },
    { id: 'V1', tipo: 'punto', etiqueta: 'Vértice V₁', ejemplo: '(−5; 0)' },
    { id: 'V2', tipo: 'punto', etiqueta: 'Vértice V₂', ejemplo: '(5; 0)' },
  ],
  resolver({ F1, F2, V1, V2 }) {
    const eje = ejeEntre(F1, F2, ['F₁', 'F₂'], 'F2');
    if (ejeEntre(V1, V2, ['V₁', 'V₂'], 'V2') !== eje) fallar('Los focos y los vértices deben estar sobre el mismo eje.', 'V2');
    mismoCentro([F1, F2], [V1, V2], ['los focos', 'los vértices'], 'V2');
    sobreEje(F1, V1, eje, 'Los focos y los vértices deben estar sobre la misma recta (el eje mayor).', 'V1');
    const sol = new Solucion('Elipse con focos y vértices');
    const C = pasoPuntoMedio(sol, F1, F2, { simbolo: 'C', titulo: 'Hallamos el centro', texto: 'El centro es el punto medio de los focos (y también de los vértices).' });
    const a = pasoSemieje(sol, C, V2, eje, 'a', { titulo: 'Calculamos a', texto: 'a es la distancia del centro a un vértice.' });
    const c = pasoSemieje(sol, C, F2, eje, 'c', { titulo: 'Calculamos c', texto: 'c es la distancia del centro a un foco.' });
    if (a.comparar(c) <= 0) fallar(`En la elipse los focos están entre los vértices, así que a > c. Aquí a = ${fmtCorto(a)} y c = ${fmtCorto(c)}.`, 'V2');
    const b2 = pasoB2(sol, 'elipse', a, c);
    terminarElipse(sol, C, a.cuadrado(), b2, eje);
    for (const [n, P] of [['F₁', F1], ['F₂', F2], ['V₁', V1], ['V₂', V2]]) sol.punto(n, P);
    return sol;
  },
};
