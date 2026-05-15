import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAuthGuard } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, AlertTriangle, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const ready = useAuthGuard();
  const [data, setData] = useState<{ farmers: any[]; insp: any[]; inc: any[]; bat: any[] }>({ farmers: [], insp: [], inc: [], bat: [] });
  useEffect(() => {
    if (!ready) return;
    (async () => {
      const [f, i, c, b] = await Promise.all([
        supabase.from("farmers").select("*"),
        supabase.from("inspections").select("*").order("inspected_at", { ascending: true }),
        supabase.from("incidents").select("*"),
        supabase.from("batches").select("*"),
      ]);
      setData({ farmers: f.data ?? [], insp: i.data ?? [], inc: c.data ?? [], bat: b.data ?? [] });
    })();
  }, [ready]);
  if (!ready) return null;

  const avgScore = data.insp.length ? Math.round(data.insp.reduce((s, x) => s + Number(x.score), 0) / data.insp.length) : 0;
  const open = data.inc.filter((x) => x.status === "open").length;
  const resolved = data.inc.filter((x) => x.status === "resolved").length;
  const trend = data.insp.map((x) => ({ d: new Date(x.inspected_at).toLocaleDateString("en-GB", { month: "short", day: "2-digit" }), score: Number(x.score) }));
  const byCat = ["Quality", "Environmental", "Traceability", "Contract"].map((c) => ({ name: c, value: data.inc.filter((x) => x.category === c).length }));
  const bySeverity = ["High", "Medium", "Low"].map((s) => ({ name: s, value: data.inc.filter((x) => x.severity === s).length }));
  const byRegion = Array.from(new Set(data.farmers.map((f) => f.region))).map((r) => {
    const ids = data.farmers.filter((f) => f.region === r).map((f) => f.id);
    const scores = data.insp.filter((i) => ids.includes(i.farmer_id)).map((i) => Number(i.score));
    return { region: r, score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0 };
  });
  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];
  const palette = ["#3a6b3a", "#b08a3a", "#c47a3a", "#7a4030"];

  return (
    <AppShell title="Compliance Dashboard">
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi icon={ShieldCheck} label="Avg compliance score" value={`${avgScore}%`} hint="Across all inspections" tone="primary" />
        <Kpi icon={Users} label="Contracted farmers" value={String(data.farmers.length)} hint={`${Array.from(new Set(data.farmers.map((f)=>f.region))).length} regions`} />
        <Kpi icon={AlertTriangle} label="Open incidents" value={String(open)} hint={`${resolved} resolved`} tone="warning" />
        <Kpi icon={TrendingUp} label="Batches tracked" value={String(data.bat.length)} hint={`${data.bat.filter((b)=>b.status==='flagged').length} flagged`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-display text-lg font-semibold">Inspection score trend</h3>
          <p className="text-xs text-muted-foreground">Per-inspection score over time</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke="#e5e1d8" /><XAxis dataKey="d" tick={{ fontSize: 11 }} /><YAxis domain={[40, 100]} tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="score" stroke="#3a6b3a" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-display text-lg font-semibold">Incidents by category</h3>
          <p className="text-xs text-muted-foreground">All recorded non-compliance</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer><PieChart><Pie data={byCat} dataKey="value" nameKey="name" outerRadius={80} label>{byCat.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}</Pie><Legend /></PieChart></ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-display text-lg font-semibold">Average score by region</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer><BarChart data={byRegion}><CartesianGrid strokeDasharray="3 3" stroke="#e5e1d8" /><XAxis dataKey="region" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="score" fill="#3a6b3a" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-display text-lg font-semibold">Incidents by severity</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer><BarChart data={bySeverity}><CartesianGrid strokeDasharray="3 3" stroke="#e5e1d8" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="#b08a3a" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h3 className="font-display text-lg font-semibold">Recent open incidents</h3>
        <div className="mt-3 divide-y">
          {data.inc.filter((x) => x.status !== "resolved").slice(0, 6).map((x) => {
            const f = data.farmers.find((y) => y.id === x.farmer_id);
            return (
              <div key={x.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{x.description}</div>
                  <div className="text-xs text-muted-foreground">{f?.name} · {f?.region} · due {x.due_date ?? "—"}</div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{x.category}</Badge>
                  <Badge className={x.severity === "High" ? "bg-destructive text-destructive-foreground" : x.severity === "Medium" ? "bg-warning text-accent-foreground" : ""}>{x.severity}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
}

function Kpi({ icon: Icon, label, value, hint, tone }: { icon: any; label: string; value: string; hint: string; tone?: "primary" | "warning" }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className={`rounded-md p-2 ${tone === "warning" ? "bg-warning/20 text-accent-foreground" : "bg-primary/10 text-primary"}`}><Icon className="h-5 w-5" /></div>
      </div>
    </Card>
  );
}
