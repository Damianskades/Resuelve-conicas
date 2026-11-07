// Plano cartesiano en <canvas>: cuadrícula con paso automático (1, 2, 5, 10...), ejes con números,
// arrastre con un dedo o el mouse, pellizco con dos dedos y rueda del mouse para hacer zoom,
// nítido en pantallas de alta densidad. Dibuja "escenas"; no sabe nada de cónicas.
//
// Escena: {
//   curvas:    [{ muestrear(vista) => [[[x, y], ...], ...], grupo? }],
//   rectas:    [{ punto: [x, y], direccion: [dx, dy], tipo, grupo?, etiqueta? }],
//   segmentos: [{ a: [x, y], b: [x, y], tipo, grupo? }],
//   puntos:    [{ x, y, tipo, grupo?, etiqueta?: { nombre, coords } }],
//   encuadre:  [[x, y], ...]
// }
// Tipos de línea: curva, directriz, asintota, auxiliar, lado-recto, eje.
// Tipos de punto: centro, vertice, foco, guia, dato (×, punto dado) y corte (rombo, punto calculado).
// Tipo de línea extra: dato (recta dada, negra continua).

export const COLORES = {
  fondo: '#FFFFFF',
  cuadriculaMenor: '#EFEFEF',
  cuadricula: '#D6D6D6',
  negro: '#000000',
  blanco: '#FFFFFF',
  gris: '#8A8A8A',
  curva: '#1F4FE0',
};

export const ESTILOS_LINEA = {
  curva: { color: COLORES.curva, ancho: 3, guiones: [] },
  directriz: { color: COLORES.negro, ancho: 2, guiones: [9, 6] },
  asintota: { color: COLORES.gris, ancho: 1.5, guiones: [7, 5] },
  auxiliar: { color: COLORES.gris, ancho: 1.5, guiones: [4, 4] },
  'lado-recto': { color: COLORES.negro, ancho: 1.5, guiones: [] },
  eje: { color: COLORES.gris, ancho: 1.5, guiones: [2, 5] },
  dato: { color: COLORES.negro, ancho: 2, guiones: [] },
};

const ORDEN_LINEAS = ['auxiliar', 'asintota', 'eje', 'directriz', 'lado-recto', 'dato', 'curva'];

export const VISIBLES_POR_DEFECTO = Object.freeze({
  focos: true,
  directrices: true,
  ladoRecto: true,
  asintotas: true,
  ejeFocal: true,
  coordenadas: true,
});

const FUENTE = '600 13px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const FUENTE_ETIQUETA = '700 14px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

// Paso de la cuadrícula para que las líneas queden a unos 70 px: 1, 2, 5, 10, 20, 50...
export function pasoCuadricula(escala, objetivoPx = 70) {
  const crudo = objetivoPx / escala;
  const pot = 10 ** Math.floor(Math.log10(crudo));
  for (const m of [1, 2, 5]) if (m * pot >= crudo - 1e-12) return m * pot;
  return 10 * pot;
}

export function decimalesPaso(paso) {
  return Math.max(0, -Math.floor(Math.log10(paso) + 1e-9));
}

// Número del eje sin errores de coma flotante: 0.30000000000000004 con paso 0,1 → "0,3"
export function formatoEje(valor, paso) {
  const dec = decimalesPaso(paso);
  const r = Number(valor.toFixed(dec));
  if (r === 0) return '0';
  return (r < 0 ? '−' : '') + Math.abs(r).toFixed(dec).replace('.', ',');
}

export function estaVisible(el, visibles) {
  return !el.grupo || visibles[el.grupo] !== false;
}

