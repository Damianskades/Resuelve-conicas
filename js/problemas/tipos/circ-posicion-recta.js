// Posición relativa de una recta y una circunferencia.
import { Solucion } from '../solucion.js';
import { circunferenciaDesdeEcuacion, pasoCortesRectaCircunferencia, construir, mValor, mAprox, mPunto } from '../comunes.js';

const NOMBRE = { secante: 'Secante', tangente: 'Tangente', exterior: 'Exterior (no se cortan)' };

export default {
  id: 'circ-posicion-recta',
  conica: 'circunferencia',
  titulo: 'Posición relativa de una recta y una circunferencia',
  descripcion: '¿Es secante, tangente o exterior? Con discriminante, puntos de corte y comprobación con la distancia.',
  palabras: 'posicion relativa recta secante tangente exterior discriminante corte interseccion',
  campos: [
    { id: 'L', tipo: 'recta', etiqueta: 'Recta L', ejemplo: 'y = 2x + 1' },
    { id: 'ecuacion', tipo: 'ecuacion', etiqueta: 'Ecuación de la circunferencia', ejemplo: 'x^2 + (y - 1)^2 = 4' },
  ],
  resolver({ L, ecuacion }) {
    const sol = new Solucion('Posición relativa de una recta y una circunferencia');
    const c = circunferenciaDesdeEcuacion(sol, ecuacion, 'ecuacion');
    const { posicion, puntos, d } = pasoCortesRectaCircunferencia(sol, c, L);
    const m = construir('circunferencia', { h: c.h, k: c.k, r: c.r });
    sol.conica(m, { respuesta: false });
    sol.tituloRespuesta = `Recta ${NOMBRE[posicion].toLowerCase()}`;
    sol.respuesta('Posición relativa', NOMBRE[posicion]);
    puntos.forEach((P, i) => {
      const nombre = puntos.length === 1 ? 'T' : `P${'₁₂'[i]}`;
      sol.respuesta(puntos.length === 1 ? 'Punto de tangencia' : `Punto de corte ${nombre}`, `${mPunto(P.x, P.y)}`);
      sol.punto(nombre, P, 'corte');
    });
    sol.respuesta('Distancia del centro a la recta', `d = ${mValor(d)}${mAprox(d)}   (r = ${mValor(c.r)}${mAprox(c.r)})`);
    sol.respuesta('Circunferencia', m.ordinaria);
    sol.valor('posicion', posicion).valor('puntos', puntos).valor('d', d);
    sol.recta('L', L);
    return sol;
  },
};
