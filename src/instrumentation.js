// Runs once when the Next.js server boots (Node.js runtime only).
// Mirrors the Express server startup that seeded the admin user.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  try {
    const { default: createAdminIfNotExists } = await import('./utils/createAdmin.js');
    await createAdminIfNotExists();
  } catch (err) {
    console.error('Admin seed failed:', err?.message || err);
  }
}
