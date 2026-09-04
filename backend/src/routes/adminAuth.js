import { Router } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../db/prisma.js';
import env from '../config/env.js';
import { authCookieOptions, signAdminToken } from '../utils/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const admin = await prisma.adminUser.findUnique({ where: { email } });

    if (!admin) {
      return res.status(401).json({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const matches = await bcrypt.compare(password, admin.passwordHash);

    if (!matches) {
      return res.status(401).json({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const token = signAdminToken(admin);
    res.cookie(env.cookieName, token, {
      ...authCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      id: admin.id,
      email: admin.email,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie(env.cookieName, authCookieOptions);
  return res.json({ ok: true });
});

router.get('/me', requireAdmin, (req, res) => {
  return res.json({
    id: req.admin.id,
    email: req.admin.email,
  });
});

router.post('/change-password', requireAdmin, async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required',
        code: 'INVALID_PASSWORD',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters',
        code: 'WEAK_PASSWORD',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: 'New password must be different from the current password',
        code: 'SAME_PASSWORD',
      });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: req.admin.id },
    });

    if (!admin) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const matches = await bcrypt.compare(currentPassword, admin.passwordHash);

    if (!matches) {
      return res.status(401).json({
        message: 'Current password is incorrect',
        code: 'INVALID_PASSWORD',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash },
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to change password' });
  }
});

export default router;
