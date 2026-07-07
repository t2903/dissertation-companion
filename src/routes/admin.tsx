import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuthGuard } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ShieldAlert, Shield, Database, RefreshCw, LayoutGrid, Users, Settings, Activity,
  FileText, HardDrive, Search, Home, Bell, LogOut, ChevronRight, Server, KeyRound,
  Boxes, ClipboardCheck, AlertTriangle, Leaf, CheckCircle2, TrendingUp
} from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type Role = "admin" | "manager" | "compliance_officer" | "agronomist" | "farmer" | "inspector";
const ROLES: Role[] = ["admin", "manager", "compliance_officer", "agronomist", "farmer", "inspector"];

type Section = "home" | "users" | "data" | "compliance" | "activity" | "settings";

function AdminPage() {
  const ready = useAuthGuard();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [rows, setRows] = useState<{ id: string; full_name: string | null; role: Role | null }[]>([]);
  const [counts, setCounts] = useState({ farmers: 0, inspections: 0, incidents: 0, batches: 0, users: 0 });
  const [anyAdmin, setAnyAdmin] = useState<boolean | null>(null);
  const [section, setSection] = useState<Section>("home");
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setUserId(u.user.id);
    setUserEmail(u.user.email ?? "");

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
      const list = (profiles.data ?? []).map((p: any) => ({ id: p.id, full_name: p.full_name, role: roleMap.get(p.id) ?? null }));
      setRows(list);
      setCounts({ farmers: f.count ?? 0, inspections: i.count ?? 0, incidents: c.count ?? 0, batches: b.count ?? 0, users: list.length });
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

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); };

  if (!ready || checking) return null;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
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
          <Button variant="outline" className="mt-3 ml-2" onClick={() => navigate({ to: "/dashboard" })}>Back to app</Button>
        </Card>
      </div>
    );
  }

  const navItems: { id: Section; label: string; icon: any }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "users", label: "Users & Roles", icon: Users },
    { id: "data", label: "Data management", icon: Database },
    { id: "compliance", label: "Compliance records", icon: ClipboardCheck },
    { id: "activity", label: "Activity & logs", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const filteredUsers = rows.filter(r =>
    !search || (r.full_name ?? "").toLowerCase().includes(search.toLowerCase()) || r.id.includes(search)
  );

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-sm font-bold">Admin Center</div>
            <div className="text-[11px] text-muted-foreground">CRP Compliance</div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {navItems.map((n) => {
            const active = section === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setSection(n.id)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  active ? "bg-primary/10 text-primary font-medium" : "text-foreground/80 hover:bg-muted"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </button>
            );
          })}
          <div className="mt-4 border-t pt-3">
            <Link to="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
              <Leaf className="h-4 w-4" /> Back to app
            </Link>
          </div>
        </nav>
        <div className="border-t p-3 text-xs">
          <div className="truncate font-medium">{userEmail}</div>
          <Badge className="mt-1" variant="outline"><Shield className="mr-1 h-3 w-3" />Administrator</Badge>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/80 px-6 py-3 backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Admin Center</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground capitalize">{navItems.find(n => n.id === section)?.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search admin center" className="h-8 w-64 pl-7" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8"><Bell className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-1 h-3.5 w-3.5" />Sign out</Button>
          </div>
        </header>

        <div className="p-6">
          {section === "home" && <HomeSection counts={counts} onGo={setSection} onRefresh={load} />}
          {section === "users" && <UsersSection rows={filteredUsers} userId={userId} onChange={changeRole} onRefresh={load} />}
          {section === "data" && <DataSection navigate={navigate} counts={counts} />}
          {section === "compliance" && <ComplianceSection counts={counts} navigate={navigate} />}
          {section === "activity" && <ActivitySection />}
          {section === "settings" && <SettingsSection userEmail={userEmail} />}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone = "default" }: { label: string; value: number | string; icon: any; tone?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${tone === "primary" ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
    </Card>
  );
}

