import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAuthGuard } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/inspections")({ component: Inspections });

function Inspections() {
  const ready = useAuthGuard();
  const [rows, setRows] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ farmer_id: "", inspector_name: "", inspection_type: "SOP Field Audit", score: 80, notes: "" });
  const load = async () => {
    const [r, f] = await Promise.all([
      supabase.from("inspections").select("*").order("inspected_at", { ascending: false }),
      supabase.from("farmers").select("id,name,region"),
    ]);
    setRows(r.data ?? []); setFarmers(f.data ?? []);
  };
  useEffect(() => { if (ready) load(); }, [ready]);
  if (!ready) return null;
  const submit = async () => {
    const { error } = await supabase.from("inspections").insert({ ...form, score: Number(form.score) });
    if (error) return toast.error(error.message);
    toast.success("Inspection recorded"); setOpen(false); load();
  };
  return (
    <AppShell title="Inspections">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{rows.length} field inspections recorded</p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />New inspection</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record field inspection</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Farmer</Label>
                  <Select value={form.farmer_id} onValueChange={(v) => setForm({ ...form, farmer_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select farmer" /></SelectTrigger>
                    <SelectContent>{farmers.map((f) => <SelectItem key={f.id} value={f.id}>{f.name} — {f.region}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Inspector name</Label><Input value={form.inspector_name} onChange={(e) => setForm({ ...form, inspector_name: e.target.value })} /></div>
                <div><Label>Type</Label>
                  <Select value={form.inspection_type} onValueChange={(v) => setForm({ ...form, inspection_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["SOP Field Audit", "TIMB Quality", "Environmental", "Contract Compliance"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Score (0–100)</Label><Input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: Number(e.target.value) })} /></div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <Button className="w-full" onClick={submit}>Save inspection</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Farmer</TableHead><TableHead>Type</TableHead><TableHead>Inspector</TableHead><TableHead className="text-right">Score</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => {
              const f = farmers.find((x) => x.id === r.farmer_id);
              const tone = r.score >= 85 ? "bg-success text-primary-foreground" : r.score >= 70 ? "bg-warning text-accent-foreground" : "bg-destructive text-destructive-foreground";
              return (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">{new Date(r.inspected_at).toLocaleDateString("en-GB")}</TableCell>
                  <TableCell className="font-medium">{f?.name ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{r.inspection_type}</Badge></TableCell>
                  <TableCell>{r.inspector_name}</TableCell>
                  <TableCell className="text-right"><Badge className={tone}>{r.score}</Badge></TableCell>
                  <TableCell className="max-w-sm truncate text-muted-foreground">{r.notes}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}
