// Step 2 of "Log in with Salesforce": Salesforce sends the person back here after login.
// We swap the one-time code for that person's own Salesforce access, then store it
// in an encrypted cookie. Nothing is saved on the server.
import { config, redirectUri, readCookies, unseal, sessionCookie, clearCookie, FLOW_COOKIE } from "../../../lib/session.js";

const page = (msg) =>
  `<!doctype html><meta charset="utf-8"><title>Sign-in problem</title><body style="font-family:Helvetica,Arial,sans-serif;padding:40px;color:#111">` +
  `<h2 style="color:#1F3864">Sign-in problem</h2><p>${msg}</p><p><a href="/api/auth/login">Try again</a></p></body>`;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const cfg = config();
    const { code, state, error, error_description } = req.query || {};
    const flow = unseal(readCookies(req)[FLOW_COOKIE]);
    if (error) {
      const denied = /access_denied|not approved|OAUTH_APP_ACCESS_DENIED/i.test(`${error} ${error_description || ""}`);
      return res
        .status(403)
        .send(page(denied ? "You don't have access to the SDR Dashboard yet. Ask RevOps to add you to the “SDR Dashboard Access” permission set." : "Salesforce did not complete the sign-in."));
    }
    if (!code || !flow || flow.state !== state) return res.status(400).send(page("Your sign-in link expired or was already used."));

    const tokenRes = await fetch(`${cfg.loginUrl}/services/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri: redirectUri(cfg),
        code_verifier: flow.verifier,
      }),
    });
    const tok = await tokenRes.json();
    if (!tokenRes.ok || !tok.access_token) {
      console.error("token exchange failed:", tokenRes.status, tok.error);
      return res.status(403).send(page("Salesforce did not approve the sign-in. If this keeps happening, ask RevOps to check your access to the SDR Dashboard app."));
    }

    let name = "";
    try {
      const ui = await fetch(`${tok.instance_url}/services/oauth2/userinfo`, { headers: { Authorization: `Bearer ${tok.access_token}` } });
      if (ui.ok) name = (await ui.json()).name || "";
    } catch {}

    res.setHeader("Set-Cookie", [
      sessionCookie({ at: tok.access_token, rt: tok.refresh_token || null, inst: tok.instance_url, name }),
      clearCookie(FLOW_COOKIE),
    ]);
    res.redirect(302, "/");
  } catch (e) {
    console.error("callback error:", e.message);
    res.status(500).send(page("Something went wrong while signing in."));
  }
}
