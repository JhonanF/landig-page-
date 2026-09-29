/**
 * spline-3d.js — Control interactivo del visor 3D Spline
 * Santuario del Hombre — Landing Page
 *
 * @description Maneja la rotación del modelo 3D con el ratón y
 * el desvanecimiento al hacer scroll. En dispositivos móviles (< 768px)
 * el canvas 3D NO se renderiza (display:none en CSS) para ahorrar
 * CPU/GPU y batería. Este script respeta esa decisión y se auto-cancela.
 */

window.addEventListener('DOMContentLoaded', () => {
    // ─── MOBILE BAIL OUT ─────────────────────────────────────────
    // En móviles el #canvas-3d está oculto con display:none en CSS.
    // No inicializar GSAP, mousemove listeners ni ScrollTrigger 3D aquí.
    const canRenderSpline = window.matchMedia(
        '(min-width: 1024px) and (hover: hover) and (pointer: fine)'
    ).matches;
    if (!canRenderSpline) return;

    // ─── DESKTOP ONLY ────────────────────────────────────────────
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    const viewer = document.querySelector('spline-viewer');

    if (!viewer) return;

    // 1. Rotación del objeto 3D con el mouse (solo desktop, pointer:fine)
    const hasPointer = window.matchMedia('(pointer: fine)').matches;
    if (hasPointer) {
        const handleMouseMove3D = (e) => {
            const xPercent = (e.clientX / window.innerWidth - 0.5) * 2;
            const yPercent = (e.clientY / window.innerHeight - 0.5) * 2;

            gsap.to(viewer, {
                rotateY: xPercent * 12,
                rotateX: -yPercent * 12,
                duration: 0.9,
                ease: "power2.out"
            });
        };

        window.addEventListener('mousemove', handleMouseMove3D, { passive: true });
    }

    // 2. Efecto de zoom y desvanecimiento sincronizado con el scroll
    gsap.to(viewer, {
        scrollTrigger: {
            trigger: ".cinematic-hero",
            start: "top top",
            end: "+=120%",
            scrub: 1.2
        },
        scale: 1.4,
        opacity: 0,
        filter: "blur(8px)",
        transformOrigin: "center center",
        ease: "power1.inOut"
    });

    // 3. Forzar fondo transparente cuando el viewer carga
    const forceTansparentBg = () => {
        const shadowRoot = viewer.shadowRoot;
        if (!shadowRoot) return;

        const canvas = shadowRoot.querySelector('#canvas3d');
        if (canvas) canvas.style.background = 'transparent';

        const shadowBg = shadowRoot.querySelector('.spline-viewer-container');
        if (shadowBg) shadowBg.style.background = 'transparent';
    };

    viewer.addEventListener('load', forceTansparentBg);
});
