/**
 * main.js — Inicialización Principal
 * Santuario del Hombre — Landing Page
 *
 * @description Maneja: scroll reveal con IntersectionObserver,
 * efecto de navbar al hacer scroll, animaciones GSAP del Hero,
 * y anti-inspect de seguridad. Optimizado para 60 FPS en móviles.
 */

// ─── DETECCIÓN DE DISPOSITIVO ────────────────────────────────

/**
 * Devuelve true si el usuario navega en un dispositivo táctil (móvil/tablet).
 * Usa matchMedia pointer:coarse como estándar moderno + fallback.
 * @returns {boolean}
 */
const isTouchDevice = () =>
    window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const supportsDesktopEffects = () =>
    window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches;

/**
 * Devuelve true si el ancho de pantalla es inferior al breakpoint móvil.
 * @param {number} [bp=768] - Breakpoint en px.
 * @returns {boolean}
 */
const isMobile = (bp = 768) => window.innerWidth <= bp;

// ─── SCROLL REVEAL ──────────────────────────────────────────

/**
 * Inicializa el efecto de scroll reveal usando IntersectionObserver.
 * Los elementos con clase `.reveal` se animan al entrar al viewport.
 * @returns {void}
 */
const initScrollReveal = () => {
    const revealElements = document.querySelectorAll('.reveal');

    if (!revealElements.length) return;

    if (prefersReducedMotion()) {
        revealElements.forEach(element => element.classList.add('is-visible'));
        return;
    }

    /** @type {IntersectionObserverInit} */
    const observerOptions = {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    };

    /**
     * Callback del IntersectionObserver.
     * @param {IntersectionObserverEntry[]} entries
     * @param {IntersectionObserver} observer
     */
    const onIntersect = (entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // Animar solo una vez
        });
    };

    const observer = new IntersectionObserver(onIntersect, observerOptions);

    revealElements.forEach((el) => {
        observer.observe(el);
    });
};

// ─── NAVBAR SCROLL EFFECT ───────────────────────────────────

/**
 * Inicializa el efecto de compresión del navbar al hacer scroll.
 * @returns {void}
 */
const initNavbarScroll = () => {
    const navbar = document.getElementById('navbar');

    if (!navbar) return;

    const SCROLL_THRESHOLD = 60;

    let scheduled = false;
    const updateNavbar = () => {
        navbar.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
        scheduled = false;
    };

    const handleScroll = () => {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(updateNavbar);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Estado inicial
};

// ─── SMOOTH SCROLL PARA LINKS INTERNOS ─────────────────────

/**
 * Inicializa el scroll suave para todos los links con href que
 * comienzan con '#'.
 * @returns {void}
 */
/**
 * Coordina los controles flotantes móviles para que no dupliquen CTAs ni
 * oculten contenido en Hero, oferta y footer.
 * @returns {void}
 */
const initMobileFixedUi = () => {
    if (!window.matchMedia('(max-width: 1023px), (pointer: coarse)').matches) return;

    const stickyBar = document.getElementById('mobile-sticky-bar');
    const floatingSocials = document.getElementById('floating-socials');
    const targets = {
        hero: document.getElementById('hero'),
        offer: document.getElementById('oferta'),
        footer: document.querySelector('.footer')
    };

    if (!stickyBar || !floatingSocials || Object.values(targets).some(target => !target)) return;

    const visible = { hero: true, offer: false, footer: false };
    const render = () => {
        stickyBar.classList.toggle('is-visible', !visible.hero && !visible.offer && !visible.footer);
        // Los accesos sociales sólo permanecen sobre el Hero, donde no tapan
        // lectura ni acciones. En el contenido y el footer se retiran.
        floatingSocials.classList.toggle('is-footer-hidden', !visible.hero || visible.offer || visible.footer);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const key = entry.target.id === 'hero'
                ? 'hero'
                : entry.target.id === 'oferta' ? 'offer' : 'footer';
            visible[key] = entry.isIntersecting;
        });
        render();
    }, { threshold: 0.08 });

    Object.values(targets).forEach(target => observer.observe(target));
    render();
};

const initSmoothScroll = () => {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (!targetId || targetId === '#') return;

            const targetEl = document.querySelector(targetId);
            if (!targetEl) return;

            e.preventDefault();
            targetEl.scrollIntoView({
                behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                block: 'start'
            });
        });
    });
};

