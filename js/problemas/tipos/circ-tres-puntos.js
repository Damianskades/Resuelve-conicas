// Circunferencia que pasa por tres puntos: sistema de 3 ecuaciones con D, E, F.
import { Solucion, fallar } from '../solucion.js';
import { pasoSistema3, terminarCircunferencia, igualesP, mValor, mParen, mAprox, mRaiz, mBase, igualdades, pt } from '../comunes.js';

export default {
  id: 'circ-tres-puntos',
  conica: 'circunferencia',
  titulo: 'Pasa por tres puntos',
  descripcion: 'Se reemplaza cada punto en x² + y² + Dx + Ey + F = 0 y se resuelve el sistema.',
  palabras: 'tres puntos sistema ecuaciones d e f',
  campos: [
    { id: 'P', tipo: 'punto', etiqueta: 'Punto P', ejemplo: '(1; −2)' },
    { id: 'Q', tipo: 'punto', etiqueta: 'Punto Q', ejemplo: '(5; 4)' },
    { id: 'R', tipo: 'punto', etiqueta: 'Punto R', ejemplo: '(10; 5)' },
  ],
  resolver({ P, Q, R }) {
    if (igualesP(P, Q) || igualesP(P, R) || igualesP(Q, R)) fallar('Los tres puntos deben ser distintos.', 'R');
    const sol = new Solucion('Circunferencia por tres puntos');
    sol.formula('x² + y² + Dx + Ey + F = 0');
    const filas = [P, Q, R].map((X) => [X.x, X.y, X.x.cuadrado().mas(X.y.cuadrado()).neg()]);
    const [D, E, F] = pasoSistema3(sol, filas, ['D', 'E', 'F'], {
      textoPlanteo: 'Reemplazamos cada punto en x² + y² + Dx + Ey + F = 0 y pasamos x² + y² al lado derecho.',
      errorSinSolucion: 'Los tres puntos están alineados (sobre una misma recta): ninguna circunferencia pasa por los tres.',
      campo: 'R',
    });
    const C = pt(D.entre(-2), E.entre(-2));
    const r2 = D.cuadrado().entre(4).mas(E.cuadrado().entre(4)).menos(F);
    const r = r2.raiz();
    sol.paso('Hallamos el centro y el radio', 'Con D, E y F usamos las fórmulas del centro y del radio.', {
      formula: ['C = (−\\frac{D}{2}; −\\frac{E}{2})', 'r = √(\\frac{D²}{4} + \\frac{E²}{4} − F)'],
      mat: [
        `C = (−\\frac{${mValor(D)}}{2}; −\\frac{${mValor(E)}}{2}) = (${mValor(C.x)}; ${mValor(C.y)})`,
        `${igualdades(`r = √(\\frac{${mBase(D)}²}{4} + \\frac{${mBase(E)}²}{4} − ${mParen(F)})`, mRaiz(r2), mValor(r))}${mAprox(r)}`,
      ],
    });
    sol.valor('D', D).valor('E', E).valor('F', F);
    terminarCircunferencia(sol, C, r);
    sol.punto('P', P).punto('Q', Q).punto('R', R);
    return sol;
  },
};
