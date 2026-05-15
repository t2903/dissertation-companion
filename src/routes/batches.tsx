import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAuthGuard } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/batches")({ component: Batches });

function Batches() {
  const ready = useAuthGuard();
  const [rows, setRows] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  useEffect(() => {
    if (!ready) return;
    Promise.all([supabase.from("batches").select("*").order("batch_date", { ascending: false }), supabase.from("farmers").select("id,name,region")])
      .then(([b, f]) => { setRows(b.data ?? []); setFarmers(f.data ?? []); });
  }, [ready]);
  if (!ready) return null;
  return (
    <AppShell title="Curing & Reaping Batches">
      <Card className="p-5">
        <p className="mb-4 text-sm text-muted-foreground">{rows.length} batches · {rows.filter((r) => r.status === "flagged").length} flagged for moisture/grade deviation</p>
        <Table>
          <TableHeader><TableRow><TableHead>Batch date</TableHead><TableHead>Farmer</TableHead><TableHead>Barn</TableHead><TableHead className="text-right">Moisture %</TableHead><TableHead>Grade</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => {
              const f = farmers.find((x) => x.id === r.farmer_id);
              const flagged = r.status === "flagged";
              return (
                <TableRow key={r.id}>
                  <TableCell>{r.batch_date}</TableCell>
                  <TableCell className="font-medium">{f?.name}</TableCell>
                  <TableCell>{r.barn}</TableCell>
                  <TableCell className={`text-right ${Number(r.moisture) > 14 ? "text-destructive font-semibold" : ""}`}>{Number(r.moisture).toFixed(1)}</TableCell>
                  <TableCell><Badge variant="outline">{r.grade}</Badge></TableCell>
                  <TableCell><Badge className={flagged ? "bg-destructive text-destructive-foreground" : "bg-success/20 text-primary"}>{r.status}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}
