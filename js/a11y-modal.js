/* Ventana "Accesibilidad del sitio": se abre como modal desde los enlaces [data-a11y-open]
   y se puede arrastrar desde su barra de título. Sin JS (o sin <dialog>) esos enlaces
   siguen llevando a la página accesibilidad/. */
(() => {
  const dialog = document.getElementById('a11y-modal');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const triggers = document.querySelectorAll('[data-a11y-open]');
  const scroller = dialog.querySelector('.a11y-modal__scroll');
  const bar = dialog.querySelector('.a11y-modal__bar');

  triggers.forEach((t) => t.addEventListener('click', (e) => {
    e.preventDefault();
    if (dialog.open) return;
    dialog.showModal();
    keepInView();
    scroller.scrollTop = 0;
  }));

  dialog.querySelector('[data-a11y-close]').addEventListener('click', () => dialog.close());
  // clic en el fondo oscuro (fuera de la ventana)
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  // --- arrastre ---
  // Al primer arrastre se pasa de "centrado con margin: auto" a left/top en px; la posición se recuerda mientras no se recargue.
  let moved = false;
  const place = (left, top) => {
    const maxL = Math.max(0, innerWidth - dialog.offsetWidth);
    const maxT = Math.max(0, innerHeight - dialog.offsetHeight);
    dialog.style.left = Math.min(Math.max(0, left), maxL) + 'px';
    dialog.style.top = Math.min(Math.max(0, top), maxT) + 'px';
  };
  function keepInView() {
    if (!moved) return;
    const r = dialog.getBoundingClientRect();
    place(r.left, r.top);
  }
  addEventListener('resize', () => { if (dialog.open) keepInView(); });

  bar.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    const r = dialog.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    if (!moved) {
      moved = true;
      dialog.style.margin = '0';
      dialog.style.inset = 'auto';
      dialog.style.position = 'fixed';
    }
    place(r.left, r.top);
    dialog.classList.add('is-dragging');
    bar.setPointerCapture(e.pointerId);

    const move = (ev) => place(ev.clientX - dx, ev.clientY - dy);
    const end = () => {
      dialog.classList.remove('is-dragging');
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', end);
      bar.removeEventListener('pointercancel', end);
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
  });
})();
