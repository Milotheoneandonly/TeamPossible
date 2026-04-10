import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Verify cron secret (Vercel sets Authorization header for cron jobs)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get today's day of week (0=Mon..6=Sun) in Swedish timezone
  const now = new Date();
  const swedenTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Stockholm" })
  );
  const jsDay = swedenTime.getDay(); // 0=Sun, 1=Mon...6=Sat
  const checkInDay = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Mon..6=Sun

  // Find all active clients with check_in_day matching today
  const { data: clients } = await supabase
    .from("clients")
    .select(
      "id, coach_id, profile:profiles!clients_profile_id_fkey(first_name)"
    )
    .eq("status", "active")
    .eq("check_in_day", checkInDay);

  if (!clients || clients.length === 0) {
    return NextResponse.json({ sent: 0, day: checkInDay });
  }

  // Today's start in Sweden timezone (for duplicate check)
  const todayStart = new Date(swedenTime);
  todayStart.setHours(0, 0, 0, 0);

  let sentCount = 0;
  for (const client of clients) {
    // Check if reminder already sent today (avoid duplicates)
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client.id)
      .eq("sender_id", client.coach_id)
      .gte("created_at", todayStart.toISOString())
      .ilike("content", "%check-in%");

    if ((count || 0) > 0) continue;

    const firstName = (client.profile as any)?.first_name || "";

    await supabase.from("messages").insert({
      client_id: client.id,
      sender_id: client.coach_id,
      content: `Hej${firstName ? ` ${firstName}` : ""}! 👋 Idag är det dags för din vecko-check-in. Gå till Check-in fliken för att fylla i. 💪`,
    });
    sentCount++;
  }

  return NextResponse.json({ sent: sentCount, day: checkInDay });
}