// ─── SEGURIDAD: ANTI-INSPECT ────────────────────────────────

/**
 * Bloquea menú contextual y atajos de DevTools.
 * @returns {void}
 */
const initSecurityGuards = () => {
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    document.addEventListener('keydown', (e) => {
        const isF12 = e.key === 'F12';
        const isDevToolsShortcut =
            e.ctrlKey && e.shiftKey &&
            ['I', 'C', 'J', 'K'].includes(e.key);
        const isViewSource = e.ctrlKey && e.key === 'U';

        if (isF12 || isDevToolsShortcut || isViewSource) {
            e.preventDefault();
        }
    });
};

// ─── CINEMATIC HERO: GSAP & INTERACTIVIDAD ─────────────────

/**
 * Inicializa las animaciones de entrada del Hero con GSAP.
 * En dispositivos táctiles/móviles, omite la animación del canvas 3D
 * para evitar jank con un elemento que ya está oculto en CSS.
 * @returns {void}
 */
const initCinematicHeroIntro = () => {
    if (typeof gsap === 'undefined') return;

    if (prefersReducedMotion()) {
        initHeroScrollAnimation();
        return;
    }

    if (!supportsDesktopEffects()) {
        const mobileIntro = gsap.timeline({ defaults: { ease: "power2.out" } });

        mobileIntro
            .from(".bg-layer", { opacity: 0, scale: 1.03, duration: 0.65 })
            .from(".monumental-title", { y: 24, opacity: 0, duration: 0.55 }, "-=0.35")
            .from(".stat-box", { y: 12, opacity: 0, duration: 0.4, stagger: 0.06 }, "-=0.28")
            .call(initHeroScrollAnimation);
        return;
    }

    const tlIntro = gsap.timeline({ defaults: { ease: "power4.out" } });

    tlIntro.from(".bg-layer", {
        opacity: 0,
        scale: 1.1,
        duration: 2
    });

    tlIntro.from(".monumental-title", {
        y: 80,
        opacity: 0,
        skewY: 3,
        duration: 1.5,
        stagger: 0.1
    }, "-=1.2");

    // El canvas 3D solo existe en desktop, evitar error en móvil
    if (document.getElementById('canvas-3d')) {
        tlIntro.from("#canvas-3d", {
            scale: 0.7,
            opacity: 0,
            duration: 1.8,
            ease: "elastic.out(1, 0.75)"
        }, "-=1.0");
    }

    tlIntro.from(".stat-box", {
        y: 20,
        opacity: 0,
        duration: 1,
        stagger: 0.2
    }, "-=1.2");

    tlIntro.call(() => {
        // El CTA permanece disponible desde el primer frame; el timeline de
        // scroll comienza cuando termina la composición visual del Hero.
        if (typeof initHeroScrollAnimation === 'function') {
            initHeroScrollAnimation();
        }
    });
};

/**
 * Efecto paralaje 3D basado en el movimiento del ratón.
 * Se desactiva completamente en dispositivos táctiles para evitar
 * listeners de mousemove innecesarios que drenan batería.
 * @returns {void}
 */
const initParallaxMouse = () => {
    if (typeof gsap === 'undefined') return;

    // BAIL OUT en táctil: mousemove nunca se dispara en móvil de forma natural
    // pero el listener existe en memoria y consume recursos. Mejor no registrarlo.
    if (isTouchDevice()) return;

    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const xPercent = (clientX / window.innerWidth - 0.5) * 2;
        const yPercent = (clientY / window.innerHeight - 0.5) * 2;

        gsap.to(".bg-layer", { x: xPercent * 20, y: yPercent * 20, duration: 1.2, ease: "power2.out" });
        gsap.to(".text-layer", { x: xPercent * -35, y: yPercent * -35, duration: 1.0, ease: "power2.out" });
        gsap.to(".fg-layer", { x: xPercent * 45, y: yPercent * 45, duration: 0.8, ease: "power2.out" });
        gsap.to("#canvas-3d", { rotateY: xPercent * 15, rotateX: -yPercent * 15, duration: 0.8, ease: "power2.out" });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
};

/**
 * Efecto de atracción magnética para el botón CTA.
 * Desactivado en táctil (el efecto magnético requiere cursor de ratón).
 * @returns {void}
 */
