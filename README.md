# Santuario del Hombre — Landing Page

Landing page de venta del proyecto **Santuario del Hombre**, la biblioteca privada de cursos más grande de Latinoamérica.

---

## Estructura del Proyecto

```
landing page de santuario/
├── .agents/
│   └── AGENTS.md              ← Reglas de tipado, testing y optimización
├── src/
│   ├── css/
│   │   ├── tokens.css         ← Design tokens (variables CSS)
│   │   ├── base.css           ← Reset, body, navbar, footer
│   │   ├── components.css     ← Secciones, cards, botones, modales
│   │   └── animations.css     ← Keyframes + clases scroll reveal
│   └── js/
│       ├── countdown.js       ← Timer regresivo de oferta
│       ├── modal.js           ← Modales de checkout
│       └── main.js            ← Scroll reveal, navbar, smooth scroll
├── index.html                 ← Landing page principal
└── README.md                  ← Este archivo
```

---

## Secciones

| ID           | Sección             | Descripción                                            |
|--------------|---------------------|--------------------------------------------------------|
| `#hero`      | Hero                | Título monumental + trust badges + CTA doble           |
| `#plataforma`| Plataforma          | 3 cards: actualización, autores, acceso libre          |
| `#pilares`   | 4 Pilares           | Seducción, Ventas, Finanzas, Desarrollo Personal       |
| `#dispositivos` | Dispositivos    | APK Android vs EXE PC                                  |
| `#oferta`    | Oferta/Precio       | Countdown + precio + CTA principal                     |
| `#pagos`     | Métodos de Pago     | PayPal, Crypto, Tarjeta, Transferencia                 |

---

## Tecnologías

- **HTML5** semántico
- **CSS Vanilla** con Custom Properties (sin frameworks)
- **JavaScript ES6+** con JSDoc (sin dependencias externas)
- **Google Fonts**: Space Grotesk + Poppins
- **IntersectionObserver** para scroll reveal nativo

---

## Cómo Usar

1. Abrir `index.html` directamente en el navegador (doble click)
2. No requiere servidor, compilador ni dependencias

---

## Paleta de Colores

| Nombre   | Valor       | Uso                         |
|----------|-------------|-----------------------------|
| Gold     | `#dfba53`   | Primario, CTA, acento        |
| Neon     | `#00ff88`   | Secundario, APK, estado vivo |
| Abyss    | `#000000`   | Fondo principal              |
| Dark     | `#050608`   | Fondo de secciones           |

---

## Reglas del Proyecto

Ver [.agents/AGENTS.md](.agents/AGENTS.md) para las reglas completas de:
- Tipado y estilo de código
- Testing y verificación
- Optimización y performance
