// Parábola: conozco el vértice, la orientación del eje y un punto por donde pasa.
import { Solucion, fallar } from '../solucion.js';
import { terminarParabola, igualesP, mValor, mParen, mBase, igualdades } from '../comunes.js';

export default {
  id: 'par-vertice-punto',
  conica: 'parabola',
  titulo: 'Conozco el vértice, el eje y un punto por donde pasa',
  descripcion: 'Se reemplaza el punto en la ecuación ordinaria para despejar p.',
  palabras: 'vertice eje punto pasa despejar p',
  campos: [
    { id: 'V', tipo: 'punto', etiqueta: 'Vértice V', ejemplo: '(0; 0)' },
    {
      id: 'eje',
      tipo: 'opcion',
      etiqueta: 'Eje de la parábola',
      opciones: [{ valor: 'horizontal', texto: 'Horizontal (eje X)' }, { valor: 'vertical', texto: 'Vertical (eje Y)' }],
      ejemplo: 'horizontal',
    },
    { id: 'P', tipo: 'punto', etiqueta: 'Punto P de la parábola', ejemplo: '(1; 2√2)' },
  ],
  resolver({ V, eje, P }) {
    if (igualesP(V, P)) fallar('P no puede ser el vértice: necesitamos otro punto para hallar p.', 'P');
    const [u, w] = eje === 'vertical' ? ['x', 'y'] : ['y', 'x'];
    const du = P[u].menos(V[u]);
    const dw = P[w].menos(V[w]);
    if (dw.esCero()) {
      fallar(`Con eje ${eje}, P no puede estar en la recta ${w} = ${mValor(V[w])} que pasa por el vértice perpendicular al eje: ahí solo está el vértice.`, 'P');
    }
    if (du.esCero()) fallar(`P está sobre el eje de la parábola (${u} = ${mValor(V[u])}); ninguna parábola con este vértice y eje pasa por P.`, 'P');
    const sol = new Solucion('Parábola con vértice, eje y un punto');
    const cuatroP = du.cuadrado().entre(dw);
    const p = cuatroP.entre(4);
    const forma = eje === 'vertical' ? '(x − h)² = 4p(y − k)' : '(y − k)² = 4p(x − h)';
    sol.paso('Reemplazamos el punto en la ecuación ordinaria', 'P está en la parábola, así que cumple su ecuación; la única incógnita es p.', {
      formula: forma,
      mat: [
        `(${mValor(P[u])} − ${mParen(V[u])})² = 4p(${mValor(P[w])} − ${mParen(V[w])})`,
        `${mBase(du)}² = 4p·${mParen(dw)}`,
        igualdades(`4p = \\frac{${mValor(du.cuadrado())}}{${mValor(dw)}}`, mValor(cuatroP)),
        `p = ${mValor(p)}`,
      ],
    });
    terminarParabola(sol, V, p, eje);
    sol.punto('P', P);
    return sol;
  },
};
