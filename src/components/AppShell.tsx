import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Leaf, LayoutDashboard, Users, ClipboardCheck, AlertTriangle, Boxes, FileText, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/farmers", label: "Farmers", icon: Users },
  { to: "/inspections", label: "Inspections", icon: ClipboardCheck },
  { to: "/incidents", label: "Incidents", icon: AlertTriangle },
  { to: "/batches", label: "Batches", icon: Boxes },
  { to: "/reports", label: "Reports", icon: FileText },
];

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? "")); }, []);
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><Leaf className="h-5 w-5" /></div>
          <div>
            <div className="font-display text-base font-bold">CRP Compliance</div>
            <div className="text-[11px] text-sidebar-foreground/70">Tobacco Sector · Zimbabwe</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map((n) => {
            const active = location.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"}`}>
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="text-xs text-sidebar-foreground/70 truncate">{email}</div>
          <button onClick={signOut} className="mt-2 flex items-center gap-2 text-xs text-sidebar-foreground/80 hover:text-sidebar-foreground"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <header className="border-b bg-card/40 backdrop-blur">
          <div className="flex items-center justify-between px-8 py-5">
            <h1 className="font-display text-2xl font-bold">{title}</h1>
            <div className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
          </div>
        </header>
        <div className="px-8 py-6">{children}</div>
      </main>
    </div>
  );
}

export function useAuthGuard() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (!s) navigate({ to: "/auth" }); });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth" }); else setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);
  return ready;
}
