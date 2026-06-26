// src/utils/createAdmin.js
import { findUserByEmail, createAdminUser } from '@/lib/services/auth.service.js';

export default async function createAdminIfNotExists() {
  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin creation.');
    return;
  }

  const existing = await findUserByEmail(adminEmail);
  if (existing) {
    console.log('✅ Admin already exists');
    return;
  }

  await createAdminUser({ email: adminEmail, password: adminPassword });
  console.log('🚀 Admin auto-created');
}
