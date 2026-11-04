// Step 1 of "Log in with Salesforce": send the person to Commure's Salesforce login page.
import crypto from "node:crypto";
import { config, redirectUri, seal, cookie, FLOW_COOKIE } from "../../lib/session.js";

export default function handler(req, res) {
  try {
    const cfg = config();
    const state = crypto.randomBytes(24).toString("base64url");
    const verifier = crypto.randomBytes(48).toString("base64url");
    const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
    const params = new URLSearchParams({
      response_type: "code",
      client_id: cfg.clientId,
      redirect_uri: redirectUri(cfg),
      scope: "api refresh_token openid",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    res.setHeader("Set-Cookie", cookie(FLOW_COOKIE, seal({ state, verifier, exp: Date.now() + 10 * 60e3 }), 600));
    res.setHeader("Cache-Control", "no-store");
    res.redirect(302, `${cfg.loginUrl}/services/oauth2/authorize?${params}`);
  } catch (e) {
    console.error("login error:", e.message);
    res.status(500).send("Login is not configured yet. Ask the dashboard owner to check the Vercel environment variables.");
  }
}
