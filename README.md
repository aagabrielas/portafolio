# Portafolio · Ana Silva

Portafolio de Ana Silva, Senior Product Designer (diseño de producto, design systems y accesibilidad).

Sitio estático en HTML, CSS y JavaScript, sin dependencias ni paso de build.

## Detalles

- **Accesibilidad primero:** enlace de salto al contenido, foco visible, `aria-label` en los elementos decorativos y respeto por `prefers-reduced-motion`.
- **Botón para pausar las animaciones** (humo de fondo, GIF, blinkies y efectos), con la preferencia guardada.
- **Título con cambio de peso al hover**, letra por letra, en Verdana (`js/weight-title.js`).
- **CSS con `@layer` y design tokens** (`css/tokens.css`).

## Estructura

```
index.html
css/   tokens, base, layout y componentes
js/    app, efectos de botón y título, humo (WebGL) y personaje
assets/
```

## Ver en local

```bash
npx serve .
```

© Ana Silva. Todos los derechos reservados.
