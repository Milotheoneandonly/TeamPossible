# Messaging Chat + Auto Check-In Reminders

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a functional coach-client chat interface and automatic daily check-in reminder messages.

**Architecture:** Rewrite the coach `/messages` page as a split-pane chat (client list left, conversation right). Add `check_in_day` column to clients table, persist it during invite flow. Create a Vercel Cron API route that runs daily and auto-sends reminder messages to clients whose check-in day matches today.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL + client), Vercel Cron Jobs

---

### Task 1: Migration — Add check_in_day to clients

**Files:**
- Create: `supabase/migrations/00016_check_in_day.sql`

**Step 1: Write the migration**

```sql
-- Migration 00016: Add check-in day column to clients
-- 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
-- NULL = no automatic reminder

ALTER TABLE public.clients ADD COLUMN check_in_day integer CHECK (check_in_day >= 0 AND check_in_day <= 6);
```

**Step 2: Open in Notepad for user to run in Supabase SQL Editor**

```bash
notepad supabase/migrations/00016_check_in_day.sql
```

**Step 3: Commit**

```bash
git add supabase/migrations/00016_check_in_day.sql
git commit -m "feat: add check_in_day column to clients table"
```

---

### Task 2: Wire check_in_day into client invite flow

**Files:**
- Modify: `src/actions/clients.ts` — `inviteClient()` function (line 40-99)
- Modify: `src/app/(coach)/clients/invite/page.tsx` — Step 3 form (line 239-295)

**Step 1: Update inviteClient action to accept and save check_in_day**

In `src/actions/clients.ts`, add `check_in_day?: number` to the formData type (line 40-46) and include it in the clients insert (line 86-91):

```typescript
export async function inviteClient(formData: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  goals?: string;
  notes?: string;
  check_in_day?: number;  // 0=Mon..6=Sun, undefined=no reminder
}) {
```

In the insert (line 86-91):
```typescript
const { error: clientError } = await supabase.from("clients").insert({
  profile_id: newUser.user.id,
  coach_id: user.id,
  goals: formData.goals || null,
  notes: formData.notes || null,
  check_in_day: formData.check_in_day ?? null,
});
```

**Step 2: Update invite page to pass check_in_day as integer**

In `src/app/(coach)/clients/invite/page.tsx`, the `checkInDay` state (line 29) currently stores Swedish day name strings. Map them to integers when calling inviteClient (line 44-51):

```typescript
const DAY_TO_INT: Record<string, number> = {
  "Måndag": 0, "Tisdag": 1, "Onsdag": 2, "Torsdag": 3,
  "Fredag": 4, "Lördag": 5, "Söndag": 6,
};

// In handleSubmit:
const res = await inviteClient({
  email,
  firstName,
  lastName,
  phone: phone || undefined,
  goals: goals || undefined,
  notes: notes || undefined,
  check_in_day: DAY_TO_INT[checkInDay],
});
```

**Step 3: Commit**

```bash
git add src/actions/clients.ts src/app/(coach)/clients/invite/page.tsx
git commit -m "feat: persist check_in_day when inviting clients"
```

---

### Task 3: Rewrite coach messages page as split-pane chat

**Files:**
- Rewrite: `src/app/(coach)/messages/page.tsx`

**Step 1: Convert to client component with split-pane layout**

Full rewrite. Current page is a server component listing clients. New page is a `"use client"` component with:

- **Left panel** (w-80, border-r): client list with avatars, names, unread badges, last message preview. Clicking a client sets them as active.
- **Right panel** (flex-1): conversation thread for selected client — messages in chronological order, coach messages right-aligned (blue), client messages left-aligned (white), timestamp under each. Text input + send button at bottom.
- Mark messages as read when selecting a client.
- Full height layout: `h-[calc(100vh-64px)]`.

Pattern to follow: the client portal messages page at `src/app/(client)/portal/messages/page.tsx` already has the chat bubble rendering and send logic. Mirror that for the right panel.

**Key state:**
```typescript
const [clients, setClients] = useState<any[]>([]);
const [activeClientId, setActiveClientId] = useState<string | null>(null);
const [messages, setMessages] = useState<any[]>([]);
const [newMessage, setNewMessage] = useState("");
const [sending, setSending] = useState(false);
const [userId, setUserId] = useState("");
```

**Key functions:**
- `loadClients()` — fetch all active clients with profiles, compute unread counts + latest message
- `selectClient(clientId)` — load messages for that client, mark unread as read
- `sendMessage()` — insert into messages table with client_id + sender_id (coach)
- Auto-scroll to bottom of message list on load and send

**Step 2: Verify with dev server**

Navigate to `/messages`, verify split pane renders, click a client, verify messages load, send a message.

**Step 3: Commit**

```bash
git add src/app/(coach)/messages/page.tsx
git commit -m "feat: split-pane chat interface for coach messages"
```

---

### Task 4: Create Vercel Cron API route for check-in reminders

**Files:**
- Create: `src/app/api/cron/check-in-reminders/route.ts`
- Create: `vercel.json`

**Step 1: Write the API route**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Verify cron secret (Vercel sets this header)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get today's day of week (0=Mon..6=Sun) in Swedish timezone
  const now = new Date();
  // Sweden is UTC+1 (CET) or UTC+2 (CEST)
  const swedenTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Stockholm" }));
  const jsDay = swedenTime.getDay(); // 0=Sun, 1=Mon...
  const checkInDay = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Mon..6=Sun

  // Find all active clients with check_in_day matching today
  const { data: clients } = await supabase
    .from("clients")
    .select("id, coach_id, profile:profiles!clients_profile_id_fkey(first_name)")
    .eq("status", "active")
    .eq("check_in_day", checkInDay);

  if (!clients || clients.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // For each client, check if reminder already sent today
  const todayStart = new Date(swedenTime);
  todayStart.setHours(0, 0, 0, 0);

  let sentCount = 0;
  for (const client of clients) {
    // Check for existing reminder today
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client.id)
      .eq("sender_id", client.coach_id)
      .gte("created_at", todayStart.toISOString())
      .ilike("content", "%check-in%");

    if ((count || 0) > 0) continue; // Already sent today

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
```

**Step 2: Create vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/cron/check-in-reminders",
      "schedule": "0 7 * * *"
    }
  ]
}
```

Note: `0 7 * * *` = 7:00 UTC = ~8:00-9:00 AM Swedish time depending on DST.

**Step 3: Add CRON_SECRET to Vercel environment**

The user needs to add `CRON_SECRET` in Vercel project settings → Environment Variables. Vercel auto-sends this as `Authorization: Bearer <secret>` header.

**Step 4: Commit**

```bash
git add src/app/api/cron/check-in-reminders/route.ts vercel.json
git commit -m "feat: Vercel cron for daily check-in reminder messages"
```

---

### Task 5: Final integration commit and push

**Step 1: Git push to deploy**

```bash
git push
```

**Step 2: User actions**
- Run migration 00016 in Supabase SQL Editor
- Add `CRON_SECRET` env var in Vercel dashboard (generate a random string)
- Verify deployment, test chat, test sending messages
