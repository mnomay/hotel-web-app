import dotenv from 'dotenv';

dotenv.config();

const env = {
  port: Number(process.env.PORT) || 3001,
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/hotel_web_app',
  nodeEnv: process.env.NODE_ENV || 'development',
};

export default env;
