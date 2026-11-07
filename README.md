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
- **Practicar › Resolver en papel**: ejercicios aleatorios de los 35 tipos, con filtros por cónica y tipo. Resuelve y grafica en tu cuaderno; toca «Ver respuesta» para comparar la solución completa y registra si acertaste.
- **Practicar › Modo alternativas**: cuatro ecuaciones, una correcta y tres distractores basados en errores típicos. Al elegir se explica cada error y se actualiza el contador una sola vez por ejercicio.
- **Practicar › Grafica tú**: parte de una ecuación y revela la construcción con «Revelar» y «Siguiente paso»: centro o vértice, puntos guía, focos, rectas auxiliares y curva. Al terminar puedes consultar la solución y autoevaluarte.
- **Contador persistente**: aciertos e intentos se guardan en el navegador. «Reiniciar contador» inicia una nueva sesión de práctica.
- **Sin internet e instalable**: después de una primera carga completa con conexión, los archivos de la app quedan disponibles sin internet. Al publicar una nueva versión se ofrece el botón «Actualizar».

El filtro de cada cónica también permite practicar «Desde la ecuación». Los enunciados generados pueden pegarse en Resolver. El detector usa reglas: revisa los datos que encontró antes de resolver, especialmente con redacciones distintas de los ejemplos.

### Alcance matemático

Se trabajan cónicas con ejes paralelos a X o Y; las cónicas rotadas con término xy no están implementadas y muestran un mensaje explicativo. En las ecuaciones se admiten coeficientes enteros, decimales y fracciones. En los campos de parámetros, puntos y medidas también se admiten raíces, como `2√5`.

## Estructura

- `js/math/` — fracciones y raíces exactas (`fracciones.js`, `raices.js`, `numeros.js`), formateo, ecuación general y parser de ecuaciones
- `js/conicas/` — circunferencia, parábola, elipse e hipérbola desde sus parámetros (ecuaciones, elementos y escena)
- `js/graficador/` — plano cartesiano en canvas (zoom, arrastre, pellizco)
- `js/problemas/` — catálogo de tipos (`tipos.js`), un archivo por tipo en `tipos/`, lectura de campos, constructor de soluciones y pasos comunes
- `js/ui/` — secciones Resolver, Graficar y Practicar, soluciones y componentes de interfaz
- `tests/` — pruebas con `node:test`
- `docs/casos-de-clase.md` — ejercicios de clase que sirven como pruebas obligatorias

### Agregar un tipo de pregunta

1. Crea `js/problemas/tipos/mi-tipo.js` que exporte `{ id, conica, titulo, descripcion, campos, resolver(datos) }`. Los campos pueden ser `numero`, `punto`, `recta`, `ecuacion`, `lista` u `opcion`.
2. Impórtalo y agrégalo a `REGISTRO` en `js/problemas/tipos.js`. La interfaz lo muestra sola.
3. (Opcional) Para que «Pegar pregunta» lo reconozca, agrega una regla a `REGLAS` en `js/problemas/detector.js`: una función `puntaje(contexto)` y otra `llenar(contexto)` que devuelve los datos del formulario.
4. Para incluirlo en Practicar, añade su generador a `GENERADORES` en `js/problemas/practica.js`. Si la respuesta es la ecuación de la cónica, revisa también `ADMITE_ALTERNATIVAS` y sus distractores.
5. Añade pruebas con datos válidos, inválidos y las condiciones geométricas del problema. Si creas un módulo, agrégalo a `ARCHIVOS` en `service-worker.js` para que esté disponible sin internet.

## Publicar en Firebase Hosting

La raíz del proyecto es la carpeta pública; no hay que compilar ni crear `dist`. `firebase.json` excluye pruebas, documentación, archivos ocultos, dependencias y registros de depuración. Los recursos de red se revalidan; el service worker mantiene la copia sin conexión de cada versión.

Con el proyecto ya configurado, cada actualización se publica desde esta carpeta:

```powershell
node --test
firebase.cmd deploy
```

