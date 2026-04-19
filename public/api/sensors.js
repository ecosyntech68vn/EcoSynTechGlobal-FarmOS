const API_URL = 'https://ecosyntech-web.onrender.com' || 'http://localhost:3000';

async function handler(req, res) {
  const url = new URL(req.url, API_URL);
  
  try {
    const response = await fetch(API_URL + '/api/sensors', {
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  } catch (e) {
    const mockData = {
      soil_moisture: { value: Math.floor(Math.random() * 40) + 35, unit: '%', timestamp: new Date().toISOString() },
      temperature: { value: Math.floor(Math.random() * 10) + 24, unit: '°C', timestamp: new Date().toISOString() },
      humidity: { value: Math.floor(Math.random() * 20) + 55, unit: '%', timestamp: new Date().toISOString() },
      light: { value: Math.floor(Math.random() * 500) + 200, unit: 'lux', timestamp: new Date().toISOString() }
    };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(mockData));
  }
}

export default handler;