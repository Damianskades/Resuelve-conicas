// Constructor de soluciones con las 5 partes de CLAUDE.md: datos, fórmulas, pasos, respuesta
// final y escena para graficar (con los datos dados marcados). Funciones puras, sin DOM.

import { aTexto } from '../math/formato.js';
import { escenaVacia, etiquetaCoords } from '../conicas/comun.js';
import { escenaDeRecta } from '../math/rectas.js';

// Error de datos: el solucionador lo lanza y el catálogo lo convierte en mensaje claro.
export class ErrorDatos extends Error {
  constructor(mensaje, campo, extra = {}) {
    super(mensaje);
    this.campo = campo;
    Object.assign(this, extra);
  }
}

export function fallar(mensaje, campo, extra) {
  throw new ErrorDatos(mensaje, campo, extra);
}

const NOMBRES = { circunferencia: 'Circunferencia', parabola: 'Parábola', elipse: 'Elipse', hiperbola: 'Hipérbola' };

export const CLAVES_RESPUESTA = {
  circunferencia: ['centro', 'radio'],
  parabola: ['vertice', 'p', 'foco', 'directriz', 'ladoRecto'],
  elipse: ['centro', 'a', 'b', 'c', 'v1', 'v2', 'f1', 'f2', 'e'],
  hiperbola: ['centro', 'a', 'b', 'c', 'v1', 'v2', 'f1', 'f2', 'asintota1', 'asintota2', 'e'],
};

const formulaUtil = (f) => f && f.includes('=') && !/^[abr] = √\([abr]²\)/.test(f);

export class Solucion {
  constructor(titulo) {
    this.titulo = titulo;
    this.tituloRespuesta = null;
    this.datos = [];
    this.formulas = [];
    this.pasos = [];
    this.lineas = [];
    this.valores = {};
    this.conicas = [];
    this.escena = escenaVacia();
  }

  dato(etiqueta, mat) {
    this.datos.push({ etiqueta, mat });
    return this;
  }

  formula(...fs) {
    for (const f of fs) if (formulaUtil(f) && !this.formulas.includes(f)) this.formulas.push(f);
    return this;
  }

  // Un paso: qué se hace y por qué (texto corto), la fórmula usada y las cuentas.
  paso(titulo, texto, { formula, mat = [] } = {}) {
    const formulas = [formula].flat().filter(Boolean);
    this.formula(...formulas);
    this.pasos.push({ titulo, texto, formula: formulas.join('   ·   ') || undefined, mat });
    return this;
  }

  respuesta(etiqueta, mat) {
    this.lineas.push({ etiqueta, mat });
    return this;
  }

  valor(clave, v) {
    this.valores[clave] = v;
    return this;
  }

  // Agrega una cónica calculada: elementos, ecuaciones en la respuesta y su gráfica.
  conica(m, { claves, sufijo = '', respuesta = true, nombre } = {}) {
    const n = nombre ?? NOMBRES[m.tipo];
    this.formula(...m.formulas, ...m.elementos.map((e) => e.formula));
    this.pasos.push({
      titulo: `Elementos de la ${n.toLowerCase()}${sufijo ? ` ${sufijo}` : ''}`,
      texto: 'Con los valores hallados aplicamos las fórmulas de cada elemento (valor exacto y aproximado).',
      tabla: m.elementos,
    });
    if (respuesta) {
      const porClave = Object.fromEntries(m.elementos.map((e) => [e.clave, e]));
      const s = sufijo ? ` ${sufijo}` : '';
      this.respuesta(`Ecuación ordinaria${s}`, m.ordinaria);
      this.respuesta(`Ecuación general${s}`, m.general);
      for (const k of claves ?? CLAVES_RESPUESTA[m.tipo]) {
        if (porClave[k]) this.respuesta(`${porClave[k].nombre}${s}`, porClave[k].valor);
      }
    }
    const e = m.escena;
    const ren = (p) => (sufijo && p.etiqueta ? { ...p, etiqueta: { ...p.etiqueta, nombre: p.etiqueta.nombre + sufijo } } : p);
    this.escena.curvas.push(...e.curvas);
    this.escena.rectas.push(...e.rectas);
    this.escena.segmentos.push(...e.segmentos);
    this.escena.puntos.push(...e.puntos.map(ren));
    this.escena.encuadre.push(...e.encuadre);
    this.conicas.push(m);
    return this;
  }

  // Marca en la gráfica un punto dado o calculado (si no hay ya un punto en ese lugar).
  punto(nombre, P, tipo = 'dato') {
    const repetido = this.escena.puntos.some((q) => Math.abs(q.x - P.x.v) < 1e-9 && Math.abs(q.y - P.y.v) < 1e-9);
    if (!repetido) {
      this.escena.puntos.push({ x: P.x.v, y: P.y.v, tipo, etiqueta: { nombre, coords: etiquetaCoords(P.x, P.y) } });
    }
    this.escena.encuadre.push([P.x.v, P.y.v]);
    return this;
  }

  // Marca una recta dada o calculada.
  recta(nombre, r, tipo = 'dato') {
    this.escena.rectas.push({ ...escenaDeRecta(r), tipo, etiqueta: nombre });
    return this;
  }

  encuadre(...puntos) {
    for (const P of puntos) this.escena.encuadre.push([P.x.v, P.y.v]);
    return this;
  }

  resultado() {
    const m = this.conicas[0];
    const titulo = this.tituloRespuesta ?? (m ? NOMBRES[m.tipo] : this.titulo);
    const porClave = m ? Object.fromEntries(m.elementos.map((e) => [e.clave, e])) : {};
    const e = this.escena;
    const vacia = !e.curvas.length && !e.rectas.length && !e.puntos.length;
    return {
      ok: true,
      titulo: this.titulo,
      tipo: m?.tipo ?? null,
      nombre: m ? NOMBRES[m.tipo] : null,
      degenerada: false,
      orientacion: m?.orientacion ?? null,
      general: m?.general ?? null,
      ordinaria: m?.ordinaria ?? null,
      ordinariaTexto: m ? aTexto(m.ordinaria) : null,
      datos: this.datos,
      formulas: this.formulas,
      pasos: this.pasos,
      elementos: m?.elementos ?? [],
      porClave,
      valores: { ...(m?.valores ?? {}), ...this.valores },
      conicas: this.conicas,
      respuesta: { titulo, lineas: this.lineas },
      respuestaTexto: [titulo, ...this.lineas.map((l) => `${l.etiqueta}: ${aTexto(l.mat).replace(/\n/g, '; ')}`)].join('\n'),
      escena: vacia ? null : e,
    };
  }
}
