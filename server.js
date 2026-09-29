const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5500;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ─── CREDENCIALES Y TOKEN ─────────────────────────────────
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'santuario2024';
const SECRET_TOKEN = 'santuario-secure-token-x89'; 

// Cargar data.json una sola vez al arrancar. Las lecturas posteriores se
// atienden desde memoria; el disco solo se toca cuando hay una escritura.
function loadData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('No se pudo cargar data.json; se usarán datos vacíos.', err);
        return { videoUrl: "", carouselImages: [], sellers: [] };
    }
}

let appData = loadData();

function readData() {
    return appData;
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    appData = data;
}

// ─── MIDDLEWARE DE AUTENTICACIÓN (API) ────────────────────
const apiAuthMiddleware = (req, res, next) => {
    if (req.path.startsWith('/api/content') && (req.method === 'POST' || req.method === 'DELETE')) {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.split(' ')[1];
        
        if (token === SECRET_TOKEN) {
            req.userRole = 'admin';
        } else if (token && token.startsWith('seller-')) {
            const data = readData();
            const sellerId = token.split('seller-')[1];
            const seller = (data.sellers || []).find(s => s.id === sellerId);
            if (seller) {
                req.userRole = 'seller';
                req.sellerId = sellerId;
            } else {
                return res.status(401).json({ error: 'No autorizado' });
            }
        } else {
            return res.status(401).json({ error: 'No autorizado' });
        }
    }
    next();
};

app.use(apiAuthMiddleware);

// Ruta de Login Inteligente
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Check si es Admin
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        return res.json({ success: true, token: SECRET_TOKEN, role: 'admin' });
    }
    
    // Check si es Vendedor
    const data = readData();
    const seller = (data.sellers || []).find(s => s.id === username && s.password === password);
    if (seller) {
        return res.json({ success: true, token: `seller-${seller.id}`, role: 'seller' });
    }
    
    res.status(401).json({ success: false, error: 'Credenciales inválidas' });
});

// Interceptar la raíz para servir el HTML correcto (Master o Seller custom)
app.get('/', (req, res) => {
    const ref = req.query.ref;
    if (ref) {
        const data = readData();
        const seller = (data.sellers || []).find(s => s.id.toLowerCase() === ref.toLowerCase());
        if (seller && seller.customHtml) {
            return res.send(seller.customHtml);
        }
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve static files from root (CSS, JS, uploads, etc.), ignorando '/' para no pisar el app.get de arriba
app.use(express.static(__dirname, { 
    index: false,
    setHeaders: (res, filepath) => {
        if (filepath.endsWith('admin.html') || 
            filepath.endsWith('admin.js') || 
            filepath.endsWith('editor.js') || 
            filepath.endsWith('editor.css')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        }
    }
}));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const IMAGE_EXTENSIONS = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}${IMAGE_EXTENSIONS[file.mimetype]}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: MAX_IMAGE_SIZE },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
            return cb(null, true);
        }

        const error = new Error('Formato de imagen no permitido');
        error.code = 'INVALID_IMAGE_TYPE';
        cb(error);
    }
});

const handleImageUpload = (req, res, next) => {
    upload.single('image')(req, res, (error) => {
        if (!error) return next();

        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                error: 'La imagen supera el tamaño máximo permitido de 10 MB'
            });
        }

        if (error.code === 'INVALID_IMAGE_TYPE') {
            return res.status(400).json({ success: false, error: error.message });
        }

        console.error('[Carousel Upload]', error);
        return res.status(400).json({ success: false, error: 'No se pudo procesar la imagen' });
    });
};


// Helper: Actualiza data general o data específica del vendedor
function updateContent(req, key, value, data) {
    if (req.userRole === 'admin') {
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
            data[key] = { ...data[key], ...value };
        } else {
            data[key] = value;
        }
    } else if (req.userRole === 'seller') {
        const seller = data.sellers.find(s => s.id === req.sellerId);
        seller.customizations = seller.customizations || {};
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
            seller.customizations[key] = { ...seller.customizations[key], ...value };
        } else {
            seller.customizations[key] = value;
        }
    }
}

function getCarouselImagesForRole(req, data) {
    if (req.userRole === 'admin') {
        data.carouselImages = Array.isArray(data.carouselImages) ? data.carouselImages : [];
        return data.carouselImages;
    }

    if (req.userRole === 'seller') {
        const seller = (data.sellers || []).find(s => s.id === req.sellerId);
        if (!seller) return null;

        seller.customizations = seller.customizations || {};
        seller.customizations.carouselImages = Array.isArray(seller.customizations.carouselImages)
            ? seller.customizations.carouselImages
            : [];
        return seller.customizations.carouselImages;
    }

    return null;
}

