// Aplicación: rueda de la fortuna o arco circular. Ecuación y cálculo de x dado y, o de y dado x.
import { Solucion } from '../solucion.js';
import { terminarCircunferencia, mValor, mParen, mBase, mRaiz, mAprox, fmtCorto, pt } from '../comunes.js';

// Para un valor dado de una coordenada, despeja la otra: otra = centro ± √(r² − (dado − centroDado)²)
function despejar(sol, { dado, valor, otra, centroDado, centroOtra, r2 }) {
  const dif = valor.menos(centroDado);
  const s = r2.menos(dif.cuadrado());
  const mat = [
    `(${mValor(valor)} − ${mParen(centroDado)})² + (${otra} − ${mParen(centroOtra)})² = ${mValor(r2)}`,
    `(${otra} − ${mParen(centroOtra)})² = ${mValor(r2)} − ${mBase(dif)}² = ${mValor(s)}`,
  ];
  let soluciones = [];
  if (s.signo() < 0) mat.push(`No hay solución real: ${dado} = ${mValor(valor)} queda fuera de la circunferencia.`);
  else if (s.esCero()) soluciones = [centroOtra];
  else {
    const raiz = s.raiz();
    soluciones = [centroOtra.mas(raiz), centroOtra.menos(raiz)];
    mat.push(`${otra} = ${mValor(centroOtra)} ± ${mRaiz(s)}${mRaiz(s) === mValor(raiz) ? '' : ` = ${mValor(centroOtra)} ± ${mValor(raiz)}`}`);
  }
  soluciones.forEach((n, i) => mat.push(`${otra}${soluciones.length > 1 ? '₁₂'[i] : ''} = ${mValor(n)}${mAprox(n)}`));
  sol.paso(`Calculamos ${otra} cuando ${dado} = ${fmtCorto(valor)}`, `Reemplazamos ${dado} en la ecuación ordinaria y despejamos ${otra}.`, {
    formula: '(x − h)² + (y − k)² = r²',
    mat,
  });
  return soluciones;
}

export default {
  id: 'app-rueda',
  conica: 'aplicacion',
  titulo: 'Rueda de la fortuna o arco circular',
  descripcion: 'Con el centro y el radio: ecuación, y la altura (y) para un x dado o la posición (x) para una altura dada.',
  palabras: 'rueda fortuna noria arco circular altura aplicacion',
  campos: [
    { id: 'C', tipo: 'punto', etiqueta: 'Centro de la rueda C', ejemplo: '(0; 10)' },
    { id: 'r', tipo: 'numero', etiqueta: 'Radio r', ejemplo: '9', positivo: true },
    { id: 'xs', tipo: 'lista', etiqueta: 'Valores de x para hallar y (opcional)', ejemplo: '−3', opcional: true, ayuda: 'Varios valores separados con punto y coma: −3; 4' },
    { id: 'ys', tipo: 'lista', etiqueta: 'Valores de y para hallar x (opcional)', ejemplo: '12', opcional: true },
  ],
  resolver({ C, r, xs, ys }) {
    const sol = new Solucion('Rueda de la fortuna');
    terminarCircunferencia(sol, C, r, { texto: 'La rueda es una circunferencia: reemplazamos el centro y el radio en la ecuación ordinaria.' });
    const r2 = r.cuadrado();
    const resultados = { y: [], x: [] };
    for (const x of xs ?? []) {
      const ysol = despejar(sol, { dado: 'x', valor: x, otra: 'y', centroDado: C.x, centroOtra: C.y, r2 });
      resultados.y.push({ x, y: ysol });
      sol.respuesta(`Para x = ${fmtCorto(x)}`, ysol.length ? ysol.map((n) => `y = ${mValor(n)}${mAprox(n)}`).join('   o   ') : 'no hay punto de la rueda');
      ysol.forEach((n) => sol.punto('', pt(x, n), 'corte'));
    }
    for (const y of ys ?? []) {
      const xsol = despejar(sol, { dado: 'y', valor: y, otra: 'x', centroDado: C.y, centroOtra: C.x, r2 });
      resultados.x.push({ y, x: xsol });
      sol.respuesta(`Para y = ${fmtCorto(y)}`, xsol.length ? xsol.map((n) => `x = ${mValor(n)}${mAprox(n)}`).join('   o   ') : 'no hay punto de la rueda a esa altura');
      xsol.forEach((n) => sol.punto('', pt(n, y), 'corte'));
    }
    sol.valor('resultados', resultados);
    return sol;
  },
};
