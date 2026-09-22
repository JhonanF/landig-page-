/**
 * modal.js — Lógica de Modales de Checkout
 * Santuario del Hombre — Landing Page
 *
 * @description Maneja la apertura/cierre del modal de checkout
 * y el modal de confirmación de método de pago.
 */

/** @type {HTMLElement|null} */
const checkoutModal = document.getElementById('modal-checkout');
/** @type {HTMLElement|null} */
const confirmModal  = document.getElementById('modal-confirm');
/** @type {HTMLElement|null} */
const confirmTitle  = document.getElementById('modal-confirm-title');
/** @type {HTMLElement|null} */
const confirmText   = document.getElementById('modal-confirm-text');

/**
 * Muestra un elemento modal.
 * @param {HTMLElement} el - El elemento modal a mostrar.
 * @returns {void}
 */
const showModal = (el) => {
    if (!el) return;
    el.classList.remove('modal--hidden');
    el.classList.add('modal--visible');
    document.body.style.overflow = 'hidden';
    // Bloquea el scroll del body pero preserva la posición de scroll actual
    document.body.style.touchAction = 'none';
};

/**
 * Oculta un elemento modal.
 * @param {HTMLElement} el - El elemento modal a ocultar.
 * @returns {void}
 */
const hideModal = (el) => {
    if (!el) return;
    el.classList.remove('modal--visible');
    el.classList.add('modal--hidden');
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
};

/**
 * Abre el modal de checkout.
 * @returns {void}
 */
const openCheckoutModal = () => {
    showModal(checkoutModal);
};

/**
 * Cierra el modal de checkout.
 * @returns {void}
 */
const closeCheckoutModal = () => {
    hideModal(checkoutModal);
};

/**
 * Procesa la selección de un método de pago.
 * Añade estado de carga al botón, espera y luego abre el modal de confirmación.
 * @param {string} method - El nombre del método de pago seleccionado.
 * @param {HTMLElement} btn - El botón que fue clickeado.
 * @returns {void}
 */
const completePurchase = (method, btn) => {
    if (btn.classList.contains('is-loading')) return;

    // Obtener la URL configurada
    const checkoutUrl = btn.getAttribute('data-checkout-url');
    if (!checkoutUrl) {
        alert('Este método de pago aún no está configurado.');
        return;
    }

    // Estado de carga
    const originalContent = btn.innerHTML;
    btn.classList.add('is-loading');
    btn.innerHTML = `<div style="display:flex; justify-content:center; width:100%;"><span class="spinner-loader"></span> Procesando seguridad...</div>`;
    btn.style.pointerEvents = 'none';

    setTimeout(() => {
        btn.classList.remove('is-loading');
        btn.innerHTML = originalContent;
        btn.style.pointerEvents = 'auto';

        closeCheckoutModal();

        // Redirigir a la URL de pago configurada
        window.open(checkoutUrl, '_blank');
        
    }, 1500); // Efecto premium de espera
};

/**
 * Cierra el modal de confirmación.
 * @returns {void}
 */
const closeConfirmModal = () => {
    hideModal(confirmModal);
};

/**
 * Maneja el cierre de modales al presionar la tecla Escape.
 * @param {KeyboardEvent} e - El evento de teclado.
 * @returns {void}
 */
const handleEscapeKey = (e) => {
    if (e.key !== 'Escape') return;
    if (checkoutModal && !checkoutModal.classList.contains('modal--hidden')) {
        closeCheckoutModal();
    }
    if (confirmModal && !confirmModal.classList.contains('modal--hidden')) {
        closeConfirmModal();
    }
};

/**
 * Maneja el cierre de modales al hacer click en el backdrop.
 * @param {MouseEvent} e - El evento de click.
 * @returns {void}
 */
const handleBackdropClick = (e) => {
    if (e.target === checkoutModal) closeCheckoutModal();
    if (e.target === confirmModal)  closeConfirmModal();
};

/**
 * Inicializa los event listeners de los modales.
 * @returns {void}
 */
const initModals = () => {
    // Botones CTA que abren el checkout (múltiples en la página)
    const openTriggers = document.querySelectorAll('[data-open-checkout]');
    openTriggers.forEach((btn) => {
        btn.addEventListener('click', openCheckoutModal);
    });

    // Botones de método de pago
    const paymentBtns = document.querySelectorAll('[data-payment-method]');
    paymentBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const method = btn.getAttribute('data-payment-method') || 'Desconocido';
            completePurchase(method, btn);
        });
    });

    // Botones de cierre de modales
    const closeCheckoutBtns = document.querySelectorAll('[data-close-checkout]');
    closeCheckoutBtns.forEach((btn) => {
        btn.addEventListener('click', closeCheckoutModal);
    });

    const closeConfirmBtns = document.querySelectorAll('[data-close-confirm]');
    closeConfirmBtns.forEach((btn) => {
        btn.addEventListener('click', closeConfirmModal);
    });

    // Cerrar con Escape
    document.addEventListener('keydown', handleEscapeKey);

    // Cerrar al click en backdrop
    if (checkoutModal) checkoutModal.addEventListener('click', handleBackdropClick);
    if (confirmModal)  confirmModal.addEventListener('click', handleBackdropClick);
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initModals);
