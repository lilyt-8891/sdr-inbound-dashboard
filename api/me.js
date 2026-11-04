// Returns the signed-in person's display name (shown in the dashboard header).
import { getSession } from "../lib/session.js";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const s = getSession(req);
  if (!s) return res.status(401).json({ isError: true, message: "SESSION_EXPIRED" });
  res.status(200).json({ name: s.name || "" });
}
