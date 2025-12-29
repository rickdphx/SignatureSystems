const express = require('express');
const basicAuth = require('express-basic-auth');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;

// Basic auth middleware
const auth = basicAuth({
  users: { 'Yahu86': '2121' },
  challenge: true,
  realm: 'Ben Console Access'
});

// Serve static files from public directory
app.use(express.static('public'));

// Root route - serve ben.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ben.html'));
});

// Admin route with basic auth - serve ben.html
app.get('/admin/', auth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ben.html'));
});

// Admin login route - redirects to /admin/
app.get('/admin/login.html', auth, (req, res) => {
  res.redirect('/admin/');
});

// Ben console route
app.get('/ben', (req, res) => {
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
  console.log(`🔐 Admin Console at http://localhost:${PORT}/admin/ (protected)`);
  console.log(`🌐 Also accessible at http://0.0.0.0:${PORT}`);
});
