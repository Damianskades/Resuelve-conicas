// Ejemplos de clase (docs/casos-de-clase.md) listos para cargar en la interfaz:
// por parámetros (sección Graficar) y por ecuación (sección Resolver).

export const EJEMPLOS_PARAMETROS = {
  circunferencia: [
    { nombre: 'Centro C(3; −7), r = 4', valores: { h: '3', k: '−7', r: '4' } },
    { nombre: 'Por P(1; −2), Q(5; 4) y R(10; 5): C(9; −3), r = √65', valores: { h: '9', k: '−3', r: '√65' } },
    { nombre: 'Tangente a 2x − y + 1 = 0 en (2; 5): C(6; 3), r = 2√5', valores: { h: '6', k: '3', r: '2√5' } },
    { nombre: 'Centro C(−1; 4), tangente a 5x + 12y + 9 = 0: r = 4', valores: { h: '−1', k: '4', r: '4' } },
    { nombre: 'Matriz de punzonado: B(−1,25; −3), r = 0,25', valores: { h: '−1,25', k: '−3', r: '0,25' } },
    { nombre: 'Rueda de la fortuna: C(0; 10), r = 9', valores: { h: '0', k: '10', r: '9' } },
  ],
  parabola: [
    { nombre: 'x² + 2x + 16y − 31 = 0: V(−1; 2), p = −4', valores: { h: '−1', k: '2', p: '−4' }, orientacion: 'vertical' },
    { nombre: 'y² + 6y + 4x + 5 = 0: V(1; −3), p = −1', valores: { h: '1', k: '−3', p: '−1' }, orientacion: 'horizontal' },
    { nombre: 'V(−1; 2), F(−1; 0): p = −2', valores: { h: '−1', k: '2', p: '−2' }, orientacion: 'vertical' },
    { nombre: 'V(4; 3), F(9; 3): p = 5', valores: { h: '4', k: '3', p: '5' }, orientacion: 'horizontal' },
    { nombre: 'Vértice en el origen, eje X: y² = 8x', valores: { h: '0', k: '0', p: '2' }, orientacion: 'horizontal' },
    { nombre: 'Puente Golden Gate: x² = (51200/19)y', valores: { h: '0', k: '0', p: '12800/19' }, orientacion: 'vertical' },
    { nombre: 'Drone: y = 8t − t², vértice (4; 16)', valores: { h: '4', k: '16', p: '−1/4' }, orientacion: 'vertical' },
  ],
  elipse: [
    { nombre: '4x² + 9y² + 32x − 18y + 37 = 0: C(−4; 1), a = 3, b = 2', valores: { h: '−4', k: '1', a: '3', b: '2' }, orientacion: 'horizontal' },
    { nombre: '9x² + 25y² − 36x − 50y + 60 = 0: C(2; 1), a = 1/3, b = 1/5', valores: { h: '2', k: '1', a: '1/3', b: '1/5' }, orientacion: 'horizontal' },
    { nombre: 'Focos (±3; 0), vértices (±5; 0)', valores: { h: '0', k: '0', a: '5', b: '4' }, orientacion: 'horizontal' },
    { nombre: 'Órbita de Plutón: e = 0,25, eje menor 10 000 (millones de km)', valores: { h: '0', k: '0', a: '4000√15/3', b: '5000' }, orientacion: 'horizontal' },
  ],
  hiperbola: [
    { nombre: '4x² − 3y² + 8x + 16 = 0: C(−1; 0), a = 2, b = √3', valores: { h: '−1', k: '0', a: '2', b: '√3' }, orientacion: 'vertical' },
    { nombre: 'Vértices (±3; 0), LR = 24', valores: { h: '0', k: '0', a: '3', b: '6' }, orientacion: 'horizontal' },
    { nombre: 'Vértices (2; 0) y (6; 0), focos (0; 0) y (8; 0)', valores: { h: '4', k: '0', a: '2', b: '2√3' }, orientacion: 'horizontal' },
    { nombre: 'LORAN: focos (±150; 0), a = 93, b² = 13 851', valores: { h: '0', k: '0', a: '93', b: '√13851' }, orientacion: 'horizontal' },
  ],
};

