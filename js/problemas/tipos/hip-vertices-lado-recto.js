// Hipérbola: conozco los vértices y el lado recto.
import { Solucion } from '../solucion.js';
import { ejeEntre, pasoPuntoMedio, pasoSemieje, terminarHiperbola, mValor } from '../comunes.js';

export default {
  id: 'hip-vertices-lado-recto',
  conica: 'hiperbola',
  titulo: 'Conozco los vértices y el lado recto',
  descripcion: 'Con LR = 2b²/a se despeja b².',
  palabras: 'vertices lado recto lr b',
  campos: [
    { id: 'V1', tipo: 'punto', etiqueta: 'Vértice V₁', ejemplo: '(−3; 0)' },
    { id: 'V2', tipo: 'punto', etiqueta: 'Vértice V₂', ejemplo: '(3; 0)' },
    { id: 'LR', tipo: 'numero', etiqueta: 'Lado recto LR', ejemplo: '24', positivo: true },
  ],
  resolver({ V1, V2, LR }) {
    const eje = ejeEntre(V1, V2, ['V₁', 'V₂'], 'V2');
    const sol = new Solucion('Hipérbola con vértices y lado recto');
    const C = pasoPuntoMedio(sol, V1, V2, { simbolo: 'C', titulo: 'Hallamos el centro', texto: 'El centro es el punto medio de los vértices.' });
    const a = pasoSemieje(sol, C, V2, eje, 'a', { titulo: 'Calculamos a', texto: 'a es la distancia del centro a un vértice.' });
    const b2 = a.por(LR).entre(2);
    sol.paso('Despejamos b² del lado recto', 'El lado recto mide LR = 2b²/a, así que b² = a·LR/2.', {
      formula: 'LR = \\frac{2b²}{a}',
      mat: [`b² = \\frac{a·LR}{2} = \\frac{${mValor(a)}·${mValor(LR)}}{2} = ${mValor(b2)}`],
    });
    terminarHiperbola(sol, C, a.cuadrado(), b2, eje);
    sol.punto('V₁', V1).punto('V₂', V2);
    return sol;
  },
};
