/* Botón del logo de Gmail: copia el email al portapapeles y lo avisa por texto y a lectores de pantalla.
   Sin avisos, el botón muestra solo el logo; el texto "Copiar email" es solo para lectores de pantalla. */
(() => {
  const copyBtn = document.querySelector('[data-copy]');
  if (!copyBtn) return;
  const label = copyBtn.querySelector('.win-btn__label');
  const status = document.getElementById('copy-status');
  const original = label.textContent;
  let timer;

  const done = (text, spoken) => {
    label.textContent = text;
    label.classList.remove('visually-hidden');      // el aviso reemplaza al logo unos segundos
    copyBtn.classList.add('is-feedback');
    status.textContent = spoken;
    clearTimeout(timer);
    timer = setTimeout(() => {
      label.textContent = original;
      label.classList.add('visually-hidden');
      copyBtn.classList.remove('is-feedback');
      status.textContent = '';
    }, 2500);
  };

  copyBtn.addEventListener('click', async () => {
    const email = copyBtn.dataset.copy;
    try {
      await navigator.clipboard.writeText(email);
      done('¡Copiado!', 'Email copiado al portapapeles');
    } catch {
      done('Ver abajo', `No se pudo copiar. El email es ${email}`);
      status.classList.remove('visually-hidden');   // plan B: mostrar la dirección a la vista
      setTimeout(() => status.classList.add('visually-hidden'), 2500);
    }
  });
})();
