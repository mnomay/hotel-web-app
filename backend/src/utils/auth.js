import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const signAdminToken = (admin) =>
  jwt.sign(
    {
      sub: admin.id,
      email: admin.email,
      role: 'admin',
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

export const verifyAdminToken = (token) => jwt.verify(token, env.jwtSecret);

export const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.nodeEnv === 'production',
  path: '/',
};
