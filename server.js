const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static(path.join(__dirname)));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'mof-secret-key',
    resave: false,
    saveUninitialized: true,
}));

// Dummy credentials
const dummyUser = {
    email: 'user@mofth.omnicrosoft.com',
    password: 'securepass123',
    name: 'Fatematus Shaheba',
    department: 'IT Department'
};

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (email === dummyUser.email && password === dummyUser.password) {
        req.session.user = dummyUser;
        return res.json({ success: true });
    } else {
        return res.json({ success: false, message: 'Invalid credentials' });
    }
});

// Authenticated route
app.get('/portal.html', (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/index.html');
    }
    next();
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/index.html');
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
