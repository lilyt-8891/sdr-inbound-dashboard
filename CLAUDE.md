# Instructions for Claude: SDR Inbound Follow-Up Dashboard

Read this before changing anything in this repository.

## What this is
- An internal Commure dashboard for the SDR team and SDR Manager, hosted on Vercel.
- Owner: Lily Thau (Marketing Operations). She is not a developer. Explain changes in plain English.
- People sign in with Salesforce. Every query runs with the **signed-in person's own Salesforce access**.

## Where things live
| File | Purpose | Change freely? |
|---|---|---|
| `dashboard/index.html` | The whole dashboard: design, filters, KPIs, tables, business rules | Yes, with the rules below |
| `api/soql.js` | Read-only relay to Salesforce | Only with Lily's explicit approval |
| `lib/soql-guard.js` | List of Salesforce objects the dashboard may read | Only with Lily's approval, and flag for RevOps review |
| `api/auth/*`, `lib/session.js`, `api/app.js` | Sign-in and security | **Do not change** without Lily's explicit approval. Suggest Engineering review |
| `vercel.json` | Hosting and security headers | Only with Lily's approval |

## Hard rules
1. **Never** write real credentials, tokens, client secrets or passwords into any file. Settings come from Vercel Environment Variables only. `.env.example` uses `CHANGE_ME`.
2. **Never** commit Salesforce data (CSV/XLSX exports, query results, screenshots with data).
3. **Never** change metric definitions or business rules (forms list, follow-up rules, unqualified handling, owner rules, test/duplicate filters) without Lily confirming the new rule in plain English first.
4. Queries must stay **read-only** (SELECT). Never add create/update/delete calls to Salesforce.
5. Keep the dashboard page free of outside scripts. If a library is truly needed, ask first. The Content-Security-Policy in `vercel.json` blocks outside sources by default.
6. Work on a **new branch** for each change. Never commit directly to `main`.
7. Run `npm run check` before telling Lily a change is ready. All checks must pass.
8. After each change, give Lily: (a) a plain-English summary, (b) the files changed, (c) what to check on the Vercel preview link, (d) any [REVIEW NEEDED] items.

## Metric definitions (source of truth: the "How to read this" box in `dashboard/index.html`)
- **Inbound** = one person submitting one or more Sales-Intent forms on a given day, after removing duplicates, tests and internal submissions.
- Outcomes are a **waterfall** (approved by Lily, Nov 5, 2026): Meeting scheduled ⊂ Connected ⊂ Followed up.
- **Followed up** = outbound call (any result), manual sales email, Outreach sequence email, or booked meeting logged after the submission.
- **Connected** = call where the rep reached the person, a verified completed meeting, or a booked meeting.
- **Meeting scheduled** = non-cancelled Event with the person (WhoId), credited by the Event's CreatedDate to the most recent submission before it. Future meetings count.
- **Team** = matched on current Owner via the `TEAMS` list (Salesforce User IDs) in `dashboard/index.html`. People can be on multiple teams.
- **Unqualified** = Lead/Contact status Unqualified and not followed up; excluded from the follow-up rate.
- **SDR view tab** (approved by Lily, Nov 5, 2026): headline = % of workable inbounds followed up within 24 hrs (`SLA_HRS`), target 80% (`SLA_TARGET`). Counts only inbounds with an exact submission time, once 24 hrs have passed or they were followed up. Workable = inbounds minus unqualified. "Needs follow-up now" = workable with no outreach (goal 0). The SDR view's list (Inbounds) shows **every** inbound with a Status pill matching the Team view (approved by Lily, Nov 13, 2026); leads still needing follow-up sort first, oldest first. Defaults to the signed-in person's own leads (matched by name); Team view stays the first tab.
- **Owner** = current Lead/Contact Owner; integration/system users show as Unassigned.

## Settings that need periodic review
- `FORMS` list (approved Sales-Intent forms)
- `TEAMS` list (team membership; update when people join, leave or change teams)
- `U` (named system/RevOps user IDs) and `NONSALES_SNAP` (saved Oct 22, 2026, non-sales users list). Review quarterly with RevOps.
