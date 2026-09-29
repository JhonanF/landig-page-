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

/**
 * Devuelve true si el ancho de pantalla es inferior al breakpoint móvil.
 * @param {number} [bp=768] - Breakpoint en px.
 * @returns {boolean}
 */
const isMobile = (bp = 768) => window.innerWidth < bp;

// ─── SCROLL REVEAL ──────────────────────────────────────────

/**
 * Inicializa el efecto de scroll reveal usando IntersectionObserver.
 * Los elementos con clase `.reveal` se animan al entrar al viewport.
 * @returns {void}
 */
const initScrollReveal = () => {
    const revealElements = document.querySelectorAll('.reveal');

    if (!revealElements.length) return;

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

    const handleScroll = () => {
        if (window.scrollY > SCROLL_THRESHOLD) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
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
const initSmoothScroll = () => {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (!targetId || targetId === '#') return;

            const targetEl = document.querySelector(targetId);
            if (!targetEl) return;

            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    const tlIntro = gsap.timeline({ defaults: { ease: "power4.out" } });
    const mobile = isMobile();

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
    if (!mobile && document.getElementById('canvas-3d')) {
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

    tlIntro.from(".btn-magnetic", {
        scale: 0.8,
        opacity: 0,
        duration: 1,
        onComplete: () => {
            // Inicializar el scroll trigger solo cuando termine la intro
            // para que no haya conflictos de opacity/scale.
            if (typeof initHeroScrollAnimation === 'function') {
                initHeroScrollAnimation();
            }
        }
    }, "-=0.8");
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

    gsap.registerPlugin(ScrollTrigger);

    const mobile = isMobile();

    // Evita el resize-jump de Safari iOS cuando la barra de URL se colapsa.
    // ignoreMobileResize impide que ScrollTrigger recalcule en cada resize táctil.
    ScrollTrigger.config({ ignoreMobileResize: true });

    const scrollTriggerConfig = {
        trigger: ".cinematic-hero",
        start: "top top",
        end: "+=120%",
        scrub: 1.2,
        pin: !mobile,         // Desactivar pin en móviles
        anticipatePin: mobile ? 0 : 1
    };

    const tlScroll = gsap.timeline({ scrollTrigger: scrollTriggerConfig });

    tlScroll
        .to(".text-layer", { scale: 1.25, opacity: 0, y: -150, duration: 1 }, 0)
        .to(".magnetic-wrap", { scale: 0.6, opacity: 0, y: 100, duration: 1 }, 0)
        .to(".bg-layer", { scale: 1.15, opacity: 0.3, duration: 1.2 }, 0)
        .to(".scroll-indicator", { opacity: 0, y: 50, duration: 0.4 }, 0)
        .fromTo(".carousel-layer",
            { opacity: 0, scale: 0.8, filter: "blur(15px)" },
            { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1 }, 0.4);

    // Canvas 3D solo existe en desktop
    if (!mobile) {
        tlScroll.to("#canvas-3d", { scale: 1.6, opacity: 0, filter: "blur(10px)", duration: 1.2 }, 0);
    }
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

        // 1. Población del VSL Video
        if (data.videoUrl) {
            const videoSource = document.getElementById('vsl-video-source');
            const videoEl = document.getElementById('main-vsl-video');
            if (videoSource && videoEl) {
                videoSource.src = data.videoUrl;
                videoEl.load(); // Forzar recarga del source
            }
        }

        // 2. Población del Carrusel de Fotos
        if (data.carouselImages && data.carouselImages.length > 0) {
            const track1 = document.getElementById('carousel-track-1');
            const track2 = document.getElementById('carousel-track-2');
            
            if (track1 && track2) {
                let html = '';
                data.carouselImages.forEach(img => {
                    html += `<img src="${img}" class="carousel-img" alt="Gallery Image">`;
                });
                track1.innerHTML = html;
                track2.innerHTML = html;
            }
        }

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
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (typeof VanillaTilt !== 'undefined' && !hasCoarsePointer) {
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
    initSmoothScroll();
    initSecurityGuards();
    initCouponSystem();

    // Inicializar Hero Cinematográfico
    initCinematicHeroIntro();
    initParallaxMouse();
    initMagneticButton();
};

document.addEventListener('DOMContentLoaded', init);
