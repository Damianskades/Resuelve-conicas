// Aplicación: túnel o arco semielíptico. Ecuación y altura a cierta distancia del centro.
import { Solucion, fallar } from '../solucion.js';
import { terminarElipse, mValor, mBase, mAprox, fmtCorto, Num, pt } from '../comunes.js';

export default {
  id: 'app-tunel',
  conica: 'aplicacion',
  titulo: 'Túnel o arco semielíptico',
  descripcion: 'Con el ancho de la base y la altura máxima: ecuación de la elipse y altura a una distancia del centro.',
  palabras: 'tunel arco semieliptico puente ancho altura aplicacion',
  campos: [
    { id: 'W', tipo: 'numero', etiqueta: 'Ancho de la base', ejemplo: '20', positivo: true },
    { id: 'H', tipo: 'numero', etiqueta: 'Altura máxima (en el centro)', ejemplo: '6', positivo: true },
    { id: 'xs', tipo: 'lista', etiqueta: 'Distancias desde el centro (opcional)', ejemplo: '4; 8', opcional: true },
  ],
  resolver({ W, H, xs }) {
    const s = W.entre(2);
    if (s.igual(H)) fallar('Si la altura es igual a la mitad del ancho, el arco es una semicircunferencia. Usa la plantilla «Rueda de la fortuna o arco circular».', 'H');
    const sol = new Solucion('Arco semielíptico');
    const eje = s.comparar(H) > 0 ? 'horizontal' : 'vertical';
    const [a, b] = eje === 'horizontal' ? [s, H] : [H, s];
    sol.paso('Ubicamos los ejes', 'Ponemos el centro de la base en el origen: la base va de x = −ancho/2 a x = ancho/2 y la altura máxima está en x = 0.', {
      mat: [`semieje horizontal = \\frac{${mValor(W)}}{2} = ${mValor(s)};   semieje vertical = ${mValor(H)}`, `a = ${mValor(a)} (el mayor);   b = ${mValor(b)};   eje mayor ${eje}`],
    });
    terminarElipse(sol, pt(0, 0), a.cuadrado(), b.cuadrado(), eje);
    const tabla = [];
    if (xs?.length) {
      const mat = [];
      for (const x of xs) {
        if (x.abs().comparar(s) > 0) {
          mat.push(`x = ${mValor(x)}: está fuera de la base (|x| > ${mValor(s)})`);
          continue;
        }
        const y = H.por(Num.de(1).menos(x.cuadrado().entre(s.cuadrado())).raiz());
        tabla.push({ x, y });
        mat.push(`x = ${mValor(x)}:   y = ${mValor(H)}·√(1 − \\frac{${mBase(x)}²}{${mBase(s)}²}) = ${mValor(y)}${mAprox(y)}`);
        sol.respuesta(`Altura a ${fmtCorto(x)} del centro`, `y = ${mValor(y)}${mAprox(y)}`);
        sol.punto('', pt(x, y), 'corte');
      }
      sol.paso('Calculamos las alturas', 'Despejamos y (positiva, porque es la mitad de arriba) y reemplazamos cada distancia.', {
        formula: 'y = H·√(1 − \\frac{x²}{(ancho/2)²})',
        mat,
      });
    }
    sol.valor('tabla', tabla);
    return sol;
  },
};
