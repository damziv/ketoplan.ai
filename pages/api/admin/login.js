// pages/api/admin/login.js
import { withApiSession } from "@/lib/session";
import crypto from "crypto";

function safeEqual(a, b) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export default withApiSession(async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, password } = req.body || {};
  const okUser = safeEqual(String(username || ""), String(process.env.ADMIN_USER || ""));
  const okPass = safeEqual(String(password || ""), String(process.env.ADMIN_PASSWORD || ""));

  if (!okUser || !okPass) {
    // small delay to make brute force slightly harder
    await new Promise((r) => setTimeout(r, 300));
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }

  req.session.user = { role: "admin", name: username, loggedInAt: Date.now() };
  await req.session.save();
  res.json({ ok: true });
});
