import { createClient } from "@supabase/supabase-js";

const SHEET_CSV = "https://docs.google.com/spreadsheets/d/1TWk517JvCeGtk-zqE0YHkpcNPBFNRwkMrtXbUiz1iJE/export?format=csv";

// Statuses to include (active franchisees only)
const ACTIVE_STATUSES = ["ativo", "ativo, entrada por repasse", "no juridico"];

interface FranchiseeRow {
  fqvNumber: number;
  username: string;
  displayName: string;
  firstName: string;
  defaultPassword: string;
}

function toFirstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
}

function defaultPassword(n: number): string {
  const a = n * 10;
  return `V24H${a}${a + 20}${a + 10}`;
}

function padNumber(n: number): string {
  return String(n).padStart(2, "0");
}

async function parseSheet(): Promise<FranchiseeRow[]> {
  const res = await fetch(SHEET_CSV);
  if (!res.ok) throw new Error(`Sheet fetch error: ${res.status}`);
  const csv = await res.text();
  const lines = csv.split("\n").slice(1); // skip header

  const seen = new Set<number>();
  const rows: FranchiseeRow[] = [];

  for (const line of lines) {
    const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    if (cols.length < 3) continue;
    const [status, fqvRaw, nameRaw] = cols;
    if (!status || !fqvRaw || !nameRaw) continue;

    const statusNorm = status.toLowerCase().replace(/[^a-z ,]/g, "").trim();
    const isActive = ACTIVE_STATUSES.some((s) => statusNorm.startsWith(s));
    if (!isActive) continue;

    // Only base numbers (skip 02.2, 07.2 etc)
    const fqvClean = fqvRaw.replace(/^0+/, "") || "0";
    if (fqvClean.includes(".")) continue;

    const fqvNumber = parseInt(fqvClean, 10);
    if (isNaN(fqvNumber) || fqvNumber <= 0) continue;
    if (seen.has(fqvNumber)) continue;
    seen.add(fqvNumber);

    const displayName = nameRaw.split(/\s+/).map(
      (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join(" ");

    rows.push({
      fqvNumber,
      username: `fqv${padNumber(fqvNumber)}`,
      displayName,
      firstName: toFirstName(nameRaw),
      defaultPassword: defaultPassword(fqvNumber),
    });
  }

  // Add admin
  rows.push({
    fqvNumber: 0,
    username: "admin",
    displayName: "Administrador",
    firstName: "Admin",
    defaultPassword: "@superfranquias2026",
  });

  return rows;
}

export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  // Allow GET (cron) or POST with secret
  const authHeader = req.headers.get("authorization") ?? "";
  const cronKey = process.env.CRON_SECRET ?? "";
  if (req.method === "POST" && cronKey && authHeader !== `Bearer ${cronKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return new Response(JSON.stringify({ error: "Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rows = await parseSheet();
  const results: string[] = [];

  for (const row of rows) {
    const email = `${row.username}@validavinho.app`;

    // Check if user already exists
    const { data: existing } = await admin.auth.admin.listUsers();
    const found = existing?.users?.find((u) => u.email === email);

    if (!found) {
      // Create user
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: row.defaultPassword,
        email_confirm: true,
        user_metadata: { username: row.username, display_name: row.displayName },
      });
      if (createErr) { results.push(`ERROR ${row.username}: ${createErr.message}`); continue; }

      // Insert profile
      await admin.from("profiles").upsert({
        id: created.user!.id,
        username: row.username,
        display_name: row.displayName,
        first_name: row.firstName,
        role: row.username === "admin" ? "admin" : "franchisee",
        franchise_number: row.fqvNumber || null,
      });
      results.push(`CREATED ${row.username} (${row.displayName})`);
    } else {
      // Update profile name (in case it changed in the sheet)
      await admin.from("profiles").update({
        display_name: row.displayName,
        first_name: row.firstName,
      }).eq("id", found.id);
      results.push(`UPDATED ${row.username}`);
    }
  }

  return new Response(JSON.stringify({ synced: rows.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
}
