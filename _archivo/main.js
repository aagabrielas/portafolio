const CONTENT = {
  es: {
    title: 'Transformo lo complejo en productos que todas las personas puedan usar y disfrutar.',
    tags: ['Senior product designer', 'Design system', 'Accesibilidad'],
    projectsLabel: 'Proyectos',
    player: 'Reproductor música',
    playerUi: { song: 'Nombre de canción', artist: 'Artista', volUp: 'Subir volumen', volDown: 'Bajar volumen', prev: 'Anterior', next: 'Siguiente', toggle: 'Reproducir / pausar' },
    about: {
      styleTitle: 'Estilo',
      style: 'Me gustan los productos que se entienden a la primera, siguen estándares y funcionan para todas las personas. Y cuando el proyecto lo permite, les pongo personalidad: creo que lo serio y lo humano no se pelean.',
      expTitle: 'Experiencia',
      exp1: 'Llevo más de 7 años en el mundo UX, con buenos resultados (y sin IA ;]). Hoy soy product designer y antes fui design system specialist, así que diseño productos pensando en cómo escalan. He trabajado en salud, fintech y comercio mayorista, en apps B2B y B2C, y en inglés con equipos de desarrollo en el extranjero. Me especialicé en accesibilidad y la llevo a todo lo que diseño.',
      exp2: 'Con la IA, mi mundo se expandió y mis soluciones ahora vienen con esteroides. Sé qué delegarle, cómo apoyarme en ella y dónde poner mi foco: donde siempre estuvo, en las decisiones de experiencia.',
      lifeTitle: 'Más allá del trabajo',
      life: 'Soy mamá de un humano y un perrito. Juego videojuegos, me encantan los animales y me motivan los retos nuevos. Si algo me da curiosidad, lo más probable es que ya me haya inscrito a un curso: cocina, etología, protocolo y etiqueta, danza, piano…',
    },
    projects: [
      {
        title: 'Netia',
        tagline: '¿Y si tu precio te estuviera haciendo trabajar gratis?',
        desc: 'Las microemprendedoras incluyen siempre menos de 4 de las 12 cosas que cuesta hacer un producto, y la mayoría vendió sin ganancia sin darse cuenta. Netia les calcula el precio completo para que su negocio pueda crecer.',
        links: [{ label: 'Leer case study', href: '#' }, { label: 'Abrir app live', href: '#' }],
      },
      {
        title: 'Proyecto 2',
        tagline: 'Frase impactante sobre el proyecto para que le den click y hable de qué trata, qué resuelve y su impacto',
      },
    ],
    image: 'Imagen',
    contact: {
      lead: '¡Llegaste al final del scroll, así que algo te gustó! Escríbeme.',
      body: 'Hoy quizás tenga trabajo, pero soy curiosa por naturaleza: si tienes una propuesta, con gusto la leo.',
      email: 'Escríbeme',
    },
  },
  en: {
    title: 'I turn complexity into products that everyone can use and enjoy.',
    tags: ['Senior product designer', 'Design system', 'Accessibility'],
    projectsLabel: 'Projects',
    player: 'Music player',
    playerUi: { song: 'Song name', artist: 'Artist', volUp: 'Volume up', volDown: 'Volume down', prev: 'Previous', next: 'Next', toggle: 'Play / pause' },
    about: {
      styleTitle: 'Style',
      style: 'I like products that make sense at first glance, follow standards and work for everyone. And when the project allows it, I give them personality: I believe serious and human aren’t at odds.',
      expTitle: 'Experience',
      exp1: 'I’ve spent over 7 years in UX, with solid results (and no AI ;]). Today I’m a product designer, and before that I was a design system specialist, so I design products with scale in mind. I’ve worked in healthcare, fintech and wholesale, on B2B and B2C apps, and in English with development teams abroad. I specialized in accessibility and bring it to everything I design.',
      exp2: 'With AI, my world expanded and my solutions now come on steroids. I know what to delegate, how to lean on it and where to keep my focus: where it has always been, on experience decisions.',
      lifeTitle: 'Beyond work',
      life: 'I’m a mom to one human and one puppy. I play video games, love animals and get motivated by new challenges. If something makes me curious, I’ve most likely already signed up for a course: cooking, ethology, protocol and etiquette, dance, piano…',
    },
    projects: [
      {
        title: 'Netia',
        tagline: 'What if your pricing were making you work for free?',
        desc: 'Micro-entrepreneurs usually account for fewer than 4 of the 12 things it costs to make a product, and most sold at a loss without realizing it. Netia calculates the full price so their business can grow.',
        links: [{ label: 'Read case study', href: '#' }, { label: 'Open live app', href: '#' }],
      },
      {
        title: 'Project 2',
        tagline: 'A punchy line about the project that makes people click and says what it is, what it solves and its impact',
      },
    ],
    image: 'Image',
    contact: {
      lead: 'You made it to the end of the scroll, so something caught your eye! Write to me.',
      body: 'I might have work right now, but I’m curious by nature: if you have a proposal, I’d be glad to read it.',
      email: 'Email me',
    },
  },
};