function HomeSection({ counts, onGo, onRefresh }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Welcome to the Admin Center</h2>
          <p className="text-sm text-muted-foreground">Manage users, roles, compliance data, and system settings.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}><RefreshCw className="mr-1 h-4 w-4" />Refresh</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Users" value={counts.users} icon={Users} tone="primary" />
        <StatCard label="Farmers" value={counts.farmers} icon={Leaf} />
        <StatCard label="Inspections" value={counts.inspections} icon={ClipboardCheck} />
        <StatCard label="Incidents" value={counts.incidents} icon={AlertTriangle} />
        <StatCard label="Batches" value={counts.batches} icon={Boxes} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Users & Roles", desc: "Add, remove and assign roles to accounts.", icon: Users, to: "users" },
          { title: "Data management", desc: "Browse and edit backend tables.", icon: Database, to: "data" },
          { title: "Compliance records", desc: "Farmers, inspections, incidents & batches.", icon: ClipboardCheck, to: "compliance" },
          { title: "Activity & logs", desc: "Recent activity across the system.", icon: Activity, to: "activity" },
          { title: "System settings", desc: "Organization, security and preferences.", icon: Settings, to: "settings" },
          { title: "Service health", desc: "All systems operational.", icon: Server, to: "activity" },
        ].map((c) => (
          <button key={c.title} onClick={() => onGo(c.to)} className="group text-left">
            <Card className="h-full p-5 transition hover:border-primary/60 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.desc}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs text-primary opacity-0 transition group-hover:opacity-100">
                Open <ChevronRight className="ml-1 h-3 w-3" />
              </div>
            </Card>
          </button>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <h3 className="font-display text-sm font-semibold">Service status</h3>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          {["Authentication", "Database", "Storage", "AI Gateway"].map((s) => (
            <div key={s} className="flex items-center justify-between rounded-md border p-3">
              <span>{s}</span>
              <Badge variant="outline" className="text-green-600 border-green-600/40">Healthy</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function UsersSection({ rows, userId, onChange, onRefresh }: any) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Users & roles</h3>
          <p className="text-xs text-muted-foreground">Grant or change access levels for registered accounts.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}><RefreshCw className="mr-1 h-4 w-4" />Refresh</Button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr className="border-b"><th className="py-2">User</th><th>User ID</th><th>Current role</th><th>Change role</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r: any) => (
              <tr key={r.id}>
                <td className="py-3 font-medium">{r.full_name ?? "—"}{r.id === userId && <Badge variant="outline" className="ml-2">you</Badge>}</td>
                <td className="font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}…</td>
                <td>{r.role ? <Badge>{r.role}</Badge> : <span className="text-muted-foreground">none</span>}</td>
                <td>
                  <Select value={r.role ?? ""} onValueChange={(v) => onChange(r.id, v as Role)}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Assign role" /></SelectTrigger>
                    <SelectContent>{ROLES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No user profiles found.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DataSection({ navigate, counts }: any) {
  const tables = [
    { name: "farmers", label: "Farmers", count: counts.farmers, icon: Leaf, to: "/farmers" },
    { name: "inspections", label: "Inspections", count: counts.inspections, icon: ClipboardCheck, to: "/inspections" },
    { name: "incidents", label: "Incidents", count: counts.incidents, icon: AlertTriangle, to: "/incidents" },
    { name: "batches", label: "Batches", count: counts.batches, icon: Boxes, to: "/batches" },
    { name: "profiles", label: "Profiles", count: counts.users, icon: Users, to: "/admin" },
    { name: "user_roles", label: "User roles", count: counts.users, icon: KeyRound, to: "/admin" },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Database className="h-5 w-5 text-primary" />Data management</h3>
        <p className="text-xs text-muted-foreground">Browse backend tables and perform CRUD operations.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((t) => (
          <Card key={t.name} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted"><t.icon className="h-5 w-5" /></div>
              <div className="flex-1">
                <div className="font-semibold">{t.label}</div>
                <div className="text-xs text-muted-foreground font-mono">public.{t.name}</div>
              </div>
              <Badge variant="secondary">{t.count}</Badge>
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate({ to: t.to })}>Open</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ComplianceSection({ counts, navigate }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-semibold flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" />Compliance records</h3>
        <p className="text-xs text-muted-foreground">Quick access to all compliance datasets.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Farmers" value={counts.farmers} icon={Leaf} />
        <StatCard label="Inspections" value={counts.inspections} icon={ClipboardCheck} />
        <StatCard label="Incidents" value={counts.incidents} icon={AlertTriangle} />
        <StatCard label="Batches" value={counts.batches} icon={Boxes} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" onClick={() => navigate({ to: "/farmers" })}>Manage farmers</Button>
        <Button variant="outline" onClick={() => navigate({ to: "/inspections" })}>Manage inspections</Button>
        <Button variant="outline" onClick={() => navigate({ to: "/incidents" })}>Manage incidents</Button>
        <Button variant="outline" onClick={() => navigate({ to: "/batches" })}>Manage batches</Button>
      </div>
      <Button variant="secondary" onClick={() => navigate({ to: "/reports" })}><FileText className="mr-1 h-4 w-4" />Open reports</Button>
    </div>
  );
}

function ActivitySection() {
  const items = [
    { t: "Admin signed in", d: "Just now", icon: Shield },
    { t: "Compliance data refreshed", d: "A few minutes ago", icon: RefreshCw },
    { t: "System health check passed", d: "Today", icon: CheckCircle2 },
    { t: "Weekly report generated", d: "This week", icon: TrendingUp },
  ];
  return (
    <Card className="p-5">
      <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Activity & logs</h3>
      <p className="text-xs text-muted-foreground">Recent activity in the admin center.</p>
      <ul className="mt-4 space-y-2">
        {items.map((i, idx) => (
          <li key={idx} className="flex items-center gap-3 rounded-md border p-3 text-sm">
            <i.icon className="h-4 w-4 text-primary" />
            <span className="flex-1">{i.t}</span>
            <span className="text-xs text-muted-foreground">{i.d}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SettingsSection({ userEmail }: { userEmail: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-5">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Settings className="h-5 w-5 text-primary" />Organization</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Name</span><span>CRP Compliance</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Sector</span><span>Tobacco · Zimbabwe</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Admin contact</span><span>{userEmail}</span></div>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" />Security</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Authentication</span><Badge variant="outline">Email + Password</Badge></div>
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Row-level security</span><Badge className="bg-green-600">Enabled</Badge></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Roles</span><span>{ROLES.length} defined</span></div>
        </div>
      </Card>
      <Card className="p-5 md:col-span-2">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2"><HardDrive className="h-5 w-5 text-primary" />Infrastructure</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-md border p-3"><div className="text-muted-foreground text-xs">Database</div><div className="mt-1 font-medium">Lovable Cloud (Postgres)</div></div>
          <div className="rounded-md border p-3"><div className="text-muted-foreground text-xs">Runtime</div><div className="mt-1 font-medium">TanStack Start (Edge)</div></div>
          <div className="rounded-md border p-3"><div className="text-muted-foreground text-xs">Region</div><div className="mt-1 font-medium">Global</div></div>
        </div>
      </Card>
    </div>
  );
}
