const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy Socket.IO connections
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: 'http://localhost:3000',
      ws: true, // Enable WebSocket proxying
      changeOrigin: true,
      logLevel: 'debug'
    })
  );

  // Proxy API requests
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
      logLevel: 'debug'
    })
  );
};