new Glitter(document.querySelector('.mp3__glitter'));

// El humo (WebGL) se crea cuando el navegador está libre, para no retrasar la carga de la página.
let smoke = null;
function initSmoke() {
  smoke = new GlitterSmoke(document.getElementById('smoke'));
  if (pastHero) smoke.stop();
}
(window.requestIdleCallback || (cb => setTimeout(cb, 200)))(initSmoke, { timeout: 800 });

const buttons = document.querySelectorAll('.lang__btn');
const projectsEl = document.getElementById('projects');
const heroTitle = new WeightTitle(document.getElementById('title'), {
  text: CONTENT.es.title,
  restWeight: 700,
  nearWeight: 200,
  radius: 400,
});

const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
const el = (tag, className, text) => {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text) n.textContent = text;
  return n;
};

function renderProjects(c) {
  projectsEl.replaceChildren(...c.projects.map(p => {
    const article = el('article', 'project');
    article.append(el('h3', 'project__title', p.title), el('p', 'project__tagline', p.tagline));
    if (p.desc) article.append(el('p', 'project__desc', p.desc));
    const shot = el('figure', 'project__shot', c.image);   // TODO: reemplazar por la imagen real del proyecto
    article.append(shot);
    if (p.links) {
      const links = el('div', 'project__links');
      p.links.forEach(l => Object.assign(links.appendChild(el('a', '', l.label)), { href: l.href }));
      article.append(links);
    }
    return article;
  }));
}

function setLang(lang, { animate = true } = {}) {
  const c = CONTENT[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(n => { n.textContent = get(c, n.dataset.i18n); });
  document.querySelectorAll('[data-i18n-label]').forEach(n => n.setAttribute('aria-label', get(c, n.dataset.i18nLabel)));
  document.querySelectorAll('.js-tags').forEach(ul => ul.replaceChildren(...c.tags.map(t => el('li', '', t))));
  renderProjects(c);
  buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  if (animate) heroTitle.setText(c.title);
  try { localStorage.setItem('lang', lang); } catch {}
}

buttons.forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

// TODO: reproductor de música. Hoy es solo UI: aquí se conectaría el audio (volume-up | volume-down | prev | next | toggle).
function onPlayerControl(action) {
  if (action === 'toggle') document.querySelector('.mp3').classList.toggle('is-paused');   // solo cambia el ícono
}
document.querySelectorAll('.mp3 [data-action]').forEach(b =>
  b.addEventListener('click', () => onPlayerControl(b.dataset.action)));

let initial = 'es';
try { initial = localStorage.getItem('lang') || (navigator.language.startsWith('en') ? 'en' : 'es'); } catch {}
if (!CONTENT[initial]) initial = 'es';
setLang(initial, { animate: initial !== 'es' });

// Cuando la sección blanca llega al header: aparece el menú, la marca se oculta y el humo se pausa.
const page = document.querySelector('.page');
let pastHero = null, ticking = false;
function updatePastHero() {
  ticking = false;
  const past = page.getBoundingClientRect().top < 70;
  if (past === pastHero) return;
  pastHero = past;
  document.body.classList.toggle('is-past-hero', past);
  if (past) smoke?.stop(); else smoke?.start();
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updatePastHero); } }, { passive: true });
addEventListener('resize', updatePastHero);
updatePastHero();
