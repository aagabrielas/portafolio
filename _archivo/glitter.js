/**
 * Glitter — fondo de glitter lila en canvas 2D (basado en Glitter Lila.html).
 * Grano animado por fotogramas + destellos que parpadean.
 *
 *   const g = new Glitter(canvas, { density, grainFrames, grainFps, colors, base });
 *   g.destroy();
 *
 * Se adapta al tamaño del canvas, se pausa si no se ve y, con prefers-reduced-motion,
 * dibuja un solo fotograma.
 */
class Glitter {
  static DEFAULTS = {
    density: 1 / 180,       // destellos por px²
    grainFrames: 6,         // fotogramas de grano (brillo tipo gif)
    grainFps: 14,
    base: '#6a3fc6',
    colors: ['#ffffff', '#ffffff', '#e9dcff', '#9ff3ff', '#7fe8ff', '#ff9be8', '#f5a8ff', '#a8ffcf', '#c7b8ff'],
  };

  constructor(canvas, opts = {}) {
    this.cv = canvas;
    this.cfg = { ...Glitter.DEFAULTS, ...opts };
    this.ctx = canvas.getContext('2d');
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.visible = true;
    this.running = false;
    this.raf = 0;
    this.t0 = performance.now();

    this._makeGrain();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(canvas);
    this._io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; this._sync(); });
    this._io.observe(canvas);
    this._vis = () => this._sync();
    document.addEventListener('visibilitychange', this._vis);
    this._resize();
  }

  _makeGrain() {
    const S = 256;
    this.grain = [];
    for (let f = 0; f < this.cfg.grainFrames; f++) {
      const c = document.createElement('canvas');
      c.width = c.height = S;
      const g = c.getContext('2d');
      const img = g.createImageData(S, S), d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = Math.random();
        if (r < 0.10) {                          // mota de color
          const t = Math.random();
          if (t < 0.35) { d[i] = 255; d[i + 1] = 170; d[i + 2] = 245; }
          else if (t < 0.65) { d[i] = 150; d[i + 1] = 235; d[i + 2] = 255; }
          else if (t < 0.8) { d[i] = 170; d[i + 1] = 255; d[i + 2] = 200; }
          else { d[i] = d[i + 1] = d[i + 2] = 255; }
          d[i + 3] = 40 + Math.random() * 120;
        } else if (r < 0.35) {                   // oscuro
          d[i] = 60; d[i + 1] = 20; d[i + 2] = 140; d[i + 3] = 30 + Math.random() * 50;
        }
      }
      g.putImageData(img, 0, 0);
      this.grain.push(this.ctx.createPattern(c, 'repeat'));
    }
  }

  _makeBg() {
    const { W, H } = this;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = this.cfg.base; g.fillRect(0, 0, W, H);
    const rg = g.createRadialGradient(W * .48, H * .48, 0, W * .48, H * .48, Math.max(W, H) * .65);
    rg.addColorStop(0, 'rgba(140,140,240,.75)');
    rg.addColorStop(.45, 'rgba(125,95,225,.45)');
    rg.addColorStop(1, 'rgba(95,40,185,0)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
    this.bg = c;
  }

  _makeSparks() {
    const { W, H, cfg } = this;
    const n = Math.round(W * H * cfg.density);
    this.sparks = Array.from({ length: n }, () => {
      const big = Math.random() < 0.06;
      return {
        x: Math.random() * W, y: Math.random() * H,
        c: cfg.colors[Math.random() * cfg.colors.length | 0],
        s: big ? 1.6 + Math.random() * 1.6 : 0.6 + Math.random() * 1.1,
        big,
        ph: Math.random() * Math.PI * 2,
        sp: 1.5 + Math.random() * 4.5,
      };
    });
  }

  _resize() {
    const { cv } = this;
    const W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.W = W; this.H = H;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._makeBg(); this._makeSparks();
    if (this.reduced) this._draw(1);              // un solo fotograma estático
    else this._sync();
  }

  _sync() {
    const go = !this.reduced && this.visible && !document.hidden && !this.dead;
    if (go && !this.running) { this.running = true; this.raf = requestAnimationFrame(t => this._frame(t)); }
    else if (!go) { this.running = false; cancelAnimationFrame(this.raf); }
  }

  _frame(now) {
    if (!this.running) return;
    this._draw((now - this.t0) / 1000);
    this.raf = requestAnimationFrame(t => this._frame(t));
  }

  _draw(t) {
    const { ctx, W, H, cfg } = this;
    if (!this.bg) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.drawImage(this.bg, 0, 0, W, H);
    ctx.fillStyle = this.grain[Math.floor(t * cfg.grainFps) % this.grain.length];
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.sparks) {
      let a = Math.sin(t * p.sp + p.ph);
      a = a > 0 ? Math.pow(a, 3) : 0;
      if (a < 0.03) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.c;
      if (p.big) {
        const r = p.s * (2.5 + a * 3);
        ctx.fillRect(p.x - r, p.y - .5, r * 2, 1);
        ctx.fillRect(p.x - .5, p.y - r, 1, r * 2);
        ctx.globalAlpha = a * .35;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 2.2, 0, 6.283); ctx.fill();
        ctx.globalAlpha = a;
        ctx.fillStyle = '#fff';
        ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      } else {
        ctx.fillRect(p.x, p.y, p.s, p.s);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  destroy() {
    this.dead = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this._ro.disconnect();
    this._io.disconnect();
    document.removeEventListener('visibilitychange', this._vis);
  }
}