const initMagneticButton = () => {
    if (typeof gsap === 'undefined') return;

    // Sin cursor = sin efecto magnético. Ahorra listeners y mejora scroll.
    if (isTouchDevice()) return;

    const magneticBtn = document.querySelector('.btn-magnetic');
    if (!magneticBtn) return;

    const btnWrap = magneticBtn.parentElement;

    const handleMouseMove = (e) => {
        const rect = btnWrap.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(magneticBtn, { x: x * 0.55, y: y * 0.55, scale: 1.05, duration: 0.35, ease: "power2.out" });
    };

    const handleMouseLeave = () => {
        gsap.to(magneticBtn, { x: 0, y: 0, scale: 1, duration: 0.8, ease: "elastic.out(1.1, 0.4)" });
    };

    btnWrap.addEventListener('mousemove', handleMouseMove);
    btnWrap.addEventListener('mouseleave', handleMouseLeave);
};

/**
 * Animación cinematográfica basada en el scroll (ScrollTrigger).
 * En móviles (< 768px): desactiva `pin: true` para evitar el bug de
 * la barra dinámica del navegador que congela el scroll en iOS/Android.
 * @returns {void}
 */
const initHeroScrollAnimation = () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    // En móvil el Hero permanece estable: evita pin, scrub y filtros durante
    // el gesto principal de scroll. Reduced motion tampoco crea timelines.
    if (prefersReducedMotion() || isMobile()) return;

    gsap.registerPlugin(ScrollTrigger);

    const desktopEffects = supportsDesktopEffects();

    // Evita el resize-jump de Safari iOS cuando la barra de URL se colapsa.
    // ignoreMobileResize impide que ScrollTrigger recalcule en cada resize táctil.
    ScrollTrigger.config({ ignoreMobileResize: true });

    const scrollTriggerConfig = {
        trigger: ".cinematic-hero",
        start: "top top",
        end: desktopEffects ? "+=120%" : "+=70%",
        scrub: desktopEffects ? 1.2 : 0.7,
        pin: desktopEffects,
        anticipatePin: desktopEffects ? 1 : 0
    };

    const tlScroll = gsap.timeline({ scrollTrigger: scrollTriggerConfig });

    if (desktopEffects) {
        tlScroll
            .to(".text-layer", { scale: 1.25, opacity: 0, y: -150, duration: 1 }, 0)
            .to(".magnetic-wrap", { scale: 0.6, opacity: 0, y: 100, duration: 1 }, 0)
            .to(".bg-layer", { scale: 1.15, opacity: 0.3, duration: 1.2 }, 0)
            .to(".scroll-indicator", { opacity: 0, y: 50, duration: 0.4 }, 0)
            .fromTo(".carousel-layer",
                { opacity: 0, scale: 0.8, filter: "blur(15px)" },
                { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1 }, 0.4)
            .to("#canvas-3d", { scale: 1.6, opacity: 0, filter: "blur(10px)", duration: 1.2 }, 0);
        return;
    }

    // Tablet: transición ligera, sin pin ni blur.
    tlScroll
        .to(".text-layer", { scale: 1.06, opacity: 0.25, y: -40, duration: 1 }, 0)
        .to(".magnetic-wrap", { opacity: 0, y: 30, duration: 0.8 }, 0)
        .to(".bg-layer", { scale: 1.03, opacity: 0.55, duration: 1 }, 0)
        .fromTo(".carousel-layer",
            { opacity: 0, scale: 0.96 },
            { opacity: 0.7, scale: 1, duration: 0.8 }, 0.15);
};

// ─── REPRODUCTOR UNIVERSAL DE VIDEO ─────────────────────────

const HLS_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/hls.js@1';
const DIRECT_VIDEO_EXTENSIONS = new Set([
    '.mp4', '.webm', '.ogg', '.ogv', '.m4v', '.mov', '.mpeg', '.mpg'
]);

let activeHlsInstance = null;
let hlsScriptPromise = null;
let videoRenderVersion = 0;

const getVideoPathExtension = (pathname) => {
    const fileName = pathname.split('/').pop() || '';
    const extensionIndex = fileName.lastIndexOf('.');
    return extensionIndex === -1 ? '' : fileName.slice(extensionIndex).toLowerCase();
};

