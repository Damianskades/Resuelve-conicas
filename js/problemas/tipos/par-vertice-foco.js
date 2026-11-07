// Parábola: conozco el vértice y el foco.
import { Solucion, fallar } from '../solucion.js';
import { ejeEntre, desplazamiento, terminarParabola, textoEje, igualesP, mValor, mParen } from '../comunes.js';

export default {
  id: 'par-vertice-foco',
  conica: 'parabola',
  titulo: 'Conozco el vértice y el foco',
  descripcion: 'p es la distancia con signo del vértice al foco.',
  palabras: 'vertice foco parametro p',
  campos: [
    { id: 'V', tipo: 'punto', etiqueta: 'Vértice V', ejemplo: '(−1; 2)' },
    { id: 'F', tipo: 'punto', etiqueta: 'Foco F', ejemplo: '(−1; 0)' },
  ],
  resolver({ V, F }) {
    if (igualesP(V, F)) fallar('El foco no puede coincidir con el vértice: p sería 0 y no habría parábola.', 'F');
    const eje = ejeEntre(V, F, ['V', 'F'], 'F');
    const p = desplazamiento(V, F, eje);
    const sol = new Solucion('Parábola con vértice y foco');
    const c = eje === 'vertical' ? 'y' : 'x';
    const abre = eje === 'vertical' ? (p.signo() > 0 ? 'arriba' : 'abajo') : p.signo() > 0 ? 'la derecha' : 'la izquierda';
    sol.paso('Identificamos el eje y el parámetro p', `V y F están en una misma recta ${eje === 'vertical' ? 'vertical' : 'horizontal'}, así que el eje es ${textoEje(eje)}. p es lo que hay que avanzar desde V para llegar a F.`, {
      formula: `p = ${c}_F − ${c}_V`,
      mat: [`p = ${mValor(F[c])} − ${mParen(V[c])} = ${mValor(p)}   (p ${p.signo() > 0 ? '>' : '<'} 0: abre hacia ${abre})`],
    });
    terminarParabola(sol, V, p, eje);
    sol.punto('V', V).punto('F', F);
    return sol;
  },
};
