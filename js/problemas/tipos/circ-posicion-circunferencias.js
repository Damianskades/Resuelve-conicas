// Posición relativa de dos circunferencias.
import { Solucion } from '../solucion.js';
import {
  circunferenciaDesdeEcuacion, pasoDistancia, pasoCortesRectaCircunferencia, construir,
  mValor, mAprox, mPunto, mSuma, R,
} from '../comunes.js';

const NOMBRE = {
  coincidentes: 'Coincidentes (son la misma circunferencia)',
  concentricas: 'Concéntricas (mismo centro, distinto radio)',
  exteriores: 'Exteriores (no se cortan, una fuera de la otra)',
  'tangentes-exteriores': 'Tangentes exteriores (se tocan en un punto, por fuera)',
  secantes: 'Secantes (se cortan en dos puntos)',
  'tangentes-interiores': 'Tangentes interiores (se tocan en un punto, una dentro de la otra)',
  interiores: 'Interiores (una dentro de la otra, sin tocarse)',
};

export default {
  id: 'circ-posicion-circunferencias',
  conica: 'circunferencia',
  titulo: 'Posición relativa de dos circunferencias',
  descripcion: 'Se compara la distancia entre centros con la suma y la diferencia de los radios.',
  palabras: 'dos circunferencias posicion relativa exteriores tangentes secantes interiores concentricas',
  campos: [
    { id: 'ec1', tipo: 'ecuacion', etiqueta: 'Circunferencia 1', ejemplo: 'x^2 + y^2 = 25' },
    { id: 'ec2', tipo: 'ecuacion', etiqueta: 'Circunferencia 2', ejemplo: '(x - 4)^2 + (y - 3)^2 = 4' },
  ],
  resolver({ ec1, ec2 }) {
    const sol = new Solucion('Posición relativa de dos circunferencias');
    const c1 = circunferenciaDesdeEcuacion(sol, ec1, 'ec1', 'la circunferencia 1');
    const c2 = circunferenciaDesdeEcuacion(sol, ec2, 'ec2', 'la circunferencia 2');
    const d = pasoDistancia(sol, c1.C, c2.C, { titulo: 'Calculamos la distancia entre los centros', texto: 'La posición depende de qué tan lejos están los centros.' });
    const suma = c1.r.mas(c2.r);
    const dif = c1.r.menos(c2.r).abs();
    let pos;
    if (d.esCero()) pos = dif.esCero() ? 'coincidentes' : 'concentricas';
    else if (d.comparar(suma) > 0) pos = 'exteriores';
    else if (d.comparar(suma) === 0) pos = 'tangentes-exteriores';
    else if (d.comparar(dif) > 0) pos = 'secantes';
    else if (d.comparar(dif) === 0) pos = 'tangentes-interiores';
    else pos = 'interiores';
    const rel = (a, b) => ({ '-1': '<', 0: '=', 1: '>' })[a.comparar(b)];
    sol.paso('Comparamos d con la suma y la diferencia de los radios', 'Si d > r₁ + r₂ son exteriores; si d = r₁ + r₂, tangentes exteriores; si |r₁ − r₂| < d < r₁ + r₂, secantes; si d = |r₁ − r₂|, tangentes interiores; si d < |r₁ − r₂|, una está dentro de la otra.', {
      formula: ['r₁ + r₂', '|r₁ − r₂|'],
      mat: [
        `r₁ + r₂ = ${mValor(c1.r)} + ${mValor(c2.r)} = ${mValor(suma)}${mAprox(suma)}`,
        `|r₁ − r₂| = ${mValor(dif)}${mAprox(dif)}`,
        `d = ${mValor(d)}${mAprox(d)}:   d ${rel(d, suma)} r₁ + r₂   y   d ${rel(d, dif)} |r₁ − r₂|`,
        `→ ${NOMBRE[pos]}`,
      ],
    });
    let puntos = [];
    if (['secantes', 'tangentes-exteriores', 'tangentes-interiores'].includes(pos)) {
      // Eje radical: restar las ecuaciones x² + y² + Dx + Ey + F = 0
      const g = (c) => [c.h.por(-2), c.k.por(-2), c.h.cuadrado().mas(c.k.cuadrado()).menos(c.r2)];
      const [D1, E1, F1] = g(c1);
      const [D2, E2, F2] = g(c2);
      const eje = R.crearRecta(D1.menos(D2), E1.menos(E2), F1.menos(F2));
      sol.paso('Restamos las dos ecuaciones', 'Al restar se cancelan x² e y² y queda la recta (eje radical) que pasa por los puntos comunes.', {
        mat: [
          `(1): ${mSuma([[1, 'x²'], [1, 'y²'], [D1, 'x'], [E1, 'y'], [F1, '']])} = 0`,
          `(2): ${mSuma([[1, 'x²'], [1, 'y²'], [D2, 'x'], [E2, 'y'], [F2, '']])} = 0`,
          `(1) − (2): ${R.fmtRecta(eje)}`,
        ],
      });
      puntos = pasoCortesRectaCircunferencia(sol, c1, eje, { nombreRecta: 'Eje radical' }).puntos;
    }
    const m1 = construir('circunferencia', { h: c1.h, k: c1.k, r: c1.r });
    const m2 = construir('circunferencia', { h: c2.h, k: c2.k, r: c2.r });
    sol.conica(m1, { respuesta: false, sufijo: '₁' });
    sol.conica(m2, { respuesta: false, sufijo: '₂' });
    sol.tituloRespuesta = NOMBRE[pos].split(' (')[0];
    sol.respuesta('Posición relativa', NOMBRE[pos]);
    sol.respuesta('Distancia entre centros', `d = ${mValor(d)}${mAprox(d)}`);
    sol.respuesta('Radios', `r₁ = ${mValor(c1.r)};   r₂ = ${mValor(c2.r)}`);
    puntos.forEach((P, i) => {
      const nombre = puntos.length === 1 ? 'T' : `P${'₁₂'[i]}`;
      sol.respuesta(puntos.length === 1 ? 'Punto de tangencia' : `Punto común ${nombre}`, mPunto(P.x, P.y));
      sol.punto(nombre, P, 'corte');
    });
    sol.valor('posicion', pos).valor('d', d).valor('puntos', puntos);
    return sol;
  },
};
