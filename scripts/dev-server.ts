import http from 'http';
import healthHandler from '../api/health.js';
import generateHandler from '../api/generate.js';
import editHandler from '../api/edit.js';
import summarizeHandler from '../api/summarize.js';

const PORT = process.env.PORT || 3001;

const routes = {
  'GET:/health': healthHandler,
  'POST:/generate': generateHandler,
  'POST:/edit': editHandler,
  'POST:/summarize': summarizeHandler,
};

const server = http.createServer(async (req, res) => {
  const key = `${req.method}:${req.url}`;
  const handler = routes[key];

  if (!handler) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // Add CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    await handler(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
