import { BottomNav } from "@/components/client/bottom-nav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientHeader } from "@/components/client/client-header";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.role === "coach") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-surface pb-20">
      <ClientHeader
        name={profile?.first_name || "Klient"}
        initialAvatarUrl={profile?.avatar_url || null}
      />
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
      <BottomNav />
    </div>
  );
}
