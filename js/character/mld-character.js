// <mld-character scale="2.5" scale-sm="2"></mld-character>
// Pixel art 100% CSS (box-shadow), sin opacidades. Requiere window.MLD_SPRITE (sprite-data.js, cargar antes).
// Ciclo: camina 3–5 s → saluda 2 s (pose "happy") → se queda parada y parpadea 5–8 s → camina…
// Hover: se detiene y mira de frente. Click: corazones.
// Atributos: scale (px por pixel, admite decimales), scale-sm (en ≤40rem, por defecto 80% de scale), range (tope de recorrido en pixeles-sprite).
// Queda quieta con prefers-reduced-motion o con .pausar-animaciones en <html>.
const MLD_STYLE = `
:host { display: block; position: relative; width: 100%; pointer-events: none; image-rendering: pixelated; }
.mover { position: absolute; bottom: 0; left: 0; }
.char { position: relative; cursor: pointer; pointer-events: auto; }
.layer { position: absolute; }
.dot { position: absolute; left: calc(var(--d) * -1); top: 0; width: var(--d); height: var(--d); }
.heart { position: absolute; }
.heart .layer { left: 0; top: 0; visibility: hidden; }
@keyframes mldRise { from { transform: translate(0, 0); } to { transform: translate(calc(var(--r) * var(--dx)), calc(var(--r) * -22)); } }
@keyframes mldF0 { 0% { visibility: visible; } 55%, 100% { visibility: hidden; } }
@keyframes mldF1 { 0%, 54% { visibility: hidden; } 55% { visibility: visible; } 80%, 100% { visibility: hidden; } }
@keyframes mldF2 { 0%, 79% { visibility: hidden; } 80% { visibility: visible; } 99%, 100% { visibility: hidden; } }
`;
const rand = (a, b) => a + Math.random() * (b - a);

class MldCharacter extends HTMLElement {
  static get observedAttributes() { return ['scale', 'scale-sm', 'range']; }

  connectedCallback() {
    this.mode = 'walk'; this.f = 0; this.x = 0; this.heading = 1; this.happy = false; this.eyes = 'open'; this.held = false;
    this.cache = new Map(); this.timers = new Set();
    this.root = this.shadowRoot || this.attachShadow({ mode: 'open' });
    this.root.innerHTML = '<style>' + MLD_STYLE + '</style><div class="mover"><div class="char"><div class="layer body"><div class="dot"></div></div></div></div>';
    this.mover = this.root.querySelector('.mover');
    this.char = this.root.querySelector('.char');
    this.body = this.root.querySelector('.body');
    this.char.addEventListener('click', () => this.poke());
    this.char.addEventListener('pointerenter', () => this.hold(true));
    this.char.addEventListener('pointerleave', () => this.hold(false));
    // en táctil no hay "leave": se suelta sola poco después del toque
    this.char.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') { clearTimeout(this.rt); this.rt = setTimeout(() => this.hold(false), 500); } });

    this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
    this.small = matchMedia('(max-width: 640px)');
    this.onMedia = () => { this.render(); this.syncStill(); };
    this.reduced.addEventListener('change', this.onMedia);
    this.small.addEventListener('change', this.onMedia);
    this.mo = new MutationObserver(() => this.syncStill());
    this.mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    this.ro = new ResizeObserver(() => this.render());
    this.ro.observe(this);

    this.render();
    this.syncStill(true);
  }
  disconnectedCallback() {
    this.clearCycle(); clearTimeout(this.ht); clearTimeout(this.bt); clearTimeout(this.rt); clearTimeout(this.lt);
    this.timers.forEach(clearTimeout);
    this.reduced.removeEventListener('change', this.onMedia);
    this.small.removeEventListener('change', this.onMedia);
    this.mo.disconnect(); this.ro.disconnect();
  }
  attributeChangedCallback() { if (this.root) this.render(); }

