import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getSql } from "./db.server";
import { issueSession, clearSessionCookie, readSession } from "./session.server";

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().optional(),
});

export const signUp = createServerFn({ method: "POST" })
  .inputValidator((d) => credsSchema.parse(d))
  .handler(async ({ data }) => {
    const sql = getSql();
    const hash = await bcrypt.hash(data.password, 10);
    const existing = (await sql`SELECT id FROM users WHERE email = ${data.email}`) as { id: string }[];
    if (existing.length) throw new Error("Email already registered");

    // First user is admin, everyone else is compliance_officer
    const countRows = (await sql`SELECT COUNT(*)::int AS n FROM users`) as { n: number }[];
    const role = countRows[0].n === 0 ? "admin" : "compliance_officer";

    const rows = (await sql`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (${data.email}, ${hash}, ${data.full_name ?? null}, ${role})
      RETURNING id, email, role
    `) as { id: string; email: string; role: string }[];
    const u = rows[0];
    issueSession({ sub: u.id, email: u.email, role: u.role });
    return { id: u.id, email: u.email, role: u.role };
  });

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email(), password: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sql = getSql();
    const rows = (await sql`
      SELECT id, email, password_hash, role FROM users WHERE email = ${data.email}
    `) as { id: string; email: string; password_hash: string; role: string }[];
    const u = rows[0];
    if (!u) throw new Error("Invalid credentials");
    const ok = await bcrypt.compare(data.password, u.password_hash);
    if (!ok) throw new Error("Invalid credentials");
    issueSession({ sub: u.id, email: u.email, role: u.role });
    return { id: u.id, email: u.email, role: u.role };
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  clearSessionCookie();
  return { ok: true };
});

export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
  const s = readSession();
  if (!s) return null;
  return { id: s.sub, email: s.email, role: s.role };
});
