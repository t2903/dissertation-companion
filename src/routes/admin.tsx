import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, useAuthGuard } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldAlert, Shield, Database, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type Role = "admin" | "manager" | "compliance_officer" | "agronomist" | "farmer" | "inspector";
const ROLES: Role[] = ["admin", "manager", "compliance_officer", "agronomist", "farmer", "inspector"];

function AdminPage() {
  const ready = useAuthGuard();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [rows, setRows] = useState<{ id: string; full_name: string | null; role: Role | null }[]>([]);
  const [counts, setCounts] = useState({ farmers: 0, inspections: 0, incidents: 0, batches: 0 });
  const [anyAdmin, setAnyAdmin] = useState<boolean | null>(null);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setUserId(u.user.id);

    const { data: adminCheck } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    setIsAdmin(!!adminCheck);

    const { count: adminsCount } = await supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
    setAnyAdmin((adminsCount ?? 0) > 0);

    if (adminCheck) {
      const [profiles, roles, f, i, c, b] = await Promise.all([
        supabase.from("profiles").select("id, full_name"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("farmers").select("id", { count: "exact", head: true }),
        supabase.from("inspections").select("id", { count: "exact", head: true }),
        supabase.from("incidents").select("id", { count: "exact", head: true }),
        supabase.from("batches").select("id", { count: "exact", head: true }),
      ]);
      const roleMap = new Map<string, Role>();
      (roles.data ?? []).forEach((r: any) => roleMap.set(r.user_id, r.role));
      setRows((profiles.data ?? []).map((p: any) => ({ id: p.id, full_name: p.full_name, role: roleMap.get(p.id) ?? null })));
      setCounts({ farmers: f.count ?? 0, inspections: i.count ?? 0, incidents: c.count ?? 0, batches: b.count ?? 0 });
    }
    setChecking(false);
  };

  useEffect(() => { if (ready) load(); }, [ready]);

  const claimAdmin = async () => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) return toast.error(error.message);
    toast.success("You are now an admin");
    load();
  };

  const changeRole = async (uid: string, role: Role) => {
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", uid);
    if (delErr) return toast.error(delErr.message);
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) return toast.error(error.message);
    toast.success("Role updated");
    load();
  };

  if (!ready || checking) return null;

  if (!isAdmin) {
    return (
      <AppShell title="Admin">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="mt-3 font-display text-xl font-semibold">Admin access required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {anyAdmin === false
              ? "No admin exists yet. Claim admin privileges for your account to configure the system."
              : "Your account does not have admin privileges. Contact an existing administrator."}
          </p>
          {anyAdmin === false && (
            <Button className="mt-5" onClick={claimAdmin}><Shield className="mr-1 h-4 w-4" />Claim admin</Button>
          )}
          <Button variant="outline" className="mt-3 ml-2" onClick={() => navigate({ to: "/dashboard" })}>Back to dashboard</Button>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Admin · Backend Control">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { l: "Farmers", v: counts.farmers },
          { l: "Inspections", v: counts.inspections },
          { l: "Incidents", v: counts.incidents },
          { l: "Batches", v: counts.batches },
        ].map((k) => (
          <Card key={k.l} className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.l}</p>
            <p className="mt-2 font-display text-3xl font-bold">{k.v}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />User & role management</h3>
            <p className="text-xs text-muted-foreground">Grant or change access levels for registered accounts.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-1 h-4 w-4" />Refresh</Button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr><th className="py-2">User</th><th>User ID</th><th>Current role</th><th>Change role</th></tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 font-medium">{r.full_name ?? "—"}{r.id === userId && <Badge variant="outline" className="ml-2">you</Badge>}</td>
                  <td className="font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}…</td>
                  <td>{r.role ? <Badge>{r.role}</Badge> : <span className="text-muted-foreground">none</span>}</td>
                  <td>
                    <Select value={r.role ?? ""} onValueChange={(v) => changeRole(r.id, v as Role)}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Assign role" /></SelectTrigger>
                      <SelectContent>{ROLES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No user profiles yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Database className="h-5 w-5 text-primary" />Backend data</h3>
        <p className="text-xs text-muted-foreground">Full CRUD across compliance records.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" onClick={() => navigate({ to: "/farmers" })}>Manage farmers</Button>
          <Button variant="outline" onClick={() => navigate({ to: "/inspections" })}>Manage inspections</Button>
          <Button variant="outline" onClick={() => navigate({ to: "/incidents" })}>Manage incidents</Button>
          <Button variant="outline" onClick={() => navigate({ to: "/batches" })}>Manage batches</Button>
        </div>
      </Card>
    </AppShell>
  );
}
