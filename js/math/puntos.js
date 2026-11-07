// Puntos { x: Num, y: Num }: lectura ("(−1; 4)", "(−1, 4)", "−1 4", "P(1; −2)"),
// distancia, punto medio y formato. Funciones puras.

import { Num, leerNumero } from './numeros.js';
import { fmtPunto, fmtPuntoCompleto } from './formato.js';

export const pt = (x, y) => Object.freeze({ x: Num.de(x), y: Num.de(y) });

const AYUDA = 'Escribe las dos coordenadas así: (−1; 4), (−1, 4) o −1 4.';

export function leerPunto(texto) {
  const original = String(texto ?? '').trim();
  if (!original) return { error: `Escribe un punto. ${AYUDA}` };
  // Quita un nombre delante: "P(1; −2)", "A = (3; 1)", "P₁(…)"
  let t = original.replace(/^\p{L}[\p{L}\d₀-₉']*\s*=?\s*(?=[([])/u, '').trim();
  if (/^[([]/.test(t)) {
    if (!/[)\]]$/.test(t)) return { error: `Falta cerrar el paréntesis del punto «${original}».` };
    t = t.slice(1, -1).trim();
  }
  let partes;
  if (t.includes(';')) partes = t.split(';');
  else if (/,\s/.test(t)) partes = t.split(/,\s+/);
  else if (/\s/.test(t)) partes = t.split(/\s+/);
  else if ((t.match(/,/g) ?? []).length === 1) partes = t.split(',');
  else partes = [t];
  partes = partes.map((s) => s.trim()).filter(Boolean);
  if (partes.length !== 2) return { error: `«${original}» no es un punto válido. ${AYUDA}` };
  const x = leerNumero(partes[0]);
  if (x.error) return { error: `La abscisa «${partes[0]}» no es válida: ${x.error}` };
  const y = leerNumero(partes[1]);
  if (y.error) return { error: `La ordenada «${partes[1]}» no es válida: ${y.error}` };
  return { punto: pt(x.num, y.num) };
}

export function distancia(P, Q) {
  return Q.x.menos(P.x).cuadrado().mas(Q.y.menos(P.y).cuadrado()).raiz();
}

export const puntoMedio = (P, Q) => pt(P.x.mas(Q.x).entre(2), P.y.mas(Q.y).entre(2));

export const igualesP = (P, Q) => P.x.igual(Q.x) && P.y.igual(Q.y);

export const fmtP = (P) => fmtPunto(P.x, P.y);
export const fmtPCompleto = (P) => fmtPuntoCompleto(P.x, P.y);
