// editor.js - Lógica del Editor Visual en Vivo

const EDITOR_ELEMENT_SELECTOR = 'h1, h2, h3, h4, p, span, li, .price, button, a';
const EDITOR_TEMP_CLASSES = [
    'editable',
    'editor-mode',
    'editor-selected',
    'editor-hover',
    'editor-active'
];
const EDITOR_EXCLUDED_SELECTOR = [
    '#editor-toolbar',
    'script',
    'style',
    'noscript',
    'template',
    '[aria-hidden="true"]',
    '[data-editor-ignore]',
    '.countdown-number',
    '.countdown-unit-label',
    '.dynamic-price',
    '.modal-price-label',
    '.modal-price-value',
    '.modal-price-status',
    '.coupon-feedback',
    '.vsl-player-loading',
    '.vsl-player-fallback'
].join(', ');
const EDITOR_PROTECTED_CONTENT_SELECTOR = [
    'i[data-lucide]',
    'svg',
    'img',
    'picture',
    'video',
    'iframe',
    'canvas',
    'input',
    'textarea',
    'select'
].join(', ');

const isSafeEditableElement = (element) => {
    if (!element.textContent.trim()) return false;
    if (element.closest(EDITOR_EXCLUDED_SELECTOR)) return false;
    if (element.querySelector(EDITOR_PROTECTED_CONTENT_SELECTOR)) return false;
    return true;
};

const getSafeEditableElements = (root) => {
    const candidates = Array.from(root.querySelectorAll(EDITOR_ELEMENT_SELECTOR))
        .filter(isSafeEditableElement);
    const candidateSet = new Set(candidates);

    return candidates.filter((element) => {
        let ancestor = element.parentElement;
        while (ancestor) {
            if (candidateSet.has(ancestor)) return false;
            ancestor = ancestor.parentElement;
        }
        return true;
    });
};

const cleanEditorArtifacts = (root) => {
    if (!root) return root;

    if (root.nodeType === Node.ELEMENT_NODE && root.id === 'editor-toolbar') {
        root.remove();
        return root;
    }

    root.querySelectorAll?.('#editor-toolbar').forEach(element => element.remove());

    const elements = [];
    if (root.nodeType === Node.ELEMENT_NODE) elements.push(root);
    root.querySelectorAll?.('*').forEach(element => elements.push(element));

    elements.forEach((element) => {
        const hasEditorMarker =
            EDITOR_TEMP_CLASSES.some(className => element.classList.contains(className)) ||
            element.hasAttribute('contenteditable') ||
            Array.from(element.attributes).some(attribute => attribute.name.startsWith('data-editor-'));

        EDITOR_TEMP_CLASSES.forEach(className => element.classList.remove(className));
        if (!element.className && element.hasAttribute('class')) {
            element.removeAttribute('class');
        }

        element.removeAttribute('contenteditable');
        if (hasEditorMarker || element.getAttribute('spellcheck') === 'true') {
            element.removeAttribute('spellcheck');
        }
        Array.from(element.attributes).forEach((attribute) => {
            if (attribute.name.startsWith('data-editor-')) {
                element.removeAttribute(attribute.name);
            }
        });
    });

    return root;
};

const hasEditorArtifacts = (root) => {
    const elements = [];
    if (root.nodeType === Node.ELEMENT_NODE) elements.push(root);
    root.querySelectorAll?.('*').forEach(element => elements.push(element));

    return elements.some((element) =>
        element.id === 'editor-toolbar' ||
        EDITOR_TEMP_CLASSES.some(className => element.classList.contains(className)) ||
        element.hasAttribute('contenteditable') ||
        element.getAttribute('spellcheck') === 'true' ||
        Array.from(element.attributes).some(attribute => attribute.name.startsWith('data-editor-'))
    );
};

const getPublicUrl = () => {
    const publicUrl = new URL(window.location.href);
    publicUrl.searchParams.delete('edit');
    publicUrl.searchParams.delete('nocache');
    return publicUrl;
};

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isEditMode = urlParams.get('edit') === 'true';

    if (!isEditMode) return;

    const token = localStorage.getItem('santuario_admin_token');
    if (!token) {
        alert('Debes iniciar sesión en el Panel de Administración primero.');
        window.location.href = '/admin.html';
        return;
    }

    document.body.classList.add('editor-mode');

    const toolbar = document.createElement('div');
    toolbar.id = 'editor-toolbar';
    toolbar.innerHTML = `
        <div class="editor-status">
            <span></span> Modo Edición Visual Activo
        </div>
        <div class="editor-actions">
            <button class="btn-editor" id="editor-cancel">Cancelar</button>
            <button class="btn-editor btn-editor-save" id="editor-save">Guardar Cambios</button>
        </div>
    `;
    document.body.prepend(toolbar);

    const editableElements = getSafeEditableElements(document);
    editableElements.forEach((element, index) => {
        element.setAttribute('contenteditable', 'true');
        element.setAttribute('spellcheck', 'true');
        element.setAttribute('data-editor-index', String(index));
        element.classList.add('editable');
    });

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (link && !link.closest('#editor-toolbar')) event.preventDefault();
    });

    document.getElementById('editor-cancel').addEventListener('click', () => {
        if (confirm('¿Descartar cambios y salir del modo edición?')) {
            window.location.href = getPublicUrl().href;
        }
    });

    document.getElementById('editor-save').addEventListener('click', async () => {
        const btnSave = document.getElementById('editor-save');
        if (btnSave.disabled) return;

        btnSave.textContent = 'Guardando...';
        btnSave.disabled = true;
        let saveSucceeded = false;

        try {
            const cleanUrl = getPublicUrl();
            cleanUrl.searchParams.set('nocache', String(Date.now()));
            const cleanResponse = await fetch(cleanUrl.href, { cache: 'no-store' });
            if (!cleanResponse.ok) {
                throw new Error(`No se pudo cargar el documento original (HTTP ${cleanResponse.status}).`);
            }

            const cleanHTMLText = await cleanResponse.text();
            const parser = new DOMParser();
            const cleanDOM = parser.parseFromString(cleanHTMLText, 'text/html');
            cleanEditorArtifacts(cleanDOM);

            const cleanTextElements = getSafeEditableElements(cleanDOM);
            const currentElementsAreConnected = editableElements.every(element => element.isConnected);
            if (!currentElementsAreConnected || cleanTextElements.length !== editableElements.length) {
                throw new Error('No se pudo asociar de forma segura el contenido editado con el documento original.');
            }

            editableElements.forEach((element, index) => {
                const editedClone = element.cloneNode(true);
                cleanEditorArtifacts(editedClone);
                cleanTextElements[index].innerHTML = editedClone.innerHTML;
            });

            cleanEditorArtifacts(cleanDOM);
            if (hasEditorArtifacts(cleanDOM)) {
                throw new Error('No se pudo limpiar completamente el documento antes de guardarlo.');
            }

            const finalHTML = '<!DOCTYPE html>\n' + cleanDOM.documentElement.outerHTML;
            const response = await fetch('/api/content/html', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ html: finalHTML })
            });
            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.success) {
                throw new Error(data?.error || `Error HTTP ${response.status}`);
            }

            saveSucceeded = true;
            cleanEditorArtifacts(document);
            alert('✓ Cambios guardados correctamente');
            window.location.href = getPublicUrl().href;
        } catch (error) {
            console.error('[Visual Editor Save]', error);
            alert('Error al guardar: ' + error.message);
        } finally {
            if (!saveSucceeded) {
                btnSave.textContent = 'Guardar Cambios';
                btnSave.disabled = false;
            }
        }
    });
});
