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
app.use(express.json());

// ─── CREDENCIALES Y TOKEN ─────────────────────────────────
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'santuario2024';
const SECRET_TOKEN = 'santuario-secure-token-x89'; // Token simple estático

// ─── MIDDLEWARE DE AUTENTICACIÓN (API) ────────────────────
const apiAuthMiddleware = (req, res, next) => {
    // Solo protegemos las rutas de escritura de la API
    if (req.path.startsWith('/api/content') && (req.method === 'POST' || req.method === 'DELETE')) {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.split(' ')[1];
        
        if (token !== SECRET_TOKEN) {
            return res.status(401).json({ error: 'No autorizado' });
        }
    }
    next();
};

app.use(apiAuthMiddleware);

// Ruta de Login para obtener el token
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        res.json({ success: true, token: SECRET_TOKEN });
    } else {
        res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }
});

// Serve static files from root (for index.html, css, js, uploads)
app.use(express.static(__dirname));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Setup Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Unique filename
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Helper to read data
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { videoUrl: "", carouselImages: [] };
    }
}

// Helper to write data
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API: Get content
app.get('/api/content', (req, res) => {
    const data = readData();
    
    // Si no hay token de administrador válido, ocultamos la información confidencial (cupones)
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    
    if (token !== SECRET_TOKEN) {
        // Enviar solo datos públicos
        const publicData = { ...data };
        delete publicData.coupons; 
        return res.json(publicData);
    }
    
    // Si es admin, enviamos todo
    res.json(data);
});

// API: Validate Coupon (Público)
app.post('/api/validate-coupon', (req, res) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ error: 'Código requerido' });
    }
    
    const data = readData();
    const coupons = data.coupons || [];
    
    const coupon = coupons.find(c => c.code.toLowerCase() === code.toLowerCase() && c.active !== false);
    
    if (coupon) {
        // Retornamos el cupón (que contiene el mensaje y los paymentLinks rebajados)
        return res.json({ success: true, coupon });
    } else {
        return res.status(404).json({ error: 'Cupón no válido o expirado' });
    }
});

// API: Update coupons (Admin)
app.post('/api/content/coupons', (req, res) => {
    const { coupons } = req.body;
    if (!Array.isArray(coupons)) {
        return res.status(400).json({ error: 'coupons array is required' });
    }
    const data = readData();
    data.coupons = coupons;
    writeData(data);
    res.json({ success: true, data });
});

// API: Update offer (Admin)
app.post('/api/content/offer', (req, res) => {
    const { offer } = req.body;
    if (!offer || typeof offer !== 'object') {
        return res.status(400).json({ error: 'offer object is required' });
    }
    const data = readData();
    data.offer = { ...data.offer, ...offer };
    writeData(data);
    res.json({ success: true, data });
});

// API: Update video URL
app.post('/api/content/video', (req, res) => {
    const { videoUrl } = req.body;
    if (typeof videoUrl !== 'string') {
        return res.status(400).json({ error: 'videoUrl is required' });
    }
    const data = readData();
    data.videoUrl = videoUrl;
    writeData(data);
    res.json({ success: true, data });
});

// API: Update social links
app.post('/api/content/social', (req, res) => {
    const { socialLinks } = req.body;
    if (!socialLinks || typeof socialLinks !== 'object') {
        return res.status(400).json({ error: 'socialLinks object is required' });
    }
    const data = readData();
    data.socialLinks = { ...data.socialLinks, ...socialLinks };
    writeData(data);
    res.json({ success: true, data });
});

// API: Update payment links
app.post('/api/content/payments', (req, res) => {
    const { paymentLinks } = req.body;
    if (!paymentLinks || typeof paymentLinks !== 'object') {
        return res.status(400).json({ error: 'paymentLinks object is required' });
    }
    const data = readData();
    data.paymentLinks = { ...data.paymentLinks, ...paymentLinks };
    writeData(data);
    res.json({ success: true, data });
});

// API: Save entire HTML (Live Editor)
app.post('/api/content/html', (req, res) => {
    const { html } = req.body;
    if (!html || typeof html !== 'string') {
        return res.status(400).json({ error: 'HTML string is required' });
    }

    const indexPath = path.join(__dirname, 'index.html');
    const backupsDir = path.join(__dirname, 'backups');

    // Create backups dir if not exists
    if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir);
    }

    try {
        // 1. Create a backup of current index.html
        if (fs.existsSync(indexPath)) {
            const currentHtml = fs.readFileSync(indexPath, 'utf8');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            fs.writeFileSync(path.join(backupsDir, `index-${timestamp}.html`), currentHtml);
        }

        // 2. Overwrite index.html
        fs.writeFileSync(indexPath, html);
        res.json({ success: true, message: 'Landing Page actualizada correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al guardar el HTML' });
    }
});

// API: Upload image
app.post('/api/content/images', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }
    const data = readData();
    // The path we send to the client (relative to root)
    const imageUrl = `uploads/${req.file.filename}`;
    data.carouselImages.push(imageUrl);
    writeData(data);
    res.json({ success: true, imageUrl, data });
});

// API: Delete image
app.delete('/api/content/images', (req, res) => {
    const { imageUrl } = req.body;
    if (!imageUrl) {
        return res.status(400).json({ error: 'imageUrl is required' });
    }
    
    let data = readData();
    data.carouselImages = data.carouselImages.filter(img => img !== imageUrl);
    writeData(data);

    // Also delete the physical file if it's in the uploads folder
    if (imageUrl.startsWith('uploads/')) {
        const filePath = path.join(__dirname, imageUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    res.json({ success: true, data });
});

// Fallback to serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor Admin corriendo en http://localhost:${PORT}`);
});