const getSafeVideoUrl = (value) => {
    if (typeof value !== 'string' || !value.trim()) return null;

    try {
        const parsedUrl = new URL(value.trim(), window.location.origin);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') return null;
        return parsedUrl;
    } catch (error) {
        return null;
    }
};

const getYouTubeId = (url) => {
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    let videoId = '';

    if (hostname === 'youtu.be') {
        videoId = url.pathname.split('/').filter(Boolean)[0] || '';
    } else if (hostname === 'youtube.com' || hostname === 'youtube-nocookie.com') {
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (url.pathname === '/watch') {
            videoId = url.searchParams.get('v') || '';
        } else if (['embed', 'shorts', 'live'].includes(pathParts[0])) {
            videoId = pathParts[1] || '';
        }
    }

    return /^[A-Za-z0-9_-]{6,20}$/.test(videoId) ? videoId : '';
};

const getYouTubeEmbedUrl = (url, videoId) => {
    const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
    const startAt = url.searchParams.get('start') || url.searchParams.get('t');
    if (/^\d+$/.test(startAt || '')) embedUrl.searchParams.set('start', startAt);
    return embedUrl.href;
};

const detectVideoType = (value) => {
    const url = getSafeVideoUrl(value);
    if (!url) return { type: 'invalid', mode: 'error', src: '' };

    const src = url.href;
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    const pathParts = url.pathname.split('/').filter(Boolean);
    const extension = getVideoPathExtension(url.pathname);

    if (extension === '.m3u8') {
        return { type: 'hls', mode: 'hls', src };
    }

    if (DIRECT_VIDEO_EXTENSIONS.has(extension)) {
        return { type: 'direct', mode: 'video', src };
    }

    if (hostname === 'playmogo.com' && pathParts[0] === 'e' && pathParts[1]) {
        return { type: 'playmogo', mode: 'iframe', src };
    }

    const youtubeId = getYouTubeId(url);
    if (youtubeId) {
        return {
            type: 'youtube',
            mode: 'iframe',
            src: getYouTubeEmbedUrl(url, youtubeId)
        };
    }

    if (hostname === 'vimeo.com' || hostname === 'player.vimeo.com') {
        const vimeoId = pathParts.find(part => /^\d+$/.test(part));
        if (vimeoId) {
            return {
                type: 'vimeo',
                mode: 'iframe',
                src: `https://player.vimeo.com/video/${vimeoId}`
            };
        }
    }

    if (hostname === 'dailymotion.com' || hostname === 'dai.ly') {
        const videoPathIndex = pathParts.indexOf('video');
        const rawId = hostname === 'dai.ly'
            ? pathParts[0]
            : videoPathIndex === -1 ? '' : pathParts[videoPathIndex + 1];
        const dailymotionId = (rawId || '').split('_')[0];
        if (/^[A-Za-z0-9]+$/.test(dailymotionId)) {
            return {
                type: 'dailymotion',
                mode: 'iframe',
                src: `https://www.dailymotion.com/embed/video/${dailymotionId}`
            };
        }
    }

    if (hostname === 'streamable.com' && pathParts[0]) {
        const streamableId = pathParts[pathParts[0] === 'e' ? 1 : 0];
        if (/^[A-Za-z0-9]+$/.test(streamableId || '')) {
            return {
                type: 'streamable',
                mode: 'iframe',
                src: `https://streamable.com/e/${streamableId}`
            };
        }
    }

    if (hostname === 'loom.com' && ['share', 'embed'].includes(pathParts[0])) {
        const loomId = pathParts[1] || '';
        if (/^[A-Za-z0-9_-]+$/.test(loomId)) {
            return {
                type: 'loom',
                mode: 'iframe',
                src: `https://www.loom.com/embed/${loomId}`
            };
        }
    }

    if (hostname === 'drive.google.com' && pathParts[0] === 'file' && pathParts[1] === 'd') {
        const fileId = pathParts[2] || '';
        if (/^[A-Za-z0-9_-]+$/.test(fileId)) {
            return {
                type: 'google-drive',
                mode: 'iframe',
                src: `https://drive.google.com/file/d/${fileId}/preview`
            };
        }
    }

    if (/\/(?:embed|e|player|video|v)(?:\/|$)/i.test(url.pathname)) {
        return { type: 'generic-embed', mode: 'iframe', src };
    }

    return { type: 'external', mode: 'fallback', src };
};

