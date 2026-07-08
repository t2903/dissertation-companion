import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAuthGuard } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listBatches, listFarmers } from "@/lib/data.functions";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/batches")({ component: Batches });

function Batches() {
  const ready = useAuthGuard();
  const fetchBatches = useServerFn(listBatches);
  const fetchFarmers = useServerFn(listFarmers);
  const [rows, setRows] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  useEffect(() => {
    if (!ready) return;
    Promise.all([fetchBatches(), fetchFarmers()]).then(([b, f]) => { setRows(b ?? []); setFarmers(f ?? []); });
  }, [ready, fetchBatches, fetchFarmers]);
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
                  <TableCell className={`text-right ${Number(r.moisture) > 14 ? "text-destructive font-semibold" : ""}`}>{Number(r.moisture ?? 0).toFixed(1)}</TableCell>
                  <TableCell><Badge variant="outline">{r.grade}</Badge></TableCell>
                  <TableCell><Badge className={flagged ? "bg-destructive text-destructive-foreground" : "bg-success/20 text-primary"}>{r.status}</Badge></TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No batches recorded yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}
