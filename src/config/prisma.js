// src/config/prisma.js
import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient across hot-reloads in dev to avoid
// exhausting the database connection pool (Next.js recreates modules).
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
