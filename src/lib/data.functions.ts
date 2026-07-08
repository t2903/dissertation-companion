import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "./db.server";
import { requireSession, requireAdmin } from "./session.server";

/* ============================ FARMERS ============================ */

export const listFarmers = createServerFn({ method: "GET" }).handler(async () => {
  requireSession();
  const sql = getSql();
  return (await sql`SELECT * FROM farmers ORDER BY name`) as any[];
});

export const createFarmer = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      name: z.string().min(1),
      contract_no: z.string().min(1),
      region: z.string().min(1),
      hectarage: z.number().nonnegative(),
      phone: z.string().optional().nullable(),
      joined_at: z.string().optional().nullable(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    requireSession();
    const sql = getSql();
    const rows = (await sql`
      INSERT INTO farmers (name, contract_no, region, hectarage, phone, joined_at)
      VALUES (${data.name}, ${data.contract_no}, ${data.region}, ${data.hectarage},
              ${data.phone ?? null}, ${data.joined_at ?? new Date().toISOString().slice(0,10)})
      RETURNING *
    `) as any[];
    return rows[0];
  });

/* ============================ BATCHES ============================ */

export const listBatches = createServerFn({ method: "GET" }).handler(async () => {
  requireSession();
  const sql = getSql();
  return (await sql`SELECT * FROM batches ORDER BY batch_date DESC`) as any[];
});

/* ============================ INSPECTIONS ============================ */

export const listInspections = createServerFn({ method: "GET" }).handler(async () => {
  requireSession();
  const sql = getSql();
  return (await sql`SELECT * FROM inspections ORDER BY inspected_at DESC`) as any[];
});

export const createInspection = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      farmer_id: z.string().uuid(),
      inspector_name: z.string().min(1),
      inspection_type: z.string().min(1),
      score: z.number().min(0).max(100),
      notes: z.string().optional().nullable(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    requireSession();
    const sql = getSql();
    const rows = (await sql`
      INSERT INTO inspections (farmer_id, inspector_name, inspection_type, score, notes, inspected_at)
      VALUES (${data.farmer_id}, ${data.inspector_name}, ${data.inspection_type},
              ${data.score}, ${data.notes ?? null}, NOW())
      RETURNING *
    `) as any[];
    return rows[0];
  });

/* ============================ INCIDENTS ============================ */

export const listIncidents = createServerFn({ method: "GET" }).handler(async () => {
  requireSession();
  const sql = getSql();
  return (await sql`SELECT * FROM incidents ORDER BY created_at DESC`) as any[];
});

export const createIncident = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      farmer_id: z.string().uuid(),
      category: z.string().min(1),
      severity: z.string().min(1),
      description: z.string().min(1),
      corrective_action: z.string().optional().nullable(),
      due_date: z.string().optional().nullable(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    requireSession();
    const sql = getSql();
    const rows = (await sql`
      INSERT INTO incidents (farmer_id, category, severity, description, corrective_action, due_date, status, created_at)
      VALUES (${data.farmer_id}, ${data.category}, ${data.severity}, ${data.description},
              ${data.corrective_action ?? null}, ${data.due_date ?? null}, 'open', NOW())
      RETURNING *
    `) as any[];
    return rows[0];
  });

export const updateIncidentStatus = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["open", "in_review", "resolved"]),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    requireSession();
    const sql = getSql();
    const resolved = data.status === "resolved" ? new Date().toISOString() : null;
    const rows = (await sql`
      UPDATE incidents
      SET status = ${data.status},
          resolved_at = ${resolved}
      WHERE id = ${data.id}
      RETURNING *
    `) as any[];
    return rows[0];
  });

/* ============================ ADMIN ============================ */

export const listUsers = createServerFn({ method: "GET" }).handler(async () => {
  requireAdmin();
  const sql = getSql();
  return (await sql`
    SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at
  `) as any[];
});

export const changeUserRole = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      user_id: z.string().uuid(),
      role: z.enum(["admin", "manager", "compliance_officer", "agronomist", "farmer", "inspector"]),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    requireAdmin();
    const sql = getSql();
    await sql`UPDATE users SET role = ${data.role} WHERE id = ${data.user_id}`;
    return { ok: true };
  });