export class Plano {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cx = 0;
    this.cy = 0;
    this.escala = 40;
    this.escena = null;
    this.visibles = { ...VISIBLES_POR_DEFECTO };
    this.ancho = 0;
    this.alto = 0;
    this.dpr = 1;
    this.punteros = new Map();
    this.gesto = null;
    this.pendiente = false;
    this.porEncuadrar = null;
    this._eventos();
    this.observador = new ResizeObserver(() => this._medir());
    this.observador.observe(canvas);
    this._medir();
  }

  // ---------- Coordenadas ----------

  aPantalla(x, y) {
    return [this.ancho / 2 + (x - this.cx) * this.escala, this.alto / 2 - (y - this.cy) * this.escala];
  }

  aMundo(px, py) {
    return [this.cx + (px - this.ancho / 2) / this.escala, this.cy - (py - this.alto / 2) / this.escala];
  }

  vista() {
    const [xmin, ymax] = this.aMundo(0, 0);
    const [xmax, ymin] = this.aMundo(this.ancho, this.alto);
    return { xmin, xmax, ymin, ymax, escala: this.escala };
  }

  // ---------- Acciones ----------

  dibujar(escena, visibles) {
    if (escena !== undefined) this.escena = escena;
    if (visibles) this.visibles = { ...VISIBLES_POR_DEFECTO, ...visibles };
    this.pedirDibujo();
  }

  zoom(factor, px = this.ancho / 2, py = this.alto / 2) {
    const [wx, wy] = this.aMundo(px, py);
    this.escala = Math.min(1e6, Math.max(1e-4, this.escala * factor));
    this.cx = wx - (px - this.ancho / 2) / this.escala;
    this.cy = wy + (py - this.alto / 2) / this.escala;
    this.pedirDibujo();
  }

  mover(dxPx, dyPx) {
    this.cx -= dxPx / this.escala;
    this.cy += dyPx / this.escala;
    this.pedirDibujo();
  }

  encuadrar(puntos = this.escena?.encuadre) {
    const validos = (puntos ?? []).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
    if (!this.ancho || !this.alto) {
      this.porEncuadrar = validos;
      return;
    }
    this.porEncuadrar = null;
    if (!validos.length) {
      this.cx = 0;
      this.cy = 0;
      this.escala = 40;
      this.pedirDibujo();
      return;
    }
    let xmin = Math.min(...validos.map((p) => p[0]));
    let xmax = Math.max(...validos.map((p) => p[0]));
    let ymin = Math.min(...validos.map((p) => p[1]));
    let ymax = Math.max(...validos.map((p) => p[1]));
    // Incluir el origen si está cerca de la cónica, para que se vean los ejes.
    const tam = Math.max(xmax - xmin, ymax - ymin, 1e-9) * 0.5;
    if (xmin - tam <= 0 && xmax + tam >= 0 && ymin - tam <= 0 && ymax + tam >= 0) {
      xmin = Math.min(xmin, 0);
      xmax = Math.max(xmax, 0);
      ymin = Math.min(ymin, 0);
      ymax = Math.max(ymax, 0);
    }
    let anchoM = xmax - xmin;
    let altoM = ymax - ymin;
    if (anchoM < 1e-9 && altoM < 1e-9) {
      anchoM = 4;
      altoM = 4;
    }
    const margen = 1.3;
    const ex = anchoM > 1e-9 ? this.ancho / (anchoM * margen) : Infinity;
    const ey = altoM > 1e-9 ? this.alto / (altoM * margen) : Infinity;
    this.escala = Math.min(1e6, Math.max(1e-4, Math.min(ex, ey)));
    this.cx = (xmin + xmax) / 2;
    this.cy = (ymin + ymax) / 2;
    this.pedirDibujo();
  }

  // ¿Algún punto de la lista cae dentro de la vista?
  contiene(puntos) {
    const v = this.vista();
    return (puntos ?? []).some((p) => p[0] >= v.xmin && p[0] <= v.xmax && p[1] >= v.ymin && p[1] <= v.ymax);
  }

  pedirDibujo() {
    if (this.pendiente) return;
    this.pendiente = true;
    requestAnimationFrame(() => {
      this.pendiente = false;
      this._render();
    });
  }

  // ---------- Tamaño ----------

  _medir() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(r.width);
    const h = Math.round(r.height);
    if (w === this.ancho && h === this.alto && dpr === this.dpr) return;
    this.ancho = w;
    this.alto = h;
    this.dpr = dpr;
    if (!w || !h) return;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    if (this.porEncuadrar) this.encuadrar(this.porEncuadrar);
    this._render();
  }

  // ---------- Eventos ----------

  _pos(ev) {
    const r = this.canvas.getBoundingClientRect();
    return [ev.clientX - r.left, ev.clientY - r.top];
  }

  _eventos() {
    const c = this.canvas;
    c.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      c.setPointerCapture?.(ev.pointerId);
      this.punteros.set(ev.pointerId, this._pos(ev));
      this._iniciarGesto();
      ev.preventDefault();
    });
    c.addEventListener('pointermove', (ev) => {
      if (!this.punteros.has(ev.pointerId)) return;
      this.punteros.set(ev.pointerId, this._pos(ev));
      this._moverGesto();
    });
    const terminar = (ev) => {
      if (!this.punteros.delete(ev.pointerId)) return;
      this._iniciarGesto();
    };
    c.addEventListener('pointerup', terminar);
    c.addEventListener('pointercancel', terminar);
    c.addEventListener('lostpointercapture', terminar);
    c.addEventListener(
      'wheel',
      (ev) => {
        ev.preventDefault();
        const [px, py] = this._pos(ev);
        const paso = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY;
        this.zoom(Math.exp(-paso * 0.0015), px, py);
      },
      { passive: false },
    );
    c.addEventListener('dblclick', (ev) => {
      const [px, py] = this._pos(ev);
      this.zoom(ev.shiftKey ? 0.5 : 2, px, py);
    });
    c.addEventListener('keydown', (ev) => {
      const d = 40;
      const acciones = {
        ArrowLeft: () => this.mover(d, 0),
        ArrowRight: () => this.mover(-d, 0),
        ArrowUp: () => this.mover(0, d),
        ArrowDown: () => this.mover(0, -d),
        '+': () => this.zoom(1.25),
        '=': () => this.zoom(1.25),
        '-': () => this.zoom(0.8),
        '0': () => this.encuadrar(),
      };
      const f = acciones[ev.key];
      if (f) {
        ev.preventDefault();
        f();
      }
    });
    window.addEventListener('resize', () => this._medir());
  }

  _iniciarGesto() {
    const pts = [...this.punteros.values()];
    if (pts.length === 1) this.gesto = { tipo: 'mover', ultimo: pts[0] };
    else if (pts.length >= 2) {
      const [a, b] = pts;
      this.gesto = { tipo: 'pellizco', dist: Math.hypot(a[0] - b[0], a[1] - b[1]), medio: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
    } else this.gesto = null;
  }

  _moverGesto() {
    const pts = [...this.punteros.values()];
    const g = this.gesto;
    if (!g) return;
    if (g.tipo === 'mover' && pts.length === 1) {
      const p = pts[0];
      this.mover(p[0] - g.ultimo[0], p[1] - g.ultimo[1]);
      g.ultimo = p;
    } else if (g.tipo === 'pellizco' && pts.length >= 2) {
      const [a, b] = pts;
      const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const medio = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      this.mover(medio[0] - g.medio[0], medio[1] - g.medio[1]);
      if (g.dist > 0 && dist > 0) this.zoom(dist / g.dist, medio[0], medio[1]);
      g.dist = dist;
      g.medio = medio;
    }
  }

  // ---------- Dibujo ----------

  _render() {
    const { ctx, ancho: W, alto: H, dpr } = this;
    if (!W || !H) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COLORES.fondo;
    ctx.fillRect(0, 0, W, H);
    this._cuadricula();
    if (this.escena) this._escena();
  }

  _lineasCuadricula(paso, color) {
    const { ctx, ancho: W, alto: H } = this;
    const v = this.vista();
    if ((v.xmax - v.xmin) / paso > 1000 || (v.ymax - v.ymin) / paso > 1000) return;
    ctx.beginPath();
    for (let i = Math.ceil(v.xmin / paso); i <= Math.floor(v.xmax / paso); i++) {
      const sx = Math.round(this.aPantalla(i * paso, 0)[0]) + 0.5;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, H);
    }
    for (let i = Math.ceil(v.ymin / paso); i <= Math.floor(v.ymax / paso); i++) {
      const sy = Math.round(this.aPantalla(0, i * paso)[1]) + 0.5;
      ctx.moveTo(0, sy);
      ctx.lineTo(W, sy);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.stroke();
  }

  _texto(t, x, y, alineacion = 'center', base = 'top', fuente = FUENTE) {
    const { ctx } = this;
    ctx.font = fuente;
    ctx.textAlign = alineacion;
    ctx.textBaseline = base;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = COLORES.blanco;
    ctx.strokeText(t, x, y);
    ctx.fillStyle = COLORES.negro;
    ctx.fillText(t, x, y);
  }

  _cuadricula() {
    const { ctx, ancho: W, alto: H } = this;
    const paso = pasoCuadricula(this.escala);
    const mant = Math.round(paso / 10 ** Math.floor(Math.log10(paso) + 1e-9));
    const menor = paso / (mant === 2 ? 4 : 5);
    if (menor * this.escala >= 8) this._lineasCuadricula(menor, COLORES.cuadriculaMenor);
    this._lineasCuadricula(paso, COLORES.cuadricula);

    const [ox, oy] = this.aPantalla(0, 0);
    ctx.strokeStyle = COLORES.negro;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    if (ox >= 0 && ox <= W) {
      ctx.moveTo(Math.round(ox) + 0.5, 0);
      ctx.lineTo(Math.round(ox) + 0.5, H);
    }
    if (oy >= 0 && oy <= H) {
      ctx.moveTo(0, Math.round(oy) + 0.5);
      ctx.lineTo(W, Math.round(oy) + 0.5);
    }
    ctx.stroke();

    // Números de los ejes (si un eje sale de la vista, sus números quedan pegados al borde).
    const v = this.vista();
    const yNum = Math.min(Math.max(oy + 6, 4), H - 20);
    for (let i = Math.ceil(v.xmin / paso); i <= Math.floor(v.xmax / paso); i++) {
      if (i === 0) continue;
      const sx = this.aPantalla(i * paso, 0)[0];
      if (sx < 12 || sx > W - 12) continue;
      this._texto(formatoEje(i * paso, paso), sx, yNum);
    }
    ctx.font = FUENTE;
    const xNum = Math.min(Math.max(ox - 6, 40), W - 6);
    for (let i = Math.ceil(v.ymin / paso); i <= Math.floor(v.ymax / paso); i++) {
      if (i === 0) continue;
      const sy = this.aPantalla(0, i * paso)[1];
      if (sy < 10 || sy > H - 10) continue;
      this._texto(formatoEje(i * paso, paso), xNum, sy, 'right', 'middle');
    }
    if (ox >= 0 && ox <= W && oy >= 0 && oy <= H) this._texto('0', ox - 6, oy + 6, 'right', 'top');
  }

  _estiloLinea(tipo) {
    const e = ESTILOS_LINEA[tipo] ?? ESTILOS_LINEA['lado-recto'];
    const { ctx } = this;
    ctx.strokeStyle = e.color;
    ctx.lineWidth = e.ancho;
    ctx.setLineDash(e.guiones);
    ctx.lineCap = e.guiones.length && e.guiones[0] <= 2 ? 'round' : 'butt';
    ctx.lineJoin = 'round';
  }

  // Extremos en pantalla de una recta infinita que cruza la vista
  _extremosRecta(r) {
    const [dx, dy] = r.direccion;
    const largo = Math.hypot(dx, dy);
    if (!largo) return null;
    const ux = dx / largo;
    const uy = dy / largo;
    const v = this.vista();
    const mx = (v.xmin + v.xmax) / 2;
    const my = (v.ymin + v.ymax) / 2;
    const t0 = (mx - r.punto[0]) * ux + (my - r.punto[1]) * uy;
    const qx = r.punto[0] + t0 * ux;
    const qy = r.punto[1] + t0 * uy;
    const L = Math.hypot(v.xmax - v.xmin, v.ymax - v.ymin);
    return { a: this.aPantalla(qx - ux * L, qy - uy * L), b: this.aPantalla(qx + ux * L, qy + uy * L) };
  }

  // Posición en pantalla para la etiqueta de una recta: dentro de la vista, cerca del borde
  _posEtiquetaRecta(e) {
    const m = 28;
    const [ax, ay] = e.a;
    const [bx, by] = e.b;
    const dx = bx - ax;
    const dy = by - ay;
    let t0 = 0;
    let t1 = 1;
    for (const [p, d, min, max] of [[ax, dx, m, this.ancho - m], [ay, dy, m, this.alto - m]]) {
      if (Math.abs(d) < 1e-9) {
        if (p < min || p > max) return null;
        continue;
      }
      const ta = (min - p) / d;
      const tb = (max - p) / d;
      t0 = Math.max(t0, Math.min(ta, tb));
      t1 = Math.min(t1, Math.max(ta, tb));
    }
    if (t0 > t1) return null;
    // Cerca del borde inferior o izquierdo: arriba a la derecha están los botones de zoom.
    const t = t0 + 0.04 * (t1 - t0);
    return [ax + t * dx, ay + t * dy];
  }

  _escena() {
    const { ctx } = this;
    const e = this.escena;
    const vis = this.visibles;
    const v = this.vista();
    const etiquetas = [];

    for (const tipo of ORDEN_LINEAS) {
      for (const s of e.segmentos ?? []) {
        if (s.tipo !== tipo || !estaVisible(s, vis)) continue;
        this._estiloLinea(tipo);
        const [ax, ay] = this.aPantalla(...s.a);
        const [bx, by] = this.aPantalla(...s.b);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
      for (const r of e.rectas ?? []) {
        if (r.tipo !== tipo || !estaVisible(r, vis)) continue;
        const ext = this._extremosRecta(r);
        if (!ext) continue;
        this._estiloLinea(tipo);
        ctx.beginPath();
        ctx.moveTo(...ext.a);
        ctx.lineTo(...ext.b);
        ctx.stroke();
        if (r.etiqueta) {
          const pos = this._posEtiquetaRecta(ext);
          if (pos) etiquetas.push({ texto: r.etiqueta, x: pos[0], y: pos[1] });
        }
      }
      if (tipo === 'curva') {
        this._estiloLinea('curva');
        for (const c of e.curvas ?? []) {
          if (!estaVisible(c, vis)) continue;
          for (const linea of c.muestrear(v)) {
            if (linea.length < 2) continue;
            ctx.beginPath();
            linea.forEach(([x, y], i) => {
              const [sx, sy] = this.aPantalla(x, y);
              if (i === 0) ctx.moveTo(sx, sy);
              else ctx.lineTo(sx, sy);
            });
            ctx.stroke();
          }
        }
      }
    }

    ctx.setLineDash([]);
    for (const p of e.puntos ?? []) {
      if (!estaVisible(p, vis)) continue;
      const [sx, sy] = this.aPantalla(p.x, p.y);
      if (sx < -20 || sy < -20 || sx > this.ancho + 20 || sy > this.alto + 20) continue;
      this._punto(p.tipo, sx, sy);
      if (p.etiqueta) {
        const t = vis.coordenadas ? `${p.etiqueta.nombre}${p.etiqueta.coords}` : p.etiqueta.nombre;
        etiquetas.push({ texto: t, x: sx + 8, y: sy - 6, punto: true });
      }
    }

    this._etiquetas(etiquetas);
  }

  // Coloca cada etiqueta en la primera posición libre (arriba-derecha, abajo-derecha,
  // arriba-izquierda, abajo-izquierda) para que no se encimen.
  _etiquetas(etiquetas) {
    const { ctx } = this;
    ctx.font = FUENTE_ETIQUETA;
    const ocupadas = [];
    const alto = 16;
    const choca = (r) => ocupadas.some((o) => r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y);
    for (const et of etiquetas) {
      const w = ctx.measureText(et.texto).width + 4;
      const px = et.punto ? et.x - 8 : et.x;
      const py = et.punto ? et.y + 6 : et.y;
      const candidatas = [
        { x: px + 8, y: py - 6 - alto },
        { x: px + 8, y: py + 8 },
        { x: px - 8 - w, y: py - 6 - alto },
        { x: px - 8 - w, y: py + 8 },
      ].map((c) => ({
        x: Math.max(2, Math.min(this.ancho - w - 2, c.x)),
        y: Math.max(2, Math.min(this.alto - alto - 2, c.y)),
        w,
        h: alto,
      }));
      const r = candidatas.find((c) => !choca(c)) ?? candidatas[0];
      ocupadas.push(r);
      this._texto(et.texto, r.x + 2, r.y + alto, 'left', 'bottom', FUENTE_ETIQUETA);
    }
  }

  _punto(tipo, x, y) {
    const { ctx } = this;
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORES.negro;
    ctx.beginPath();
    if (tipo === 'centro') {
      ctx.fillStyle = COLORES.negro;
      ctx.fillRect(x - 5, y - 5, 10, 10);
      return;
    }
    if (tipo === 'vertice') {
      ctx.arc(x, y, 5.5, 0, 2 * Math.PI);
      ctx.fillStyle = COLORES.negro;
      ctx.fill();
      return;
    }
    if (tipo === 'dato') {
      ctx.lineWidth = 2.5;
      ctx.moveTo(x - 6, y - 6);
      ctx.lineTo(x + 6, y + 6);
      ctx.moveTo(x + 6, y - 6);
      ctx.lineTo(x - 6, y + 6);
      ctx.stroke();
      return;
    }
    if (tipo === 'corte') {
      ctx.moveTo(x, y - 7);
      ctx.lineTo(x + 7, y);
      ctx.lineTo(x, y + 7);
      ctx.lineTo(x - 7, y);
      ctx.closePath();
      ctx.fillStyle = COLORES.negro;
      ctx.fill();
      return;
    }
    if (tipo === 'foco') {
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = COLORES.blanco;
      ctx.fill();
      ctx.stroke();
      return;
    }
    ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = COLORES.negro;
    ctx.fill();
  }
}
