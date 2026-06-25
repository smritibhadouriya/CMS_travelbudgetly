// src/utils/createAdmin.js
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

export default async function createAdminIfNotExists() {
  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin creation.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log('✅ Admin already exists');
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await prisma.user.create({ data: { email: adminEmail, password: hashedPassword } });
  console.log('🚀 Admin auto-created');
}