Antes de publicar cambios en la app, incrementa `VERSION` en `service-worker.js` (por ejemplo, de `v5.0.1` a `v5.0.2`). Si no cambia el service worker, quien ya abrió la app puede seguir viendo los archivos de la versión anterior. Cuando aparezca «Actualizar», ese botón activa la versión nueva.

La herramienta muestra la dirección pública al terminar. `firebase.cmd` evita el bloqueo de `firebase.ps1` en PowerShell; en otras terminales también se puede usar `firebase deploy`. No hace falta ejecutar `firebase init` otra vez ni subir primero a GitHub.

Para configurar Hosting desde otra computadora:

1. Instala Node.js y ejecuta `npm.cmd install -g firebase-tools`.
2. Ejecuta `firebase.cmd login` con una cuenta que tenga acceso al proyecto.
3. Conserva `firebase.json` y `.firebaserc` del repositorio; comprueba el proyecto con `firebase.cmd use`.
4. Ejecuta las pruebas y publica con `firebase.cmd deploy --only hosting`.

Consulta la [configuración oficial de Hosting](https://firebase.google.com/docs/hosting/full-config) y la [guía de publicación](https://firebase.google.com/docs/hosting/quickstart).

## Guardar cambios en GitHub

El repositorio es [Damianskades/Resuelve-conicas](https://github.com/Damianskades/Resuelve-conicas). Desde esta carpeta, con el remoto y la rama main ya configurados:

```powershell
git add .
git commit -m "Actualiza el resolvedor de conicas"
git push
```

Si GitHub rechaza el envío, revisa los cambios remotos antes de repetirlo. GitHub conserva el código; Firebase publica la copia local guardada.

### Alternativa: GitHub Pages

1. Sube el proyecto a la rama `main` del repositorio.
2. En GitHub, abre **Settings → Pages**.
3. En **Build and deployment**, elige **Deploy from a branch**.
4. Selecciona `main` y `/(root)`; guarda y espera la publicación.
5. Abre el enlace que indique GitHub. Las rutas relativas y `.nojekyll` permiten servir la app dentro de la subcarpeta del repositorio.

## Instalar en el celular

1. Abre la dirección HTTPS publicada y espera a que termine de cargar con conexión.
2. En Android/Chrome, abre el menú y elige «Instalar aplicación» o «Agregar a pantalla principal», según la opción disponible.
3. En iPhone/Safari, abre Compartir y elige «Agregar a pantalla de inicio».
4. Abre la app desde su icono. Para usarla sin conexión necesitas haber completado al menos una carga con internet. Borrar los datos del navegador también borra la caché y el contador.

## Verificación manual en el celular

- [ ] A 360 px de ancho no hay desplazamiento horizontal en Resolver, Graficar ni Practicar, incluso con ecuaciones largas.
- [ ] Resolver muestra resultados y gráfica; una entrada inválida da un mensaje claro y permite corregirla.
- [ ] Arrastre, pellizco, botones de zoom y Centrar funcionan; al girar el teléfono la gráfica sigue siendo legible.
- [ ] En práctica en papel se oculta la respuesta hasta pulsar «Ver respuesta».
- [ ] En alternativas hay cuatro opciones, se explican los errores y se cuenta solo el primer intento.
- [ ] En Grafica tú aparecen los pasos en orden; prueba una circunferencia con radio irracional, como `√5`.
- [ ] El contador se conserva al cerrar y abrir; «Reiniciar contador» lo devuelve a cero.
- [ ] Tras una primera carga completa, activa modo avión, cierra y vuelve a abrir: Resolver, Graficar y Practicar siguen funcionando.
- [ ] Tras publicar otra versión, con conexión aparece «Actualizar» y al tocarlo se carga la nueva.
- [ ] Con teclado o lector de pantalla se identifican los campos y botones y el foco permanece visible.

Estas comprobaciones requieren un navegador real; las pruebas de Node no verifican la instalación ni la disposición visual del teléfono.
