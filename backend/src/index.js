import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import env from './config/env.js';
import healthRouter from './routes/health.js';
import roomsRouter from './routes/rooms.js';
import bookingsRouter from './routes/bookings.js';
import reviewsRouter from './routes/reviews.js';
import adminAuthRouter from './routes/adminAuth.js';

const app = express();

app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get('/', (_req, res) => {
  res.json({
    name: 'Hotel Web App API',
    version: '0.1.0',
  });
});

app.use('/api/health', healthRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/admin', adminAuthRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
