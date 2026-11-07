// Elipse: conozco los vértices y el lado recto.
import { Solucion, fallar } from '../solucion.js';
import { ejeEntre, pasoPuntoMedio, pasoSemieje, terminarElipse, mValor, fmtCorto } from '../comunes.js';

export default {
  id: 'eli-vertices-lado-recto',
  conica: 'elipse',
  titulo: 'Conozco los vértices y el lado recto',
  descripcion: 'Con LR = 2b²/a se despeja b².',
  palabras: 'vertices lado recto lr b',
  campos: [
    { id: 'V1', tipo: 'punto', etiqueta: 'Vértice V₁', ejemplo: '(−7; 1)' },
    { id: 'V2', tipo: 'punto', etiqueta: 'Vértice V₂', ejemplo: '(−1; 1)' },
    { id: 'LR', tipo: 'numero', etiqueta: 'Lado recto LR', ejemplo: '8/3', positivo: true },
  ],
  resolver({ V1, V2, LR }) {
    const eje = ejeEntre(V1, V2, ['V₁', 'V₂'], 'V2');
    const sol = new Solucion('Elipse con vértices y lado recto');
    const C = pasoPuntoMedio(sol, V1, V2, { simbolo: 'C', titulo: 'Hallamos el centro', texto: 'El centro es el punto medio de los vértices.' });
    const a = pasoSemieje(sol, C, V2, eje, 'a', { titulo: 'Calculamos a', texto: 'a es la distancia del centro a un vértice.' });
    const b2 = a.por(LR).entre(2);
    sol.paso('Despejamos b² del lado recto', 'El lado recto mide LR = 2b²/a, así que b² = a·LR/2.', {
      formula: 'LR = \\frac{2b²}{a}',
      mat: [`b² = \\frac{a·LR}{2} = \\frac{${mValor(a)}·${mValor(LR)}}{2} = ${mValor(b2)}`],
    });
    if (b2.comparar(a.cuadrado()) >= 0) {
      fallar(`Con ese lado recto b² = ${fmtCorto(b2)} no es menor que a² = ${fmtCorto(a.cuadrado())}, y en la elipse b < a. El lado recto debe ser menor que el eje mayor (2a = ${fmtCorto(a.por(2))}).`, 'LR');
    }
    terminarElipse(sol, C, a.cuadrado(), b2, eje);
    sol.punto('V₁', V1).punto('V₂', V2);
    return sol;
  },
};
