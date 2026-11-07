// Recta tangente a una circunferencia en un punto de ella.
import { Solucion, fallar } from '../solucion.js';
import { circunferenciaDesdeEcuacion, construir, mResta, mValor, mParen, mPorBinomio, igualdades, fmtCorto, Num, R } from '../comunes.js';

export default {
  id: 'circ-recta-tangente',
  conica: 'circunferencia',
  titulo: 'Recta tangente a una circunferencia en un punto de ella',
  descripcion: 'La tangente es perpendicular al radio que llega al punto.',
  palabras: 'recta tangente punto pendiente radio perpendicular',
  campos: [
    { id: 'ecuacion', tipo: 'ecuacion', etiqueta: 'Ecuación de la circunferencia', ejemplo: 'x^2 + y^2 - 4x - 6y + 8 = 0' },
    { id: 'A', tipo: 'punto', etiqueta: 'Punto A de la circunferencia', ejemplo: '(3; 1)' },
  ],
  resolver({ ecuacion, A }) {
    const sol = new Solucion('Recta tangente en un punto');
    const c = circunferenciaDesdeEcuacion(sol, ecuacion, 'ecuacion');
    const dx = A.x.menos(c.h);
    const dy = A.y.menos(c.k);
    const valor = dx.cuadrado().mas(dy.cuadrado());
    const esta = valor.igual(c.r2);
    sol.paso('Comprobamos que A está en la circunferencia', 'Solo hay una tangente en A si A cumple la ecuación.', {
      formula: '(x − h)² + (y − k)² = r²',
      mat: [`(${mValor(A.x)} − ${mParen(c.h)})² + (${mValor(A.y)} − ${mParen(c.k)})² = ${mValor(valor)} ${esta ? '=' : '≠'} ${mValor(c.r2)}`],
    });
    if (!esta) {
      fallar(
        `El punto A(${fmtCorto(A.x)}; ${fmtCorto(A.y)}) no está en la circunferencia: (x − h)² + (y − k)² da ${fmtCorto(valor)} y debería dar r² = ${fmtCorto(c.r2)}. Revisa el punto o la ecuación.`,
        'A',
      );
    }
    // Tangente: (x_A − h)(x − x_A) + (y_A − k)(y − y_A) = 0
    const tangente = R.crearRecta(dx, dy, dx.por(A.x).mas(dy.por(A.y)).neg());
    let mat;
    if (dx.esCero()) mat = [`El radio CA es vertical, así que la tangente es horizontal: y = ${mValor(A.y)}`];
    else if (dy.esCero()) mat = [`El radio CA es horizontal, así que la tangente es vertical: x = ${mValor(A.x)}`];
    else {
      const mr = dy.entre(dx);
      const mt = Num.de(-1).entre(mr);
      mat = [
        igualdades(`m_{CA} = \\frac{${mValor(A.y)} − ${mParen(c.k)}}{${mValor(A.x)} − ${mParen(c.h)}}`, mValor(mr)),
        `m_T = −\\frac{1}{m_{CA}} = ${mValor(mt)}`,
        `${mResta('y', A.y)} = ${mPorBinomio(mt, 'x', A.x)}`,
      ];
    }
    mat.push(`T: ${R.fmtRecta(tangente)}`);
    sol.paso('Hallamos la recta tangente', 'La tangente es perpendicular al radio CA: su pendiente es la inversa opuesta de la del radio.', {
      formula: ['m_{CA} = \\frac{y_A − k}{x_A − h}', 'm_T = −\\frac{1}{m_{CA}}', 'y − y_A = m_T(x − x_A)'],
      mat,
    });
    const m = construir('circunferencia', { h: c.h, k: c.k, r: c.r });
    sol.conica(m, { respuesta: false });
    sol.tituloRespuesta = 'Recta tangente';
    sol.respuesta('Recta tangente en A', R.fmtRecta(tangente));
    sol.respuesta('Forma explícita', R.fmtExplicita(tangente));
    sol.respuesta('Circunferencia', m.ordinaria);
    sol.valor('tangente', tangente);
    sol.recta('T', tangente).punto('A', A);
    return sol;
  },
};
