// src/lib/services/auth.service.js
// Single source of truth for User data access + credential logic.
import prisma from '@/config/prisma';
import bcrypt from 'bcryptjs';

/* ── Data access ── */
export const findUserByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });

export const createUser = (data) =>
  prisma.user.create({ data });

/* Hash the password and create the user — used by the admin seed.
   (Same bcrypt cost factor 10 as before — hashing logic unchanged.) */
export const createAdminUser = async ({ email, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return createUser({ email, password: hashedPassword });
};

/* Verify email + password. Returns the user on success, null otherwise —
   callers map null → 401, identical to the previous inline behavior. */
export const verifyUserCredentials = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const match = await bcrypt.compare(password, user.password);
  return match ? user : null;
};