const clearVideoPlayer = (container) => {
    if (activeHlsInstance) {
        activeHlsInstance.destroy();
        activeHlsInstance = null;
    }

    const currentVideo = container.querySelector('video');
    if (currentVideo) {
        currentVideo.pause();
        currentVideo.removeAttribute('src');
        currentVideo.querySelectorAll('source').forEach(source => source.removeAttribute('src'));
        currentVideo.load();
    }

    container.replaceChildren();
};

const createVideoElement = (container) => {
    const video = document.createElement('video');
    video.className = 'vsl-player vsl-player--video';
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    if (container.dataset.poster) video.poster = container.dataset.poster;
    return video;
};

const createIframeElement = (videoInfo) => {
    const iframe = document.createElement('iframe');
    iframe.className = 'vsl-player vsl-player--iframe';
    iframe.src = videoInfo.src;
    iframe.title = `Reproductor de video ${videoInfo.type}`;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    return iframe;
};

const renderVideoFallback = (container, src, message = 'No se puede reproducir este video directamente aquí.') => {
    const fallback = document.createElement('div');
    fallback.className = 'vsl-player-fallback';

    const text = document.createElement('p');
    text.textContent = message;
    fallback.appendChild(text);

    if (src) {
        const link = document.createElement('a');
        link.className = 'btn btn--primary vsl-player-fallback__link';
        link.href = src;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Abrir video';
        fallback.appendChild(link);
    }

    container.replaceChildren(fallback);
    container.setAttribute('aria-busy', 'false');
};

const renderVideoLoading = (container) => {
    const loading = document.createElement('div');
    loading.className = 'vsl-player-loading';
    loading.textContent = 'Cargando video...';
    container.replaceChildren(loading);
    container.setAttribute('aria-busy', 'true');
};

const loadHlsLibrary = () => {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (hlsScriptPromise) return hlsScriptPromise;

    hlsScriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = HLS_SCRIPT_URL;
        script.async = true;
        script.onload = () => window.Hls
            ? resolve(window.Hls)
            : reject(new Error('HLS.js no está disponible'));
        script.onerror = () => reject(new Error('No se pudo cargar HLS.js'));
        document.head.appendChild(script);
    }).catch(error => {
        hlsScriptPromise = null;
        throw error;
    });

    return hlsScriptPromise;
};

const renderVideo = async (value) => {
    const container = document.getElementById('video-player-container');
    if (!container) return null;

    const renderVersion = ++videoRenderVersion;
    clearVideoPlayer(container);
    const videoInfo = detectVideoType(value);

    if (videoInfo.mode === 'error') {
        renderVideoFallback(container, '', 'El enlace de video configurado no es válido.');
        return videoInfo;
    }

    if (videoInfo.mode === 'fallback') {
        renderVideoFallback(container, videoInfo.src);
        return videoInfo;
    }

    if (videoInfo.mode === 'iframe') {
        container.replaceChildren(createIframeElement(videoInfo));
        container.setAttribute('aria-busy', 'false');
        return videoInfo;
    }

    const video = createVideoElement(container);
    const handlePlaybackError = () => {
        if (renderVersion !== videoRenderVersion) return;
        clearVideoPlayer(container);
        renderVideoFallback(container, videoInfo.src, 'No se pudo cargar este video.');
    };

    if (videoInfo.mode === 'video') {
        video.src = videoInfo.src;
        video.addEventListener('error', handlePlaybackError, { once: true });
        container.replaceChildren(video);
        container.setAttribute('aria-busy', 'false');
        return videoInfo;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoInfo.src;
        video.addEventListener('error', handlePlaybackError, { once: true });
        container.replaceChildren(video);
        container.setAttribute('aria-busy', 'false');
        return videoInfo;
    }

    renderVideoLoading(container);
    try {
        const Hls = await loadHlsLibrary();
        if (renderVersion !== videoRenderVersion) return videoInfo;

        if (!Hls.isSupported()) {
            renderVideoFallback(container, videoInfo.src, 'Este navegador no puede reproducir el stream HLS.');
            return videoInfo;
        }

        container.replaceChildren(video);
        container.setAttribute('aria-busy', 'false');
        activeHlsInstance = new Hls();
        activeHlsInstance.loadSource(videoInfo.src);
        activeHlsInstance.attachMedia(video);
        activeHlsInstance.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal && renderVersion === videoRenderVersion) {
                handlePlaybackError();
            }
        });
    } catch (error) {
        if (renderVersion === videoRenderVersion) {
            console.error('[Video HLS]', error);
            renderVideoFallback(container, videoInfo.src, 'No se pudo iniciar el reproductor HLS.');
        }
    }

    return videoInfo;
};

