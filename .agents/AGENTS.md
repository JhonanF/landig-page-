# AGENTS.md — Reglas del Proyecto: Landing Page Santuario del Hombre

Este archivo define las reglas obligatorias que cualquier agente o desarrollador debe seguir al trabajar en este proyecto.

---

## 1. REGLAS DE TIPADO Y CÓDIGO

### JavaScript (Vanilla ES6+)
- **Prohibido `var`**: Usar siempre `const` para valores inmutables y `let` para mutables.
- **JSDoc obligatorio** en todas las funciones que expongan lógica de negocio:
  ```js
  /**
   * Formatea un número con ceros a la izquierda.
   * @param {number} num - El número a formatear.
   * @param {number} size - El ancho mínimo de caracteres.
   * @returns {string} El número formateado.
   */
  const padStart = (num, size) => String(num).padStart(size, '0');
  ```
- **Sin funciones anónimas sueltas** asignadas en listeners. Siempre nombrar la función antes:
  ```js
  // ✅ Correcto
  const handleScroll = () => { /* ... */ };
  window.addEventListener('scroll', handleScroll);

  // ❌ Prohibido
  window.addEventListener('scroll', () => { /* ... */ });
  ```
- **Nombres de funciones con verbos**: `openModal`, `closeModal`, `startCountdown`, `revealOnScroll`.
- **Separación de responsabilidades**: Cada archivo `.js` tiene una sola responsabilidad (countdown, modal, animaciones).

### CSS (Vanilla con Custom Properties)
- **Todos los valores de diseño** (colores, fuentes, sombras, transiciones) deben vivir en `src/css/tokens.css` como variables CSS (`--variable-name`).
- **Prohibido valores mágicos** directamente en reglas CSS. Usar siempre la variable correspondiente:
  ```css
  /* ✅ Correcto */
  color: var(--color-gold);

  /* ❌ Prohibido */
  color: #dfba53;
  ```
- **Nomenclatura BEM relajada**: Usar clases descriptivas con guion. Ejemplo: `.hero-title`, `.card-pilar`, `.btn-primary`.
- **Orden de propiedades CSS**: positioning → display/flex/grid → sizing → spacing → visual (color, background) → typography → transitions.

### HTML
- **Semántica HTML5 obligatoria**: Usar `<header>`, `<main>`, `<section>`, `<footer>`, `<nav>`, `<article>` correctamente.
- **Un solo `<h1>` por página**.
- **Alt text** en todas las imágenes.

---

## 2. REGLAS DE TESTING Y VERIFICACIÓN

### IDs únicos para testing
- **Todas las secciones** del HTML deben tener un `id` descriptivo y único:
  - `#hero`, `#plataforma`, `#pilares`, `#dispositivos`, `#oferta`, `#pagos`
- **Todos los botones de acción CTA** deben tener `data-testid`:
  ```html
  <button data-testid="cta-hero-primary">🔥 DESBLOQUEAR ACCESO</button>
  <button data-testid="cta-oferta-checkout">⚡ ACCEDER AHORA</button>
  <button data-testid="checkout-paypal">PayPal</button>
  <button data-testid="checkout-crypto">Criptomonedas</button>
  <button data-testid="checkout-card">Tarjeta</button>
  ```

### Checklist de verificación manual antes de cualquier deploy
- [ ] El countdown timer corre sin errores en la consola del navegador.
- [ ] Los modales de checkout abren y cierran correctamente (click en CTA y en ×).
- [ ] El scroll suave funciona en todos los links del navbar (`#plataforma`, `#pilares`, etc.).
- [ ] La página es funcional en móvil (viewport 375px).
- [ ] No hay errores 404 en recursos (CSS, JS, fuentes).
- [ ] El meta `description` y `title` están presentes y son descriptivos.
- [ ] Las imágenes tienen atributo `alt`.

### Consola limpia
- Antes de hacer commit, la consola del navegador debe estar **libre de errores y warnings**.
- Usar `console.error` solo para errores críticos, no `console.log` en producción.