  get u() {
    const big = Math.max(1, parseFloat(this.getAttribute('scale') || '6'));
    const sm = parseFloat(this.getAttribute('scale-sm') || '') || Math.max(1, big * 0.8);
    return this.small && this.small.matches ? sm : big;
  }
  get still() { return this.reduced.matches || document.documentElement.classList.contains('pausar-animaciones'); }

  // --- ciclo: caminar → saludar → descansar → caminar ---
  clearCycle() { clearTimeout(this.wt); clearTimeout(this.gt); }
  syncStill(first) {
    if (this.still) {
      this.clearCycle(); clearTimeout(this.bt);
      this.mode = 'still'; this.x = 0; this.render();
    } else if (this.mode === 'still' || first) {
      this.held ? this.hold(true) : this.startWalk();
      this.scheduleBlink();
    }
  }
  startWalk() {
    this.clearCycle(); this.mode = 'walk'; this.render();
    this.step();
    this.gt = setTimeout(() => this.startGreet(), rand(3000, 5000));
  }
  startGreet() {
    this.clearCycle(); this.mode = 'greet'; this.render();
    this.gt = setTimeout(() => this.startRest(), 2000);
  }
  startRest() {
    this.clearCycle(); this.mode = 'rest'; this.render();
    this.gt = setTimeout(() => this.startWalk(), rand(5000, 8000));
  }
  step() {
    this.wt = setTimeout(() => {
      const nx = this.x + this.heading * (window.MLD_SPRITE.walkStep || 3);
      if (Math.abs(nx) > this.lim) this.heading = -this.heading; else this.x = nx;
      this.f++;
      this.render();
      this.step();
    }, 160);
  }
  // hover/toque: se queda de frente y quieta; al soltar retoma el ciclo
  hold(on) {
    if (this.still) return;
    this.held = on;
    clearTimeout(this.lt);
    if (on) { this.clearCycle(); this.mode = 'hold'; this.render(); }
    // al soltar espera 2 s de frente antes de volver a caminar
    else if (this.mode === 'hold') this.lt = setTimeout(() => { if (this.mode === 'hold') this.startWalk(); }, 2000);
  }
  scheduleBlink() {
    clearTimeout(this.bt);
    this.bt = setTimeout(() => {
      if (this.still) return;
      const twice = Math.random() < 0.25, shut = v => { this.eyes = v; this.render(); };
      shut('closed');
      this.bt = setTimeout(() => {
        shut('open');
        if (twice) this.bt = setTimeout(() => { shut('closed'); this.bt = setTimeout(() => { shut('open'); this.scheduleBlink(); }, 130); }, 160);
        else this.scheduleBlink();
      }, 140);
    }, rand(2200, 4400));
  }

  // --- click: corazones ---
  poke() {
    const S = window.MLD_SPRITE, u = this.u, d = Math.ceil(u);
    this.happy = true; this.render();
    clearTimeout(this.ht);
    this.ht = setTimeout(() => { this.happy = false; this.render(); }, 700);
    if (this.still) return;
    const n = 3 + Math.floor(Math.random() * 3), mine = [];
    for (let i = 0; i < n; i++) {
      const b = { x: 6 + Math.floor(Math.random() * 28), y: 4 + Math.floor(Math.random() * 10), dx: Math.floor(Math.random() * 9) - 4, dur: 900 + Math.floor(Math.random() * 500), delay: i * 90 };
      const el = document.createElement('div');
      el.className = 'heart';
      el.style.cssText = 'left:' + Math.round(b.x * u) + 'px;top:' + Math.round(b.y * u) + 'px;width:' + Math.round(S.miniHeart[0].length * u) + 'px;height:' + Math.round(S.miniHeart.length * u) + 'px;--dx:' + b.dx + ';--r:' + Math.round(u) + 'px;animation:mldRise ' + b.dur + 'ms steps(11) ' + b.delay + 'ms both';
      [0, 1, 2].forEach(k => {
        const l = this.layer(S.miniHeart, { ...S.palette, ...S.miniFade[k] }, u);
        l.style.animation = 'mldF' + k + ' ' + b.dur + 'ms step-end ' + b.delay + 'ms both';
        el.appendChild(l);
      });
      this.char.appendChild(el); mine.push(el);
    }
    const t = setTimeout(() => { mine.forEach(e => e.remove()); this.timers.delete(t); }, 1700);
    this.timers.add(t);
  }

