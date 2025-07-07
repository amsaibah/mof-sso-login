const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login route (this will be connected to MySQL later)
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (email.endsWith('@mofth.omnicrosoft.com') && password.length >= 8) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
