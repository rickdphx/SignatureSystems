const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const PORT = 3000;

// Simple JSON database
const DB_FILE = '/var/www/signature-chair-frontend/barbers.json';

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { barbers: {} };
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function hash(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function getSignupPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Create Your Barber Site - Signature System</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: linear-gradient(135deg, #0A1929 0%, #6B1C23 100%); color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { max-width: 500px; width: 100%; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; border: 1px solid rgba(212,175,55,0.3); }
    h1 { font-size: 2rem; margin-bottom: 10px; color: #D4AF37; }
    p { color: #ccc; margin-bottom: 30px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; font-size: 0.9rem; color: #D4AF37; text-transform: uppercase; letter-spacing: 1px; }
    input, select { width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; font-size: 1rem; }
    input:focus, select:focus { outline: none; border-color: #D4AF37; }
    button { width: 100%; padding: 15px; background: linear-gradient(135deg, #6B1C23, #9f2f4a); border: 2px solid #D4AF37; border-radius: 10px; color: #fff; font-size: 1rem; font-weight: 600; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; }
    button:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(212,175,55,0.4); }
    .link { text-align: center; margin-top: 20px; color: #D4AF37; }
    .link a { color: #D4AF37; text-decoration: none; }
    .link a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Create Your Barber Site</h1>
    <p>Get your own professional booking site in minutes</p>
    <form action="/api/signup" method="POST">
      <div class="form-group">
        <label>Your Name</label>
        <input type="text" name="name" required placeholder="John Doe">
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" name="email" required placeholder="you@example.com">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" name="password" required placeholder="Create a password">
      </div>
      <div class="form-group">
        <label>Your Site URL</label>
        <input type="text" name="slug" required placeholder="yourname" pattern="[a-z0-9.-]+" title="Lowercase letters, numbers, dots and hyphens only">
        <small style="color:#ccc;font-size:0.8rem;">Will be: thesignaturechair.com/yourname</small>
      </div>
      <div class="form-group">
        <label>Color Scheme</label>
        <select name="theme">
          <option value="burgundy">Burgundy & Gold (Default)</option>
          <option value="blackwhite">Black & White</option>
          <option value="blue">Blue & Silver</option>
          <option value="green">Green & Gold</option>
        </select>
      </div>
      <button type="submit">Create My Site</button>
    </form>
    <div class="link">
      Already have an account? <a href="/login">Login</a>
    </div>
  </div>
</body>
</html>`;
}

function getLoginPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login - Signature System</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0A1929 0%, #6B1C23 100%); color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { max-width: 400px; width: 100%; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; border: 1px solid rgba(212,175,55,0.3); }
    h1 { font-size: 2rem; margin-bottom: 30px; color: #D4AF37; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; color: #D4AF37; }
    input { width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; }
    input:focus { outline: none; border-color: #D4AF37; }
    button { width: 100%; padding: 15px; background: linear-gradient(135deg, #6B1C23, #9f2f4a); border: 2px solid #D4AF37; border-radius: 10px; color: #fff; font-weight: 600; cursor: pointer; }
    .link { text-align: center; margin-top: 20px; color: #D4AF37; }
    .link a { color: #D4AF37; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Login</h1>
    <form action="/api/login" method="POST">
      <div class="form-group">
        <label>Email</label>
        <input type="email" name="email" required>
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" name="password" required>
      </div>
      <button type="submit">Login</button>
    </form>
    <div class="link">
      Don't have an account? <a href="/signup">Sign up</a>
    </div>
  </div>
</body>
</html>`;
}

function getDashboard(barber) {
  const url = 'https://staging.thesignaturechair.com/' + barber.slug;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Dashboard - ${barber.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: sans-serif; background: linear-gradient(135deg, #0A1929, #6B1C23); color: #fff; padding: 40px; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { font-size: 2.5rem; color: #D4AF37; margin-bottom: 10px; }
    .url { background: rgba(0,0,0,0.3); padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #D4AF37; }
    .url a { color: #D4AF37; font-size: 1.2rem; text-decoration: none; }
    .url a:hover { text-decoration: underline; }
    .btn { display: inline-block; padding: 12px 30px; background: #6B1C23; color: #fff; text-decoration: none; border-radius: 8px; border: 2px solid #D4AF37; margin: 10px 10px 10px 0; }
    .btn:hover { background: #9f2f4a; }
    .section { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; margin: 20px 0; }
    h2 { color: #D4AF37; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome, ${barber.name}!</h1>
    <div class="url">
      <strong>Your Site:</strong> <a href="${url}" target="_blank">${url}</a>
    </div>
    <div class="section">
      <h2>Quick Actions</h2>
      <a href="${url}" class="btn" target="_blank">View My Site</a>
      <a href="/dashboard/edit" class="btn">Edit Settings</a>
      <a href="/api/logout" class="btn">Logout</a>
    </div>
    <div class="section">
      <h2>Your Settings</h2>
      <p><strong>Theme:</strong> ${barber.theme}</p>
      <p><strong>Slug:</strong> ${barber.slug}</p>
      <p><strong>Created:</strong> ${new Date(barber.created).toLocaleDateString()}</p>
    </div>
  </div>
</body>
</html>`;
}

function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const params = new URLSearchParams(body);
    const data = {};
    for (let [key, value] of params) {
      data[key] = value;
    }
    callback(data);
  });
}

const server = http.createServer((req, res) => {
  console.log(req.method, req.url);

  // Signup page
  if (req.url === '/signup' && req.method === 'GET') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    return res.end(getSignupPage());
  }

  // Login page
  if (req.url === '/login' && req.method === 'GET') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    return res.end(getLoginPage());
  }

  // Signup API
  if (req.url === '/api/signup' && req.method === 'POST') {
    return parseBody(req, (data) => {
      const db = loadDB();

      if (db.barbers[data.email]) {
        res.writeHead(400, {'Content-Type': 'text/html'});
        return res.end('<h1>Email already exists</h1><a href="/signup">Try again</a>');
      }

      db.barbers[data.email] = {
        name: data.name,
        email: data.email,
        password: hash(data.password),
        slug: data.slug.toLowerCase(),
        theme: data.theme || 'burgundy',
        created: new Date().toISOString()
      };

      saveDB(db);

      res.writeHead(302, {'Location': '/dashboard?email=' + data.email});
      res.end();
    });
  }

  // Login API
  if (req.url === '/api/login' && req.method === 'POST') {
    return parseBody(req, (data) => {
      const db = loadDB();
      const barber = db.barbers[data.email];

      if (!barber || barber.password !== hash(data.password)) {
        res.writeHead(401, {'Content-Type': 'text/html'});
        return res.end('<h1>Invalid credentials</h1><a href="/login">Try again</a>');
      }

      res.writeHead(302, {'Location': '/dashboard?email=' + data.email});
      res.end();
    });
  }

  // Dashboard
  if (req.url.startsWith('/dashboard') && req.method === 'GET') {
    const params = new URL(req.url, 'http://localhost').searchParams;
    const email = params.get('email');
    const db = loadDB();
    const barber = db.barbers[email];

    if (!barber) {
      res.writeHead(302, {'Location': '/login'});
      return res.end();
    }

    res.writeHead(200, {'Content-Type': 'text/html'});
    return res.end(getDashboard(barber));
  }

  // Home
  if (req.url === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    return res.end('<h1>Signature System</h1><a href="/signup">Create Your Site</a> | <a href="/login">Login</a>');
  }

  // 404
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => console.log('Server running on port ' + PORT));
