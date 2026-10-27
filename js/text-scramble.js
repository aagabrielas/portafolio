/* Hover/foco en text links: cada letra se vuelve un símbolo al azar (naranja) y se
   resuelve de izquierda a derecha hasta volver a la palabra. Respeta la pausa y
   prefers-reduced-motion. */
(() => {
  const SELECTOR = 'a:not(.btn-pixel):not(.skip-link), .btn-link';
  const GLYPHS = '{}[]<>^/\\|*+=~#@%&?!;:0123456789';
  const TICK = 35;        // ms entre cambios de símbolo
  const SETTLE = 40;      // ms entre un grupo de letras resuelto y el siguiente
  const GROUP = 2;        // letras que se resuelven a la vez
  const BASE = 60;        // ms antes de resolver el primer grupo
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const rand = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

  const attach = (el) => {
    let raf = 0;
    let text = '';

    const restore = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (!text) return;
      el.textContent = text;
      el.removeAttribute('aria-label');
      el.style.minInlineSize = '';
      text = '';
    };

    const run = () => {
      if (raf || reduced.matches || root.classList.contains('pausar-animaciones')) return;
      text = el.textContent;
      if (!text.trim()) { text = ''; return; }
      const chars = [...text];
      const width = el.getBoundingClientRect().width;
      el.setAttribute('aria-label', text);
      el.style.minInlineSize = `${width}px`;
      el.textContent = '';

      // cada letra en su caja del ancho original, para que el link no salte
      const spans = chars.map((ch) => {
        const s = document.createElement('span');
        s.setAttribute('aria-hidden', 'true');
        s.textContent = ch;
        el.append(s);
        return s;
      });
      spans.forEach((s) => {
        if (s.textContent === ' ') return;
        // el inline-block no hereda el subrayado del link, así que lo repite
        s.style.cssText = `display:inline-block;text-align:center;text-decoration:underline;text-underline-offset:0.2em;inline-size:${s.getBoundingClientRect().width}px`;
      });

      const start = performance.now();
      let last = -TICK;
      const frame = (now) => {
        const t = now - start;
        let pending = 0;
        spans.forEach((s, i) => {
          if (chars[i] === ' ') return;
          if (t >= BASE + Math.floor(i / GROUP) * SETTLE) {
            if (s.textContent !== chars[i]) s.textContent = chars[i];
            s.style.color = '';
          } else {
            pending++;
            if (t - last >= TICK) s.textContent = rand();
            s.style.color = 'var(--orange)';
          }
        });
        if (t - last >= TICK) last = t;
        if (pending) raf = requestAnimationFrame(frame);
        else restore();
      };
      raf = requestAnimationFrame(frame);
    };

    el.addEventListener('mouseenter', run);
    el.addEventListener('focus', () => { if (el.matches(':focus-visible')) run(); });
    el.addEventListener('mouseleave', restore);
    el.addEventListener('blur', restore);
  };

  document.querySelectorAll(SELECTOR).forEach(attach);
})();
