/**
 * WeightTitle — título cuyo peso tipográfico (wght) por letra depende de la
 * distancia al cursor. Requiere una fuente variable con eje wght.
 *
 *   new WeightTitle(h1, { text, restWeight: 700, nearWeight: 200, radius: 400 });
 *
 * Opciones (o data-text / data-rest-weight / data-near-weight / data-radius):
 *   text        texto completo (por defecto, el contenido del elemento)
 *   restWeight  peso en reposo
 *   nearWeight  peso con el cursor encima (falloff lineal hasta `radius`)
 *   radius      radio de influencia en px
 * Métodos: setText(text), destroy()
 */
class WeightTitle {
  constructor(el, opts = {}) {
    const d = el.dataset;
    this.el = el;
    this.text = opts.text ?? d.text ?? el.textContent.trim();
    this.rest = opts.restWeight ?? +(d.restWeight ?? 700);
    this.near = opts.nearWeight ?? +(d.nearWeight ?? 200);
    this.radius = opts.radius ?? +(d.radius ?? 400);

    this.hoverEnabled =
      !matchMedia('(hover: none), (pointer: coarse)').matches &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.chars = [];
    this.words = [];
    this.px = 0; this.py = 0;
    this.running = false;
    this.last = 0;

    this._onMove = e => { this.px = e.pageX; this.py = e.pageY; this._run(); };
    this._onLeave = () => { this.px = this.py = -1e5; this._run(); };
    this._onResize = () => { cancelAnimationFrame(this._rz); this._rz = requestAnimationFrame(() => this._layout()); };

    this._render();
    addEventListener('resize', this._onResize, { passive: true });
    if (this.hoverEnabled) {
      this.px = this.py = -1e5;
      addEventListener('pointermove', this._onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', this._onLeave);
    }
    document.fonts?.ready.then(() => this._layout());
  }

  setText(text) {
    this.text = text;
    this.el.classList.remove('is-in');
    this._render();
  }

  destroy() {
    removeEventListener('resize', this._onResize);
    removeEventListener('pointermove', this._onMove);
    document.documentElement.removeEventListener('pointerleave', this._onLeave);
    cancelAnimationFrame(this._raf);
  }

  _render() {
    const { el } = this;
    el.setAttribute('aria-label', this.text);
    el.textContent = '';
    this.chars = [];
    this.words = this.text.trim().split(/\s+/).map(w => {
      const word = document.createElement('span');
      word.className = 'wt-word';
      word.setAttribute('aria-hidden', 'true');
      for (const ch of w) {
        const c = document.createElement('span');
        c.className = 'wt-char';
        c.textContent = ch;
        c.style.transitionDelay = `${this.chars.length * 0.0175}s`;
        word.appendChild(c);
        this.chars.push({ el: c, cx: 0, cy: 0, cur: this.rest });
      }
      return word;
    });
    this._layout();
    void el.offsetWidth;                         // fija el estado inicial antes del reveal
    requestAnimationFrame(() => el.classList.add('is-in'));
  }

  /** Agrupa palabras en líneas (máscaras) según el ancho actual y mide centros. */
  _layout() {
    const { el } = this;
    el.textContent = '';
    const probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    this.words.forEach((w, i) => { if (i) probe.append(' '); probe.append(w); });
    el.append(probe);

    // Líneas fijadas con el peso en reposo, para que no se reacomoden al animar el peso.
    const groups = [];
    let top = null;
    for (const w of this.words) {
      if (top === null || Math.abs(w.offsetTop - top) > 2) { groups.push([]); top = w.offsetTop; }
      groups[groups.length - 1].push(w);
    }
    el.textContent = '';
    this.lines = groups.map(g => {
      const line = document.createElement('span');
      line.className = 'wt-line';
      line.setAttribute('aria-hidden', 'true');
      g.forEach((w, i) => { if (i) line.append(' '); line.append(w); });
      el.append(line);
      return { el: line, chars: g.flatMap(w => [...w.children]) };
    });

    // cy sale de la línea (sin transform), cx de cada letra.
    const sx = scrollX, sy = scrollY;
    for (const line of this.lines) {
      const lr = line.el.getBoundingClientRect();
      const cy = lr.top + lr.height / 2 + sy;
      for (const node of line.chars) {
        const c = this.chars.find(k => k.el === node);
        const r = node.getBoundingClientRect();
        c.cx = r.left + r.width / 2 + sx;
        c.cy = cy;
      }
    }
  }

  _run() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this._raf = requestAnimationFrame(t => this._tick(t));
  }

  _tick(now) {
    const dt = Math.min((now - this.last) / 1000, 0.1);
    this.last = now;
    const k = 1 - Math.exp(-dt / 0.12);          // ~0.4s hasta asentarse
    const lo = Math.min(this.rest, this.near), hi = Math.max(this.rest, this.near);
    let moving = false;
    for (const c of this.chars) {
      const dist = Math.hypot(this.px - c.cx, this.py - c.cy);
      const f = dist >= this.radius ? 0 : 1 - dist / this.radius;
      const target = Math.min(Math.max(this.rest + (this.near - this.rest) * f, lo), hi);
      const diff = target - c.cur;
      if (Math.abs(diff) > 0.1) { c.cur += diff * k; moving = true; } else c.cur = target;
      c.el.style.setProperty('--wght', c.cur.toFixed(1));
    }
    if (moving) this._raf = requestAnimationFrame(t => this._tick(t));
    else this.running = false;
  }
}
