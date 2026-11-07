# CLAUDE.md — Resolvedor de Cónicas

Web estática para estudiar la Unidad 3 de Álgebra Lineal y Geometría Analítica. Se construye por fases; no avanzar a la siguiente fase sin que el usuario lo pida.

## Alcance
- SOLO circunferencia, parábola, elipse e hipérbola: ecuación ordinaria, canónica y general, elementos, tangencia, posiciones relativas y aplicaciones. Nada de otros temas.
- Los ejercicios de `docs/casos-de-clase.md` son pruebas obligatorias: cada uno debe tener su prueba y dar exactamente esos resultados.

## Tecnología
- HTML, CSS y JavaScript puro con módulos ES. Sin frameworks, sin bundlers, sin npm obligatorio (el `package.json` solo declara `"type": "module"`; no hay dependencias).
- Toda la lógica matemática va en funciones puras, separadas del DOM (`js/math`, `js/conicas`, `js/problemas`), para poder probarlas con `node --test`.
- Solo `js/ui`, `js/graficador` y `js/main.js` tocan el DOM o el canvas.
- Pruebas en `tests/` con `node:test` y `node:assert`, sin dependencias.
- Debe funcionar publicado en GitHub Pages (rutas relativas, sin servidor).

## Idioma y notación (como en clase)
- Interfaz y soluciones en español.
- Puntos con punto y coma: `C(−1; 4)`.
- El signo menos se muestra como “−” (U+2212), no como guion.
- Decimales con coma: `2,24`.
- Ecuación general de la forma `Ax² + Cy² + Dx + Ey + F = 0` con coeficientes enteros simplificados (divididos entre su MCD) y el primer coeficiente positivo.
- Resultados exactos cuando se pueda: fracciones (`2/5`) y raíces (`√5`), con su decimal aproximado a 2 decimales al lado (`√5 ≈ 2,24`).
- Nunca mostrar errores de coma flotante como `0,30000000000000004`.

## Estructura de cada solución
1. Datos identificados
2. Fórmulas usadas
3. Procedimiento paso a paso
4. Respuesta final resaltada
5. Gráfica con todos los elementos

## Errores
- Si un dato es inválido o la pregunta no corresponde a estos temas, mostrar un mensaje claro que diga qué está mal y cómo corregirlo. Nunca fallar en silencio.

## Diseño (neobrutalista y legible)
- Fondo blanco y gris muy claro, texto negro.
- Bordes negros gruesos de 3 px, sombras sólidas desplazadas sin desenfoque, esquinas casi rectas.
- Solo 2 colores de acento:
  - Amarillo `#FFD400`: botones activos y respuesta final.
  - Azul `#1F4FE0`: solo la curva en la gráfica.
- Nada de degradados ni de más colores.

## Mobile-first
- Botones y controles táctiles de al menos 44 px.
- Nada de scroll horizontal en la página.
- Controles pensados para el tacto.

## Al terminar cada fase
- Todas las pruebas pasan (`node --test`).
- Entregar una lista corta de verificación manual.
- Entregar un resumen de los archivos creados o cambiados.
