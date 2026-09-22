/**
 * countdown.js — Timer de Oferta Regresivo
 * Santuario del Hombre — Landing Page
 *
 * @description Maneja el countdown de la sección de oferta.
 * Corre desde 2h 45m 30s. Los milisegundos simulan movimiento rápido.
 * En dispositivos móviles, los milisegundos se fijan en "00" para evitar
 * ciclos de repintado continuos (80ms) que drenan la batería.
 */

/** @type {number} Segundos totales iniciales */
let totalSeconds = 2 * 3600 + 45 * 60 + 30;

/** @type {HTMLElement|null} */
const hoursEl   = document.getElementById('countdown-hours');
/** @type {HTMLElement|null} */
const minutesEl = document.getElementById('countdown-minutes');
/** @type {HTMLElement|null} */
const secondsEl = document.getElementById('countdown-seconds');
/** @type {HTMLElement|null} */
const millisEl  = document.getElementById('countdown-millis');

/**
 * Devuelve true si la pantalla es de tipo móvil (< 768px).
 * Usado para desactivar el intervalo de milisegundos en móviles.
 * @returns {boolean}
 */
const isDeviceMobile = () => window.innerWidth < 768;

/**
 * Formatea un número con ceros a la izquierda.
 * @param {number} num - El número a formatear.
 * @param {number} size - El ancho mínimo de caracteres.
 * @returns {string} Número con padding de ceros.
 */
const padZero = (num, size) => String(num).padStart(size, '0');

/**
 * Actualiza el DOM del countdown con el tiempo actual.
 * @returns {void}
 */
const updateCountdown = () => {
    if (totalSeconds <= 0) {
        totalSeconds = 0;
    }

    const hours   = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hoursEl)   hoursEl.textContent   = padZero(hours, 2);
    if (minutesEl) minutesEl.textContent = padZero(minutes, 2);
    if (secondsEl) secondsEl.textContent = padZero(seconds, 2);

    if (totalSeconds > 0) {
        totalSeconds--;
    }
};

/**
 * Actualiza el display de milisegundos con un valor aleatorio
 * para simular movimiento rápido. Solo se ejecuta en desktop.
 * @returns {void}
 */
const updateMillis = () => {
    if (millisEl) {
        const rand = Math.floor(Math.random() * 90) + 10;
        millisEl.textContent = padZero(rand, 2);
    }
};

/**
 * Inicia el countdown timer con la configuración dinámica.
 * @param {number} hours - Las horas desde las que inicia el reloj.
 * @param {string} discountText - Texto de descuento (ej. "70%").
 * @returns {void}
 */
window.initOfferCountdown = (hours = 2, discountText = '') => {
    totalSeconds = hours * 3600;
    
    // Si hay un texto de descuento, modificar el label "La oferta expira en:"
    const labelEl = document.querySelector('.countdown-label');
    if (labelEl && discountText) {
        labelEl.textContent = `La oferta del ${discountText} expira en:`;
    }

    if (!hoursEl && !minutesEl && !secondsEl) return;

    updateCountdown();
    // Limpiar intervalos previos si los hubiera
    if (window.countdownInterval) clearInterval(window.countdownInterval);
    if (window.millisInterval) clearInterval(window.millisInterval);

    window.countdownInterval = setInterval(updateCountdown, 1000);

    if (!isDeviceMobile()) {
        window.millisInterval = setInterval(updateMillis, 80);
    } else {
        if (millisEl) millisEl.textContent = '00';
    }
};
