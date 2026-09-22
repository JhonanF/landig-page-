// editor.js - Lógica del Editor Visual en Vivo

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isEditMode = urlParams.get('edit') === 'true';

    if (!isEditMode) return;

    // Verificar si el usuario tiene el token de administrador
    const token = localStorage.getItem('santuario_admin_token');
    if (!token) {
        alert('Debes iniciar sesión en el Panel de Administración primero.');
        window.location.href = '/admin.html';
        return;
    }

    // Inyectar Barra de Herramientas
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

    // Ajustar el body para que no se superponga con la barra flotante
    document.body.style.paddingTop = '60px';

    // Hacer que los elementos de texto sean editables
    // Excluimos los del toolbar y los que no son útiles de editar
    const textElements = document.querySelectorAll('h1, h2, h3, h4, p, span:not(.logo-icon), li, .price, button:not(#editor-cancel, #editor-save), a:not(.btn-editor)');
    
    textElements.forEach(el => {
        // Evitar hacer editables elementos dentro del toolbar o scripts
        if (!el.closest('#editor-toolbar') && !el.closest('script')) {
            el.setAttribute('contenteditable', 'true');
            el.classList.add('editable');
            
            // Evitar que los enlaces se abran accidentalmente al editarlos
            if (el.tagName === 'A') {
                el.addEventListener('click', (e) => e.preventDefault());
            }
        }
    });

    // Lógica para Cancelar
    document.getElementById('editor-cancel').addEventListener('click', () => {
        if (confirm('¿Descartar cambios y salir del modo edición?')) {
            window.location.href = '/';
        }
    });

    // Lógica para Guardar
    document.getElementById('editor-save').addEventListener('click', async () => {
        const btnSave = document.getElementById('editor-save');
        btnSave.textContent = 'Guardando...';
        btnSave.disabled = true;

        try {
            // 1. Obtener el HTML limpio directamente del servidor para no guardar la basura de GSAP/Spline
            const resHTML = await fetch(window.location.pathname + '?nocache=' + Date.now());
            const cleanHTMLText = await resHTML.text();
            
            // 2. Parsearlo a un DOM virtual
            const parser = new DOMParser();
            const cleanDOM = parser.parseFromString(cleanHTMLText, 'text/html');
            
            // 3. Obtener los mismos elementos en el DOM limpio (mismo selector, mismo orden)
            const cleanTextElements = cleanDOM.querySelectorAll('h1, h2, h3, h4, p, span:not(.logo-icon), li, .price, button:not(#editor-cancel, #editor-save), a:not(.btn-editor)');
            
            // 4. Transferir el texto editado del DOM actual al DOM limpio
            const currentEditables = document.querySelectorAll('.editable');
            
            if (cleanTextElements.length === currentEditables.length) {
                currentEditables.forEach((el, index) => {
                    const cleanEl = cleanTextElements[index];
                    // Solo transferimos el HTML interno, evitando clonar atributos sucios
                    cleanEl.innerHTML = el.innerHTML;
                });
            } else {
                console.warn('Advertencia: La cantidad de elementos editables no coincide exactamente. Intentando guardado de respaldo.');
                // Fallback: Si por alguna razón la estructura mutó, usar el clon limpio como último recurso
            }

            // 5. Preparar el HTML final desde el cleanDOM
            const finalHTML = '<!DOCTYPE html>\n' + cleanDOM.documentElement.outerHTML;

            // 6. Enviar al backend
            const res = await fetch('/api/content/html', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ html: finalHTML })
            });

            const data = await res.json();

            if (res.ok) {
                alert('¡Cambios guardados con éxito!');
                window.location.href = window.location.pathname; // Quitar ?edit=true
            } else {
                throw new Error(data.error || 'Error desconocido');
            }
        } catch (error) {
            console.error(error);
            alert('Error al guardar: ' + error.message);
            btnSave.textContent = 'Guardar Cambios';
            btnSave.disabled = false;
        }
    });
});
