import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAuthGuard } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listFarmers, listInspections, listIncidents } from "@/lib/data.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({ component: Reports });

function Reports() {
  const ready = useAuthGuard();
  const fF = useServerFn(listFarmers);
  const fI = useServerFn(listInspections);
  const fC = useServerFn(listIncidents);
  const [data, setData] = useState<{ farmers: any[]; insp: any[]; inc: any[] }>({ farmers: [], insp: [], inc: [] });
  useEffect(() => {
    if (!ready) return;
    Promise.all([fF(), fI(), fC()]).then(([f, i, c]) => setData({ farmers: f ?? [], insp: i ?? [], inc: c ?? [] }));
  }, [ready]);
  if (!ready) return null;

  const exportCsv = (rows: any[], name: string) => {
    if (!rows.length) return toast.error("No rows");
    const cols = Object.keys(rows[0]);
    const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? "")).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `${name}.csv`; a.click();
    toast.success(`${name}.csv downloaded`);
  };

  const avg = data.insp.length ? Math.round(data.insp.reduce((s, x) => s + Number(x.score), 0) / data.insp.length) : 0;
  const repeat = data.farmers.map((f) => ({ f, n: data.inc.filter((i) => i.farmer_id === f.id).length })).filter((x) => x.n >= 2).sort((a, b) => b.n - a.n);

  return (
    <AppShell title="Compliance Reports">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Inspections register", rows: data.insp, name: "inspections" },
          { title: "Incidents register", rows: data.inc, name: "incidents" },
          { title: "Farmer registry", rows: data.farmers, name: "farmers" },
        ].map((r) => (
          <Card key={r.name} className="p-5">
            <FileText className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-semibold">{r.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{r.rows.length} rows · CSV export</p>
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => exportCsv(r.rows, r.name)}><Download className="mr-1 h-4 w-4" />Download CSV</Button>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-5">
        <h3 className="font-display text-lg font-semibold">Audit summary</h3>
        <dl className="mt-3 grid gap-3 text-sm md:grid-cols-3">
          <div><dt className="text-muted-foreground">Average compliance score</dt><dd className="text-2xl font-bold">{avg}%</dd></div>
          <div><dt className="text-muted-foreground">Open incidents</dt><dd className="text-2xl font-bold">{data.inc.filter((x) => x.status !== "resolved").length}</dd></div>
          <div><dt className="text-muted-foreground">Repeat offenders</dt><dd className="text-2xl font-bold">{repeat.length}</dd></div>
        </dl>
        {repeat.length > 0 && (
          <div className="mt-5">
            <h4 className="text-sm font-semibold">Top repeat offenders</h4>
            <ul className="mt-2 space-y-1 text-sm">
              {repeat.slice(0, 5).map((r) => <li key={r.f.id} className="flex justify-between"><span>{r.f.name} <span className="text-muted-foreground">({r.f.region})</span></span><span className="font-medium">{r.n} incidents</span></li>)}
            </ul>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
