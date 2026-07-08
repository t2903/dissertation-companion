import { createFileRoute } from "@tanstack/react-router";

async function bootstrap() {
  const { getSql } = await import("@/lib/db.server");
  const sql = getSql();

  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      role TEXT NOT NULL DEFAULT 'compliance_officer',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS farmers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      contract_no TEXT NOT NULL,
      region TEXT NOT NULL,
      hectarage NUMERIC NOT NULL DEFAULT 0,
      phone TEXT,
      joined_at DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS batches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
      batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
      barn TEXT,
      moisture NUMERIC,
      grade TEXT,
      status TEXT NOT NULL DEFAULT 'ok',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS inspections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
      inspector_name TEXT NOT NULL,
      inspection_type TEXT NOT NULL,
      score NUMERIC NOT NULL DEFAULT 0,
      notes TEXT,
      inspected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS incidents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      description TEXT NOT NULL,
      corrective_action TEXT,
      due_date DATE,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_batches_farmer ON batches(farmer_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_inspections_farmer ON inspections(farmer_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_incidents_farmer ON incidents(farmer_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status)`;

  // Seed demo farmers if empty
  const count = (await sql`SELECT COUNT(*)::int AS n FROM farmers`) as { n: number }[];
  if (count[0].n === 0) {
    await sql`
      INSERT INTO farmers (name, contract_no, region, hectarage, phone) VALUES
      ('Tafadzwa Moyo', 'CRP-2025-001', 'Mashonaland Central', 4.5, '+263 77 111 2233'),
      ('Rudo Chikanga', 'CRP-2025-002', 'Mashonaland East', 3.2, '+263 77 222 3344'),
      ('Farai Ncube', 'CRP-2025-003', 'Mashonaland West', 6.0, '+263 77 333 4455'),
      ('Nyasha Dube', 'CRP-2025-004', 'Manicaland', 2.8, '+263 77 444 5566'),
      ('Tendai Sibanda', 'CRP-2025-005', 'Mashonaland Central', 5.4, '+263 77 555 6677')
    `;
  }

  return { ok: true };
}

export const Route = createFileRoute("/api/init-db")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const result = await bootstrap();
          return Response.json(result);
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      },
    },
  },
});
