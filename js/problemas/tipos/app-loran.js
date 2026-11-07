// Aplicación: LORAN. Estaciones en los focos; la diferencia de distancias es 2a = v·Δt.
import { Solucion, fallar } from '../solucion.js';
import {
  ejeEntre, pasoPuntoMedio, pasoSemieje, pasoB2, terminarHiperbola, mValor, mParen, mBase, mAprox, fmtCorto, Num, pt,
} from '../comunes.js';

export default {
  id: 'app-loran',
  conica: 'aplicacion',
  titulo: 'LORAN (navegación con dos estaciones)',
  descripcion: 'Con las estaciones, la diferencia de tiempos y la velocidad: ecuación de la hipérbola y la coordenada pedida.',
  palabras: 'loran estaciones barco señal diferencia tiempos velocidad hiperbola aplicacion',
  campos: [
    { id: 'S1', tipo: 'punto', etiqueta: 'Estación 1', ejemplo: '(−150; 0)' },
    { id: 'S2', tipo: 'punto', etiqueta: 'Estación 2', ejemplo: '(150; 0)' },
    { id: 'dt', tipo: 'numero', etiqueta: 'Diferencia de tiempos Δt', ejemplo: '0,001', positivo: true },
    { id: 'v', tipo: 'numero', etiqueta: 'Velocidad de la señal v', ejemplo: '186000', positivo: true },
    {
      id: 'cual',
      tipo: 'opcion',
      etiqueta: 'Coordenada conocida del barco',
      opciones: [{ valor: 'y', texto: 'Conozco y, busco x' }, { valor: 'x', texto: 'Conozco x, busco y' }],
      ejemplo: 'y',
    },
    { id: 'valor', tipo: 'numero', etiqueta: 'Valor conocido (opcional)', ejemplo: '75', opcional: true },
  ],
  resolver({ S1, S2, dt, v, cual, valor }) {
    const eje = ejeEntre(S1, S2, ['La estación 1', 'la estación 2'], 'S2');
    const sol = new Solucion('LORAN');
    const C = pasoPuntoMedio(sol, S1, S2, { simbolo: 'C', titulo: 'Hallamos el centro', texto: 'Las estaciones son los focos; el centro es su punto medio.' });
    const c = pasoSemieje(sol, C, S2, eje, 'c', { titulo: 'Calculamos c', texto: 'c es la distancia del centro a una estación (foco).' });
    const dosA = v.por(dt);
    const a = dosA.entre(2);
    sol.paso('Calculamos a', 'La diferencia de distancias del barco a las estaciones es constante: v·Δt = 2a.', {
      formula: '2a = v·Δt',
      mat: [`2a = ${mValor(v)}·${mValor(dt)} = ${mValor(dosA)}  →  a = ${mValor(a)}`],
    });
    if (a.comparar(c) >= 0) fallar(`La diferencia de distancias (2a = ${fmtCorto(dosA)}) debe ser menor que la distancia entre estaciones (2c = ${fmtCorto(c.por(2))}). Revisa Δt o la velocidad.`, 'dt');
    const b2 = pasoB2(sol, 'hiperbola', a, c);
    terminarHiperbola(sol, C, a.cuadrado(), b2, eje);
    sol.punto('S₁', S1).punto('S₂', S2);
    if (valor) {
      // Coordenada a lo largo del eje transverso (u) y la perpendicular (w)
      const conocidaEsTransversa = (cual === 'x') === (eje === 'horizontal');
      const a2 = a.cuadrado();
      const [cu, cw] = eje === 'horizontal' ? [C.x, C.y] : [C.y, C.x];
      const busca = cual === 'y' ? 'x' : 'y';
      let soluciones = [];
      const mat = [];
      if (!conocidaEsTransversa) {
        // (u − cu)² = a²(1 + (w − cw)²/b²)
        const d = valor.menos(cw);
        const u2 = a2.por(Num.de(1).mas(d.cuadrado().entre(b2)));
        const r = u2.raiz();
        soluciones = [cu.menos(r), cu.mas(r)];
        mat.push(`(${busca} − ${mParen(cu)})² = a²(1 + \\frac{${mBase(d)}²}{b²}) = ${mValor(a2)}(1 + \\frac{${mValor(d.cuadrado())}}{${mValor(b2)}}) = ${mValor(u2)}`);
      } else {
        const d = valor.menos(cu);
        const w2 = b2.por(d.cuadrado().entre(a2).menos(1));
        if (w2.signo() < 0) fallar(`Con ${cual} = ${fmtCorto(valor)} no hay punto de la hipérbola: entre los vértices no pasa ninguna rama.`, 'valor');
        const r = w2.raiz();
        soluciones = [cw.menos(r), cw.mas(r)];
        mat.push(`(${busca} − ${mParen(cw)})² = b²(\\frac{${mBase(d)}²}{a²} − 1) = ${mValor(w2)}`);
      }
      soluciones.forEach((n) => mat.push(`${busca} = ${mValor(n)}${mAprox(n)}`));
      sol.paso(`Calculamos ${busca} para ${cual} = ${fmtCorto(valor)}`, `Reemplazamos ${cual} en la ecuación y despejamos ${busca}. El signo depende de qué estación recibe primero la señal: el barco está en la rama más cercana a esa estación.`, {
        mat,
      });
      sol.respuesta(`Posición del barco (${cual} = ${fmtCorto(valor)})`, soluciones.map((n) => `${busca} = ${mValor(n)}${mAprox(n)}`).join('   o   '));
      soluciones.forEach((n) => sol.punto('', cual === 'y' ? pt(n, valor) : pt(valor, n), 'corte'));
      sol.valor('coordenada', soluciones);
    }
    return sol;
  },
};
