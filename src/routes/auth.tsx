import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { signIn, signUp } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Leaf } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const doSignIn = useServerFn(signIn);
  const doSignUp = useServerFn(signUp);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const u = await doSignIn({ data: { email, password } });
      toast.success("Welcome back");
      navigate({ to: u.role === "admin" ? "/admin" : "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Sign in failed");
    } finally { setLoading(false); }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const u = await doSignUp({ data: { email, password, full_name: name } });
      toast.success("Account created");
      navigate({ to: u.role === "admin" ? "/admin" : "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Sign up failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground"><Leaf className="h-5 w-5" /></div>
          <div>
            <h1 className="font-display text-xl font-bold">CRP Compliance</h1>
            <p className="text-xs text-muted-foreground">Sign in to continue</p>
          </div>
        </div>
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="signin">Sign in</TabsTrigger><TabsTrigger value="signup">Sign up</TabsTrigger></TabsList>
          <TabsContent value="signin" className="space-y-4 pt-4">
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@crp.co.zw" /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button className="w-full" onClick={handleSignIn} disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
          </TabsContent>
          <TabsContent value="signup" className="space-y-4 pt-4">
            <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button className="w-full" onClick={handleSignUp} disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
            <p className="text-xs text-muted-foreground">The first account created is automatically granted admin privileges.</p>
          </TabsContent>
        </Tabs>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          First-time setup? <a href="/api/init-db" target="_blank" className="underline">Initialize database</a>
        </p>
      </div>
    </div>
  );
}
