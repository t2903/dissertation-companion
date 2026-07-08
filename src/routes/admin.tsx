import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuthGuard } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentUser, signOut as signOutFn } from "@/lib/auth.functions";
import { listUsers, changeUserRole, listFarmers, listInspections, listIncidents, listBatches } from "@/lib/data.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ShieldAlert, Shield, Database, RefreshCw, Users, Settings, Activity,
  Search, Home, Bell, LogOut, ChevronRight, Server, KeyRound,
  Boxes, ClipboardCheck, AlertTriangle, Leaf, CheckCircle2
} from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type Role = "admin" | "manager" | "compliance_officer" | "agronomist" | "farmer" | "inspector";
const ROLES: Role[] = ["admin", "manager", "compliance_officer", "agronomist", "farmer", "inspector"];
type Section = "home" | "users" | "data" | "compliance" | "activity" | "settings";

function AdminPage() {
  const ready = useAuthGuard();
  const navigate = useNavigate();
  const getMe = useServerFn(getCurrentUser);
  const doSignOut = useServerFn(signOutFn);
  const fetchUsers = useServerFn(listUsers);
  const doChangeRole = useServerFn(changeUserRole);
  const fF = useServerFn(listFarmers);
  const fI = useServerFn(listInspections);
  const fC = useServerFn(listIncidents);
  const fB = useServerFn(listBatches);

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [me, setMe] = useState<{ id: string; email: string; role: string | null } | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [counts, setCounts] = useState({ farmers: 0, inspections: 0, incidents: 0, batches: 0, users: 0 });
  const [section, setSection] = useState<Section>("home");
  const [search, setSearch] = useState("");

  const load = async () => {
    const u = await getMe();
    if (!u) return;
    setMe(u);
    const admin = u.role === "admin";
    setIsAdmin(admin);
    if (admin) {
      const [usrs, f, i, c, b] = await Promise.all([fetchUsers(), fF(), fI(), fC(), fB()]);
      setUsers(usrs ?? []);
      setCounts({
        users: usrs?.length ?? 0,
        farmers: f?.length ?? 0,
        inspections: i?.length ?? 0,
        incidents: c?.length ?? 0,
        batches: b?.length ?? 0,
      });
    }
    setChecking(false);
  };
  useEffect(() => { if (ready) load(); }, [ready]);

  const changeRole = async (uid: string, role: Role) => {
    try { await doChangeRole({ data: { user_id: uid, role } }); toast.success("Role updated"); load(); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };
  const signOut = async () => { await doSignOut(); navigate({ to: "/auth" }); };

  if (!ready || checking) return null;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="mt-3 font-display text-xl font-semibold">Admin access required</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your account does not have admin privileges. Contact an existing administrator.</p>
          <Button variant="outline" className="mt-5" onClick={() => navigate({ to: "/dashboard" })}>Back to app</Button>
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

  const filteredUsers = users.filter((r) =>
    !search || (r.full_name ?? "").toLowerCase().includes(search.toLowerCase()) || (r.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><Shield className="h-5 w-5" /></div>
          <div>
            <div className="font-display text-sm font-bold">Admin Center</div>
            <div className="text-[11px] text-muted-foreground">CRP Compliance</div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {navItems.map((n) => (
            <button key={n.id} onClick={() => setSection(n.id)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition ${section === n.id ? "bg-primary/10 text-primary font-medium" : "text-foreground/80 hover:bg-muted"}`}>
              <n.icon className="h-4 w-4" />{n.label}
            </button>
          ))}
          <div className="mt-4 border-t pt-3">
            <Link to="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
              <Leaf className="h-4 w-4" /> Back to app
            </Link>
          </div>
        </nav>
        <div className="border-t p-3 text-xs">
          <div className="truncate font-medium">{me?.email}</div>
          <Badge className="mt-1" variant="outline"><Shield className="mr-1 h-3 w-3" />Administrator</Badge>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/80 px-6 py-3 backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" /><span>Admin Center</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground capitalize">{navItems.find((n) => n.id === section)?.label}</span>
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
          {section === "home" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold">Welcome to the Admin Center</h2>
                  <p className="text-sm text-muted-foreground">Manage users, roles, compliance data, and system settings.</p>
                </div>
                <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-1 h-4 w-4" />Refresh</Button>
              </div>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                <Stat label="Users" value={counts.users} icon={Users} tone="primary" />
                <Stat label="Farmers" value={counts.farmers} icon={Leaf} />
                <Stat label="Inspections" value={counts.inspections} icon={ClipboardCheck} />
                <Stat label="Incidents" value={counts.incidents} icon={AlertTriangle} />
                <Stat label="Batches" value={counts.batches} icon={Boxes} />
              </div>
              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <h3 className="font-display text-sm font-semibold">Service status · Neon Postgres</h3>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  {["Database", "Authentication", "Session tokens", "API"].map((s) => (
                    <div key={s} className="flex items-center justify-between rounded-md border p-3">
                      <span>{s}</span>
                      <Badge variant="outline" className="text-green-600 border-green-600/40">Healthy</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {section === "users" && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Users & roles</h3>
                  <p className="text-xs text-muted-foreground">Grant or change access levels for registered accounts.</p>
                </div>
                <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-1 h-4 w-4" />Refresh</Button>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground">
                    <tr className="border-b"><th className="py-2">Name</th><th>Email</th><th>Current role</th><th>Change role</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map((r) => (
                      <tr key={r.id}>
                        <td className="py-3 font-medium">{r.full_name ?? "—"}{r.id === me?.id && <Badge variant="outline" className="ml-2">you</Badge>}</td>
                        <td className="text-muted-foreground">{r.email}</td>
                        <td>{r.role ? <Badge>{r.role}</Badge> : <span className="text-muted-foreground">none</span>}</td>
                        <td>
                          <Select value={r.role ?? ""} onValueChange={(v) => changeRole(r.id, v as Role)}>
                            <SelectTrigger className="w-48"><SelectValue placeholder="Assign role" /></SelectTrigger>
                            <SelectContent>{ROLES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No users found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {section === "data" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Database className="h-5 w-5 text-primary" />Data management</h3>
                <p className="text-xs text-muted-foreground">All data lives in your Neon Postgres database. Edits here write directly to Neon.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { name: "farmers", label: "Farmers", count: counts.farmers, icon: Leaf, to: "/farmers" as const },
                  { name: "inspections", label: "Inspections", count: counts.inspections, icon: ClipboardCheck, to: "/inspections" as const },
                  { name: "incidents", label: "Incidents", count: counts.incidents, icon: AlertTriangle, to: "/incidents" as const },
                  { name: "batches", label: "Batches", count: counts.batches, icon: Boxes, to: "/batches" as const },
                  { name: "users", label: "Users", count: counts.users, icon: Users, to: "/admin" as const },
                  { name: "session", label: "Sessions (JWT)", count: 0, icon: KeyRound, to: "/admin" as const },
                ].map((t) => (
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
          )}

          {section === "compliance" && (
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" />Compliance records</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Stat label="Farmers" value={counts.farmers} icon={Leaf} />
                <Stat label="Inspections" value={counts.inspections} icon={ClipboardCheck} />
                <Stat label="Incidents" value={counts.incidents} icon={AlertTriangle} />
                <Stat label="Batches" value={counts.batches} icon={Boxes} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" onClick={() => navigate({ to: "/farmers" })}>Manage farmers</Button>
                <Button variant="outline" onClick={() => navigate({ to: "/inspections" })}>Manage inspections</Button>
                <Button variant="outline" onClick={() => navigate({ to: "/incidents" })}>Manage incidents</Button>
                <Button variant="outline" onClick={() => navigate({ to: "/reports" })}>Compliance reports</Button>
              </div>
            </div>
          )}

          {section === "activity" && (
            <Card className="p-5">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Activity & logs</h3>
              <p className="mt-2 text-sm text-muted-foreground">Activity log not implemented. Check your Neon dashboard or connect pgAdmin for query logs.</p>
            </Card>
          )}

          {section === "settings" && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-5">
                <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Server className="h-5 w-5 text-primary" />Infrastructure</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Database</dt><dd>Neon Postgres (serverless)</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Auth</dt><dd>JWT + bcrypt</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Session TTL</dt><dd>7 days</dd></div>
                </dl>
              </Card>
              <Card className="p-5">
                <h3 className="font-display text-lg font-semibold flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" />pgAdmin connection</h3>
                <p className="mt-2 text-xs text-muted-foreground">Use these in pgAdmin's "Register Server → Connection" dialog. Password is stored securely and not shown here.</p>
                <dl className="mt-3 space-y-1 font-mono text-xs">
                  <div>Host: ep-muddy-moon-ainaf3st-pooler.c-4.us-east-1.aws.neon.tech</div>
                  <div>Port: 5432</div>
                  <div>Database: neondb</div>
                  <div>Username: neondb_owner</div>
                  <div>SSL mode: require</div>
                </dl>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: any; tone?: string }) {
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
