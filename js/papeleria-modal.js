/* Ventana "Papelería creativa": pasa entre las agrupaciones de fotos con Anterior / Siguiente.
   Cada ventana de idioma trae sus páginas ([data-pp-page]); solo una está visible. Al abrir vuelve a la primera.
   La apertura, el arrastre y el cierre los maneja js/a11y-modal.js. */
(() => {
  const dialog = document.getElementById('papeleria-modal');
  if (!dialog) return;

  let win = null, pages = [], index = 0;

  const show = (i, focusNav) => {
    index = Math.min(Math.max(0, i), pages.length - 1);
    pages.forEach((p, n) => { p.hidden = n !== index; });

    // los adornos del título cambian con la página (tijeras / osito)
    const icons = pages[index].dataset.ppIcons;
    win.querySelectorAll('[data-pp-hero]').forEach((img) => { img.hidden = img.dataset.ppHero !== icons; });

    // aviso para lectores de pantalla: "Agenda viajera, 2 de 4"
    const status = win.querySelector('[data-pp-status]');
    status.textContent = `${pages[index].getAttribute('aria-label')}, ${index + 1} ${status.dataset.of} ${pages.length}`;

    win.querySelector('.a11y-modal__scroll').scrollTop = 0;
    // el botón pulsado queda oculto: el foco pasa al botón equivalente de la página nueva
    if (focusNav) (pages[index].querySelector(focusNav) || pages[index].querySelector('.pp-nav__btn'))?.focus();
  };

  dialog.addEventListener('modal:open', (e) => {
    win = e.detail;
    pages = [...win.querySelectorAll('[data-pp-page]')];
    show(0);
    win.querySelector('[data-pp-status]').textContent = '';
  });

  dialog.addEventListener('click', (e) => {
    if (e.target.closest('[data-pp-next]')) show(index + 1, '[data-pp-next]');
    else if (e.target.closest('[data-pp-prev]')) show(index - 1, '[data-pp-prev]');
  });
})();
