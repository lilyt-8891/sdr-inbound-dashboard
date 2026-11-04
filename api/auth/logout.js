// Sign out: revoke the Salesforce access for this browser and clear the cookie.
import { getSession, clearCookie, SESSION_COOKIE, config } from "../../lib/session.js";

export default async function handler(req, res) {
  const s = getSession(req);
  if (s) {
    try {
      const cfg = config();
      await fetch(`${cfg.loginUrl}/services/oauth2/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: s.rt || s.at }),
      });
    } catch {}
  }
  res.setHeader("Set-Cookie", clearCookie(SESSION_COOKIE));
  res.setHeader("Cache-Control", "no-store");
  res
    .status(200)
    .send(`<!doctype html><meta charset="utf-8"><title>Signed out</title><body style="font-family:Helvetica,Arial,sans-serif;padding:40px"><h2 style="color:#1F3864">You're signed out</h2><p><a href="/">Sign back in</a></p></body>`);
}
