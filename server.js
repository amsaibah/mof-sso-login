const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({
    secret: 'mof_sso_secret',
    resave: false,

}))

app.use(express.static(path.join(__dirname, 'public')));

// Login endpoint
app.post('/login', (req, res) => {
    const {email, password} = req.body;

    if (email.endswith('@mofth.omnicrosoft.com') && password.length >= 8) {
        req.session.authenticated = true;
        req.session.user = email;
        return res.status(200).json({success: true});

    } else {
        return res.status(401).json({sucess: false, message: 'Invalid credentials'});
    }
});

// Portal protection
app.get('/logout', (req, res, next) => {
    if (req.session.authenticated) {
        return next(); 
    }
    return res.redirect('index.html');
})

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/index.html');
    });
});

// Start server
app.listen(PORT, () => {
    console.log('Server running at http://localhost:${PORT}');
});