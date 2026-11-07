// Parábola: conozco el foco y la directriz (el vértice es el punto medio).
import { Solucion, fallar } from '../solucion.js';
import { pasoPuntoMedio, terminarParabola, mValor, mParen, pt, R } from '../comunes.js';

export default {
  id: 'par-foco-directriz',
  conica: 'parabola',
  titulo: 'Conozco el foco y la directriz',
  descripcion: 'El vértice está a mitad de camino entre el foco y la directriz.',
  palabras: 'foco directriz vertice punto medio',
  campos: [
    { id: 'F', tipo: 'punto', etiqueta: 'Foco F', ejemplo: '(3; 2)' },
    { id: 'd', tipo: 'recta', etiqueta: 'Directriz', ejemplo: 'x = −1', ayuda: 'Debe ser horizontal (y = …) o vertical (x = …).' },
  ],
  resolver({ F, d }) {
    let eje;
    let D0;
    if (R.esHorizontal(d)) {
      eje = 'vertical';
      D0 = pt(F.x, d.c.neg().entre(d.b));
    } else if (R.esVertical(d)) {
      eje = 'horizontal';
      D0 = pt(d.c.neg().entre(d.a), F.y);
    } else {
      fallar('La directriz debe ser horizontal (y = k) o vertical (x = h): en esta unidad el eje de la parábola es paralelo a X o a Y.', 'd');
    }
    if (R.contiene(d, F)) fallar('El foco está sobre la directriz: así no hay parábola. El foco debe estar fuera de la directriz.', 'F');
    const sol = new Solucion('Parábola con foco y directriz');
    sol.paso('Identificamos el eje', `La directriz es ${eje === 'vertical' ? 'horizontal' : 'vertical'}, así que el eje (perpendicular a ella, por el foco) es ${eje}. D es el punto de la directriz más cercano al foco.`, {
      mat: [`directriz: ${R.fmtExplicita(d)}   →   D = (${mValor(D0.x)}; ${mValor(D0.y)})`],
    });
    const V = pasoPuntoMedio(sol, F, D0, { simbolo: 'V', titulo: 'Hallamos el vértice', texto: 'Todo punto de la parábola está a igual distancia del foco y de la directriz; el vértice es el punto medio de F y D.' });
    const c = eje === 'vertical' ? 'y' : 'x';
    const p = F[c].menos(V[c]);
    sol.paso('Calculamos p', 'p es la distancia con signo del vértice al foco.', {
      formula: `p = ${c}_F − ${c}_V`,
      mat: [`p = ${mValor(F[c])} − ${mParen(V[c])} = ${mValor(p)}`],
    });
    terminarParabola(sol, V, p, eje);
    sol.punto('F', F);
    return sol;
  },
};
