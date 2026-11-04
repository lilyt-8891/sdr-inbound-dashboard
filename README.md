# SDR Inbound Follow-Up Dashboard

## Executive Summary
An internal Commure dashboard showing every Sales-Intent inbound, who owns it, and whether Sales followed up. It reads Salesforce live and read-only. People sign in with their normal Commure Salesforce login and see only what their own Salesforce access allows. Nothing is stored outside Salesforce.

- **Audience:** SDR team and SDR Manager
- **Owner:** Lily Thau, Marketing Operations
- **Hosting:** Vercel (Commure team) · **Code:** this private GitHub repo

---

## How it works
1. Someone opens the dashboard link.
2. If they aren't signed in, they're sent to Commure's Salesforce login.
3. Salesforce checks that they have the **"SDR Dashboard Access"** permission set (managed by RevOps).
4. The dashboard loads and asks Salesforce for data using that person's own access.

## What's in this folder
| Item | What it is |
|---|---|
| `dashboard/index.html` | The dashboard itself (design, filters, metrics, rules) |
| `api/` | Small server pieces: sign-in, sign-out and the read-only Salesforce relay |
| `lib/` | Shared security helpers |
| `public/` | Public files (only `robots.txt`, which tells search engines to stay away) |
| `scripts/check.js` | Safety checks (`npm run check`) |
| `CLAUDE.md` | Rules Claude follows when editing this project |
| `.env.example` | List of required settings, with **no real values** |

## Settings (Vercel → Project → Settings → Environment Variables)
| Name | What it is | Who provides it |
|---|---|---|
| `SF_CLIENT_ID` | Salesforce app Consumer Key | RevOps |
| `SF_CLIENT_SECRET` | Salesforce app Consumer Secret (**secret**) | RevOps |
| `SF_LOGIN_URL` | `https://athelas.my.salesforce.com` | Fixed |
| `APP_BASE_URL` | The dashboard's address, e.g. `https://sdr-inbound-dashboard.vercel.app` | Vercel |
| `SESSION_SECRET` | Long random string (32+ characters) used to encrypt sign-in cookies (**secret**) | You generate it |

**Never** put real values in any file in this repo, in Slack, or in a Claude chat.

## How to make a change (with Claude)
1. In GitHub Desktop, click **Fetch origin** to get the latest version.
2. In Claude Cowork (with this folder connected), describe the change in plain English.
3. Claude creates a new branch, makes the change and runs the safety checks.
4. In GitHub Desktop, review the changes, then click **Commit** → **Push origin** → **Create Pull Request**.
5. Vercel posts a private preview link on the pull request. Check it.
6. If it looks right, click **Merge** on GitHub. It goes live in about a minute.
7. **To undo:** Vercel → Deployments → pick the previous version → **Promote to Production**.

## Test checklist (after each deploy)
- [ ] Opening the link while signed out redirects to Salesforce login
- [ ] A user with the permission set can sign in and see data
- [ ] A user without the permission set is blocked
- [ ] `/dashboard/index.html` returns **404** (the page can't be opened directly)
- [ ] KPIs match the previous version for the same date range
- [ ] Sign out works

## Who to contact
- **Access requests / Salesforce app:** RevOps
- **Vercel or GitHub permissions:** Engineering / IT
- **Dashboard content and metrics:** Lily Thau