// Enunciados de examen (Fase 4: pegar pregunta). Los que tienen alternativas vienen de clase.
export const EJEMPLOS_ENUNCIADOS = [
  'Determina la ecuación general de la circunferencia que tiene su centro en el punto C=(−1; 4) y es tangente a la recta que pasa por los puntos A = (3; −2) y B = (−9; 3).\na. x²+y²+2x−8y+1=0\nb. x²+y²+4x−8y+5=0\nc. x²+y²+4x−8y+1=0\nd. x²+y²+4x−8y+12=0',
  'Se tiene la circunferencia x² + y² – 4x – 6y + 8 = 0. Hallar la ecuación de la recta tangente a la circunferencia en el punto A = (3, 1).\na. −x+y+1=0\nb. x−2y−1=0\nc. x+y−1=0\nd. x−y+1=0',
  'Determine el centro y la longitud del eje menor de E: 9x² + 25y² − 36x −50y + 60 = 0.\na. C(1; 2); em=2/3\nb. C(−2; 1); em=2/3\nc. C(2; −1); em=1/25\nd. C(2; 1); em=2/5',
  'Obtener la ecuación canónica de la elipse cuyos focos son: F1=(3,0) y F2=(−3,0); y cuyos vértices son: V1=(5,0) y V2=(−5,0).\na. x²/36+y²/16=1\nb. x²/16+y²/36=1\nc. x²/16+y²/25=1\nd. x²/25+y²/16=1',
  'Determinar la ecuación de la hipérbola con vértices (±3, 0) y el lado recto es 24.\na. x²/9−y²/36=1\nb. x²/36−y²/9=1\nc. x²/16−y²/36=1\nd. y²/36−x²/9=1',
  'Determina la ecuación general de la hipérbola. Vértices: (2, 0) y (6, 0); Focos: (0, 0) y (8, 0).\na. 3x²−y²−24x+36=0\nb. 3x²−4y²−24x+36=0\nc. 3x²−6y²−24x+36=0\nd. 3x²−2y²−24x+36=0',
  'Determine la ecuación general de la parábola. Vértice: (−1, 2); Foco: (−1, 0).\na. x²−2x+8y+15=0\nb. x²−2x+8y−15=0\nc. x²+2x−8y−15=0\nd. x²+2x+8y−15=0',
  'Determina la forma estándar de la ecuación de la parábola. Vértice: (4, 3); Foco: (9, 3).\na. (y−3)²=20(x−4)\nb. (y−3)²=10(x−4)\nc. (y−3)²=16(x−4)\nd. (x−3)²=20(y−4)',
  'Halla la ecuación de la circunferencia tangente a la recta 2x − y + 1 = 0 en el punto (2; 5) y cuyo centro está sobre la recta x + y = 9.',
  'El cable del puente Golden Gate cuelga entre dos torres separadas 1280 m y de 152 m de altura. Halla su ecuación y las alturas en x = 100, 250, 400 y 500.',
  'Dos estaciones LORAN están en (−150; 0) y (150; 0). La diferencia de tiempos es 0,001 s y la velocidad de la señal es 186000 millas/s. Si el barco está en y = 75, halla x.',
];

export const EJEMPLOS_ECUACIONES = [
  { nombre: 'Circunferencia de centro C(3; −7) y r = 4', ecuacion: 'x^2 + y^2 - 6x + 14y + 42 = 0' },
  { nombre: 'Circunferencia por P, Q y R', ecuacion: 'x^2 + y^2 - 18x + 6y + 25 = 0' },
  { nombre: 'Circunferencia tangente a la recta AB', ecuacion: 'x^2 + y^2 + 2x - 8y + 1 = 0' },
  { nombre: 'Matriz de punzonado', ecuacion: '2x^2 + 2y^2 + 5x + 12y + 21 = 0' },
  { nombre: 'Rueda de la fortuna (forma ordinaria)', ecuacion: 'x^2 + (y - 10)^2 = 81' },
  { nombre: 'Parábola que abre hacia abajo', ecuacion: 'x^2 + 2x + 16y - 31 = 0' },
  { nombre: 'Parábola de eje horizontal', ecuacion: 'y^2 + 6y + 4x + 5 = 0' },
  { nombre: 'Parábola con V(−1; 2) y F(−1; 0)', ecuacion: 'x^2 + 2x + 8y - 15 = 0' },
  { nombre: 'Parábola con V(4; 3) y F(9; 3) (forma ordinaria)', ecuacion: '(y - 3)^2 = 20(x - 4)' },
  { nombre: 'Puente Golden Gate', ecuacion: 'x^2 = (51200/19)y' },
  { nombre: 'Elipse de eje mayor horizontal', ecuacion: '4x^2 + 9y^2 + 32x - 18y + 37 = 0' },
  { nombre: 'Elipse con eje menor 2/5', ecuacion: '9x^2 + 25y^2 - 36x - 50y + 60 = 0' },
  { nombre: 'Elipse con focos (±3; 0) (forma canónica)', ecuacion: 'x^2/25 + y^2/16 = 1' },
  { nombre: 'Hipérbola de eje transverso vertical', ecuacion: '4x^2 - 3y^2 + 8x + 16 = 0' },
  { nombre: 'Hipérbola con LR = 24 (forma canónica)', ecuacion: 'x^2/9 - y^2/36 = 1' },
  { nombre: 'Hipérbola con focos (0; 0) y (8; 0)', ecuacion: '3x^2 - y^2 - 24x + 36 = 0' },
  { nombre: 'LORAN (forma canónica)', ecuacion: 'x^2/8649 - y^2/13851 = 1' },
];
