// Elipse: conozco los vértices y la excentricidad.
import { Solucion } from '../solucion.js';
import { ejeEntre, pasoPuntoMedio, pasoSemieje, pasoB2, terminarElipse, mValor, mAprox } from '../comunes.js';

export default {
  id: 'eli-vertices-excentricidad',
  conica: 'elipse',
  titulo: 'Conozco los vértices y la excentricidad',
  descripcion: 'Con e = c/a se despeja c = a·e; luego b² = a² − c².',
  palabras: 'vertices excentricidad e c a',
  campos: [
    { id: 'V1', tipo: 'punto', etiqueta: 'Vértice V₁', ejemplo: '(−7; 1)' },
    { id: 'V2', tipo: 'punto', etiqueta: 'Vértice V₂', ejemplo: '(−1; 1)' },
    { id: 'e', tipo: 'numero', etiqueta: 'Excentricidad e', ejemplo: '√5/3', mayorQue: 0, menorQue: 1, ayuda: 'En la elipse 0 < e < 1.' },
  ],
  resolver({ V1, V2, e }) {
    const eje = ejeEntre(V1, V2, ['V₁', 'V₂'], 'V2');
    const sol = new Solucion('Elipse con vértices y excentricidad');
    const C = pasoPuntoMedio(sol, V1, V2, { simbolo: 'C', titulo: 'Hallamos el centro', texto: 'El centro es el punto medio de los vértices.' });
    const a = pasoSemieje(sol, C, V2, eje, 'a', { titulo: 'Calculamos a', texto: 'a es la distancia del centro a un vértice.' });
    const c = a.por(e);
    sol.paso('Calculamos c con la excentricidad', 'Como e = c/a, despejamos c = a·e.', {
      formula: 'e = \\frac{c}{a}',
      mat: [`c = a·e = ${mValor(a)}·${mValor(e)} = ${mValor(c)}${mAprox(c)}`],
    });
    const b2 = pasoB2(sol, 'elipse', a, c);
    terminarElipse(sol, C, a.cuadrado(), b2, eje);
    sol.punto('V₁', V1).punto('V₂', V2);
    return sol;
  },
};
