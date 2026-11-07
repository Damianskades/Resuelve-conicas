// Punto único para resolver una pregunta: lee y valida los campos del tipo elegido, llama a su
// resolver y devuelve { ok: true, datos, formulas, pasos, respuesta, escena, ... } o
// { ok: false, error, campo } con un mensaje claro. Funciones puras.

import { tipoPorId } from './tipos.js';
import { leerCampos, datosLegibles } from './campos.js';
import { Solucion, ErrorDatos } from './solucion.js';

// crudos: { idCampo: texto }. Por compatibilidad, un texto suelto es la ecuación.
export function resolverPregunta(id, crudos) {
  const tipo = tipoPorId(id === 'desde-ecuacion' ? 'ecuacion' : id);
  if (!tipo) return { ok: false, error: `No existe el tipo de pregunta «${id}».` };
  const entrada = typeof crudos === 'string' ? { [tipo.campos[0].id]: crudos } : crudos ?? {};
  const leidos = leerCampos(tipo.campos, entrada);
  if (leidos.error) return { ok: false, ...leidos };
  try {
    let r = tipo.resolver(leidos.datos);
    if (r instanceof Solucion) r = r.resultado();
    if (r.ok && !tipo.datosPropios) r = { ...r, datos: [...datosLegibles(tipo.campos, leidos.datos), ...r.datos] };
    if (!r.ok && r.campo && r.entrada === undefined) r = { ...r, entrada: entrada[r.campo] };
    return { ...r, tipoPregunta: tipo.id };
  } catch (e) {
    if (e instanceof ErrorDatos) {
      const { campo, posicion, longitud } = e;
      return {
        ok: false,
        error: e.message,
        campo,
        posicion,
        longitud,
        entrada: campo ? entrada[campo] : undefined,
        tipoPregunta: tipo.id,
      };
    }
    if (e instanceof RangeError) {
      return { ok: false, error: 'Los números son demasiado grandes o el cálculo no es posible con estos datos. Revísalos.', tipoPregunta: tipo.id };
    }
    throw e;
  }
}
