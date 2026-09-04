import prisma from '../db/prisma.js';
import env from '../config/env.js';
import { verifyAdminToken } from '../utils/auth.js';

export const requireAdmin = async (req, res, next) => {
  try {
    const token = req.cookies?.[env.cookieName];

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    let payload;
    try {
      payload = verifyAdminToken(token);
    } catch {
      return res.status(401).json({
        message: 'Invalid or expired session',
        code: 'UNAUTHORIZED',
      });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, createdAt: true },
    });

    if (!admin) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    req.admin = admin;
    return next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
};
