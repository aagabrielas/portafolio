/**
 * WeightTitle — al pasar el cursor, las letras cercanas cambian de peso.
 * Verdana solo tiene 400 y 700 (no es variable), así que el cambio es por letra:
 * dentro del radio pasan de `restWeight` a `nearWeight`.
 *
 *   new WeightTitle(h1, { restWeight: 700, nearWeight: 400, radius: 220 });
 */
class WeightTitle {
  constructor(el, opts = {}) {
    this.el = el;
    this.text = el.textContent.trim();
    this.rest = opts.restWeight ?? 700;
    this.near = opts.nearWeight ?? 400;
    this.radius = opts.radius ?? 220;
    this.px = this.py = -1e5;

    const root = document.documentElement;
    const enabled = () =>
      !matchMedia('(hover: none), (pointer: coarse)').matches &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches &&
      !root.classList.contains('pausar-animaciones');

    this._render();
    addEventListener('resize', () => { cancelAnimationFrame(this._rz); this._rz = requestAnimationFrame(() => this._layout()); }, { passive: true });
    addEventListener('pointermove', e => {
      if (!enabled()) return;
      this.px = e.pageX; this.py = e.pageY;
      this._update();
    }, { passive: true });
    root.addEventListener('pointerleave', () => { this.px = this.py = -1e5; this._update(); });
    document.fonts?.ready.then(() => this._layout());
  }

  _render() {
    this.el.setAttribute('aria-label', this.text);
    this.chars = [];
    this.words = this.text.split(/\s+/).map(w => {
      const word = document.createElement('span');
      word.className = 'wt-word';
      word.setAttribute('aria-hidden', 'true');
      for (const ch of w) {
        const c = document.createElement('span');
        c.className = 'wt-char';
        c.textContent = ch;
        word.appendChild(c);
        this.chars.push({ el: c, cx: 0, cy: 0, w: this.rest });
      }
      return word;
    });
    this._layout();
  }

  /** Agrupa palabras en líneas según el ancho actual (con peso en reposo) y mide los centros. */
  _layout() {
    const { el } = this;
    for (const c of this.chars) { c.w = this.rest; c.el.style.fontWeight = ''; }
    el.textContent = '';
    const probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    this.words.forEach((w, i) => { if (i) probe.append(' '); probe.append(w); });
    el.append(probe);

    const groups = [];
    let top = null;
    for (const w of this.words) {
      if (top === null || Math.abs(w.offsetTop - top) > 2) { groups.push([]); top = w.offsetTop; }
      groups[groups.length - 1].push(w);
    }
    el.textContent = '';
    const lines = groups.map(g => {
      const line = document.createElement('span');
      line.className = 'wt-line';
      line.setAttribute('aria-hidden', 'true');
      g.forEach((w, i) => { if (i) line.append(' '); line.append(w); });
      el.append(line);
      return { el: line, words: g };
    });

    const sx = scrollX, sy = scrollY;
    for (const line of lines) {
      const lr = line.el.getBoundingClientRect();
      const cy = lr.top + lr.height / 2 + sy;
      for (const word of line.words) {
        for (const node of word.children) {
          const c = this.chars.find(k => k.el === node);
          const r = node.getBoundingClientRect();
          c.cx = r.left + r.width / 2 + sx;
          c.cy = cy;
        }
      }
    }
  }

  _update() {
    if (this._pending) return;
    this._pending = requestAnimationFrame(() => {
      this._pending = 0;
      for (const c of this.chars) {
        const w = Math.hypot(this.px - c.cx, this.py - c.cy) < this.radius ? this.near : this.rest;
        if (w !== c.w) { c.w = w; c.el.style.fontWeight = w; }
      }
    });
  }
}