window.SantuarioVideo = Object.freeze({ detectVideoType, renderVideo });

const MIN_CAROUSEL_ITEMS = 8;
const MAX_CAROUSEL_ITEMS = 40;

/**
 * Genera una secuencia suficientemente larga para cubrir el viewport sin
 * multiplicar innecesariamente galerías que ya tienen muchas imágenes.
 * @param {unknown} images
 * @returns {string[]}
 */
const getCarouselSequence = (images) => {
    if (!Array.isArray(images)) return [];

    const sourceImages = images
        .filter(image => typeof image === 'string' && image.trim() !== '')
        .slice(0, MAX_CAROUSEL_ITEMS);

    if (sourceImages.length === 0) return [];

    const itemCount = Math.max(MIN_CAROUSEL_ITEMS, sourceImages.length);
    return Array.from({ length: itemCount }, (_, index) => sourceImages[index % sourceImages.length]);
};

/**
 * Crea una tarjeta decorativa del carrusel preservando su geometría si falla.
 * @param {string} source
 * @param {number} index
 * @param {number} trackIndex
 * @returns {HTMLImageElement}
 */
const createCarouselImage = (source, index, trackIndex) => {
    const image = document.createElement('img');
    image.src = source;
    image.className = 'carousel-img';
    image.alt = '';
    image.draggable = false;
    image.decoding = 'async';
    image.loading = trackIndex === 0 && index < 6 ? 'eager' : 'lazy';
    image.addEventListener('error', () => {
        image.classList.add('is-broken');
        image.removeAttribute('src');
    }, { once: true });
    return image;
};

/**
 * Mantiene ambos tracks idénticos para que el reinicio a -100% sea continuo.
 * @param {unknown} images
 * @returns {void}
 */
const renderHeroCarousel = (images) => {
    const track1 = document.getElementById('carousel-track-1');
    const track2 = document.getElementById('carousel-track-2');
    const wrapper = track1?.closest('.marquee-wrapper');

    if (!track1 || !track2 || !wrapper) return;

    const sequence = getCarouselSequence(images);
    const tracks = [track1, track2];

    tracks.forEach((track, trackIndex) => {
        const fragment = document.createDocumentFragment();
        sequence.forEach((source, index) => {
            fragment.appendChild(createCarouselImage(source, index, trackIndex));
        });
        track.replaceChildren(fragment);
    });

    if (sequence.length === 0) {
        wrapper.style.removeProperty('--marquee-duration');
        return;
    }

    const durationSeconds = Math.min(240, Math.max(56, sequence.length * 7));
    wrapper.style.setProperty('--marquee-duration', `${durationSeconds}s`);
};

// ─── INICIALIZACIÓN ─────────────────────────────────────────

/**
 * Obtiene el contenido dinámico del backend (Node.js) y puebla el DOM.
 * Si falla, usa un fallback silencioso.
 */
