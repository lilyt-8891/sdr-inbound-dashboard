// Quick safety checks. Run with:  npm run check
// Claude runs this before every change is committed.
import fs from "node:fs";
import path from "node:path";
import { checkSoql } from "../lib/soql-guard.js";

let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`); if (!cond) fails++; };

// 1. Query guard
ok(checkSoql("SELECT Id FROM Lead WHERE Id != null") === null, "allows read-only Lead query");
ok(checkSoql("SELECT Id, Profile.Name FROM User WHERE Id != null") === null, "allows User query with relationship field");
ok(checkSoql("SELECT Id FROM Opportunity") !== null, "blocks objects not on the approved list");
ok(checkSoql("DELETE FROM Lead") !== null, "blocks non-SELECT statements");
ok(checkSoql("SELECT Id, (SELECT Id FROM Tasks) FROM Lead") !== null, "blocks sub-queries");

// 2. Session encryption round-trip
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "x".repeat(40);
const { seal, unseal } = await import("../lib/session.js");
const t = seal({ a: 1, exp: Date.now() + 60000 });
ok(unseal(t)?.a === 1, "encrypted session can be read back");
ok(unseal(t.slice(0, -2) + "AA") === null, "tampered session is rejected");
ok(unseal(seal({ a: 1, exp: Date.now() - 1 })) === null, "expired session is rejected");

// 3. Dashboard page
const dash = path.join(process.cwd(), "dashboard", "index.html");
if (fs.existsSync(dash)) {
  const html = fs.readFileSync(dash, "utf8");
  ok(!/window\.cowork/.test(html), "dashboard no longer depends on the Claude connector");
  ok(/\/api\/soql/.test(html), "dashboard uses the secure /api/soql relay");
} else ok(false, "dashboard/index.html exists");

// 4. Secret scan (all tracked-looking files)
const SECRET = /(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|sk_live_|-----BEGIN [A-Z ]*PRIVATE KEY|3MVG9[A-Za-z0-9._]{40,}|SF_CLIENT_SECRET\s*=\s*(?!CHANGE_ME)\S+)/;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  [".git", "node_modules", ".vercel"].includes(e.name) ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const hits = walk(process.cwd()).filter((f) => f !== path.join(process.cwd(), "scripts", "check.js") && SECRET.test(fs.readFileSync(f, "utf8")));
ok(hits.length === 0, "no credentials found in files" + (hits.length ? ` (check: ${hits.join(", ")})` : ""));
ok(!fs.existsSync(path.join(process.cwd(), ".env")), "no .env file in the folder");

console.log(fails ? `\n${fails} check(s) failed.` : "\nAll checks passed.");
process.exit(fails ? 1 : 0);
