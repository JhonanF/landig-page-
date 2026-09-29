/**
 * Carga el componente Spline exclusivamente en pantallas de escritorio.
 * Así los móviles no descargan el runtime ni inicializan WebGL para un
 * elemento que CSS mantiene oculto.
 */
if (window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches) {
    import('https://unpkg.com/@splinetool/viewer@1.3.0/build/spline-viewer.js');
}
