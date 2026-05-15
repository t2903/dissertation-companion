import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf, BarChart3, ShieldCheck, Database } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><Leaf className="h-5 w-5" /></div>
            <span className="font-display text-lg font-bold">CRP Compliance</span>
          </div>
          <Button onClick={() => navigate({ to: authed ? "/dashboard" : "/auth" })}>{authed ? "Open Dashboard" : "Sign in"}</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">Zimbabwe Tobacco Sector</p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">A data-driven compliance monitor for curing & reaping operators.</h1>
            <p className="mt-5 text-lg text-muted-foreground">Replace manual, fragmented compliance audits with continuous, evidence-based oversight aligned to TIMB regulations and Education 5.0 industrialisation goals.</p>
            <div className="mt-8 flex gap-3">
              <Link to="/auth"><Button size="lg">Get started</Button></Link>
              <Link to="/dashboard"><Button size="lg" variant="outline">View demo dashboard</Button></Link>
            </div>
          </div>
          <div className="grid gap-4">
            {[
              { icon: ShieldCheck, title: "Real-time inspections", body: "Capture SOP, TIMB and environmental checks from the field." },
              { icon: BarChart3, title: "Analytics dashboard", body: "Track compliance scores, repeat offenders and regional trends." },
              { icon: Database, title: "Auditable records", body: "Centralised farmer, batch and incident registers." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-5 shadow-sm">
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Prototype system for BBM&IT Dissertation · Catholic University of Zimbabwe
      </footer>
    </div>
  );
}
