const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_TARGET = process.env.API_TARGET || 'http://127.0.0.1:8000';

console.log(`Starting server on port ${PORT}, proxying API calls to ${API_TARGET}`);

// Proxy /api to backend
app.use('/api', createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  logLevel: 'info',
}));

// Proxy /forecasts to backend
app.use('/forecasts', createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  logLevel: 'info',
}));

// Serve static files from dist
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback - serve index.html for all other routes (must be last)
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
  console.log(`API proxy target: ${API_TARGET}`);
});
