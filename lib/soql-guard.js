// Safety check for queries the dashboard sends to Salesforce.
// Only read-only SELECT queries on the objects the dashboard actually uses are allowed.
// To let the dashboard read a NEW Salesforce object, add it to this list (Engineering/RevOps review recommended).
export const ALLOWED_OBJECTS = ["Task", "Lead", "Contact", "User", "LeadHistory", "ContactHistory", "Event"];
export const MAX_QUERY_LENGTH = 20000;

export function checkSoql(q) {
  if (typeof q !== "string" || !q.trim()) return "Query is empty.";
  if (q.length > MAX_QUERY_LENGTH) return "Query is too long.";
  if (!/^\s*SELECT\s/i.test(q)) return "Only SELECT queries are allowed.";
  const froms = [...q.matchAll(/\bFROM\s+([A-Za-z_][A-Za-z0-9_]*)/gi)];
  if (froms.length !== 1) return "Only simple queries on one object are allowed.";
  if (/\(\s*SELECT\b/i.test(q)) return "Sub-queries are not allowed.";
  const obj = froms[0][1];
  if (!ALLOWED_OBJECTS.some((o) => o.toLowerCase() === obj.toLowerCase())) return `Object "${obj}" is not on the approved list.`;
  return null; // OK
}
