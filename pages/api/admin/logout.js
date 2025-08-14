// pages/api/admin/logout.js
import { withApiSession } from "@/lib/session";

export default withApiSession(async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  req.session.destroy();
  res.json({ ok: true });
});
