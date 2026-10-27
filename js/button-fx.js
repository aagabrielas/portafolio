/* Botones pixel: el relleno entra por el lado por donde llega el cursor y sale por el lado por donde se va.
   También copia el email al portapapeles. */
(() => {
  document.querySelectorAll('.btn-pixel').forEach((btn) => {
    const fill = btn.querySelector('.btn-pixel__fill');

    const side = (e) => {
      const r = btn.getBoundingClientRect();
      return e.clientX < r.left + r.width / 2 ? -101 : 101;
    };
    const enter = (from) => {
      fill.classList.add('is-reset');              // coloca el relleno en el lado de entrada sin animar
      fill.style.setProperty('--fx', `${from}%`);
      void fill.offsetWidth;
      fill.classList.remove('is-reset');
      fill.style.setProperty('--fx', '0%');
      btn.classList.add('is-active');
    };
    const leave = (to) => {
      fill.style.setProperty('--fx', `${to}%`);
      btn.classList.remove('is-active');
    };

    btn.addEventListener('pointerenter', (e) => enter(side(e)));
    btn.addEventListener('pointerleave', (e) => leave(side(e)));
    btn.addEventListener('focus', () => { if (btn.matches(':focus-visible')) enter(-101); });
    btn.addEventListener('blur', () => leave(101));
  });

  const copyBtn = document.querySelector('[data-copy]');
  if (!copyBtn) return;
  const label = copyBtn.querySelector('.btn-pixel__label');
  const status = document.getElementById('copy-status');
  const original = label.textContent;
  let timer;

  const done = (text, spoken) => {
    label.textContent = text;
    status.textContent = spoken;
    clearTimeout(timer);
    timer = setTimeout(() => { label.textContent = original; status.textContent = ''; }, 2500);
  };

  copyBtn.addEventListener('click', async () => {
    const email = copyBtn.dataset.copy;
    try {
      await navigator.clipboard.writeText(email);
      done('¡Copiado!', 'Email copiado al portapapeles');
    } catch {
      done(email, `No se pudo copiar. El email es ${email}`);   // plan B: mostrar la dirección
    }
  });
})();
