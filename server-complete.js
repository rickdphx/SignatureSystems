const http = require('http');
const https = require('https');
const fs = require('fs');

const PORT = 3000;
const BACKEND_URL = 'http://localhost:3001';

// Read nandoblends HTML
const nandoBlendsHTML = fs.readFileSync('/var/www/signature-chair-frontend/nandoblends.html', 'utf8');

// Fetch services from backend
async function fetchServices() {
  return new Promise((resolve, reject) => {
    http.get(BACKEND_URL + '/api/public/services', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.services || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Group services by category
function groupByCategory(services) {
  const categories = {};
  services.forEach(service => {
    const cat = service.categoryName || 'Services';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(service);
  });
  return categories;
}

function getHomePage() {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Signature Chair - Premium Grooming</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:linear-gradient(135deg,#0A1929 0%,#2f445d 30%,#6B1C23 100%);color:#fff;min-height:100vh}.container{max-width:1200px;margin:0 auto;padding:80px 40px;text-align:center}h1{font-family:"Playfair Display",serif;font-size:4rem;font-weight:700;margin-bottom:20px}h1 .highlight{background:linear-gradient(135deg,#D4AF37,#facc15);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}.subtitle{font-size:1.5rem;color:#ddd;margin-bottom:20px}.locations{font-size:1.1rem;color:#999;margin-bottom:60px}.btn{display:inline-block;background:linear-gradient(135deg,#6B1C23,#9f2f4a);color:#fff;padding:20px 40px;text-decoration:none;border-radius:10px;font-weight:600;border:2px solid #D4AF37;transition:all .3s;margin:10px}.btn:hover{transform:translateY(-3px);box-shadow:0 15px 40px rgba(212,175,55,.4);border-color:#facc15}@media(max-width:768px){h1{font-size:2.5rem}.container{padding:40px 20px}}</style></head><body><div class="container"><h1>The <span class="highlight">Signature</span> Chair</h1><p class="subtitle">Premium Grooming Experience</p><p class="locations">Tempe • Phoenix • Scottsdale • Sky Harbor</p><a href="/rick/book" class="btn">Book with Rick</a></div></body></html>';
}

async function getBookingPage(barberName, slug) {
  try {
    const services = await fetchServices();
    const categories = groupByCategory(services);

    let categoriesHTML = '';
    Object.keys(categories).forEach(catName => {
      const catServices = categories[catName];
      let servicesHTML = '';

      catServices.forEach(service => {
        const priceFormatted = '$' + (service.price / 100).toFixed(0);
        const duration = service.duration + ' min';
        servicesHTML += '<div class="service-card"><div class="service-icon">✂️</div><h3 class="service-name">' + service.name + '</h3><p class="service-desc">' + (service.description || '') + '</p><div class="service-meta"><span>' + duration + '</span><span class="service-price">' + priceFormatted + '</span></div><button class="service-btn" onclick="selectService(\'' + service.id + '\', \'' + service.name + '\', ' + service.price + ', ' + service.duration + ')">Select</button></div>';
      });

      categoriesHTML += '<div class="category-section"><h2 class="category-title">' + catName + '</h2><div class="services-grid">' + servicesHTML + '</div></div>';
    });

    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Book with ' + barberName + ' - The Signature Chair</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:linear-gradient(135deg,#0A1929 0%,#2f445d 30%,#6B1C23 100%);color:#fff;min-height:100vh}.container{max-width:1200px;margin:0 auto;padding:60px 40px}h1{font-family:"Playfair Display",serif;font-size:3rem;font-weight:700;margin-bottom:10px;text-align:center}.highlight{background:linear-gradient(135deg,#D4AF37,#facc15);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}.back-link{color:#D4AF37;text-decoration:none;display:inline-block;margin-bottom:30px}.back-link:hover{text-decoration:underline}.category-section{margin:60px 0}.category-title{font-family:"Playfair Display",serif;font-size:2rem;color:#D4AF37;margin-bottom:30px;text-align:center}.services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:30px;margin-top:30px}.service-card{background:rgba(47,68,93,0.4);backdrop-filter:blur(10px);border:1px solid rgba(212,175,55,0.3);border-radius:20px;padding:30px;transition:all .3s;text-align:center}.service-card:hover{border-color:rgba(212,175,55,0.6);box-shadow:0 25px 80px rgba(0,0,0,0.7);transform:translateY(-5px)}.service-icon{font-size:3rem;margin-bottom:15px}.service-name{font-size:1.5rem;font-weight:700;margin-bottom:15px;color:#fff}.service-desc{color:#ccc;margin-bottom:20px;font-size:0.9rem;min-height:40px}.service-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-top:20px;border-top:1px solid rgba(212,175,55,0.2)}.service-price{font-size:1.8rem;font-weight:700;color:#D4AF37}.service-btn{width:100%;background:linear-gradient(135deg,#6B1C23,#9f2f4a);color:#fff;padding:15px;border:2px solid #D4AF37;border-radius:10px;font-weight:600;cursor:pointer;transition:all .3s;text-transform:uppercase;letter-spacing:1px}.service-btn:hover{transform:translateY(-3px);box-shadow:0 15px 40px rgba(212,175,55,.4);border-color:#facc15}@media(max-width:768px){h1{font-size:2rem}.container{padding:40px 20px}.services-grid{grid-template-columns:1fr}}</style></head><body><div class="container"><a href="/" class="back-link">← Back to Home</a><h1>Book with <span class="highlight">' + barberName + '</span></h1>' + categoriesHTML + '</div><script>function selectService(id,name,price,duration){alert("Booking system integration coming soon!\\n\\nSelected: " + name + "\\nPrice: $" + (price/100) + "\\nDuration: " + duration + " min");}</script></body></html>';
  } catch (error) {
    console.error('Error fetching services:', error);
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Error</title></head><body><h1>Error loading services</h1><p>Please make sure the backend API is running on port 3001</p><a href="/">Go Home</a></body></html>';
  }
}

const server = http.createServer(async (req, res) => {
  const url = req.url;
  console.log('Request:', url);

  // Homepage
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getHomePage());
    return;
  }

  // Nando Blends
  if (url === '/nando.blends' || url === '/nando.blends.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(nandoBlendsHTML);
    return;
  }

  // Rick booking page
  if (url === '/rick/book') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    const html = await getBookingPage('Rick', 'rick');
    res.end(html);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log('Signature Chair frontend running on port ' + PORT);
  console.log('Backend API expected at ' + BACKEND_URL);
  console.log('Routes:');
  console.log('  - / (home)');
  console.log('  - /rick/book (booking with real Square services)');
  console.log('  - /nando.blends (contact)');
});
