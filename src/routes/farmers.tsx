import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAuthGuard } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/farmers")({ component: Farmers });

function Farmers() {
  const ready = useAuthGuard();
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => { if (ready) supabase.from("farmers").select("*").order("name").then(({ data }) => setRows(data ?? [])); }, [ready]);
  if (!ready) return null;
  const filtered = rows.filter((r) => `${r.name} ${r.region} ${r.contract_no}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <AppShell title="Farmer Registry">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{rows.length} contracted farmers across all CRP regions</p>
          <Input placeholder="Search farmer, region or contract…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contract</TableHead><TableHead>Region</TableHead><TableHead className="text-right">Hectarage</TableHead><TableHead>Phone</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell><Badge variant="outline">{r.contract_no}</Badge></TableCell>
                <TableCell>{r.region}</TableCell>
                <TableCell className="text-right">{Number(r.hectarage).toFixed(1)} ha</TableCell>
                <TableCell className="text-muted-foreground">{r.phone}</TableCell>
                <TableCell className="text-muted-foreground">{r.joined_at}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}
