// Catálogo de tipos de pregunta. Para agregar un tipo nuevo: crea su archivo en tipos/
// (un objeto con id, conica, titulo, campos y resolver) e impórtalo en la lista REGISTRO.
// La interfaz se arma sola a partir de este catálogo.

import ecuacion from './tipos/ecuacion.js';
import circCentroRadio from './tipos/circ-centro-radio.js';
import circCentroPunto from './tipos/circ-centro-punto.js';
import circDiametro from './tipos/circ-diametro.js';
import circTresPuntos from './tipos/circ-tres-puntos.js';
import circCentroTangente from './tipos/circ-centro-tangente.js';
import circCentroTangenteAB from './tipos/circ-centro-tangente-ab.js';
import circTangenteCentroEnRecta from './tipos/circ-tangente-centro-en-recta.js';
import circRectaTangente from './tipos/circ-recta-tangente.js';
import circPosicionRecta from './tipos/circ-posicion-recta.js';
import circPosicionCircunferencias from './tipos/circ-posicion-circunferencias.js';
import circPuntoTangenteEnPunto from './tipos/circ-punto-tangente-en-punto.js';
import parVerticeFoco from './tipos/par-vertice-foco.js';
import parFocoDirectriz from './tipos/par-foco-directriz.js';
import parVerticeDirectriz from './tipos/par-vertice-directriz.js';
import parVerticePunto from './tipos/par-vertice-punto.js';
import parTresPuntos from './tipos/par-tres-puntos.js';
import parEcuacion from './tipos/par-ecuacion.js';
import eliFocosVertices from './tipos/eli-focos-vertices.js';
import eliCentroVerticeFoco from './tipos/eli-centro-vertice-foco.js';
import eliVerticesExcentricidad from './tipos/eli-vertices-excentricidad.js';
import eliVerticesLadoRecto from './tipos/eli-vertices-lado-recto.js';
import eliVerticesEjeMenor from './tipos/eli-vertices-eje-menor.js';
import eliFocosEje from './tipos/eli-focos-eje.js';
import hipVerticesFocos from './tipos/hip-vertices-focos.js';
import hipVerticesLadoRecto from './tipos/hip-vertices-lado-recto.js';
import hipVerticesAsintota from './tipos/hip-vertices-asintota.js';
import hipFocosExcentricidad from './tipos/hip-focos-excentricidad.js';
import hipCentroVerticeFoco from './tipos/hip-centro-vertice-foco.js';
import appRueda from './tipos/app-rueda.js';
import appPuente from './tipos/app-puente.js';
import appTrayectoria from './tipos/app-trayectoria.js';
import appTunel from './tipos/app-tunel.js';
import appOrbita from './tipos/app-orbita.js';
import appLoran from './tipos/app-loran.js';

const REGISTRO = [
  ecuacion,
  circCentroRadio, circCentroPunto, circDiametro, circTresPuntos, circCentroTangente, circCentroTangenteAB,
  circTangenteCentroEnRecta, circRectaTangente, circPosicionRecta, circPosicionCircunferencias, circPuntoTangenteEnPunto,
  parVerticeFoco, parFocoDirectriz, parVerticeDirectriz, parVerticePunto, parTresPuntos, parEcuacion,
  eliFocosVertices, eliCentroVerticeFoco, eliVerticesExcentricidad, eliVerticesLadoRecto, eliVerticesEjeMenor, eliFocosEje,
  hipVerticesFocos, hipVerticesLadoRecto, hipVerticesAsintota, hipFocosExcentricidad, hipCentroVerticeFoco,
  appRueda, appPuente, appTrayectoria, appTunel, appOrbita, appLoran,
];

export const GRUPOS = [
  { id: 'general', nombre: 'Desde la ecuación' },
  { id: 'circunferencia', nombre: 'Circunferencia' },
  { id: 'parabola', nombre: 'Parábola' },
  { id: 'elipse', nombre: 'Elipse' },
  { id: 'hiperbola', nombre: 'Hipérbola' },
  { id: 'aplicacion', nombre: 'Aplicaciones' },
];

const TIPOS_CAMPO = ['numero', 'punto', 'recta', 'ecuacion', 'lista', 'opcion'];

// Revisa que cada tipo tenga lo necesario (se usa en las pruebas y al cargar).
export function validarTipo(t) {
  const errores = [];
  for (const k of ['id', 'conica', 'titulo', 'campos', 'resolver']) if (!t[k]) errores.push(`falta «${k}»`);
  if (t.conica && !GRUPOS.some((g) => g.id === t.conica)) errores.push(`cónica desconocida «${t.conica}»`);
  for (const c of t.campos ?? []) {
    if (!c.id || !c.etiqueta || c.ejemplo === undefined) errores.push(`campo incompleto ${JSON.stringify(c.id)}`);
    if (!TIPOS_CAMPO.includes(c.tipo)) errores.push(`tipo de campo desconocido «${c.tipo}»`);
    if (c.tipo === 'opcion' && !c.opciones?.length) errores.push(`el campo ${c.id} no tiene opciones`);
  }
  return errores;
}

const ids = new Set();
for (const t of REGISTRO) {
  const errores = validarTipo(t);
  if (ids.has(t.id)) errores.push('id repetido');
  if (errores.length) throw new Error(`Tipo de pregunta «${t.id}» mal definido: ${errores.join('; ')}`);
  ids.add(t.id);
}

export const TIPOS_PREGUNTA = Object.freeze([...REGISTRO]);

export const tipoPorId = (id) => TIPOS_PREGUNTA.find((t) => t.id === id) ?? null;

const normalizar = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

// Busca por palabras (sin importar tildes ni mayúsculas) en el título, la descripción y las palabras clave.
export function buscarTipos(texto) {
  const palabras = normalizar(texto).split(/\s+/).filter(Boolean);
  if (!palabras.length) return TIPOS_PREGUNTA;
  return TIPOS_PREGUNTA.filter((t) => {
    const grupo = GRUPOS.find((g) => g.id === t.conica)?.nombre;
    const pajar = normalizar(`${t.titulo} ${t.descripcion} ${t.palabras ?? ''} ${grupo}`);
    return palabras.every((p) => pajar.includes(p));
  });
}

// Tipos agrupados por cónica, en el orden de GRUPOS.
export function agrupar(tipos = TIPOS_PREGUNTA) {
  return GRUPOS.map((g) => ({ ...g, tipos: tipos.filter((t) => t.conica === g.id) })).filter((g) => g.tipos.length);
}
