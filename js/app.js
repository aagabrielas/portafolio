/* Humo de fondo + pausa global de animaciones. */
(() => {
  const root = document.documentElement;
  const pauseBtn = document.getElementById('pause');
  const canvas = document.getElementById('smoke');
  const KEY = 'pausar-animaciones';

  const read = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
  const write = (v) => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* sin almacenamiento */ } };

  // Los GIF no se pausan con CSS: al pausar (o con movimiento reducido) se cambian por su primer cuadro.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const gifs = [...document.querySelectorAll('img[src$=".gif"]')].map((img) => ({ img, src: img.src, still: null, frozen: false }));
  const freezeGifs = (freeze) => gifs.forEach((g) => {
    if (!g.still || g.frozen === freeze) return;
    g.frozen = freeze;
    g.img.src = freeze ? g.still : g.src;
  });
  gifs.forEach((g) => {
    const capture = () => {
      if (g.still || !g.img.naturalWidth) return;
      const c = document.createElement('canvas');
      c.width = g.img.naturalWidth; c.height = g.img.naturalHeight;
      c.getContext('2d').drawImage(g.img, 0, 0);
      g.still = c.toDataURL('image/png');
      freezeGifs(root.classList.contains('pausar-animaciones') || reduced.matches);
    };
    if (g.img.complete) capture(); else g.img.addEventListener('load', capture, { once: true });
  });

  // Los videos decorativos (banner Netia, footer, créditos) se pausan igual que los GIF.
  // Los marcados con data-lazy (créditos, bajo el fold) no cargan ni arrancan hasta acercarse a la pantalla.
  const videos = [...document.querySelectorAll('video')];
  const play = (v) => v.play().catch(() => { /* el navegador bloqueó el autoplay */ });
  const freezeVideos = (freeze) => videos.forEach((v) => {
    if (freeze) v.pause();
    else if (!v.hasAttribute('data-lazy') || v.dataset.visible) play(v);
  });
  const lazyVideos = videos.filter((v) => v.hasAttribute('data-lazy'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.dataset.visible = '1';
      if (!root.classList.contains('pausar-animaciones') && !reduced.matches) play(e.target);
    }), { rootMargin: '200px' });
    lazyVideos.forEach((v) => io.observe(v));
  } else {
    lazyVideos.forEach((v) => { v.dataset.visible = '1'; });
  }

  let smoke = null;
  const apply = (paused) => {
    root.classList.toggle('pausar-animaciones', paused);
    pauseBtn.setAttribute('aria-pressed', String(paused));
    if (smoke) smoke.setPaused(paused);
    freezeGifs(paused || reduced.matches);
    freezeVideos(paused || reduced.matches);
  };
  reduced.addEventListener('change', () => apply(root.classList.contains('pausar-animaciones')));

  const start = () => {
    // fondo más gris y con más contraste que los valores por defecto (grayBase 0.34, grayDim 0.2)
    smoke = new GlitterSmoke(canvas, { paused: read(), grayBase: 0.6, grayDim: 0.45 });
  };
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 800 });
  else setTimeout(start, 200);

  apply(read());
  pauseBtn.addEventListener('click', () => {
    const next = !root.classList.contains('pausar-animaciones');
    write(next);
    apply(next);
  });
})();
