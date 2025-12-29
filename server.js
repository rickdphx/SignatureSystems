const express = require('express');
const basicAuth = require('express-basic-auth');
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();
const PORT = process.env.PORT || 80;

// Basic authentication
app.use(basicAuth({
    users: { 'Yahu86': '2121' },
    challenge: true,
    realm: 'Ben Console Access'
}));

// Serve static files from public directory
app.use(express.static('public'));

// Root route - serve ben.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ben.html'));
});

// BG route with basic auth - serve ben.html
app.get('/bg/', auth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ben.html'));
});

// BG login route - redirects to /bg/
app.get('/bg/login.html', auth, (req, res) => {
  res.redirect('/bg/');
});

// Ben console route
app.get('/ben', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ben.html'));
});

// Admin route - serve Ben Console
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ben.html'));
});

app.get('/admin/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ben.html'));
});

// Serve standalone version directly
app.get('/standalone', (req, res) => {
  res.sendFile(path.join(__dirname, 'DOWNLOAD_THIS.html'));
});

// Download endpoint
app.get('/download', (req, res) => {
  res.download(path.join(__dirname, 'DOWNLOAD_THIS.html'), 'ben-console.html');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Ben Console Server running on http://localhost:${PORT}`);
  console.log(`📺 Access Ben Console at http://localhost:${PORT}/ben`);
  console.log(`🔐 BG Console at http://localhost:${PORT}/bg/ (protected)`);
  console.log(`🌐 Also accessible at http://0.0.0.0:${PORT}`);
});
