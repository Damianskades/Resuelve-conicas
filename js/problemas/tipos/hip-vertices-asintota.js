// Hipérbola: conozco los vértices y una asíntota.
import { Solucion, fallar } from '../solucion.js';
import { ejeEntre, pasoPuntoMedio, pasoSemieje, terminarHiperbola, mValor, mAprox, R } from '../comunes.js';

export default {
  id: 'hip-vertices-asintota',
  conica: 'hiperbola',
  titulo: 'Conozco los vértices y una asíntota',
  descripcion: 'La pendiente de la asíntota es ±b/a (eje horizontal) o ±a/b (eje vertical); de ahí sale b.',
  palabras: 'vertices asintota pendiente b',
  campos: [
    { id: 'V1', tipo: 'punto', etiqueta: 'Vértice V₁', ejemplo: '(−3; 0)' },
    { id: 'V2', tipo: 'punto', etiqueta: 'Vértice V₂', ejemplo: '(3; 0)' },
    { id: 'A', tipo: 'recta', etiqueta: 'Asíntota', ejemplo: 'y = 2x' },
  ],
  resolver({ V1, V2, A }) {
    const eje = ejeEntre(V1, V2, ['V₁', 'V₂'], 'V2');
    const sol = new Solucion('Hipérbola con vértices y una asíntota');
    const C = pasoPuntoMedio(sol, V1, V2, { simbolo: 'C', titulo: 'Hallamos el centro', texto: 'El centro es el punto medio de los vértices.' });
    if (!R.contiene(A, C)) fallar('Las asíntotas pasan por el centro de la hipérbola, y esta recta no pasa por el centro. Revisa la asíntota.', 'A');
    const m = R.pendiente(A);
    if (m === null || m.esCero()) fallar('Una asíntota no puede ser horizontal ni vertical: su pendiente es ±b/a o ±a/b, distinta de 0.', 'A');
    const a = pasoSemieje(sol, C, V2, eje, 'a', { titulo: 'Calculamos a', texto: 'a es la distancia del centro a un vértice.' });
    const mAbs = m.abs();
    const b = eje === 'horizontal' ? mAbs.por(a) : a.entre(mAbs);
    sol.paso('Calculamos b con la pendiente de la asíntota', eje === 'horizontal' ? 'Con eje transverso horizontal la pendiente es ±b/a, así que b = |m|·a.' : 'Con eje transverso vertical la pendiente es ±a/b, así que b = a/|m|.', {
      formula: eje === 'horizontal' ? 'm = ±\\frac{b}{a}' : 'm = ±\\frac{a}{b}',
      mat: [`m = ${mValor(m)}`, eje === 'horizontal' ? `b = |m|·a = ${mValor(mAbs)}·${mValor(a)} = ${mValor(b)}${mAprox(b)}` : `b = \\frac{a}{|m|} = \\frac{${mValor(a)}}{${mValor(mAbs)}} = ${mValor(b)}${mAprox(b)}`],
    });
    terminarHiperbola(sol, C, a.cuadrado(), b.cuadrado(), eje);
    sol.punto('V₁', V1).punto('V₂', V2);
    return sol;
  },
};
