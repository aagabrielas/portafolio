/* Ventanas "Papelería creativa" e "Ilustraciones": pasan entre sus páginas con Anterior / Siguiente.
   Cada ventana de idioma trae sus páginas ([data-pp-page]); solo una está visible. Al abrir vuelve a la primera.
   La apertura, el arrastre y el cierre los maneja js/a11y-modal.js. */
document.querySelectorAll('dialog.papeleria-modal').forEach((dialog) => {
  let win = null, pages = [], index = 0;

  const show = (i, focusNav) => {
    index = Math.min(Math.max(0, i), pages.length - 1);
    pages.forEach((p, n) => { p.hidden = n !== index; });

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

  // las fotos no se pueden guardar con clic derecho ni arrastrándolas (solo disuade: no es una protección real)
  dialog.addEventListener('contextmenu', (e) => { if (e.target.closest('.pp-cell')) e.preventDefault(); });
  dialog.addEventListener('dragstart', (e) => { if (e.target.closest('.pp-cell')) e.preventDefault(); });

  dialog.addEventListener('click', (e) => {
    // en Ilustraciones, las miniaturas de los lados también avanzan / retroceden (los botones siguen siendo la vía accesible)
    if (e.target.closest('[data-pp-next], .il-side--next')) show(index + 1, '[data-pp-next]');
    else if (e.target.closest('[data-pp-prev], .il-side--prev')) show(index - 1, '[data-pp-prev]');
  });
});
