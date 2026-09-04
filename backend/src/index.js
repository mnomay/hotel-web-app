import cors from 'cors';
import express from 'express';
import env from './config/env.js';
import healthRouter from './routes/health.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    name: 'Hotel Web App API',
    version: '0.1.0',
  });
});

app.use('/api/health', healthRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
