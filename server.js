const express = require('express');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',       
    password: '',       
    database: 'mof_sso'
});

db.connect(err => {
    if (err) {
        console.error('MySQL connection error:', err);
        return;
    }
    console.log('Connected to MySQL DB');
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'mof-secret-key',
    resave: false,
    saveUninitialized: true,
}));
app.use(express.static(path.join(__dirname, 'public')));

// Login route (no DB check, just email pattern + password length)
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email.endsWith('@mofth.onmicrosoft.com')) {
        return res.json({ success: false, message: 'Use @mofth.onmicrosoft.com email only' });
    }

    if (!password || password.length < 8) {
        return res.json({ success: false, message: 'Password must be at least 8 characters' });
    }

    req.session.user = {
        email,
        name: email.split('@')[0],     
        department: 'General'
    };

    return res.json({ success: true });
});

// Auth-protected portal route
app.get('/portal.html', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/index.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});


app.get('/user-info', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    res.json(req.session.user);
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/index.html');
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

const multer = require('multer');
const uploadFolder = path.join(__dirname, 'public/uploads');
const fs = require('fs');

// Ensure upload folder exists
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

// Multer config
const storage = multer.diskStorage({
    destination: uploadFolder,
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const filename = `${file.fieldname}-${timestamp}${ext}`;
        cb(null, filename);
    }
});
const upload = multer({ storage });

// Upload route
app.post('/upload-document', upload.single('document'), (req, res) => {
    const { title, type, description } = req.body;
    const filePath = `/uploads/${req.file.filename}`;
    const createdBy = req.session.user?.email || 'system';

    const sql = `
        INSERT INTO documents (title, type, status, description, file_path, created_by, created_at, updated_at)
        VALUES (?, ?, 'draft', ?, ?, ?, NOW(), NOW())
    `;
    const values = [title, type, description, filePath, createdBy];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Upload DB error:', err);
            return res.status(500).json({ success: false, message: 'Upload failed' });
        }
        res.json({ success: true, message: 'Document uploaded successfully' });
    });
});

app.get('/documents', (req, res) => {
    db.query('SELECT * FROM documents ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error('Fetch error:', err);
            return res.status(500).json({ success: false, message: 'Failed to load documents' });
        }
        res.json(results);
    });
});



