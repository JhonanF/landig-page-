// admin.js - Lógica del Panel de Administración

const API_URL = '/api/content';

document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM - Video
    const videoForm = document.getElementById('video-form');
    const videoUrlInput = document.getElementById('video-url');
    const videoFeedback = document.getElementById('video-feedback');

    // Referencias DOM - Imágenes
    const imageForm = document.getElementById('image-form');
    const imageUpload = document.getElementById('image-upload');
    const fileNameDisplay = document.getElementById('file-name-display');
    const btnUploadImage = document.getElementById('btn-upload-image');
    const imageFeedback = document.getElementById('image-feedback');
    const galleryGrid = document.getElementById('gallery-grid');

    // Referencias DOM - Login
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const loginFeedback = document.getElementById('login-feedback');
    const btnLogin = document.getElementById('btn-login');

    // Referencias DOM - Payment
    const paymentForm = document.getElementById('payment-form');
    const paymentCard = document.getElementById('payment-card');
    const paymentCardActive = document.getElementById('payment-card-active');
    const paymentPaypal = document.getElementById('payment-paypal');
    const paymentPaypalActive = document.getElementById('payment-paypal-active');
    const paymentCrypto = document.getElementById('payment-crypto');
    const paymentCryptoActive = document.getElementById('payment-crypto-active');
    const paymentFeedback = document.getElementById('payment-feedback');
    const btnSavePayment = document.getElementById('btn-save-payment');

    // Referencias DOM - Offer
    const offerForm = document.getElementById('offer-form');
    const offerActive = document.getElementById('offer-active');
    const offerDiscountText = document.getElementById('offer-discount-text');
    const offerHours = document.getElementById('offer-hours');
    const offerFeedback = document.getElementById('offer-feedback');
    const btnSaveOffer = document.getElementById('btn-save-offer');

    // Referencias DOM - Coupons
    const couponsContainer = document.getElementById('coupons-container');
    const btnAddCoupon = document.getElementById('btn-add-coupon');
    const btnSaveCoupons = document.getElementById('btn-save-coupons');
    const couponsFeedback = document.getElementById('coupons-feedback');
    let couponsData = [];

    // Referencias DOM - Sellers
    const sellersContainer = document.getElementById('sellers-container');
    const btnAddSeller = document.getElementById('btn-add-seller');
    const btnSaveSellers = document.getElementById('btn-save-sellers');
    const sellersFeedback = document.getElementById('sellers-feedback');
    let sellersData = [];

    // Referencias DOM - Social
    const socialForm = document.getElementById('social-form');
    const socialWhatsapp = document.getElementById('social-whatsapp');
    const socialWhatsappActive = document.getElementById('social-whatsapp-active');
    const socialTelegram = document.getElementById('social-telegram');
    const socialTelegramActive = document.getElementById('social-telegram-active');
    const socialInstagram = document.getElementById('social-instagram');
    const socialInstagramActive = document.getElementById('social-instagram-active');
    const socialFeedback = document.getElementById('social-feedback');
    const btnSaveSocial = document.getElementById('btn-save-social');

    // Utilidad: Mostrar mensaje de feedback
    const showFeedback = (element, message, type) => {
        element.textContent = message;
        element.className = `feedback-msg ${type}`;
        setTimeout(() => {
            element.textContent = '';
            element.className = 'feedback-msg';
        }, 4000);
    };

    let toastHideTimer = null;
    let toastCleanupTimer = null;

    const getToastElement = () => {
        let toast = document.getElementById('admin-toast');
        if (toast) return toast;

        toast = document.createElement('div');
        toast.id = 'admin-toast';
        toast.className = 'admin-toast';
        toast.setAttribute('aria-atomic', 'true');
        toast.setAttribute('aria-hidden', 'true');
        document.body.appendChild(toast);
        return toast;
    };

    const showToast = (message, type = 'success') => {
        const toast = getToastElement();
        const isError = type === 'error';

        clearTimeout(toastHideTimer);
        clearTimeout(toastCleanupTimer);
        toast.className = `admin-toast admin-toast--${isError ? 'error' : 'success'}`;
        toast.setAttribute('role', isError ? 'alert' : 'status');
        toast.setAttribute('aria-live', isError ? 'assertive' : 'polite');
        toast.setAttribute('aria-hidden', 'false');

        const icon = document.createElement('span');
        icon.className = 'admin-toast__icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = isError ? '✕' : '✓';

        const text = document.createElement('span');
        text.className = 'admin-toast__message';
        text.textContent = message;
        toast.replaceChildren(icon, text);

        requestAnimationFrame(() => toast.classList.add('is-visible'));
        toastHideTimer = setTimeout(() => {
            toast.classList.remove('is-visible');
            toastCleanupTimer = setTimeout(() => {
                toast.setAttribute('aria-hidden', 'true');
                toast.replaceChildren();
            }, 250);
        }, 2600);
    };

    const copyToClipboard = async (text) => {
        let clipboardError = null;

        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch (error) {
            clipboardError = error;
        }

        let textarea = null;
        try {
            textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            Object.assign(textarea.style, {
                position: 'fixed',
                top: '-9999px',
                left: '-9999px',
                width: '1px',
                height: '1px',
                opacity: '0'
            });
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            textarea.setSelectionRange(0, textarea.value.length);

            if (typeof document.execCommand !== 'function' || !document.execCommand('copy')) {
                throw new Error('El navegador rechazó el método alternativo de copia.');
            }

            return true;
        } catch (fallbackError) {
            const error = new Error('No se pudo copiar el enlace.');
            error.clipboardError = clipboardError;
            error.cause = fallbackError;
            throw error;
        } finally {
            textarea?.remove();
        }
    };

    const copyButtonStates = new WeakMap();

    const restoreCopyButton = (button, refreshIcons = true) => {
        const state = copyButtonStates.get(button);
        if (!state) return;

        clearTimeout(state.restoreTimer);
        button.innerHTML = state.originalHTML;
        if (state.originalAriaLabel === null) {
            button.removeAttribute('aria-label');
        } else {
            button.setAttribute('aria-label', state.originalAriaLabel);
        }
        copyButtonStates.delete(button);
        if (refreshIcons && window.lucide) window.lucide.createIcons();
    };

    const handleCopySellerLink = async (button) => {
        const state = copyButtonStates.get(button) || {
            originalHTML: button.innerHTML,
            originalAriaLabel: button.getAttribute('aria-label'),
            restoreTimer: null
        };
        clearTimeout(state.restoreTimer);
        state.restoreTimer = null;
        copyButtonStates.set(button, state);
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');

        try {
            await copyToClipboard(button.dataset.link);
            button.innerHTML = '<i data-lucide="check" style="width:16px;"></i> Copiado';
            button.setAttribute('aria-label', 'Enlace copiado');
            if (window.lucide) window.lucide.createIcons();
            showToast('Enlace copiado al portapapeles', 'success');

            state.restoreTimer = setTimeout(() => {
                if (button.isConnected) restoreCopyButton(button);
            }, 2500);
        } catch (error) {
            console.error('[Clipboard]', error);
            restoreCopyButton(button);
            showToast('No se pudo copiar el enlace', 'error');
        } finally {
            if (button.isConnected) {
                button.disabled = false;
                button.removeAttribute('aria-busy');
            }
        }
    };

    // Utilidad: Renderizar Cupones
    const renderCoupons = () => {
        couponsContainer.innerHTML = '';
        if (couponsData.length === 0) {
            couponsContainer.innerHTML = '<p class="admin-empty-state">No hay cupones creados.</p>';
            return;
        }

        couponsData.forEach((c, index) => {
            const div = document.createElement('div');
            div.className = 'input-group admin-repeater-card coupon-card';

            div.innerHTML = `
                <div class="repeater-card-header">
                    <label class="repeater-card-title">Cupón #${index + 1}</label>
                    <div class="repeater-card-actions">
                        <label class="switch">
                            <input type="checkbox" class="coupon-active-toggle" data-index="${index}" aria-label="Activar cupón #${index + 1}" ${c.active !== false ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                        <button type="button" class="btn btn-outline btn-delete-coupon admin-danger-button" data-index="${index}">
                            <i data-lucide="trash-2" aria-hidden="true"></i> Eliminar
                        </button>
                    </div>
                </div>
                <input type="text" class="coupon-code-input" data-index="${index}" aria-label="Código del cupón #${index + 1}" placeholder="Código (ej. DESC50)" value="${c.code || ''}">
                <input type="text" class="coupon-msg-input" data-index="${index}" aria-label="Mensaje del cupón #${index + 1}" placeholder="Mensaje de éxito (ej. ¡Tienes 50%!)" value="${c.message || ''}">
                <div class="coupon-value-row">
                    <input type="url" class="coupon-url-input" data-index="${index}" aria-label="URL de pago del cupón #${index + 1}" placeholder="URL del pago rebajado (Stripe/PayPal)" value="${c.url || ''}">
                    <input type="text" class="coupon-price-input" data-index="${index}" aria-label="Nuevo precio del cupón #${index + 1}" placeholder="Nuevo Precio (Ej. $4.25)" value="${c.newPrice || ''}">
                </div>
            `;
            couponsContainer.appendChild(div);
        });

        // Add Listeners to dynamic inputs
        document.querySelectorAll('.coupon-active-toggle').forEach(el => {
            el.addEventListener('change', (e) => {
                couponsData[e.target.dataset.index].active = e.target.checked;
            });
        });
        document.querySelectorAll('.coupon-code-input').forEach(el => {
            el.addEventListener('input', (e) => {
                couponsData[e.target.dataset.index].code = e.target.value.trim();
            });
        });
        document.querySelectorAll('.coupon-msg-input').forEach(el => {
            el.addEventListener('input', (e) => {
                couponsData[e.target.dataset.index].message = e.target.value;
            });
        });
        document.querySelectorAll('.coupon-url-input').forEach(el => {
            el.addEventListener('input', (e) => {
                couponsData[e.target.dataset.index].url = e.target.value.trim();
            });
        });
        document.querySelectorAll('.coupon-price-input').forEach(el => {
            el.addEventListener('input', (e) => {
                couponsData[e.target.dataset.index].newPrice = e.target.value.trim();
            });
        });
        document.querySelectorAll('.btn-delete-coupon').forEach(el => {
            el.addEventListener('click', (e) => {
                const idx = e.currentTarget.dataset.index;
                couponsData.splice(idx, 1);
                renderCoupons();
            });
        });

        // Re-init lucide icons for dynamic elements
        if (window.lucide) {
            window.lucide.createIcons();
        }
    };

    // Utilidad: Renderizar Vendedores
    const renderSellers = () => {
        sellersContainer.querySelectorAll('.btn-copy-seller')
            .forEach(button => restoreCopyButton(button, false));
        sellersContainer.innerHTML = '';
        if (sellersData.length === 0) {
            sellersContainer.innerHTML = '<p class="admin-empty-state">No hay vendedores creados.</p>';
            return;
        }

        sellersData.forEach((s, index) => {
            const div = document.createElement('div');
            div.className = 'input-group admin-repeater-card seller-card';

            const currentUrl = window.location.origin;
            const refLink = `${currentUrl}/?ref=${s.id || 'ID'}`;

            div.innerHTML = `
                <div class="seller-fields">
                    <input type="text" class="seller-name-input" data-index="${index}" aria-label="Nombre completo del vendedor #${index + 1}" placeholder="Nombre Completo" value="${s.name || ''}">
                    <div class="seller-credentials">
                        <input type="text" class="seller-id-input" data-index="${index}" aria-label="Usuario del vendedor #${index + 1}" placeholder="Usuario (ej. juan)" value="${s.id || ''}">
                        <input type="text" class="seller-pass-input" data-index="${index}" aria-label="Contraseña del vendedor #${index + 1}" placeholder="Contraseña" value="${s.password || ''}">
                    </div>
                </div>
                <div class="seller-actions">
                    <button type="button" class="btn btn-copy-seller" data-link="${refLink}">
                        <i data-lucide="copy" aria-hidden="true"></i> Copiar URL
                    </button>
                    <button type="button" class="btn btn-outline btn-delete-seller admin-danger-button" data-index="${index}">
                        <i data-lucide="trash-2" aria-hidden="true"></i> Eliminar
                    </button>
                </div>
            `;
            sellersContainer.appendChild(div);
        });

        // Add Listeners
        document.querySelectorAll('.seller-id-input').forEach(el => {
            el.addEventListener('input', (e) => {
                sellersData[e.target.dataset.index].id = e.target.value.trim().toLowerCase();
            });
        });
        document.querySelectorAll('.seller-name-input').forEach(el => {
            el.addEventListener('input', (e) => {
                sellersData[e.target.dataset.index].name = e.target.value;
            });
        });
        document.querySelectorAll('.seller-pass-input').forEach(el => {
            el.addEventListener('input', (e) => {
                sellersData[e.target.dataset.index].password = e.target.value;
            });
        });
        document.querySelectorAll('.btn-delete-seller').forEach(el => {
            el.addEventListener('click', (e) => {
                sellersData.splice(e.currentTarget.dataset.index, 1);
                renderSellers();
            });
        });
        document.querySelectorAll('.btn-copy-seller').forEach(el => {
            el.addEventListener('click', (e) => handleCopySellerLink(e.currentTarget));
        });

        if (window.lucide) {
            window.lucide.createIcons();
        }
    };

    // Helper para hacer fetch con el token
    const fetchWithAuth = async (url, options = {}) => {
        const token = localStorage.getItem('santuario_admin_token');
        const headers = { ...options.headers };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch(url, { ...options, headers });
        if (res.status === 401) {
            // Token inválido o expirado
            loginOverlay.classList.remove('hidden');
            const error = new Error('No autorizado');
            error.requestKind = 'api';
            error.status = 401;
            throw error;
        }
        return res;
    };

    const createRequestError = (kind, message, details = {}) => {
        const error = new Error(message);
        error.requestKind = kind;
        Object.assign(error, details);
        return error;
    };

    const requestJson = async (url, options = {}) => {
        let response;
        try {
            response = await fetchWithAuth(url, options);
        } catch (error) {
            if (error.requestKind) throw error;
            throw createRequestError('network', 'No se pudo conectar con el servidor.', { cause: error });
        }

        let result;
        try {
            result = await response.json();
        } catch (error) {
            throw createRequestError('parse', 'El servidor devolvió una respuesta inválida.', {
                status: response.status,
                cause: error
            });
        }

        if (!response.ok) {
            if (result && typeof result.error === 'string' && result.error) {
                throw createRequestError('api', result.error, { status: response.status });
            }

            throw createRequestError(
                'http',
                `El servidor respondió con un error HTTP ${response.status}.`,
                { status: response.status }
            );
        }

        if (result && result.success === false) {
            throw createRequestError('api', result.error || 'La operación fue rechazada por el servidor.');
        }

        return result;
    };

    const getCarouselImagesFromResponse = (result) => {
        const images = result?.data?.carouselImages;
        if (!Array.isArray(images)) {
            throw createRequestError(
                'response',
                'La respuesta del servidor no contiene una galería válida.'
            );
        }
        return images;
    };

    const getCarouselErrorMessage = (error, fallbackMessage) => {
        if (error.requestKind === 'api' || error.requestKind === 'http' ||
            error.requestKind === 'parse' || error.requestKind === 'response' ||
            error.requestKind === 'network') {
            return error.message;
        }

        return fallbackMessage;
    };

    // 0. Manejo del Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnLogin.textContent = 'Verificando...';
        btnLogin.disabled = true;

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: loginUsername.value, 
                    password: loginPassword.value 
                })
            });

            const data = await res.json();
            
            if (data.success) {
                localStorage.setItem('santuario_admin_token', data.token);
                localStorage.setItem('santuario_user_role', data.role); // 'admin' o 'seller'
                loginOverlay.classList.add('hidden');
                loginPassword.value = '';
                applyRoleRestrictions(data.role);
                loadContent(); // Cargar los datos al loguearse con éxito
            } else {
                showFeedback(loginFeedback, 'Credenciales incorrectas.', 'error');
            }
        } catch (error) {
            showFeedback(loginFeedback, 'Error conectando al servidor.', 'error');
        } finally {
            btnLogin.textContent = 'Ingresar al Panel';
            btnLogin.disabled = false;
        }
    });

    const applyRoleRestrictions = (role) => {
        if (role === 'seller') {
            // Ocultar la sección de crear vendedores para que un vendedor no cree otros
            const sellerSection = document.getElementById('btn-add-seller').closest('.admin-section');
            if (sellerSection) sellerSection.style.display = 'none';
        } else {
            const sellerSection = document.getElementById('btn-add-seller').closest('.admin-section');
            if (sellerSection) sellerSection.style.display = 'block';
        }
    };


    // 1. Cargar datos iniciales
    const loadContent = async () => {
        try {
            const res = await fetchWithAuth(API_URL);
            const data = await res.json();
            
            // Poblar video
            if (data.videoUrl) {
                videoUrlInput.value = data.videoUrl;
            }

            // Poblar redes sociales
            if (data.socialLinks) {
                if (data.socialLinks.whatsapp) {
                    socialWhatsapp.value = data.socialLinks.whatsapp.url || '';
                    socialWhatsappActive.checked = data.socialLinks.whatsapp.active !== false;
                }
                if (data.socialLinks.telegram) {
                    socialTelegram.value = data.socialLinks.telegram.url || '';
                    socialTelegramActive.checked = data.socialLinks.telegram.active !== false;
                }
                if (data.socialLinks.instagram) {
                    socialInstagram.value = data.socialLinks.instagram.url || '';
                    socialInstagramActive.checked = data.socialLinks.instagram.active !== false;
                }
            }

            // Poblar pagos
            if (data.paymentLinks) {
                if (data.paymentLinks.card) {
                    paymentCard.value = data.paymentLinks.card.url || '';
                    paymentCardActive.checked = data.paymentLinks.card.active !== false;
                }
                if (data.paymentLinks.paypal) {
                    paymentPaypal.value = data.paymentLinks.paypal.url || '';
                    paymentPaypalActive.checked = data.paymentLinks.paypal.active !== false;
                }
                if (data.paymentLinks.crypto) {
                    paymentCrypto.value = data.paymentLinks.crypto.url || '';
                    paymentCryptoActive.checked = data.paymentLinks.crypto.active !== false;
                }
            }

            // Poblar oferta
            if (data.offer) {
                offerActive.checked = data.offer.active !== false;
                offerDiscountText.value = data.offer.discountText || '';
                offerHours.value = data.offer.hours || 2;
            }

            // Poblar cupones
            if (data.coupons) {
                couponsData = data.coupons;
                renderCoupons();
            }

            // Poblar vendedores
            if (data.sellers) {
                sellersData = data.sellers;
                renderSellers();
            }

            // Poblar galería
            renderGallery(data.carouselImages || []);
        } catch (error) {
            console.error('Error cargando contenido:', error);
            galleryGrid.innerHTML = '<div class="gallery-loading">Error cargando imágenes.</div>';
        }
    };

    const buildImageSrc = (imgUrl) => {
        if (typeof imgUrl !== 'string' || !imgUrl.trim()) return '';

        const cleanUrl = imgUrl.trim();
        const isExternalUrl = /^(?:https?:)?\/\//i.test(cleanUrl);
        if (isExternalUrl) return cleanUrl;

        const hashIndex = cleanUrl.indexOf('#');
        const urlWithoutHash = hashIndex === -1 ? cleanUrl : cleanUrl.slice(0, hashIndex);
        const hash = hashIndex === -1 ? '' : cleanUrl.slice(hashIndex);
        const separator = urlWithoutHash.includes('?') ? '&' : '?';
        return `${urlWithoutHash}${separator}t=${Date.now()}${hash}`;
    };

    const createImagePlaceholder = () => {
        const placeholder = document.createElement('div');
        placeholder.textContent = 'Imagen no disponible';
        placeholder.setAttribute('role', 'img');
        placeholder.setAttribute('aria-label', 'Imagen no disponible');
        Object.assign(placeholder.style, {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            color: 'var(--text-muted)',
            background: '#111',
            fontSize: '0.85rem',
            textAlign: 'center'
        });
        return placeholder;
    };

    const renderGallery = (images) => {
        galleryGrid.innerHTML = '';
        if (images.length === 0) {
            galleryGrid.innerHTML = '<div class="gallery-loading">No hay imágenes en el carrusel.</div>';
            return;
        }

        images.forEach(imgUrl => {
            const item = document.createElement('div');
            item.className = 'gallery-item';

            const delBtn = document.createElement('button');
            delBtn.className = 'gallery-item-delete';
            delBtn.innerHTML = '<i data-lucide="trash-2" aria-hidden="true"></i>';
            delBtn.title = "Eliminar imagen";
            delBtn.setAttribute('aria-label', 'Eliminar imagen');
            
            delBtn.addEventListener('click', () => deleteImage(imgUrl));

            const imageSrc = buildImageSrc(imgUrl);
            if (imageSrc) {
                const img = document.createElement('img');
                img.src = imageSrc;
                img.alt = 'Imagen del carrusel';
                img.addEventListener('error', () => {
                    if (img.parentNode === item) {
                        item.replaceChild(createImagePlaceholder(), img);
                    }
                }, { once: true });
                item.appendChild(img);
            } else {
                item.appendChild(createImagePlaceholder());
            }

            item.appendChild(delBtn);
            galleryGrid.appendChild(item);
        });

        // Reinicializar iconos si hay nuevos
        if (window.lucide) {
            lucide.createIcons();
        }
    };

    // 1.2 Guardar Pagos
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        btnSavePayment.textContent = 'Guardando...';
        btnSavePayment.disabled = true;

        const payload = {
            paymentLinks: {
                card: { url: paymentCard.value.trim(), active: paymentCardActive.checked },
                paypal: { url: paymentPaypal.value.trim(), active: paymentPaypalActive.checked },
                crypto: { url: paymentCrypto.value.trim(), active: paymentCryptoActive.checked }
            }
        };

        try {
            const res = await fetchWithAuth(`${API_URL}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showFeedback(paymentFeedback, 'Métodos de pago actualizados.', 'success');
            } else {
                throw new Error('Error al guardar');
            }
        } catch (error) {
            showFeedback(paymentFeedback, 'Error al guardar pagos.', 'error');
        } finally {
            btnSavePayment.textContent = 'Guardar Pagos';
            btnSavePayment.disabled = false;
        }
    });

    // 1.3 Gestionar Oferta
    offerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        btnSaveOffer.textContent = 'Guardando...';
        btnSaveOffer.disabled = true;

        const payload = {
            offer: {
                active: offerActive.checked,
                discountText: offerDiscountText.value.trim(),
                hours: parseFloat(offerHours.value) || 2
            }
        };

        try {
            const res = await fetchWithAuth(`${API_URL}/offer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showFeedback(offerFeedback, 'Configuración de oferta guardada.', 'success');
            } else {
                throw new Error('Error al guardar');
            }
        } catch (error) {
            showFeedback(offerFeedback, 'Error al guardar la oferta.', 'error');
        } finally {
            btnSaveOffer.textContent = 'Guardar Configuración de Oferta';
            btnSaveOffer.disabled = false;
        }
    });

    // 1.4 Gestionar Cupones
    btnAddCoupon.addEventListener('click', () => {
        couponsData.push({ code: '', message: '', url: '', newPrice: '', active: true });
        renderCoupons();
    });

    btnSaveCoupons.addEventListener('click', async () => {
        btnSaveCoupons.textContent = 'Guardando...';
        btnSaveCoupons.disabled = true;

        const payload = { coupons: couponsData };

        try {
            const res = await fetchWithAuth(`${API_URL}/coupons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showFeedback(couponsFeedback, 'Cupones actualizados correctamente.', 'success');
            } else {
                throw new Error('Error al guardar');
            }
        } catch (error) {
            showFeedback(couponsFeedback, 'Error al guardar cupones.', 'error');
        } finally {
            btnSaveCoupons.textContent = 'Guardar Cambios de Cupones';
            btnSaveCoupons.disabled = false;
        }
    });

    // 1.4.5 Gestionar Vendedores
    btnAddSeller.addEventListener('click', () => {
        sellersData.push({ id: '', name: '', paymentLinks: { card: '', paypal: '', crypto: '' } });
        renderSellers();
    });

    btnSaveSellers.addEventListener('click', async () => {
        btnSaveSellers.textContent = 'Guardando...';
        btnSaveSellers.disabled = true;

        const payload = { sellers: sellersData };

        try {
            const res = await fetchWithAuth(`${API_URL}/sellers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showFeedback(sellersFeedback, 'Vendedores actualizados correctamente.', 'success');
                renderSellers(); // to update copy links based on new ID
            } else {
                throw new Error('Error al guardar');
            }
        } catch (error) {
            showFeedback(sellersFeedback, 'Error al guardar vendedores.', 'error');
        } finally {
            btnSaveSellers.textContent = 'Guardar Cambios de Vendedores';
            btnSaveSellers.disabled = false;
        }
    });

    // 1.5. Guardar Redes Sociales
    socialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        btnSaveSocial.textContent = 'Guardando...';
        btnSaveSocial.disabled = true;

        const payload = {
            socialLinks: {
                whatsapp: { 
                    url: socialWhatsapp.value.trim(), 
                    active: socialWhatsappActive.checked 
                },
                telegram: { 
                    url: socialTelegram.value.trim(), 
                    active: socialTelegramActive.checked 
                },
                instagram: { 
                    url: socialInstagram.value.trim(), 
                    active: socialInstagramActive.checked 
                }
            }
        };

        try {
            const res = await fetchWithAuth(`${API_URL}/social`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showFeedback(socialFeedback, 'Redes actualizadas correctamente.', 'success');
            } else {
                throw new Error('Error al guardar');
            }
        } catch (error) {
            showFeedback(socialFeedback, 'Hubo un error al guardar las redes.', 'error');
        } finally {
            btnSaveSocial.textContent = 'Guardar Redes Sociales';
            btnSaveSocial.disabled = false;
        }
    });

    const isValidVideoUrl = (value) => {
        if (typeof value !== 'string' || !value.trim()) return false;

        const cleanUrl = value.trim();
        try {
            const parsedUrl = new URL(cleanUrl, window.location.origin);
            const hasExplicitProtocol = /^[A-Za-z][A-Za-z\d+.-]*:/.test(cleanUrl);

            if (hasExplicitProtocol) {
                return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
            }

            if (cleanUrl.startsWith('//')) return false;
            return /\.(?:mp4|webm|ogg|ogv|m4v|mov|mpeg|mpg|m3u8)$/i.test(parsedUrl.pathname);
        } catch (error) {
            return false;
        }
    };

    // 2. Guardar Video
    videoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = videoUrlInput.value.trim();
        if (!isValidVideoUrl(url)) {
            showFeedback(videoFeedback, 'Introduce una URL de video válida.', 'error');
            return;
        }

        const btn = document.getElementById('btn-save-video');
        const originalText = btn.textContent;
        btn.textContent = 'Guardando...';
        btn.disabled = true;

        try {
            const res = await fetchWithAuth(`${API_URL}/video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl: url })
            });

            if (res.ok) {
                showFeedback(videoFeedback, '✓ Video actualizado correctamente.', 'success');
            } else {
                const result = await res.json().catch(() => null);
                throw new Error(result?.error || `Error HTTP ${res.status}`);
            }
        } catch (error) {
            console.error('[Video Admin]', error);
            showFeedback(videoFeedback, error.message || 'Hubo un error al guardar el video.', 'error');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    // 3. Manejo de archivo (preview name)
    imageUpload.addEventListener('change', () => {
        if (imageUpload.files && imageUpload.files.length > 0) {
            fileNameDisplay.textContent = imageUpload.files[0].name;
            btnUploadImage.disabled = false;
        } else {
            fileNameDisplay.textContent = 'Ningún archivo seleccionado';
            btnUploadImage.disabled = true;
        }
    });

    // 4. Subir Imagen
    imageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!imageUpload.files || imageUpload.files.length === 0) return;

        const file = imageUpload.files[0];
        const formData = new FormData();
        formData.append('image', file);

        btnUploadImage.textContent = 'Subiendo...';
        btnUploadImage.disabled = true;

        try {
            const result = await requestJson(`${API_URL}/images`, {
                method: 'POST',
                body: formData
            });

            const carouselImages = getCarouselImagesFromResponse(result);
            imageUpload.value = '';
            fileNameDisplay.textContent = 'Ningún archivo seleccionado';
            renderGallery(carouselImages);
            showFeedback(imageFeedback, 'Imagen subida con éxito.', 'success');
        } catch (error) {
            console.error('[Carousel Upload]', error);
            showFeedback(
                imageFeedback,
                getCarouselErrorMessage(error, 'Ocurrió un error interno al subir la imagen.'),
                'error'
            );
        } finally {
            btnUploadImage.textContent = 'Subir Imagen';
            btnUploadImage.disabled = !imageUpload.files || imageUpload.files.length === 0;
        }
    });

    // 5. Eliminar Imagen
    const deleteImage = async (imageUrl) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta imagen?')) return;

        try {
            const result = await requestJson(`${API_URL}/images`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl })
            });

            renderGallery(getCarouselImagesFromResponse(result));
            showFeedback(imageFeedback, 'Imagen eliminada correctamente.', 'success');
        } catch (error) {
            console.error('[Carousel Delete]', error);
            showFeedback(
                imageFeedback,
                getCarouselErrorMessage(error, 'Ocurrió un error interno al eliminar la imagen.'),
                'error'
            );
        }
    };

    // Iniciar: si hay token intentamos cargar, si no, mostramos login
    const savedToken = localStorage.getItem('santuario_admin_token');
    const savedRole = localStorage.getItem('santuario_user_role');
    if (savedToken) {
        if (savedRole) applyRoleRestrictions(savedRole);
        loadContent().catch(() => loginOverlay.classList.remove('hidden'));
    } else {
        loginOverlay.classList.remove('hidden');
    }
});
