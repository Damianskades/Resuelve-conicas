# Casos de clase

Ejercicios resueltos en clase. Son **pruebas obligatorias**: desde la Fase 1, cada caso debe tener su prueba en `tests/` y la app debe dar exactamente estos resultados.

Los decimales están redondeados a 2 cifras.

## Circunferencia

1. **Centro y radio.** Centro C(3; −7), r = 4
   → (x − 3)² + (y + 7)² = 16
   → x² + y² − 6x + 14y + 42 = 0
2. **Por tres puntos.** Pasa por P(1; −2), Q(5; 4), R(10; 5)
   → x² + y² − 18x + 6y + 25 = 0, C(9; −3), r = √65
3. **Tangente en un punto y centro sobre una recta.** Tangente a 2x − y + 1 = 0 en (2; 5) y centro sobre x + y = 9
   → C(6; 3), (x − 6)² + (y − 3)² = 20
4. **Centro y recta tangente por dos puntos.** Centro C(−1; 4), tangente a la recta que pasa por A(3; −2) y B(−9; 3)
   → recta 5x + 12y + 9 = 0, r = 4, x² + y² + 2x − 8y + 1 = 0
5. **Recta tangente en un punto.** Recta tangente a x² + y² − 4x − 6y + 8 = 0 en A(3; 1)
   → x − 2y − 1 = 0
6. **Posición relativa recta–circunferencia.** y = 2x + 1 y x² + (y − 1)² = 4
   → secante, x = ±√(4/5)
7. **Aplicación: matriz de punzonado.** Centro B(−1,25; −3), r = 0,25
   → 2x² + 2y² + 5x + 12y + 21 = 0
8. **Aplicación: rueda de la fortuna.** x² + (y − 10)² = 81
   → con x = −3: y ≈ 18,49 o y ≈ 1,51
   → con y = 12: x ≈ ±8,77

## Parábola

1. **General → ordinaria (eje vertical).** x² + 2x + 16y − 31 = 0
   → (x + 1)² = −16(y − 2), V(−1; 2), p = −4, F(−1; −2), directriz y = 6, LR = 16, abre hacia abajo
2. **General → ordinaria (eje horizontal).** y² + 6y + 4x + 5 = 0
   → (y + 3)² = −4(x − 1), V(1; −3), p = −1, F(0; −3), directriz x = 2, LR = 4
3. **Vértice y foco.** V(−1; 2), F(−1; 0)
   → x² + 2x + 8y − 15 = 0
4. **Vértice y foco.** V(4; 3), F(9; 3)
   → (y − 3)² = 20(x − 4)
5. **Condición de distancias.** Vértice en el origen, eje X, punto A(p/2; 2√2) con AO = AF
   → p = 2, y² = 8x
6. **Aplicación: puente Golden Gate.** Torres a 1280 m, altura 152 m, vértice en el origen
   → x² = (51200/19)y
   → alturas: x = 100 → 3,71; x = 250 → 23,19; x = 400 → 59,38; x = 500 → 92,77
7. **Aplicación: drone.** y = at − t² + b, pasa por (1; 7) y (6; 12)
   → a = 8, b = 0, y = 8t − t², vértice (4; 16)

## Elipse

1. **General → ordinaria.** 4x² + 9y² + 32x − 18y + 37 = 0
   → (x + 4)²/9 + (y − 1)²/4 = 1, C(−4; 1), a = 3, b = 2, c = √5
   → V(−7; 1) y V(−1; 1), directrices x ≈ −8,02 y x ≈ 0,02, LR ≈ 2,67, e = √5/3
2. **General → elementos.** 9x² + 25y² − 36x − 50y + 60 = 0
   → C(2; 1), eje menor = 2/5
3. **Focos y vértices.** Focos (±3; 0), vértices (±5; 0)
   → x²/25 + y²/16 = 1
4. **Aplicación: órbita de Plutón.** e = 0,25, eje menor 10 000 millones de km
   → afelio ≈ 6454,97 y perihelio ≈ 3872,98 (millones de km)

## Hipérbola

1. **General → ordinaria (eje vertical).** 4x² − 3y² + 8x + 16 = 0
   → y²/4 − (x + 1)²/3 = 1, C(−1; 0), a = 2, b = √3, c = √7
   → V(−1; ±2), F(−1; ±√7), directrices y ≈ ±1,51, LR = 3, e ≈ 1,32
   → asíntotas y = ±(2/√3)(x + 1)
2. **Vértices y lado recto.** Vértices (±3; 0), LR = 24
   → x²/9 − y²/36 = 1
3. **Vértices y focos.** Vértices (2; 0) y (6; 0), focos (0; 0) y (8; 0)
   → 3x² − y² − 24x + 36 = 0
4. **Aplicación: LORAN.** Focos (±150; 0), diferencia de tiempos 0,001 s, velocidad 186 000 millas/s
   → a = 93, b² = 13 851, x²/8649 − y²/13 851 = 1
   → con y = 75: x ≈ 110,28
