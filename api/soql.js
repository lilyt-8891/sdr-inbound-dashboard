// Read-only relay between the dashboard page and Salesforce.
// Runs each query with the SIGNED-IN person's own Salesforce access (same as the Claude version).
import { getSession, sessionCookie, config } from "../lib/session.js";
import { checkSoql } from "../lib/soql-guard.js";

async function refresh(cfg, s) {
  if (!s.rt) return null;
  const r = await fetch(`${cfg.loginUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: s.rt, client_id: cfg.clientId, client_secret: cfg.clientSecret }),
  });
  if (!r.ok) return null;
  const t = await r.json();
  return t.access_token ? { ...s, at: t.access_token, inst: t.instance_url || s.inst } : null;
}

const run = (cfg, s, q) =>
  fetch(`${s.inst}/services/data/${cfg.apiVersion}/query?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${s.at}`, Accept: "application/json" },
  });

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ isError: true, message: "Use POST." });
  if (!/application\/json/i.test(req.headers["content-type"] || "")) return res.status(415).json({ isError: true, message: "JSON only." });

  let s = getSession(req);
  if (!s) return res.status(401).json({ isError: true, message: "SESSION_EXPIRED" });

  const q = req.body && req.body.q;
  const problem = checkSoql(q);
  if (problem) return res.status(400).json({ isError: true, message: "BLOCKED_QUERY: " + problem });

  try {
    const cfg = config();
    let r = await run(cfg, s, q);
    if (r.status === 401) {
      const s2 = await refresh(cfg, s);
      if (!s2) return res.status(401).json({ isError: true, message: "SESSION_EXPIRED" });
      s = s2;
      res.setHeader("Set-Cookie", sessionCookie(s));
      r = await run(cfg, s, q);
    }
    const body = await r.json().catch(() => null);
    if (!r.ok) {
      const err = Array.isArray(body) ? body[0] : body || {};
      const code = err.errorCode || `HTTP_${r.status}`;
      const msg = code === "REQUEST_LIMIT_EXCEEDED" ? "rate limit: Salesforce API limit reached" : `${code}: ${err.message || "Salesforce error"}`;
      return res.status(r.status === 401 ? 401 : 502).json({ isError: true, message: msg });
    }
    return res.status(200).json({ records: body.records || [], done: body.done, totalSize: body.totalSize });
  } catch (e) {
    console.error("soql relay error:", e.message);
    return res.status(502).json({ isError: true, message: "Could not reach Salesforce." });
  }
}
