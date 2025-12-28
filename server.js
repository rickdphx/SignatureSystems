const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static('public'));

// Root route - serve ben.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ben.html'));
});

// Ben console route
app.get('/ben', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ben.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Ben Console Server running on http://localhost:${PORT}`);
  console.log(`📺 Access Ben Console at http://localhost:${PORT}/ben`);
  console.log(`🌐 Also accessible at http://0.0.0.0:${PORT}`);
});