function isCarouselImageReferenced(data, imageUrl) {
    if ((data.carouselImages || []).includes(imageUrl)) return true;

    return (data.sellers || []).some(seller =>
        (seller.customizations?.carouselImages || []).includes(imageUrl)
    );
}

function resolveLocalUploadPath(imageUrl) {
    if (typeof imageUrl !== 'string' || !imageUrl.startsWith('uploads/')) return null;

    const relativeUploadPath = imageUrl.slice('uploads/'.length);
    const resolvedPath = path.resolve(uploadsDir, relativeUploadPath);
    const relativePath = path.relative(uploadsDir, resolvedPath);

    if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        return null;
    }

    return resolvedPath;
}

// API: Get content
app.get('/api/content', (req, res) => {
    const data = readData();
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    
    if (token === SECRET_TOKEN) {
        // Master admin ve todo
        return res.json(data);
    } else if (token && token.startsWith('seller-')) {
        // Vendedor ve su propia customización mezclada (solo él sabe sus cupones, links, etc.)
        const sellerId = token.split('seller-')[1];
        const seller = (data.sellers || []).find(s => s.id === sellerId);
        if (seller) {
            // Le devolvemos un objeto similar a data pero con SUS cosas
            const sellerData = { ...(seller.customizations || {}) };
            // Tambien devolvemos algunas cosas globales por defecto si no las ha tocado
            return res.json(sellerData);
        }
    }
    
    // Público: ocultar cupones
    const publicData = { ...data };
    delete publicData.coupons; 
    
    // Si la visita pública viene con ?ref=vendedor, sobrescribimos los datos con los de él
    if (req.query.ref) {
        const seller = (data.sellers || []).find(s => s.id.toLowerCase() === req.query.ref.toLowerCase());
        if (seller && seller.customizations) {
            if (seller.customizations.offer) publicData.offer = seller.customizations.offer;
            if (seller.customizations.paymentLinks) publicData.paymentLinks = seller.customizations.paymentLinks;
            if (seller.customizations.videoUrl) publicData.videoUrl = seller.customizations.videoUrl;
            if (seller.customizations.socialLinks) publicData.socialLinks = seller.customizations.socialLinks;
            if (seller.customizations.carouselImages && seller.customizations.carouselImages.length > 0) {
                publicData.carouselImages = seller.customizations.carouselImages;
            }
        }
    }
    
    res.json(publicData);
});

// API: Validate Coupon (Público)
app.post('/api/validate-coupon', (req, res) => {
    const { code, ref } = req.body;
    if (!code) return res.status(400).json({ error: 'Código requerido' });
    
    const data = readData();
    let coupons = data.coupons || [];
    
    // Si hay ref, buscar cupones del vendedor primero
    if (ref) {
        const seller = (data.sellers || []).find(s => s.id.toLowerCase() === ref.toLowerCase());
        if (seller && seller.customizations && seller.customizations.coupons) {
            coupons = seller.customizations.coupons; // Usa los del vendedor
        }
    }
    
    const coupon = coupons.find(c => c.code.toLowerCase() === code.toLowerCase() && c.active !== false);
    if (coupon) {
        return res.json({ success: true, coupon });
    } else {
        return res.status(404).json({ error: 'Cupón no válido o expirado' });
    }
});

// Endpoints Universales (Admin y Sellers)
app.post('/api/content/coupons', (req, res) => {
    const data = readData();
    updateContent(req, 'coupons', req.body.coupons, data);
    writeData(data);
    res.json({ success: true });
});

app.post('/api/content/offer', (req, res) => {
    const data = readData();
    updateContent(req, 'offer', req.body.offer, data);
    writeData(data);
    res.json({ success: true });
});

app.post('/api/content/video', (req, res) => {
    const data = readData();
    updateContent(req, 'videoUrl', req.body.videoUrl, data);
    writeData(data);
    res.json({ success: true });
});

app.post('/api/content/social', (req, res) => {
    const data = readData();
    updateContent(req, 'socialLinks', req.body.socialLinks, data);
    writeData(data);
    res.json({ success: true });
});

app.post('/api/content/payments', (req, res) => {
    const data = readData();
    updateContent(req, 'paymentLinks', req.body.paymentLinks, data);
    writeData(data);
    res.json({ success: true });
});

// API: Update sellers (SOLO ADMIN MASTER)
app.post('/api/content/sellers', (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: 'Prohibido' });
    
    const { sellers } = req.body;
    const data = readData();
    
    // Fusionar inteligentemente para no perder "customizations" al editar
    const existingSellers = data.sellers || [];
    const updatedSellers = sellers.map(newS => {
        const existing = existingSellers.find(s => s.id === newS.id);
        if (existing) {
            return { ...existing, name: newS.name, id: newS.id, password: newS.password };
        }
        return { ...newS, customizations: {} };
    });
    
    data.sellers = updatedSellers;
    writeData(data);
    res.json({ success: true, data });
});

