// Encrypted cookie helpers (no outside libraries).
// Sessions are encrypted with AES-256-GCM using SESSION_SECRET, so the browser
// can hold the cookie but cannot read or alter what is inside it.
import crypto from "node:crypto";

export const SESSION_COOKIE = "sdr_session";
export const FLOW_COOKIE = "sdr_oauth"; // short-lived, used only during login
const SESSION_HOURS = 8;

function key() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET is missing or shorter than 32 characters.");
  return crypto.createHash("sha256").update(s).digest();
}

export function seal(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString("base64url");
}

export function unseal(token) {
  try {
    const buf = Buffer.from(String(token || ""), "base64url");
    if (buf.length < 29) return null;
    const d = crypto.createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
    d.setAuthTag(buf.subarray(12, 28));
    const obj = JSON.parse(Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8"));
    if (obj.exp && Date.now() > obj.exp) return null;
    return obj;
  } catch {
    return null;
  }
}

export function readCookies(req) {
  const out = {};
  String(req.headers.cookie || "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

export function cookie(name, value, maxAgeSec) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

export function getSession(req) {
  return unseal(readCookies(req)[SESSION_COOKIE]);
}

export function sessionCookie(session) {
  const exp = session.exp || Date.now() + SESSION_HOURS * 3600e3;
  return cookie(SESSION_COOKIE, seal({ ...session, exp }), Math.max(0, Math.round((exp - Date.now()) / 1000)));
}

export function clearCookie(name) {
  return cookie(name, "", 0);
}

export function config() {
  const need = ["SF_CLIENT_ID", "SF_CLIENT_SECRET", "SF_LOGIN_URL", "APP_BASE_URL", "SESSION_SECRET"];
  const missing = need.filter((k) => !process.env[k]);
  if (missing.length) throw new Error("Missing environment variables: " + missing.join(", "));
  return {
    clientId: process.env.SF_CLIENT_ID,
    clientSecret: process.env.SF_CLIENT_SECRET,
    loginUrl: process.env.SF_LOGIN_URL.replace(/\/+$/, ""),
    baseUrl: process.env.APP_BASE_URL.replace(/\/+$/, ""),
    apiVersion: process.env.SF_API_VERSION || "v62.0",
  };
}

export const redirectUri = (cfg) => `${cfg.baseUrl}/api/auth/callback/salesforce`;
