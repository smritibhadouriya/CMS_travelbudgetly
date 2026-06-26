// Runs once when the Next.js server boots (Node.js runtime only).
// Seeds the admin user once when the server boots.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  try {
    const { default: createAdminIfNotExists } = await import('@/lib/bootstrap/createAdmin.js');
    await createAdminIfNotExists();
  } catch (err) {
    console.error('Admin seed failed:', err?.message || err);
  }
}