// API: Get Seller specific content (Público, usado por la landing)
app.get('/api/seller/:id', (req, res) => {
    const data = readData();
    const sellers = data.sellers || [];
    const seller = sellers.find(s => s.id.toLowerCase() === req.params.id.toLowerCase());
    
    if (seller) {
        res.json({ success: true, seller: { name: seller.name, id: seller.id, customizations: seller.customizations || {} } });
    } else {
        res.status(404).json({ error: 'Vendedor no encontrado' });
    }
});

function containsEditorArtifacts(html) {
    if (typeof html !== 'string') return true;

    const editorAttributePatterns = [
        /<[^>]*\bcontenteditable(?:\s*=|\s|\/?>)/i,
        /<[^>]*\bspellcheck\s*=\s*(?:"true"|'true'|true)(?:\s|\/?>)/i,
        /<[^>]*\bdata-editor-[\w:-]*(?:\s*=|\s|\/?>)/i
    ];
    if (editorAttributePatterns.some(pattern => pattern.test(html))) return true;

    const idAttributePattern = /<[^>]*\bid\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/gi;
    let attributeMatch;
    while ((attributeMatch = idAttributePattern.exec(html)) !== null) {
        if ((attributeMatch[1] || attributeMatch[2]) === 'editor-toolbar') return true;
    }

    const temporaryClasses = new Set([
        'editable',
        'editor-mode',
        'editor-selected',
        'editor-hover',
        'editor-active'
    ]);
    const classAttributePattern = /<[^>]*\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/gi;
    while ((attributeMatch = classAttributePattern.exec(html)) !== null) {
        const classNames = (attributeMatch[1] || attributeMatch[2]).split(/\s+/);
        if (classNames.some(className => temporaryClasses.has(className))) return true;
    }

    return false;
}

// API: Save entire HTML (Live Editor)
app.post('/api/content/html', (req, res) => {
    const { html } = req.body;
    if (typeof html !== 'string' || !html.trim()) {
        return res.status(400).json({ success: false, error: 'El documento HTML es obligatorio.' });
    }

    if (containsEditorArtifacts(html)) {
        return res.status(400).json({
            success: false,
            error: 'El documento contiene artefactos temporales del editor.'
        });
    }

    const data = readData();

    if (req.userRole === 'admin') {
        const indexPath = path.join(__dirname, 'index.html');
        const backupsDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);
        if (fs.existsSync(indexPath)) {
            fs.writeFileSync(path.join(backupsDir, `index-${Date.now()}.html`), fs.readFileSync(indexPath, 'utf8'));
        }
        fs.writeFileSync(indexPath, html);
    } else if (req.userRole === 'seller') {
        const seller = data.sellers.find(s => s.id === req.sellerId);
        seller.customHtml = html;
        writeData(data);
    }
    res.json({ success: true });
});

// API: Upload image (Maneja admin y seller)
app.post('/api/content/images', handleImageUpload, (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'Selecciona una imagen válida' });
    }

    const data = readData();
    const imageUrl = `uploads/${req.file.filename}`;
    const carouselImages = getCarouselImagesForRole(req, data);

    if (!carouselImages) {
        return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    carouselImages.push(imageUrl);
    writeData(data);
    
    res.json({
        success: true,
        imageUrl,
        data: { carouselImages: [...carouselImages] }
    });

    console.info('[Carousel Upload]', {
        role: req.userRole,
        file: imageUrl,
        total: carouselImages.length
    });
});

// API: Delete image
app.delete('/api/content/images', (req, res) => {
    const { imageUrl } = req.body;
    if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
        return res.status(400).json({ success: false, error: 'La URL de la imagen es obligatoria' });
    }

    const data = readData();
    const carouselImages = getCarouselImagesForRole(req, data);

    if (!carouselImages) {
        return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    const imageWasReferenced = carouselImages.includes(imageUrl);
    const updatedCarouselImages = carouselImages.filter(img => img !== imageUrl);
    updateContent(req, 'carouselImages', updatedCarouselImages, data);
    writeData(data);

    res.json({
        success: true,
        data: { carouselImages: [...updatedCarouselImages] }
    });

    console.info('[Carousel Delete]', {
        role: req.userRole,
        imageUrl,
        total: updatedCarouselImages.length
    });

    const filePath = resolveLocalUploadPath(imageUrl);
    if (imageWasReferenced && filePath && !isCarouselImageReferenced(data, imageUrl)) {
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (error) {
                console.warn('[Carousel Delete File]', error);
            }
        }
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
