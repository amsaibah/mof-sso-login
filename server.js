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
