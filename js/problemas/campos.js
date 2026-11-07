// Lectura y validación de los campos de un tipo de pregunta.
// Tipos de campo: numero, punto, recta, ecuacion, lista (varios números) y opcion.
// Funciones puras.

import { leerNumero } from '../math/numeros.js';
import { leerPunto } from '../math/puntos.js';
import { leerRecta, fmtRecta } from '../math/rectas.js';
import { fmtCorto } from '../math/formato.js';
import { mValor, mPunto, mAprox } from '../math/expresiones.js';

export const TIPOS_CAMPO = ['numero', 'punto', 'recta', 'ecuacion', 'lista', 'opcion'];

// "100; 250; 400" o "100 250 400" → [Num]
export function leerLista(texto) {
  const t = String(texto ?? '').trim();
  if (!t) return { error: 'Escribe al menos un número.' };
  const partes = t.includes(';') ? t.split(';') : t.split(/\s+/);
  const nums = [];
  for (const p of partes.map((s) => s.trim()).filter(Boolean)) {
    const r = leerNumero(p);
    if (r.error) return { error: `«${p}»: ${r.error} Separa los valores con punto y coma: 100; 250; 400.` };
    nums.push(r.num);
  }
  return { lista: nums };
}

function leerUno(campo, crudo) {
  switch (campo.tipo) {
    case 'numero': {
      const r = leerNumero(crudo);
      if (r.error) return r;
      const n = r.num;
      if (campo.positivo && n.signo() <= 0) return { error: `debe ser mayor que 0 (escribiste ${fmtCorto(n)}).` };
      if (campo.noCero && n.esCero()) return { error: 'no puede ser 0.' };
      if (campo.mayorQue !== undefined && n.comparar(campo.mayorQue) <= 0) {
        return { error: `debe ser mayor que ${campo.mayorQue} (escribiste ${fmtCorto(n)}).` };
      }
      if (campo.menorQue !== undefined && n.comparar(campo.menorQue) >= 0) {
        return { error: `debe ser menor que ${campo.menorQue} (escribiste ${fmtCorto(n)}).` };
      }
      return { valor: n };
    }
    case 'punto': {
      const r = leerPunto(crudo);
      return r.error ? r : { valor: r.punto };
    }
    case 'recta': {
      const r = leerRecta(crudo);
      return r.error ? r : { valor: r.recta };
    }
    case 'ecuacion':
      return { valor: String(crudo) };
    case 'lista': {
      const r = leerLista(crudo);
      return r.error ? r : { valor: r.lista };
    }
    case 'opcion': {
      const ok = campo.opciones.some((o) => o.valor === crudo);
      return ok ? { valor: crudo } : { error: `elige una opción: ${campo.opciones.map((o) => o.texto).join(' o ')}.` };
    }
    default:
      return { error: `tipo de campo desconocido «${campo.tipo}».` };
  }
}

const vacio = (v) => v === undefined || v === null || String(v).trim() === '';

// crudos: { idCampo: texto } → { datos } o { error, campo, posicion?, longitud? }
export function leerCampos(campos, crudos = {}) {
  const datos = {};
  for (const campo of campos) {
    let crudo = crudos[campo.id];
    if (vacio(crudo) && campo.tipo === 'opcion') crudo = campo.opciones[0].valor;
    if (vacio(crudo)) {
      if (campo.opcional) {
        datos[campo.id] = null;
        continue;
      }
      return { error: `Falta ${campo.etiqueta}. Ejemplo: ${campo.ejemplo}`, campo: campo.id };
    }
    const r = leerUno(campo, String(crudo).trim());
    if (r.error) {
      const sep = /^[a-záéíóú]/.test(r.error) ? ' ' : ': ';
      return { error: `${campo.etiqueta}${sep}${r.error}`, campo: campo.id, posicion: r.posicion, longitud: r.longitud, entrada: String(crudo) };
    }
    datos[campo.id] = r.valor;
  }
  return { datos };
}

// Datos ya leídos → líneas para la parte "1. Datos" de la solución
export function datosLegibles(campos, datos) {
  const out = [];
  for (const c of campos) {
    const v = datos[c.id];
    if (v === null || v === undefined) continue;
    let mat;
    if (c.tipo === 'numero') mat = `${mValor(v)}${mAprox(v)}`;
    else if (c.tipo === 'punto') mat = mPunto(v.x, v.y);
    else if (c.tipo === 'recta') mat = fmtRecta(v);
    else if (c.tipo === 'lista') mat = v.map((n) => mValor(n)).join(';  ');
    else if (c.tipo === 'opcion') mat = c.opciones.find((o) => o.valor === v).texto;
    else mat = String(v);
    out.push(c.tipo === 'ecuacion' ? { etiqueta: c.etiqueta, texto: v } : { etiqueta: c.etiqueta, mat });
  }
  return out;
}