  // --- dibujo ---
  // Escala admite decimales: cada pixel se coloca en round(i*u) y se pinta de ceil(u) de lado. Se apila de abajo-derecha
  // hacia arriba-izquierda para que el vecino tape el pixel que sobra: sin costuras y sin suavizado.
  shadow(rows, pal, u, flip) {
    const d = Math.ceil(u), out = [];
    for (let y = rows.length - 1; y >= 0; y--) {
      const r = flip ? [...rows[y]].reverse().join('') : rows[y];
      for (let x = r.length - 1; x >= 0; x--) if (r[x] !== '.') out.push((Math.round(x * u) + d) + 'px ' + Math.round(y * u) + 'px 0 0 ' + pal[r[x]]);
    }
    return out.join(',');
  }
  layer(rows, pal, u) {
    const w = document.createElement('div'), p = document.createElement('div');
    w.className = 'layer'; w.style.cssText = 'width:' + Math.round(rows[0].length * u) + 'px;height:' + Math.round(rows.length * u) + 'px';
    p.className = 'dot'; p.style.cssText = '--d:' + Math.ceil(u) + 'px;box-shadow:' + this.shadow(rows, pal, u);
    w.appendChild(p); return w;
  }
  pose() {
    const P = window.MLD_SPRITE.poses;
    if (this.happy || this.mode === 'greet') return ['happy', 0];
    if (this.mode === 'walk') return ['walk', this.f % P.walk.length];
    return [this.eyes === 'closed' && this.mode === 'rest' ? 'blink' : 'idle', 0];
  }
  render() {
    const S = window.MLD_SPRITE;
    if (!S || !this.root) return;
    const idleRows = S.poses.idle[0].length, walkRows = S.poses.walk[0].length;
    const u = this.u, [name, i] = this.pose(), rows = S.poses[name][i], walking = name === 'walk';
    // el perfil está dibujado en menos pixeles: se escala para que mida lo mismo de alto que el frente
    const s = walking ? u * idleRows / walkRows : u;
    const flip = walking && this.heading < 0;
    const w = Math.round(rows[0].length * s), h = Math.round(rows.length * s);
    const key = name + i + '@' + s.toFixed(3) + (flip ? 'f' : '');
    if (!this.cache.has(key)) this.cache.set(key, this.shadow(rows, S.palette, s, flip));

    const walkW = Math.round(S.poses.walk[0][0].length * idleRows / walkRows * u);
    this.lim = Math.max(0, Math.floor((this.clientWidth - walkW) / 2 / u));
    const cap = parseInt(this.getAttribute('range') || '', 10);
    if (cap > 0) this.lim = Math.min(cap, this.lim);
    if (Math.abs(this.x) > this.lim) this.x = Math.sign(this.x) * this.lim;

    this.style.height = Math.round(idleRows * u) + 'px';
    // posición en pixeles enteros: nada de -50% (media coordenada = costuras entre pixeles)
    this.mover.style.left = Math.round((this.clientWidth - w) / 2 + this.x * u) + 'px';
    this.char.style.cssText = 'width:' + w + 'px;height:' + h + 'px';
    this.body.style.cssText = 'left:0;top:0;width:' + w + 'px;height:' + h + 'px';
    this.body.firstChild.style.cssText = '--d:' + Math.ceil(s) + 'px;box-shadow:' + this.cache.get(key);
  }
}
customElements.define('mld-character', MldCharacter);
