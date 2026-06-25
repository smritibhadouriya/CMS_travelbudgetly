// Logout: clears the httpOnly `token` cookie set at login.
import { runRoute } from '@/lib/express-adapter';

const logout = async (req, res) => {
  // maxAge:0 -> the browser drops the cookie immediately.
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out' });
};

export async function POST(req, ctx) {
  return runRoute(req, ctx, logout);
}
