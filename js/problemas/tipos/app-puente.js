// Aplicación: puente colgante o arco parabólico. Ecuación y tabla de alturas.
import { Solucion } from '../solucion.js';
import { terminarParabola, mValor, mParen, mBase, mAprox, igualdades, fmtCorto, pt } from '../comunes.js';

export default {
  id: 'app-puente',
  conica: 'aplicacion',
  titulo: 'Puente colgante o arco parabólico',
  descripcion: 'Con la distancia entre apoyos y la altura: ecuación de la parábola y tabla de alturas para varios x.',
  palabras: 'puente colgante cable torres arco parabolico golden gate alturas aplicacion',
  campos: [
    {
      id: 'forma',
      tipo: 'opcion',
      etiqueta: 'Forma',
      opciones: [
        { valor: 'colgante', texto: 'Cable colgante (vértice abajo, en el origen)' },
        { valor: 'arco', texto: 'Arco (vértice arriba, base en el suelo)' },
      ],
      ejemplo: 'colgante',
    },
    { id: 'L', tipo: 'numero', etiqueta: 'Distancia entre apoyos (torres)', ejemplo: '1280', positivo: true },
    { id: 'H', tipo: 'numero', etiqueta: 'Altura (de las torres sobre el vértice, o del arco)', ejemplo: '152', positivo: true },
    { id: 'xs', tipo: 'lista', etiqueta: 'Valores de x para la tabla (opcional)', ejemplo: '100; 250; 400; 500', opcional: true },
  ],
  resolver({ forma, L, H, xs }) {
    const sol = new Solucion(forma === 'colgante' ? 'Puente colgante' : 'Arco parabólico');
    const mitad = L.entre(2);
    const colg = forma === 'colgante';
    const V = colg ? pt(0, 0) : pt(0, H);
    const P = colg ? pt(mitad, H) : pt(mitad, 0);
    sol.paso('Ubicamos los ejes', colg
      ? 'Ponemos el vértice (punto más bajo del cable) en el origen; las torres quedan en x = ±L/2 a la altura H.'
      : 'Ponemos el vértice (punto más alto del arco) en (0; H); los apoyos quedan en el suelo, en x = ±L/2.', {
      mat: [`V = (${mValor(V.x)}; ${mValor(V.y)});   apoyo P = (${mValor(P.x)}; ${mValor(P.y)})`],
    });
    // x² = 4p(y − k), con el punto P
    const cuatroP = mitad.cuadrado().entre(P.y.menos(V.y));
    const p = cuatroP.entre(4);
    sol.paso('Hallamos 4p con un apoyo', 'El apoyo está en la parábola, así que cumple x² = 4p(y − k).', {
      formula: 'x² = 4p(y − k)',
      mat: [
        `${mBase(mitad)}² = 4p(${mValor(P.y)} − ${mParen(V.y)})`,
        igualdades(`4p = \\frac{${mValor(mitad.cuadrado())}}{${mValor(P.y.menos(V.y))}}`, `${mValor(cuatroP)}${mAprox(cuatroP)}`),
      ],
    });
    terminarParabola(sol, V, p, 'vertical');
    sol.punto('', pt(mitad.neg(), P.y)).punto('', P);
    const tabla = [];
    if (xs?.length) {
      const mat = [];
      for (const x of xs) {
        const y = V.y.mas(x.cuadrado().entre(cuatroP));
        tabla.push({ x, y });
        const fuera = x.abs().comparar(mitad) > 0 ? '   (fuera del tramo entre apoyos)' : '';
        mat.push(`x = ${mValor(x)}:   y = ${colg ? '' : `${mValor(H)} + `}\\frac{${mBase(x)}²}{${mValor(cuatroP)}} = ${mValor(y)}${mAprox(y)}${fuera}`);
        sol.respuesta(`Altura en x = ${fmtCorto(x)}`, `y = ${mValor(y)}${mAprox(y)}`);
        sol.punto('', pt(x, y), 'corte');
      }
      sol.paso('Calculamos las alturas', 'Despejamos y de la ecuación y reemplazamos cada x.', {
        formula: colg ? 'y = \\frac{x²}{4p}' : 'y = H + \\frac{x²}{4p}',
        mat,
      });
    }
    sol.valor('cuatroP', cuatroP).valor('tabla', tabla);
    return sol;
  },
};
