// Mirrors the inline handler in src/routes/auth.routes.js (logic unchanged).
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/config/prisma.js';
import { runRoute } from '@/lib/express-adapter';

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Save the JWT as an httpOnly cookie so protected API routes can read it
    // (see auth.middleware.js -> req.cookies.token). httpOnly keeps it out of
    // JS/XSS; Secure is enabled in production (HTTPS).
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 day — matches the JWT expiry
    });

    res.json({ token });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ message: 'Login failed' });
  }
};

export async function POST(req, ctx) {
  return runRoute(req, ctx, login);
}
