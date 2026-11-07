// Circunferencia (x − h)² + (y − k)² = r² desde sus parámetros h, k, r:
// ecuación ordinaria y general, elementos con su fórmula y escena para el graficador.
// Funciones puras.

import { aTexto, fmtCorto } from '../math/formato.js';
import { mCuadrado, mValor, mParen, mRaiz, igualdades } from '../math/expresiones.js';
import { N, leerParametros, ecuacionGeneral, ePunto, eValor, escenaVacia, punto, curvaElipse } from './comun.js';

export const FORMULAS = ['(x − h)² + (y − k)² = r²'];

export function resolver(params = {}) {
  const l = leerParametros(params, ['h', 'k', 'r']);
  if (l.error) return l;
  const { h, k, r } = l.valores;
  if (r.signo() <= 0) {
    return { error: `El radio debe ser mayor que 0 (escribiste r = ${fmtCorto(r)}). Usa un número positivo, por ejemplo r = 3.`, campo: 'r' };
  }
  const r2 = r.cuadrado();
  const ordinaria = `${mCuadrado('x', h)} + ${mCuadrado('y', k)} = ${mValor(r2)}`;
  const general = ecuacionGeneral({
    A: N(1),
    C: N(1),
    D: h.por(-2),
    E: k.por(-2),
    F: h.cuadrado().mas(k.cuadrado()).menos(r2),
  });
  const d = r.por(2);

  const elementos = [
    ePunto('centro', 'Centro', 'C', h, k, 'C = (h; k)'),
    eValor('radio', 'Radio', 'r', r, 'r = √(r²)', igualdades('r', mRaiz(r2), mValor(r))),
    eValor('diametro', 'Diámetro', 'd', d, 'diámetro = 2r', `d = 2·${mParen(r)} = ${mValor(d)}`),
  ];

  const escena = escenaVacia();
  escena.curvas.push(curvaElipse(h.v, k.v, r.v, r.v));
  escena.puntos.push(punto('C', h, k, 'centro'));
  escena.encuadre.push([h.v - r.v, k.v - r.v], [h.v + r.v, k.v + r.v]);

  return {
    tipo: 'circunferencia',
    orientacion: null,
    ordinaria,
    ordinariaTexto: aTexto(ordinaria),
    general: general.texto,
    coef: general.coef,
    formulas: FORMULAS,
    elementos,
    valores: { h, k, r, r2 },
    escena,
  };
}