const fetchDynamicContent = async () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref');
        const apiUrl = ref ? `/api/content?ref=${encodeURIComponent(ref)}` : '/api/content';
        
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('API no disponible');
        const data = await res.json();

        // 1. Población del reproductor VSL universal
        await renderVideo(data.videoUrl || '');

        // 2. Población del Carrusel de Fotos
        renderHeroCarousel(data.carouselImages || []);

        // 3. Población de Redes Sociales Flotantes
        if (data.socialLinks) {
            const configureSocialBtn = (id, networkData) => {
                const btn = document.getElementById(id);
                if (btn) {
                    // Verificamos el nuevo esquema { url, active } o el viejo (string)
                    const url = typeof networkData === 'string' ? networkData : networkData?.url;
                    const isActive = typeof networkData === 'object' ? networkData?.active : true;

                    if (isActive && url && url.trim() !== '') {
                        btn.href = url;
                        btn.classList.remove('hidden');
                    } else {
                        btn.classList.add('hidden');
                    }
                }
            };
            
            configureSocialBtn('btn-social-whatsapp', data.socialLinks.whatsapp);
            configureSocialBtn('btn-social-telegram', data.socialLinks.telegram);
            configureSocialBtn('btn-social-instagram', data.socialLinks.instagram);
        }

        // 4. Población de Métodos de Pago (Checkout)
        if (data.paymentLinks) {
            const configurePaymentBtn = (testId, paymentData) => {
                // Seleccionamos el botón por su data-testid
                const btn = document.querySelector(`[data-testid="${testId}"]`);
                if (btn) {
                    const url = paymentData?.url;
                    const isActive = paymentData?.active !== false; // true por defecto

                    if (isActive && url && url.trim() !== '') {
                        btn.setAttribute('data-checkout-url', url);
                        btn.style.display = ''; // Mostrar
                    } else {
                        btn.removeAttribute('data-checkout-url');
                        btn.style.display = 'none'; // Ocultar
                    }
                }
            };

            configurePaymentBtn('checkout-card', data.paymentLinks.card);
            configurePaymentBtn('checkout-paypal', data.paymentLinks.paypal);
            configurePaymentBtn('checkout-crypto', data.paymentLinks.crypto);
        }

        // 5. Configuración de Oferta (Temporizador)
        window.appState = { offerActive: false };
        if (data.offer) {
            window.appState.offerActive = data.offer.active === true;
            const countdownBox = document.querySelector('.countdown-box');
            const pricingOriginals = document.querySelectorAll('.pricing-original');
            const offerRibbons = document.querySelectorAll('.offer-ribbon');
            const dynamicPrices = document.querySelectorAll('.dynamic-price');
            
            if (data.offer.active === false) {
                if (countdownBox) countdownBox.style.display = 'none';
                // Ocultar precio original tachado y etiqueta de cupón
                pricingOriginals.forEach(el => el.style.display = 'none');
                offerRibbons.forEach(el => el.style.display = 'none');
                // Restaurar el precio real
                dynamicPrices.forEach(el => el.textContent = '$17.00 USD');
            } else {
                if (countdownBox) countdownBox.style.display = '';
                // Asegurar que se muestre el precio original tachado y etiqueta
                pricingOriginals.forEach(el => el.style.display = '');
                offerRibbons.forEach(el => {
                    el.style.display = '';
                    if (data.offer.discountText) {
                        el.textContent = `Cupón ${data.offer.discountText} Aplicado`;
                        el.setAttribute('aria-label', `Cupón del ${data.offer.discountText} aplicado`);
                    }
                });
                // Calcular matemáticamente el precio final basado en el porcentaje
                let calculatedPrice = 8.50; // default 50% de 17.00
                if (data.offer.discountText) {
                    const match = data.offer.discountText.match(/\d+/); // Extrae el número, ej "70%" -> 70
                    if (match) {
                        const percentage = parseInt(match[0], 10);
                        if (percentage >= 0 && percentage <= 100) {
                            calculatedPrice = 17.00 * (1 - percentage / 100);
                        }
                    }
                }
                dynamicPrices.forEach(el => el.textContent = `$${calculatedPrice.toFixed(2)} USD`);
                
                // Iniciar contador
                if (typeof window.initOfferCountdown === 'function') {
                    window.initOfferCountdown(data.offer.hours, data.offer.discountText);
                }
            }
        } else {
            // Fallback por defecto si no hay data
            if (typeof window.initOfferCountdown === 'function') {
                window.initOfferCountdown(2, '');
            }
        }
    } catch (err) {
        console.warn('Backend no conectado. Contenido dinámico no cargado.', err);
        const videoContainer = document.getElementById('video-player-container');
        if (videoContainer && !videoContainer.querySelector('.vsl-player')) {
            renderVideoFallback(videoContainer, '', 'El video no está disponible en este momento.');
        }
    }
};

/**
 * Lógica del sistema de cupones de descuento.
 * @returns {void}
 */
