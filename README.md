# Portafolio · Ana Silva

Portafolio de Ana Silva, Senior Product Designer (diseño de producto, design systems y accesibilidad).

Sitio estático en HTML, CSS y JavaScript, sin dependencias ni paso de build. El diseño de referencia está en Paper (archivo "Quiet unicorn", página "Final MVP").

## Detalles

- **Accesibilidad primero:** enlace de salto al contenido, foco visible, `aria-label` en los elementos decorativos y respeto por `prefers-reduced-motion`.
- **Botón para pausar las animaciones** (humo de fondo, GIF, videos con poster al pausar, cartel "en construcción" y efectos), con la preferencia guardada.
- **Título con cambio de peso al hover**, letra por letra, en Silkscreen (`js/weight-title.js`).
- **Banner de Netia y fondo/foto del footer** como `<video>` (webm + mp4, con poster) que se pausan junto con el resto.
- **Borde ondulado** en la card del avatar (`.card-scallop`, tile pixel-art en `assets/scallop-pixel-white.png`).
- **CSS con `@layer` y design tokens** (`css/tokens.css`).

## Estructura

```
index.html
css/   tokens, base, layout y componentes
js/    app (pausa, GIF y videos), contact (copiar email), efectos de título y links, humo (WebGL) y personaje
assets/        imágenes, GIF y fuentes (assets/fonts)
assets/video/  videos del banner Netia y del footer
```

## Pendiente

- **Contador de visitas:** servicio de terceros FC2 Counter (script en `index.html`, id `41258307`). El estilo del número se configura en el panel de FC2, no en el CSS del sitio.
- Links `href="#"`: Escuchar playlist, Accesibilidad, Papelería creativa, Ilustraciones, Créditos, case study y plataforma live.
- Ruta `en/` (versión en inglés) todavía no existe.
- La fuente Visitor TT1 BRK (`assets/fonts`) viene del equipo de diseño: confirmar su licencia antes de publicar.

## Ver en local

```bash
npx serve .
```

© Ana Silva. Todos los derechos reservados.
