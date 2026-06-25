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

    res.json({ token });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ message: 'Login failed' });
  }
};

export async function POST(req, ctx) {
  return runRoute(req, ctx, login);
}
