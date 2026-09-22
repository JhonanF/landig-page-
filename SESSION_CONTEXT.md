# Santuario del Hombre - Contexto de Proyecto (Actualizado)

Este documento contiene el contexto de todas las funcionalidades, reglas y soluciones implementadas hasta la fecha para que cualquier agente o desarrollador que tome el proyecto entienda el estado actual.

## 🚀 Estado General
- La Landing Page y su Panel de Administración (CMS propio con Node.js `server.js` y `data.json`) son 100% funcionales.
- El repositorio está inicializado con **Git** localmente (commit inicial asegurado) y cuenta con su `.gitignore`.

## ⚙️ Funcionalidades Implementadas Recientemente

### 1. Sistema de Ofertas Globales (Evergreen)
- Se controla desde el Panel Admin. Guarda las configuraciones en `data.json`.
- **Precios Dinámicos:** Si se desactiva la oferta, toda la web regresa al precio original (`$17.00 USD`). Se ocultan las etiquetas tachadas y los ribbons de descuento.
- **Cálculo Matemático:** Si se ingresa "70%" en el panel, el archivo `main.js` realiza el cálculo: `17.00 * (1 - 0.70)` y formatea todos los botones automáticamente a `$5.10 USD`.

### 2. Sistema de Cupones VIP
- **Diseño Neomórfico (UI Premium):** Se rediseñó el área de cupones para ser una "Llave de Acceso" estilizada y alojada directamente en la parte final de la *Offer Card*, con bordes iluminados y colores dorados.
- **Regla Anti-Acumulación:** En `main.js` se agregó la variable global `window.appState`. Si la "Oferta Global" está activa, el sistema bloquea inmediatamente cualquier intento de aplicar un cupón ("Los cupones no son acumulativos").
- **Cálculo Automático de Cupones:** Si un cupón se activa, `main.js` extrae el número del mensaje del administrador (Ej: "50 OFF" extrae `50`), y hace el cálculo matemático exacto sobre los `$17.00 USD` para mostrar el nuevo precio.

### 3. Editor Visual en Vivo
- El botón de guardado en el Editor Visual fallaba porque estaba intentando guardar las etiquetas inyectadas por las librerías 3D (GSAP y Spline). 
- **Solución:** `editor.js` ahora descarga un DOM limpio del backend original, inyecta solo las modificaciones textuales precisas y guarda sin romper la estructura de las animaciones.

### 4. Reparación Crítica de Pantalla Negra (GSAP Error)
- Anteriormente el Hero se veía totalmente negro porque los archivos `countdown.js` y `main.js` estaban compitiendo por la misma constante global (`isMobile`), lo que crasheaba `main.js` y evitaba que GSAP les quitara la opacidad `0` a las cajas (`.reveal`).
- **Solución:** Se renombró la variable conflictiva en `countdown.js` a `isDeviceMobile`.

### 5. Carrusel de Imágenes
- Se removió el filtro `grayscale(100%)` en `components.css`. Ahora el carrusel de imágenes de la landing se muestra en **Full Color** atenuado (`brightness(0.6)`), y brilla al 100% en el evento `:hover`.

## 📂 Archivos Críticos a Tener en Cuenta
- `server.js`: El backend local con Express que maneja la API y guarda en `data.json`.
- `data.json`: La base de datos cruda del sistema. No modificar manualmente.
- `index.html` y `admin.html`: Interfaces.
- `src/js/main.js`: Lógica core, animaciones de scroll y manejo de precios dinámicos/cupones.
- `src/js/editor.js`: Lógica del editor de textos en vivo.
- `src/css/components.css` y `tokens.css`: Base del sistema de diseño (Golden/Dark aesthetic).

## 🛠 Próximos Pasos Recomendados
- El usuario mencionó previamente una integración futura o ajustes con pasarelas de pago, pero de momento la landing cuenta con una asignación dinámica de URLs para los botones de checkout si vienen inyectados por el backend en las respuestas.
