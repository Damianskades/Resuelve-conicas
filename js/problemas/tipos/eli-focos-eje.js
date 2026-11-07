// Elipse: conozco los focos y la longitud del eje mayor o del eje menor.
import { Solucion, fallar } from '../solucion.js';
import { ejeEntre, pasoPuntoMedio, pasoSemieje, pasoB2, terminarElipse, mValor, mBase, fmtCorto } from '../comunes.js';

export default {
  id: 'eli-focos-eje',
  conica: 'elipse',
  titulo: 'Conozco los focos y la longitud del eje mayor o menor',
  descripcion: 'c sale de los focos; con 2a o 2b se completa a² = b² + c².',
  palabras: 'focos eje mayor menor longitud',
  campos: [
    { id: 'F1', tipo: 'punto', etiqueta: 'Foco F₁', ejemplo: '(−3; 0)' },
    { id: 'F2', tipo: 'punto', etiqueta: 'Foco F₂', ejemplo: '(3; 0)' },
    {
      id: 'cual',
      tipo: 'opcion',
      etiqueta: '¿Qué eje conoces?',
      opciones: [{ valor: 'mayor', texto: 'Eje mayor (2a)' }, { valor: 'menor', texto: 'Eje menor (2b)' }],
      ejemplo: 'mayor',
    },
    { id: 'L', tipo: 'numero', etiqueta: 'Longitud del eje', ejemplo: '10', positivo: true },
  ],
  resolver({ F1, F2, cual, L }) {
    const eje = ejeEntre(F1, F2, ['F₁', 'F₂'], 'F2');
    const sol = new Solucion('Elipse con focos y longitud de un eje');
    const C = pasoPuntoMedio(sol, F1, F2, { simbolo: 'C', titulo: 'Hallamos el centro', texto: 'El centro es el punto medio de los focos.' });
    const c = pasoSemieje(sol, C, F2, eje, 'c', { titulo: 'Calculamos c', texto: 'c es la distancia del centro a un foco.' });
    let a2;
    let b2;
    if (cual === 'mayor') {
      const a = L.entre(2);
      sol.paso('Calculamos a', 'El eje mayor mide 2a.', { mat: [`a = \\frac{${mValor(L)}}{2} = ${mValor(a)}`] });
      if (a.comparar(c) <= 0) fallar(`El eje mayor debe ser más largo que la distancia entre focos (2a > 2c). Aquí 2a = ${fmtCorto(L)} y 2c = ${fmtCorto(c.por(2))}.`, 'L');
      a2 = a.cuadrado();
      b2 = pasoB2(sol, 'elipse', a, c);
    } else {
      const b = L.entre(2);
      b2 = b.cuadrado();
      a2 = b2.mas(c.cuadrado());
      sol.paso('Calculamos b y a²', 'El eje menor mide 2b; en la elipse a² = b² + c².', {
        formula: 'a² = b² + c²',
        mat: [`b = \\frac{${mValor(L)}}{2} = ${mValor(b)}`, `a² = ${mBase(b)}² + ${mBase(c)}² = ${mValor(a2)}`],
      });
    }
    terminarElipse(sol, C, a2, b2, eje);
    sol.punto('F₁', F1).punto('F₂', F2);
    return sol;
  },
};
