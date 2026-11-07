// Elipse: conozco los vértices y un extremo del eje menor (o la longitud del eje menor).
import { Solucion, fallar } from '../solucion.js';
import { ejeEntre, pasoPuntoMedio, pasoSemieje, terminarElipse, mValor, fmtCorto } from '../comunes.js';

export default {
  id: 'eli-vertices-eje-menor',
  conica: 'elipse',
  titulo: 'Conozco los vértices y el eje menor (un extremo o su longitud)',
  descripcion: 'a sale de los vértices y b del extremo del eje menor o de su longitud 2b.',
  palabras: 'vertices eje menor extremo b longitud',
  campos: [
    { id: 'V1', tipo: 'punto', etiqueta: 'Vértice V₁', ejemplo: '(−5; 0)' },
    { id: 'V2', tipo: 'punto', etiqueta: 'Vértice V₂', ejemplo: '(5; 0)' },
    { id: 'B', tipo: 'punto', etiqueta: 'Extremo del eje menor B (opcional)', ejemplo: '(0; 4)', opcional: true },
    { id: 'L', tipo: 'numero', etiqueta: 'Longitud del eje menor 2b (opcional)', ejemplo: '', opcional: true, positivo: true, ayuda: 'Llena B o la longitud 2b, no los dos.' },
  ],
  resolver({ V1, V2, B, L }) {
    if (!B && !L) fallar('Falta el eje menor: escribe un extremo B o la longitud 2b.', 'B');
    if (B && L) fallar('Escribe solo uno de los dos datos: el extremo B o la longitud 2b.', 'L');
    const eje = ejeEntre(V1, V2, ['V₁', 'V₂'], 'V2');
    const sol = new Solucion('Elipse con vértices y eje menor');
    const C = pasoPuntoMedio(sol, V1, V2, { simbolo: 'C', titulo: 'Hallamos el centro', texto: 'El centro es el punto medio de los vértices.' });
    const a = pasoSemieje(sol, C, V2, eje, 'a', { titulo: 'Calculamos a', texto: 'a es la distancia del centro a un vértice.' });
    let b;
    if (B) {
      const otro = eje === 'horizontal' ? 'vertical' : 'horizontal';
      const ok = otro === 'vertical' ? B.x.igual(C.x) : B.y.igual(C.y);
      if (!ok || (B.x.igual(C.x) && B.y.igual(C.y))) fallar('El extremo del eje menor debe estar sobre la recta perpendicular al eje mayor que pasa por el centro.', 'B');
      b = pasoSemieje(sol, C, B, otro, 'b', { titulo: 'Calculamos b', texto: 'b es la distancia del centro al extremo del eje menor.' });
    } else {
      b = L.entre(2);
      sol.paso('Calculamos b', 'El eje menor mide 2b.', { formula: 'b = \\frac{2b}{2}', mat: [`b = \\frac{${mValor(L)}}{2} = ${mValor(b)}`] });
    }
    if (b.comparar(a) >= 0) fallar(`En la elipse el eje menor es más corto que el mayor: b < a. Aquí a = ${fmtCorto(a)} y b = ${fmtCorto(b)}.`, B ? 'B' : 'L');
    terminarElipse(sol, C, a.cuadrado(), b.cuadrado(), eje);
    sol.punto('V₁', V1).punto('V₂', V2);
    if (B) sol.punto('B', B);
    return sol;
  },
};