const initCouponSystem = () => {
    const form = document.getElementById('coupon-form');
    const input = document.getElementById('coupon-input');
    const btn = document.getElementById('btn-apply-coupon');
    const feedback = document.getElementById('coupon-feedback');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (window.appState && window.appState.offerActive) {
            feedback.innerHTML = `<span style="color:var(--color-danger)">Ya hay una oferta global activa. Los cupones no son acumulativos.</span>`;
            return;
        }

        const code = input.value.trim();
        if (!code) return;

        btn.textContent = '...';
        btn.disabled = true;

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const ref = urlParams.get('ref');

            const res = await fetch('/api/validate-coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, ref })
            });

            const data = await res.json();

            if (res.ok && data.success && data.coupon) {
                feedback.textContent = data.coupon.message || '¡Cupón aplicado con éxito!';
                feedback.className = 'coupon-feedback success';
                
                // Efecto confeti rápido (opcional, sin librería)
                input.style.borderColor = 'var(--color-neon)';
                
                const couponUrl = data.coupon.url;
                let couponPrice = data.coupon.newPrice;
                
                // Si no hay un precio fijo configurado, extraer el porcentaje del mensaje (Ej. "50 OFF" -> 50%)
                if (!couponPrice && data.coupon.message) {
                    const match = data.coupon.message.match(/\d+/);
                    if (match) {
                        const percentage = parseInt(match[0], 10);
                        if (percentage >= 0 && percentage <= 100) {
                            couponPrice = `$${(17.00 * (1 - percentage / 100)).toFixed(2)} USD`;
                        }
                    }
                }

                if (couponUrl) {
                    const paymentBtns = document.querySelectorAll('[data-checkout-url]');
                    paymentBtns.forEach(pbtn => {
                        pbtn.setAttribute('data-checkout-url', couponUrl);
                    });
                }
                
                // Si el cupón tiene un nuevo precio configurado, actualizamos la UI
                if (couponPrice) {
                    // Actualizar textos en landing
                    const dynamicPrices = document.querySelectorAll('.dynamic-price');
                    dynamicPrices.forEach(el => {
                        // Evitar doble tachado
                        if (!el.hasAttribute('data-discount-applied')) {
                            const originalText = el.textContent;
                            el.innerHTML = `<del style="opacity:0.5; font-size:0.9em; margin-right:4px;">${originalText}</del> <span style="color:var(--color-neon);">${couponPrice}</span>`;
                            el.setAttribute('data-discount-applied', 'true');
                        }
                    });

                    // Actualizar el texto de precio en el modal de checkout si existe
                    const priceSummary = document.querySelector('.modal-price-summary');
                    if (priceSummary) {
                        priceSummary.innerHTML = `
                            <div>
                                <span class="modal-price-label">Precio con Cupón </span>
                                <span class="modal-price-value">${couponPrice}</span>
                            </div>
                            <span class="modal-price-status">✓ Activado</span>
                        `;
                    }
                }
            } else {
                feedback.textContent = data.error || 'Cupón inválido.';
                feedback.className = 'coupon-feedback error';
            }
        } catch (err) {
            feedback.textContent = 'Error al validar el cupón.';
            feedback.className = 'coupon-feedback error';
        } finally {
            btn.textContent = 'Aplicar';
            btn.disabled = false;
        }
    });
};

/**
 * Punto de entrada principal. Se llama cuando el DOM está listo.
 * @returns {void}
 */
const init = async () => {
    // 1. Cargar datos dinámicos primero
    await fetchDynamicContent();

    // 2. Inicializar Iconos Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // VanillaTilt solo en equipos con puntero preciso. En pantallas táctiles
    // evitamos sus listeners de movimiento/orientación y su coste continuo.
    if (typeof VanillaTilt !== 'undefined' && supportsDesktopEffects()) {
        VanillaTilt.init(document.querySelectorAll(".platform-card, .pilar-card, .device-card, .tilt-video"), {
            max: 5,
            speed: 400,
            glare: true,
            "max-glare": 0.15,
            scale: 1.02
        });
    }

    initScrollReveal();
    initNavbarScroll();
    initMobileFixedUi();
    initSmoothScroll();
    initSecurityGuards();
    initCouponSystem();

    // Inicializar Hero Cinematográfico
    initCinematicHeroIntro();
    initParallaxMouse();
    initMagneticButton();
};

document.addEventListener('DOMContentLoaded', init);
