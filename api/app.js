// Serves the dashboard page, but only to people who are signed in.
// The page lives in /dashboard (not /public) so it can never be opened without logging in.
import fs from "node:fs";
import path from "node:path";
import { getSession } from "../lib/session.js";

let HTML = null;

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const s = getSession(req);
  if (!s) return res.redirect(302, "/api/auth/login");
  if (!HTML) HTML = fs.readFileSync(path.join(process.cwd(), "dashboard", "index.html"), "utf8");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(HTML);
}