---

## 3. REGLAS DE OPTIMIZACIÓN Y PERFORMANCE

### Fuentes
- **Precargar fuentes críticas** en `<head>` con `<link rel="preload">`:
  ```html
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Space+Grotesk..." as="style">
  ```
- Usar `font-display: swap` para evitar FOIT (Flash of Invisible Text).

### Imágenes
- Tamaño máximo de imágenes generadas: **1200px** de ancho.
- Usar `loading="lazy"` en todas las imágenes que no estén en el viewport inicial.
- Usar `width` y `height` explícitos en imágenes para evitar layout shift (CLS).

### CSS y JS
- **No usar librerías externas** para animaciones de scroll (usar `IntersectionObserver` nativo).
- Archivos JS cargados con `defer` o al final del `<body>`.
- Separar CSS en módulos (`tokens`, `base`, `components`, `animations`) para mantenibilidad.

### SEO
- `<title>` descriptivo y único (máx. 60 caracteres).
- `<meta name="description">` entre 150-160 caracteres.
- Meta tags Open Graph (`og:title`, `og:description`, `og:image`) obligatorios.
- Heading hierarchy: `h1` → `h2` → `h3`. Nunca saltar niveles.

### Accesibilidad mínima
- Contraste de colores suficiente (dorado sobre negro: ✅).
- Los modales deben ser cerrables con `Escape` (implementado en `modal.js`).
- `aria-label` en botones que solo tengan iconos.

---

## 4. REGLAS DE GIT Y TRABAJO

- **Mensajes de commit en español**, descriptivos: `feat: agregar sección de pilares`, `fix: corregir countdown en móvil`.
- **Nunca commitear** `node_modules/`, archivos `.env`, o archivos temporales.
- `.gitignore` debe incluir: `node_modules/`, `*.log`, `.DS_Store`, `Thumbs.db`.

---

## 5. REGLAS DE OPTIMIZACIÓN MOBILE-FIRST & CRO

### Touch & Pointer Detection
- **Regla:** Cuando implementes animaciones de ratón (Parallax, VanillaTilt), envuélvelas en una validación: `const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;`.
- **Acción:** Si es táctil, aborta la ejecución o el registro de listeners `mousemove`.

### Fallback de 3D WebGL / Spline
- **Regla:** Elementos pesados como `<spline-viewer>` deben ocultarse en pantallas `< 768px` con `display: none;` para prevenir bloqueos de GPU/CPU y captura accidental del scroll táctil.
- **Acción:** Proveer fallback (imagen webp o video silencioso de bajo peso) visible solo en móviles. JS debe abortar instanciación 3D si detecta vista móvil.

### GSAP ScrollTrigger en móviles
- **Regla:** No usar `pin: true` en contenedores full-screen móviles. Usa `ScrollTrigger.config({ ignoreMobileResize: true });` para evitar recalculos que rompan la página al ocultarse la barra de URL en iOS/Android.

### Grids a Touch Scroll-Snap
- **Regla:** Las grillas de más de 3 tarjetas (ej. pilares, plataforma) deben transformarse en carruseles táctiles nativos en móvil para mejor usabilidad.
- **Implementación:** `overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;`. Elementos hijos con `scroll-snap-align: start;`.

### Thumb-Zone Sticky CTA & Safe Areas
- **Regla:** Botones o elementos fijos inferiores deben tener `padding-bottom: calc(1rem + env(safe-area-inset-bottom));`.
- **Touch Target:** Los botones en móviles deben tener `min-height: 48px`.

### Modales & Render Optimization
- **Regla:** Contenedor de modales en móvil debe usar `100dvh` y `max-height: 90dvh` con scroll interno.
- **Acción:** Al abrir modales aplicar `touchAction = 'none'` al body.
- **Countdowns:** Usar `font-variant-numeric: tabular-nums;` para números mutantes y evitar repintados por cambios de ancho.
