// Hipérbola: conozco los focos y la excentricidad.
import { Solucion } from '../solucion.js';
import { ejeEntre, pasoPuntoMedio, pasoSemieje, pasoB2, terminarHiperbola, mValor, mAprox } from '../comunes.js';

export default {
  id: 'hip-focos-excentricidad',
  conica: 'hiperbola',
  titulo: 'Conozco los focos y la excentricidad',
  descripcion: 'Con e = c/a se despeja a = c/e; luego b² = c² − a².',
  palabras: 'focos excentricidad e a',
  campos: [
    { id: 'F1', tipo: 'punto', etiqueta: 'Foco F₁', ejemplo: '(−1; −√7)' },
    { id: 'F2', tipo: 'punto', etiqueta: 'Foco F₂', ejemplo: '(−1; √7)' },
    { id: 'e', tipo: 'numero', etiqueta: 'Excentricidad e', ejemplo: '√7/2', mayorQue: 1, ayuda: 'En la hipérbola e > 1.' },
  ],
  resolver({ F1, F2, e }) {
    const eje = ejeEntre(F1, F2, ['F₁', 'F₂'], 'F2');
    const sol = new Solucion('Hipérbola con focos y excentricidad');
    const C = pasoPuntoMedio(sol, F1, F2, { simbolo: 'C', titulo: 'Hallamos el centro', texto: 'El centro es el punto medio de los focos.' });
    const c = pasoSemieje(sol, C, F2, eje, 'c', { titulo: 'Calculamos c', texto: 'c es la distancia del centro a un foco.' });
    const a = c.entre(e);
    sol.paso('Calculamos a con la excentricidad', 'Como e = c/a, despejamos a = c/e.', {
      formula: 'e = \\frac{c}{a}',
      mat: [`a = \\frac{c}{e} = \\frac{${mValor(c)}}{${mValor(e)}} = ${mValor(a)}${mAprox(a)}`],
    });
    const b2 = pasoB2(sol, 'hiperbola', a, c);
    terminarHiperbola(sol, C, a.cuadrado(), b2, eje);
    sol.punto('F₁', F1).punto('F₂', F2);
    return sol;
  },
};
