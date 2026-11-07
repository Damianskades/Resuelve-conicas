# Resolvedor de Cónicas

Web estática para estudiar la Unidad 3 de Álgebra Lineal y Geometría Analítica: circunferencia, parábola, elipse e hipérbola. Ingresas una ecuación, unos datos o un enunciado y la app muestra los datos identificados, las fórmulas usadas, el procedimiento paso a paso, la respuesta final y la gráfica.

Hecha con HTML, CSS y JavaScript puro (módulos ES). No necesita instalar nada.

## Probar en local

Los módulos ES no funcionan abriendo `index.html` con doble clic; hace falta un servidor local:

```sh
npx serve
```

Luego abre la dirección que aparece (normalmente http://localhost:3000).

## Correr las pruebas

Requiere Node.js 18 o superior:

```sh
node --test
```

## Qué hace por ahora

- **Resolver › Pegar pregunta** (modo por defecto): pegas el enunciado tal como viene en el examen, con sus alternativas. La app detecta el tipo de pregunta y los datos con reglas (sin IA ni internet), llena el formulario para que lo revises, resuelve y marca la alternativa correcta explicando por qué las otras no coinciden.
- **Resolver › Elegir tipo**: 35 tipos de pregunta agrupados por cónica (con buscador): desde la ecuación, centro y radio, tres puntos, tangentes, posición relativa, vértice y foco, focos y vértices, asíntotas, y plantillas de aplicaciones (rueda, puente, drone, túnel, órbitas, LORAN). Cada solución trae datos, fórmulas, pasos, respuesta final (con botón para copiar) y gráfica con los datos marcados.
- **Graficar**: eliges la cónica, escribes sus parámetros (enteros, decimales, fracciones o raíces como `2√5`) y ves la gráfica, las ecuaciones y todos los elementos.
- **Practicar**: próximamente.

## Estructura

- `js/math/` — fracciones y raíces exactas (`fracciones.js`, `raices.js`, `numeros.js`), formateo, ecuación general y parser de ecuaciones
- `js/conicas/` — circunferencia, parábola, elipse e hipérbola desde sus parámetros (ecuaciones, elementos y escena)
- `js/graficador/` — plano cartesiano en canvas (zoom, arrastre, pellizco)
- `js/problemas/` — catálogo de tipos (`tipos.js`), un archivo por tipo en `tipos/`, lectura de campos, constructor de soluciones y pasos comunes
- `js/ui/` — secciones Resolver y Graficar, y componentes de interfaz
- `tests/` — pruebas con `node:test`
- `docs/casos-de-clase.md` — ejercicios de clase que sirven como pruebas obligatorias

### Agregar un tipo de pregunta

1. Crea `js/problemas/tipos/mi-tipo.js` que exporte `{ id, conica, titulo, descripcion, campos, resolver(datos) }`. Los campos pueden ser `numero`, `punto`, `recta`, `ecuacion`, `lista` u `opcion`.
2. Impórtalo y agrégalo a `REGISTRO` en `js/problemas/tipos.js`. La interfaz lo muestra sola.
3. (Opcional) Para que «Pegar pregunta» lo reconozca, agrega una regla a `REGLAS` en `js/problemas/detector.js`: una función `puntaje(contexto)` y otra `llenar(contexto)` que devuelve los datos del formulario.
