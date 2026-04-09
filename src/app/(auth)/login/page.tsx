"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LogIn, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Fel e-post eller lösenord. Försök igen.");
      setLoading(false);
      return;
    }

    // Get user role to redirect
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "coach") {
        router.push("/dashboard");
      } else {
        router.push("/portal");
      }
    }

    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent>
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-text-primary">
            Logga in
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Ange din e-post och ditt lösenord
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            id="email"
            label="E-post"
            type="email"
            placeholder="din@email.se"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            id="password"
            label="Lösenord"
            type="password"
            placeholder="Ditt lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && (
            <div className="bg-error/10 text-error text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {loading ? "Loggar in..." : "Logga in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
