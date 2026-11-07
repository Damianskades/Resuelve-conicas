// Parábola: conozco el vértice y la directriz.
import { Solucion, fallar } from '../solucion.js';
import { terminarParabola, mValor, mParen, R } from '../comunes.js';

export default {
  id: 'par-vertice-directriz',
  conica: 'parabola',
  titulo: 'Conozco el vértice y la directriz',
  descripcion: 'La directriz está a distancia p del vértice, del lado contrario al foco.',
  palabras: 'vertice directriz parametro p',
  campos: [
    { id: 'V', tipo: 'punto', etiqueta: 'Vértice V', ejemplo: '(4; 3)' },
    { id: 'd', tipo: 'recta', etiqueta: 'Directriz', ejemplo: 'x = −1', ayuda: 'Debe ser horizontal (y = …) o vertical (x = …).' },
  ],
  resolver({ V, d }) {
    let eje;
    let valor;
    if (R.esHorizontal(d)) {
      eje = 'vertical';
      valor = d.c.neg().entre(d.b);
    } else if (R.esVertical(d)) {
      eje = 'horizontal';
      valor = d.c.neg().entre(d.a);
    } else {
      fallar('La directriz debe ser horizontal (y = k) o vertical (x = h): en esta unidad el eje de la parábola es paralelo a X o a Y.', 'd');
    }
    if (R.contiene(d, V)) fallar('El vértice está sobre la directriz: p sería 0 y no habría parábola.', 'V');
    const c = eje === 'vertical' ? 'y' : 'x';
    const p = V[c].menos(valor);
    const sol = new Solucion('Parábola con vértice y directriz');
    sol.paso('Identificamos el eje y p', `La directriz ${R.fmtExplicita(d)} es ${eje === 'vertical' ? 'horizontal' : 'vertical'}, así que el eje es ${eje}. Como la directriz es ${c} = ${c === 'y' ? 'k' : 'h'} − p, despejamos p.`, {
      formula: `${c} = ${c === 'y' ? 'k' : 'h'} − p  →  p = ${c === 'y' ? 'k' : 'h'} − ${c}_d`,
      mat: [`p = ${mValor(V[c])} − ${mParen(valor)} = ${mValor(p)}`],
    });
    terminarParabola(sol, V, p, eje);
    return sol;
  },
};
