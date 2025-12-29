const http = require('http');
const fs = require('fs');

const PORT = 3000;

// Read the nandoblends HTML file
const nandoBlendsHTML = fs.readFileSync('/var/www/signature-chair-frontend/nandoblends.html', 'utf8');

function getHomePage() {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Signature Chair - Premium Grooming</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:linear-gradient(135deg,#0A1929 0%,#2f445d 30%,#6B1C23 100%);color:#fff;min-height:100vh}.container{max-width:1200px;margin:0 auto;padding:80px 40px;text-align:center}h1{font-family:"Playfair Display",serif;font-size:4rem;font-weight:700;margin-bottom:20px}h1 .highlight{background:linear-gradient(135deg,#D4AF37,#facc15);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}.subtitle{font-size:1.5rem;color:#ddd;margin-bottom:20px}.locations{font-size:1.1rem;color:#999;margin-bottom:60px}.btn{display:inline-block;background:linear-gradient(135deg,#6B1C23,#9f2f4a);color:#fff;padding:20px 40px;text-decoration:none;border-radius:10px;font-weight:600;border:2px solid #D4AF37;transition:all .3s;margin:10px}.btn:hover{transform:translateY(-3px);box-shadow:0 15px 40px rgba(212,175,55,.4);border-color:#facc15}@media(max-width:768px){h1{font-size:2.5rem}.container{padding:40px 20px}}</style></head><body><div class="container"><h1>The <span class="highlight">Signature</span> Chair</h1><p class="subtitle">Premium Grooming Experience</p><p class="locations">Tempe • Phoenix • Scottsdale • Sky Harbor</p><a href="/rick/book" class="btn">Book Appointment</a><a href="/rick" class="btn" style="background:transparent;border:2px solid #D4AF37">View Services</a></div></body></html>';
}

function getBarberPage(barberName, slug) {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Book with ' + barberName + ' - The Signature Chair</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:linear-gradient(135deg,#0A1929 0%,#2f445d 30%,#6B1C23 100%);color:#fff;min-height:100vh}.container{max-width:1200px;margin:0 auto;padding:80px 40px}h1{font-family:"Playfair Display",serif;font-size:3.5rem;font-weight:700;margin-bottom:20px}.highlight{background:linear-gradient(135deg,#D4AF37,#facc15);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}.subtitle{font-size:1.2rem;color:#ddd;margin-bottom:40px}.btn{display:inline-block;background:linear-gradient(135deg,#6B1C23,#9f2f4a);color:#fff;padding:20px 40px;text-decoration:none;border-radius:10px;font-weight:600;border:2px solid #D4AF37;transition:all .3s;margin-top:20px}.btn:hover{transform:translateY(-3px);box-shadow:0 15px 40px rgba(212,175,55,.4)}.back-link{color:#D4AF37;text-decoration:none;display:inline-block;margin-bottom:30px}.back-link:hover{text-decoration:underline}.services{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:30px;margin-top:60px}.service-card{background:rgba(47,68,93,0.4);backdrop-filter:blur(10px);border:1px solid rgba(212,175,55,0.3);border-radius:20px;padding:40px;transition:all .3s}.service-card:hover{border-color:rgba(212,175,55,0.6);box-shadow:0 25px 80px rgba(0,0,0,0.7)}.service-icon{font-size:3rem;margin-bottom:20px}.service-title{font-size:1.8rem;font-weight:700;margin-bottom:15px;color:#D4AF37}.service-desc{color:#ccc;margin-bottom:20px}.service-link{color:#D4AF37;text-decoration:none;font-weight:600}.service-link:hover{text-decoration:underline}@media(max-width:768px){h1{font-size:2rem}.container{padding:40px 20px}}</style></head><body><div class="container"><a href="/" class="back-link">← Back to Home</a><h1>Book with <span class="highlight">' + barberName + '</span></h1><p class="subtitle">Professional barber specializing in signature cuts, fades, and beard grooming</p><a href="/' + slug + '/book" class="btn">Book Appointment</a><div class="services"><div class="service-card"><div class="service-icon">✂️</div><h3 class="service-title">Haircuts</h3><p class="service-desc">Classic cuts & signature fades</p><a href="/' + slug + '/book" class="service-link">Book Now →</a></div><div class="service-card"><div class="service-icon">🪒</div><h3 class="service-title">Beard Grooming</h3><p class="service-desc">Precision trims & royal shaves</p><a href="/' + slug + '/book" class="service-link">Book Now →</a></div><div class="service-card"><div class="service-icon">⭐</div><h3 class="service-title">Premium</h3><p class="service-desc">VIP experience & packages</p><a href="/' + slug + '/book" class="service-link">Book Now →</a></div></div></div></body></html>';
}

function getBookingPage(barberName, slug) {
  var now = new Date();
  var hour = now.getHours();
  var day = now.getDay();
  var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  var classicPrice = 50;
  var signaturePrice = 55;
  var fadePrice = 50;
  var alert = '';

  if (day === 6) {
    alert = '<div style="background:#9f2f4a;padding:20px;border-radius:10px;margin-bottom:30px;text-align:center;font-weight:600;">⚠️ No Saturday availability - Please select another day</div>';
    classicPrice = 0;
  } else if (day === 0) {
    classicPrice = 45;
    signaturePrice = 50;
    fadePrice = 45;
    alert = '<div style="background:#2f8d5f;padding:20px;border-radius:10px;margin-bottom:30px;text-align:center;font-weight:600;">🎉 Sunday Special - Discounted pricing!</div>';
  } else if (hour < 10) {
    classicPrice = 55;
    signaturePrice = 60;
    fadePrice = 55;
    alert = '<div style="background:#D4AF37;color:#0A1929;padding:20px;border-radius:10px;margin-bottom:30px;text-align:center;font-weight:600;">🌅 Early Morning Surcharge Applied</div>';
  } else if (hour >= 17) {
    classicPrice = 55;
    signaturePrice = 60;
    fadePrice = 55;
    alert = '<div style="background:#D4AF37;color:#0A1929;padding:20px;border-radius:10px;margin-bottom:30px;text-align:center;font-weight:600;">🌙 Evening Surcharge Applied</div>';
  }

  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Book with ' + barberName + ' - The Signature Chair</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:linear-gradient(135deg,#0A1929 0%,#2f445d 30%,#6B1C23 100%);color:#fff;min-height:100vh}.container{max-width:900px;margin:0 auto;padding:60px 40px}h1{font-family:"Playfair Display",serif;font-size:3rem;font-weight:700;margin-bottom:10px}.highlight{background:linear-gradient(135deg,#D4AF37,#facc15);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}.back-link{color:#D4AF37;text-decoration:none;display:inline-block;margin-bottom:30px}.back-link:hover{text-decoration:underline}.progress-bar{display:flex;gap:10px;margin:30px 0}.progress-step{flex:1;height:8px;background:#2f445d;border-radius:4px}.progress-step.active{background:#D4AF37}.card{background:rgba(47,68,93,0.4);backdrop-filter:blur(10px);border:1px solid rgba(212,175,55,0.3);border-radius:20px;padding:50px;margin-top:30px}.step-title{font-size:2rem;font-weight:700;margin-bottom:30px}.services-grid{display:grid;gap:20px}.service-btn{background:rgba(10,25,41,0.6);border:2px solid rgba(212,175,55,0.3);color:#fff;padding:25px;border-radius:15px;cursor:pointer;text-align:left;width:100%;transition:all .3s;display:flex;justify-content:space-between;align-items:center}.service-btn:hover{border-color:#D4AF37;background:rgba(10,25,41,0.9);transform:translateY(-2px)}.service-name{font-size:1.3rem;font-weight:700}.service-details{color:#ccc;font-size:0.9rem;margin-top:5px}.service-price{font-size:1.8rem;font-weight:700;color:#D4AF37}@media(max-width:768px){.container{padding:30px 20px}h1{font-size:2rem}.card{padding:30px}}</style></head><body><div class="container"><a href="/' + slug + '" class="back-link">← Back</a><h1>Book with <span class="highlight">' + barberName + '</span></h1><div class="progress-bar"><div class="progress-step active"></div><div class="progress-step"></div><div class="progress-step"></div><div class="progress-step"></div><div class="progress-step"></div></div><div class="card">' + alert + '<h2 class="step-title">Select Service Category</h2><div class="services-grid"><button class="service-btn" onclick="alert(\'Booking system coming soon! Currently showing ' + dayNames[day] + ' pricing.\')"><div><div class="service-name">✂️ Haircuts</div><div class="service-details">Classic cuts & signature fades</div></div><div class="service-price">From $' + classicPrice + '</div></button><button class="service-btn" onclick="alert(\'Booking system coming soon!\')"><div><div class="service-name">🪒 Beard & Grooming</div><div class="service-details">Precision trims & royal shaves</div></div><div class="service-price">From $25</div></button><button class="service-btn" onclick="alert(\'Booking system coming soon!\')"><div><div class="service-name">✨ Color & Extras</div><div class="service-details">Gray blending & enhancements</div></div><div class="service-price">From $10</div></button><button class="service-btn" onclick="alert(\'Booking system coming soon!\')"><div><div class="service-name">⭐ Premium Experience</div><div class="service-details">VIP packages & special services</div></div><div class="service-price">From $85</div></button></div></div></div></body></html>';
}

const server = http.createServer((req, res) => {
  const url = req.url;

  console.log('Request:', url);

  // Route: Home page
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getHomePage());
    return;
  }

  // Route: Nando Blends contact page
  if (url === '/nando.blends' || url === '/nando.blends.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(nandoBlendsHTML);
    return;
  }

  // Route: Barber pages (e.g., /rick, /john)
  const barberMatch = url.match(/^\/([a-z]+)$/);
  if (barberMatch) {
    const slug = barberMatch[1];
    if (slug !== 'favicon.ico') {
      const barberName = slug.charAt(0).toUpperCase() + slug.slice(1);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(getBarberPage(barberName, slug));
      return;
    }
  }

  // Route: Booking pages (e.g., /rick/book, /john/book)
  const bookingMatch = url.match(/^\/([a-z]+)\/book$/);
  if (bookingMatch) {
    const slug = bookingMatch[1];
    const barberName = slug.charAt(0).toUpperCase() + slug.slice(1);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getBookingPage(barberName, slug));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log('Signature Chair frontend running on port ' + PORT);
  console.log('Routes:');
  console.log('  - / (home)');
  console.log('  - /nando.blends (Nando Blends contact - black & white theme)');
  console.log('  - /:barber (barber profile)');
  console.log('  - /:barber/book (booking flow)');
});
