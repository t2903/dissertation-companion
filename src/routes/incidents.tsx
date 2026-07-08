import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAuthGuard } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listIncidents, listFarmers, updateIncidentStatus } from "@/lib/data.functions";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/incidents")({ component: Incidents });

function Incidents() {
  const ready = useAuthGuard();
  const fetchInc = useServerFn(listIncidents);
  const fetchFarmers = useServerFn(listFarmers);
  const doUpdate = useServerFn(updateIncidentStatus);
  const [rows, setRows] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const load = async () => {
    const [r, f] = await Promise.all([fetchInc(), fetchFarmers()]);
    setRows(r ?? []); setFarmers(f ?? []);
  };
  useEffect(() => { if (ready) load(); }, [ready]);
  if (!ready) return null;
  const setStatus = async (id: string, status: "open" | "in_review" | "resolved") => {
    try { await doUpdate({ data: { id, status } }); toast.success("Incident updated"); load(); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };
  return (
    <AppShell title="Non-Compliance Incidents">
      <Card className="p-5">
        <p className="mb-4 text-sm text-muted-foreground">{rows.filter((r) => r.status !== "resolved").length} open · {rows.filter((r) => r.status === "resolved").length} resolved</p>
        <Table>
          <TableHeader><TableRow><TableHead>Logged</TableHead><TableHead>Farmer</TableHead><TableHead>Category</TableHead><TableHead>Severity</TableHead><TableHead>Description</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => {
              const f = farmers.find((x) => x.id === r.farmer_id);
              const sev = r.severity === "High" ? "bg-destructive text-destructive-foreground" : r.severity === "Medium" ? "bg-warning text-accent-foreground" : "bg-secondary";
              const st = r.status === "open" ? "bg-destructive/10 text-destructive" : r.status === "in_review" ? "bg-warning/20 text-accent-foreground" : "bg-success/20 text-primary";
              return (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-GB")}</TableCell>
                  <TableCell className="font-medium">{f?.name}</TableCell>
                  <TableCell><Badge variant="outline">{r.category}</Badge></TableCell>
                  <TableCell><Badge className={sev}>{r.severity}</Badge></TableCell>
                  <TableCell className="max-w-xs">{r.description}<div className="text-xs text-muted-foreground">{r.corrective_action}</div></TableCell>
                  <TableCell>{r.due_date ?? "—"}</TableCell>
                  <TableCell><Badge className={st}>{r.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell>
                    {r.status !== "resolved" && (
                      <div className="flex gap-1">
                        {r.status === "open" && <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "in_review")}>Review</Button>}
                        <Button size="sm" onClick={() => setStatus(r.id, "resolved")}>Resolve</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No incidents logged.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}
