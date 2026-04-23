# POSSIBLE — Fitness Coaching Platform — Complete Context Summary

**Last updated:** 2026-04-23
**Read this first** if context was reset. This file is the handoff document between Claude sessions.

---

## 1. WHO THIS IS FOR

- **User:** Daniel (email: `danbegovic@proton.me`)
- **Wife:** Alice — fitness coach, 30 Swedish/Nordic clients, currently on `zenfit.io`. Migrating everything to this custom platform.
- **Brand name:** "Possible" (previously "Team Possible")
- **Primary priority:** The **client portal** (99% of usage). Everything client-facing must be perfect.
- **User pace:** "Take it slow, one step at a time." "No stress." Prefers flawless, steady delivery over fast hacks.

## 2. WORKFLOW PREFERENCES (CRITICAL)

- **Deploy after every task:** `git add` specific files → commit → `git push`. Vercel auto-deploys.
- **SQL via notepad:** When a task needs a Supabase migration, write the `.sql` file in `supabase/migrations/` AND open it in Notepad (`start notepad "path"`) so Daniel can copy-paste into the Supabase SQL editor. Always mention which step requires action on his side.
- **Red line doctrine** (Daniel's term): Every client-side change must have a matching coach-side display and vice versa. When a client uploads a photo / edits a measurement / writes a note / changes their avatar, it must show up on the coach's corresponding view. When a coach creates a plan / adds an image / writes a note, the client must see it. Verify this end-to-end before marking a task done.
- **TAKE YOUR TIME.** Better to audit first than rush. Use agents for parallel exploration if the task spans many files.
- **Ask clarifying questions** when the spec is ambiguous rather than guessing.
- **Browser access:** Daniel logs into Vercel + Supabase in his browser and lets Claude "take control" (MCP Chrome + Claude Preview) when useful. Usually not needed — he'll run SQL himself.

## 3. TECH STACK

- **Next.js 16.2.3** — App Router, TypeScript. **IMPORTANT:** Breaking changes from your training data. Uses `proxy.ts` (NOT `middleware.ts`). Check `node_modules/next/dist/docs/` if unsure. `AGENTS.md` warns about this.
- **Build command:** `npm run build --webpack` (Turbopack is blocked on this machine — always pass `--webpack`).
- **Tailwind CSS 4** with `@theme inline` tokens in `src/app/globals.css`.
- **Supabase** — Postgres + Auth + Storage + RLS. URL: `https://yqfliqqwwqjsitaolias.supabase.co`.
- **@dnd-kit** — drag-and-drop for workout + meal plan builders (core + sortable). Uses `useDraggable`, `useDroppable`, `useSortable`, `DndContext`, `SortableContext`.
- **lucide-react** — icon library.
- **Vercel** — hosted at `team-possible.vercel.app` (project name: `team-possible`). Auto-deploys from `main` branch.
- **Vercel Cron** — defined in `vercel.json`, runs `/api/cron/check-in-reminders` daily at 7:00 UTC.
- **GitHub:** `github.com/Milotheoneandonly/TeamPossible`.
- **Local path:** `C:\Users\danth\Desktop\Possible ZENFIT\team-possible`.

## 4. SUPABASE STORAGE BUCKETS

| Bucket | Public? | Contents |
|---|---|---|
| `avatars` | public | Coach + client profile pictures |
| `recipe-images` | public | Recipe images AND meal plan hero images (`meal-plans/{coach_id}/...`) AND workout plan hero images (`workout-plans/{coach_id}/...`) |
| `content-files` | public | Uploaded PDFs, Word, Excel, images for client documents |
| `exercise-media` | public | Exercise media (rarely used) |
| `progress-photos` | **private** | Client body photos from check-in. Served to coach via server-side **signed URLs** (1 hour TTL) |

## 5. DATABASE — FULL SCHEMA

### Profile & auth
- `profiles` (id PK = auth.users.id, role `coach`/`client`, first_name, last_name, email, phone, avatar_url, locale default 'sv')
- `clients` (id, coach_id FK profiles, profile_id FK profiles, status, goals, notes, start_date, dietary_preferences text[], allergies text[], height_cm, target_weight_kg, activity_level, **tags text[]**, **check_in_day int 0-6 NULL** — 0=Mon..6=Sun for auto-reminder cron)

### Nutrition
- `foods` (name, name_sv, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, serving_size_g default 100, category) — **260+ Swedish foods seeded**
- `recipes` (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags[], instructions, prep_time_minutes, cook_time_minutes, servings, image_url) — **71 recipes imported from Zenfit**
- `recipe_ingredients` (recipe_id, food_id, amount_g, sort_order) — **284 ingredient links**
- `meal_plans` (coach_id, client_id NULL, title, description, is_template, is_active, target_calories, target_protein_g, target_carbs_g, target_fat_g, **image_url**)
- `meal_plan_days` (plan_id, day_number, name, sort_order)
- `meals` (day_id, meal_type, name, sort_order)
- `meal_items` (meal_id, **food_id OR recipe_id**, amount_g, servings, sort_order, calories, protein, carbs, fat, notes)

### Training
- `exercise_categories` (name, name_sv, sort_order)
- `exercises` (name, name_sv, description, description_sv, video_url, thumbnail_url, muscle_groups text[], equipment text[], difficulty, is_custom, category_id) — **90 personal exercises imported from Zenfit with YouTube URLs**
- `workout_plans` (coach_id, client_id NULL, title, description, is_template, is_active, start_date, end_date, **image_url** — added in 00021)
- `workout_days` (plan_id, day_number, name, sort_order)
- `workout_exercises` (workout_day_id, exercise_id, sets int, reps text, rest_seconds int, tempo, notes, superset_group, sort_order)
- `workout_logs` (client_id, workout_day_id, date, duration_minutes, notes, completed)
- `workout_log_sets` (log_id, exercise_id, set_number, weight_kg, reps int, rpe, completed)
- **`client_exercise_notes`** (client_id, exercise_id, note, updated_at, UNIQUE(client_id, exercise_id)) — added in 00021, per-client private notes per exercise

### Check-ins & progress
- `check_in_templates` + `check_in_questions` (older, largely unused now)
- `check_ins` (client_id, status `pending`/`submitted`/`reviewed`, submitted_at, reviewed_at, coach_notes, created_at)
- `check_in_responses` (check_in_id, question_id, answer) — legacy, not used by new form
- `progress_entries` — **expanded several times**:
  - Core: client_id, check_in_id, date, weight_kg, body_fat_pct
  - Measurements: waist_cm, chest_cm, hips_cm, arm_left_cm, arm_right_cm, thigh_left_cm, thigh_right_cm
  - Wellbeing: energy_level (1-10), sleep_hours_avg, stress_level (1-10), steps_avg
  - Free text: notes (legacy single Kommentar field)
  - **`check_in_answers jsonb`** (00019) — the 9 weekly reflection questions stored as JSON keyed by `training`, `nutrition`, `motivation`, `hydration_steps`, `injury`, `menstruation`, `wins`, `improvement`, `questions`
  - **`height_cm numeric(5,1)`** (00020) — Längd
  - **`glutes_cm numeric(5,1)`** (00020) — Stuss
- `progress_photos` (progress_entry_id, storage_path, photo_type `front`/`side`/`back`/`other`)

### Content & documents
- `content_files` (coach_id, title, description, file_url, file_type, file_size_bytes)
- `lessons` (coach_id, title, subtitle, message, media_url, media_type, status `draft`/`published`)
- `client_documents` (client_id, content_file_id OR lesson_id) — assignment join

### Messaging
- `messages` (client_id, sender_id, content, is_read, created_at) — coach↔client chat AND auto check-in reminders (both flow through this table; sender_id = coach's profile_id for automated reminders)

### Leads (CRM)
- `leads` (coach_id, first_name, last_name, email, phone, country, status CHECK `ny`/`kontaktad`/`vunnen`, tags text[], notes, created_at, updated_at)

## 6. MIGRATIONS (21 FILES)

1. `00001_initial_schema.sql` — Core tables
2. `00002_rls_policies.sql` — `is_coach()` + `my_client_id()` helpers, RLS on all tables
3. `00003_seed_swedish_foods.sql` — 150+ Swedish foods
4. `00004_expand_foods.sql` — More foods + spices
5. `00005_storage_policies.sql` — Avatars bucket policies
6. `00006_content_tables.sql` — `content_files`, `lessons`
7. `00007_client_documents.sql` — Client documents join
8. `00008_fix_coach_profile_update.sql` — Coach UPDATE policy
9. `00009_client_tags.sql` — `clients.tags text[]`
10. `00010_more_foods.sql` — Extra foods
11. `00011_recipe_images_storage.sql` — recipe-images bucket RLS
12. `00012_fix_all_storage.sql` — content-files bucket RLS
13. `00013_meal_plan_image.sql` — `meal_plans.image_url`
14. `00014_import_zenfit_recipes.sql` — 71 recipes + 58 new foods + 284 ingredient links
15. `00015_meal_item_macros.sql` — calories/protein/carbs/fat/notes on meal_items
16. `00016_check_in_day.sql` — `clients.check_in_day int`
17. `00017_leads.sql` — Leads CRM table with RLS
18. `00018_import_zenfit_exercises.sql` — 90 personal exercises with YouTube URLs
19. **`00019_check_in_answers.sql`** — `progress_entries.check_in_answers jsonb` for 9-question reflection
20. **`00020_progress_photos_and_measurements.sql`** — `progress_entries.height_cm`, `.glutes_cm`, private `progress-photos` bucket + storage RLS (15 MB limit, jpeg/png/webp/heic)
21. **`00021_workout_plan_image_and_client_notes.sql`** — `workout_plans.image_url`, `client_exercise_notes` table (unique on client_id+exercise_id) with RLS (coach reads all, client manages own), updated_at trigger

## 7. RLS HELPERS (defined in 00002)

```sql
create or replace function public.my_client_id()
returns uuid as $$
  select id from public.clients where profile_id = auth.uid() limit 1;
$$ language sql stable security definer;

create or replace function public.is_coach()
returns boolean as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'coach');
$$ language sql stable security definer;
```

Policy pattern: **coach can do everything via `is_coach()`; client can read own data via joins back to `my_client_id()`.**

## 8. ROUTES — COMPLETE MAP

### Public
- `/` — Landing page
- `/login` — Email/password login
- `/callback` — Auth callback

### API
- `/api/cron/check-in-reminders` — Vercel Cron @ 7am UTC daily, auto-sends reminder messages. Requires `CRON_SECRET` env var, uses admin Supabase client

### Coach — `(coach)` route group with `Sidebar`
- `/dashboard` — Greeting (God morgon/dag/kväll by UTC hour), Leads/Check-ins/Messages cards, Att granska/Dina klienter/Leads columns
- `/clients` — Client table, filter tabs + search
- `/clients/invite` — 3-step wizard: Klientinfo, Medlemskap, Check-in (sets check_in_day)
- `/clients/[id]` — Overview with sub-tabs (Översikt / Näring / Träning / Framsteg / Dokument). Cards: Klientinstallningar, Vikt, Check-in, Medlemskap, Kostschema (shows all active plans), Träning (shows all active plans), Messages (last 3), Documents (up to 5, clickable → opens file or goes to dokument page)
- `/clients/[id]/naring` — Client's assigned meal plans
- `/clients/[id]/traning` — **UPDATED:** plans table + **"Senaste träningspass"** (last 10 logs, expandable to show per-exercise set detail) + **"Klientens övningsanteckningar"** (all client_exercise_notes)
- `/clients/[id]/framsteg` — **REBUILT:** Check-in summary, body stats with new order (Bröst/Midja/Stuss/Höger Lår/Vänster Lår/Höger Arm/Vänster Arm/Längd), Check-in historik rows show Steg + expandable "Visa veckans reflektion" (9 answers), Framstegsbilder gallery grouped by date with 1-hour signed URLs
- `/clients/[id]/dokument` — Assign files/lessons
- `/leads` — Leads CRM
- `/foods` — Näring hub: Mallar / Recept / Livsmedel tabs
- `/foods/new-recipe` — Recipe creator
- `/foods/recipe/[id]` — Recipe editor
- `/foods/new-food` — Add food
- `/meal-plans` — Listing
- `/meal-plans/new` — Simplified creator
- `/meal-plans/[id]` — **REDESIGNED meal plan editor** (stacked layout with grams-only input, sortable meal sections, sortable items within meals, droppable meal zones for sidebar items). **Sidebar has Livsmedel/Recept tabs** with shared search box. Sidebar IDs: `sidebar-recipe-{id}` and `sidebar-food-{id}` — dnd-kit detects prefix. Drag into meal section (or onto items inside it) — target detected via `useDroppable` + `findMealForItem` fallback. Hero image via Camera button → `recipe-images/meal-plans/{coach_id}/...`
- `/workouts` — Träning hub: Mallar / Övningar tabs
- `/workouts/new` — Simplified creator (auto-creates "Dag 1")
- `/workouts/new-exercise` — Add exercise
- `/workouts/[id]` — Workout builder. **Hero image upload now works** (Camera button → `recipe-images/workout-plans/{coach_id}/...`). Template assignment copies `image_url` to the cloned plan
- `/content` — Innehåll hub (Filer + Lektioner)
- `/content/new-file`, `/content/new-lesson`
- `/check-ins` — Pending + reviewed
- `/messages` — Split-pane chat (client list left, conversation right)
- `/settings` — **Coach account settings**: Profil tab (name, phone, read-only email) + Säkerhet tab (password change). Avatar upload dispatches `profile-updated` event for sidebar sync

### Client — `(client)` route group, all under `/portal/`
- `/portal` — Home
- `/portal/meals` — Meal plan viewer + shopping list
- `/portal/workouts` — **REBUILT:** Lists all active workout plans stacked with hero image (`h-36`), plan title, description, "Plan översikt" day list. Day cards are text-only (name, "X övningar", "Y set", chevron). Fixed critical bug where `.single()` returned null when 0 or 2+ active plans
- `/portal/workouts/day/[dayId]` — **NEW:** Day detail. Utrustning + Målmuskler chips (Swedish translation maps for muscle/equipment slugs), "X övningar / Y set" summary, exercise list with YouTube thumbnail fallback via `getYouTubeThumbnail(video_url)`. Coach notes are **bold**. Sticky black "Starta träningspasset" button at bottom
- `/portal/workouts/log?day=xxx` — **REWRITTEN:** Active session. Sticky progress bar with completed % (green gradient). Per-exercise card with name, "Tilldelad: X reps", tappable thumbnail (opens modal), set rows (number, reps input, kg input, green check button). Values prefilled from last session. Coach notes are **bold**. Sticky black "Slutför" button. On submit creates `workout_logs` + `workout_log_sets` rows and redirects to `/portal/workouts`. **Exercise modal:** embedded video (YouTube/Vimeo URLs parsed to embed URLs, direct video URLs use `<video>`), muscle/equipment chips, "Min anteckning" textarea upserted to `client_exercise_notes`
- `/portal/check-in` — **COMPLETELY REVAMPED:**
  - Vikt card (unchanged)
  - Mått card: **new order** Bröst, Midja, Höger Lår, Vänster Lår, Höger Arm, Vänster Arm, **Längd, Stuss** (8 fields). All preloaded from most recent `progress_entry` so client only edits what changed
  - **"Ladda upp bilder" card:** 3 primary photo slots (Framsida, Baksida, Sida) with camera icons, tap-to-upload, instant preview via `URL.createObjectURL`. "Lägg till ytterligare bilder" button adds removable extra slots. On submit, all files upload to `progress-photos/{client_id}/{entry_id}/{type}-{timestamp}.{ext}` and create `progress_photos` rows
  - Välmående card: Energinivå slider, Sömn, **Antal Steg** (Ca. per dag), Stressnivå slider
  - **"Veckans reflektion" card:** 9 stacked question textareas stored as JSONB in `check_in_answers`
  - **Success screen:** green gradient check with sparkle animation, "Bra jobbat, {FirstName}!", "Jag är så stolt över dig. Tack för att du checkade in denna vecka. 💚", auto-redirect to `/portal` after 3.5s
- `/portal/progress` — Weight/measurements history
- `/portal/messages` — Chat with coach
- `/portal/settings` — **NEW:** 3 tabs: Profil (name/phone + avatar upload with camera badge), E-post (email change via `supabase.auth.updateUser({email})` with confirmation-email messaging), Lösenord (password change, min 6 chars). Avatar upload dispatches `profile-updated` event; `ClientHeader` listens and refetches

## 9. KEY COMPONENTS

### Coach components (`src/components/coach/`)
- `Sidebar` — Nav: Dashboard, Klienter, Leads, Näring, Träning, Innehåll, Meddelanden. Profile card at bottom (avatar, name, email, chevron → upward dropdown with Inställningar + Logga ut). Listens for `profile-updated` event
- `AvatarUpload`, `ClientTagToggle`, `ExerciseEditModal`, `ExerciseList`, `VideoModal`
- `PlanStatusToggle` — Reusable Aktiv/Inaktiv dropdown, works for meal_plans OR workout_plans (pass `table` prop)
- `DeleteMealPlanButton`, `DeleteWorkoutPlanButton`, `DeleteClientButton`

### Client components (`src/components/client/`)
- `BottomNav` — 5 items: Hem, Kost, Träning, Framsteg, Meddelanden
- `ClientHeader` — Sticky top bar. Logo + "Possible" left. Right: **tappable avatar circle → `/portal/settings`** + logout button. Re-fetches profile on route change and on `profile-updated` event so avatar syncs immediately after upload

### UI components (`src/components/ui/`)
- `AvatarCircle` — Used everywhere. Accepts `src`, `initials`, `size` (xs/sm/md/lg)
- `Button` — variants primary/secondary/ghost
- `Card`, `CardContent`
- `Input` — Supports `label` prop

## 10. SERVER ACTIONS (`src/actions/`)

- `clients.ts` — `getClients`, `getClient(id)`, `inviteClient(formData)` (saves check_in_day), `updateClient(id, data)`, `getClientStats()`
- `recipes.ts` — CRUD + search
- `meal-plans.ts` — Templates, plan, create (simplified), assign (allows multiple active), add/remove item, searchFoods
- `workouts.ts` — Templates, plan, create, exercises CRUD, assign (allows multiple active)
- `delete.ts` — `deleteMealPlan`, `deleteWorkoutPlan`, `deleteClient`

## 11. HELPER LIBRARIES (`src/lib/`)

- `supabase/client.ts` — Browser client (`createClient()`)
- `supabase/server.ts` — Server client (`createClient()`)
- `supabase/admin.ts` — Admin client with service role key (used for user creation + deletion + cron reminders)
- `youtube.ts` — `getYouTubeVideoId(url)`, `getYouTubeThumbnail(url)` → returns `https://img.youtube.com/vi/{id}/mqdefault.jpg`. Used on both coach editor AND client day/session pages so thumbnails match
- `constants.ts` — `APP_NAME = "Possible"`
- `utils.ts` — `cn()` (classnames)

## 12. DESIGN PATTERNS & GOTCHAS

### Patterns
- **Optimistic state updates:** For anything editable (e.g. grams → macros), do `setPlan(prev => ...)` immediately, then fire-and-forget DB update. Don't wait for a DB roundtrip before showing the new value. Used in meal plan editor's `handleGramsChange`.
- **Server-component red line:** Coach pages are server components that fetch via Supabase server client on every render. No cache layer, so client-side data changes appear on the coach's next navigation. Verified for avatars (6 files use `profile.avatar_url` via profiles join).
- **Prefix-based dnd-kit IDs:** When mixing draggable types, prefix IDs (`sidebar-recipe-`, `sidebar-food-`, `meal-section-`, `meal-drop-`, item UUIDs). `handleDragEnd` dispatches on prefix.
- **Nested SortableContexts:** dnd-kit supports outer context for meal sections + inner context per meal for items. Each has its own IDs and strategy.
- **Fixed-position dropdowns:** When a dropdown lives inside a scrollable container (`overflow-x-auto`), `position: absolute` gets clipped. Use `position: fixed` with `getBoundingClientRect()` coordinates + document click listener to close.
- **Private bucket viewing:** For sensitive photos, use a private bucket and generate 1-hour signed URLs server-side via `storage.from(bucket).createSignedUrls(paths, 3600)`. Render with `<img>` — the URL includes an HMAC token.
- **YouTube thumbnail fallback:** If an exercise has `video_url` but no `thumbnail_url`, call `getYouTubeThumbnail(video_url)`. Both coach editor and client session page use this, so visuals are identical.
- **Preload from previous entry:** In check-in form, load the most recent `progress_entry` and pre-fill every field. Client only changes what differs. Helper text: "Dina senaste värden är ifyllda — ändra bara det som förändrats."

### Gotchas hit and resolved
- **`.single()` silently returns null when 0 or 2+ rows.** Causes phantom empty states. Use `.maybeSingle()` for 0-or-1, or fetch array for multi.
- **JSX apostrophe bugs:** Quote strings with `'` can break JSX. Use a string variable with unicode escape `\u2019` if needed.
- **SWC parser quirks:** Some TypeScript return type annotations + unicode literals cause parser errors. If SWC complains, remove the type annotation.
- **Next.js 16 breaking change:** File is `proxy.ts`, NOT `middleware.ts`.
- **Turbopack blocked:** Always build with `npm run build --webpack`. Dev server: `npm run dev --webpack`.
- **`defaultValue` on uncontrolled inputs:** React won't update when props change. Fine for grams input where user keeps their typed value, but macros in headers must come from state-derived calculations for them to update.

### Red line audit points (where client state appears on coach side)
| Client change | Coach side display |
|---|---|
| Avatar upload (`/portal/settings`) | 6 files: dashboard, clients list, messages, client detail, framsteg header, traning header — all via `profile.avatar_url` join |
| Check-in submission | `clients/[id]/framsteg`: summary cards, Omkrets grid, Check-in historik with expandable answers, Framstegsbilder gallery |
| Progress photos | `clients/[id]/framsteg` Framstegsbilder section (signed URLs, grouped by date) |
| Workout session | `clients/[id]/traning` "Senaste träningspass" section (expandable per-exercise sets) |
| Exercise note | `clients/[id]/traning` "Klientens övningsanteckningar" section |
| Name/phone edit | Same as avatar — all coach displays of the client re-fetch profile on render |

## 13. SESSION HISTORY — EVERYTHING BUILT

### 2026-04-10 session (pre-compaction)
Covered initial platform build — see "Migration" list items 1–18. Key features:
- Recipe migration (71 Zenfit recipes imported)
- Meal plan macro display
- Meal plan editor redesign (tab-based, left sidebar, SortableMealItemRow)
- Simplified creation forms
- Coach chat (split-pane messages)
- Auto check-in reminders (Vercel Cron)
- Client overview: messages + documents cards
- Leads CRM (full module with migration 00017)
- 90 personal exercises imported (migration 00018)

### Mid-session work (pre-compaction of current session)
- Allowed 4+ active plans simultaneously (removed deactivation in 4 locations across meal + workout actions)
- Fixed tab rename/delete in meal editor (fixed-position dropdown pattern)
- `PlanStatusToggle` component — reusable Aktiv/Inaktiv dropdown for meal + workout plans
- Kostschema + Träning cards on client overview show all active plans
- Dashboard redesign: God morgon/dag/kväll greeting, Leads/Check-ins/Messages cards, Att granska / Dina klienter / Leads columns, text-gradient coach name
- Coach `/settings` page created (Profil + Säkerhet tabs, avatar upload)
- Coach Sidebar profile card at bottom with upward dropdown
- Visual polish: background `#F4F6F9`, sidebar matches bg, `card-elevated` class, motivational quote fixed to bottom-right (pointer-events-none, hidden on mobile)
- Document clickability: files → open in new tab; lessons → dokument viewer modal
- Check-in flow fix: client form now creates check-in if none is pending (was silently doing nothing)
- `/clients/[id]/framsteg` check-in historik fallback by date proximity when check_in_id is null
- **Meal plan editor redesign** to stacked layout: each meal is its own section with its own header/totals, grams-only input on items, auto-calculated section header (kcal / P / K / F). Tab navigation scrolls to meal section. `addRecipeToMeal` fetches ingredient total weight from `recipe_ingredients`. Active meal gets `ring-2 ring-primary/20`

### 2026-04-23 session (current — post-compaction)

**Task 1: Meal plan editor bug fixes** (commit `a8bb255`)
- **Bug 1** — grams change didn't update section header macros. Fix: optimistic `setPlan(prev => ...)` in `handleGramsChange` that scales calories/protein/carbs/fat by `newGrams/oldGrams` ratio locally before the DB write, so header totals update instantly.
- **Bug 2** — couldn't drag entire meal sections to reorder. Fix: new `MealSectionWrapper` component uses `useSortable({ id: 'meal-section-{id}' })` for the outer section AND `useDroppable({ id: 'meal-drop-{id}' })` for receiving sidebar drops. Wrapped meals in outer `SortableContext`. Drag handle = `GripVertical` button in section header.
- **Bug 3** — sidebar drag always went to last meal. Fix: `handleDragEnd` now detects drop target by checking `over.id` prefix (`meal-drop-` → use that meal; `meal-section-` → use that meal; item UUID → `findMealForItem` helper). Also fixed item reordering to find the correct parent meal instead of using `activeMeal`.
- Each sidebar recipe now uses `sidebar-recipe-{id}` (was `sidebar-{id}`).

**Task 2: Client check-in revamp** (commit `780e24d`, migration `00019`)
- Reordered Mått: Bröst, Midja, Höger Lår, Vänster Lår, Höger Arm, Vänster Arm (Höfter removed from UI, hips_cm column kept in schema)
- Preload every numeric field from most recent `progress_entry` so client only edits changes
- Added **Antal Steg** (Ca. per dag) wired to existing `steps_avg` column
- Replaced single Kommentar with **9 stacked reflection question textareas** stored as JSONB in new `check_in_answers` column. Keys: training, nutrition, motivation, hydration_steps, injury, menstruation, wins, improvement, questions
- **Celebration screen:** green gradient check with sparkle animations, "Bra jobbat, {FirstName}!", warm message, auto-redirect to `/portal` after 3.5s + manual button

**Task 3: Photo upload + Längd/Stuss + coach red line** (commit `8e25bb6`, migration `00020`)
- Added `height_cm` + `glutes_cm` columns to `progress_entries`
- Created **private** `progress-photos` bucket (15 MB limit, jpeg/png/webp/heic) with RLS
- Check-in form: added Längd + Stuss inputs (preloaded), new **"Ladda upp bilder"** section
  - 3 primary photo slots (Framsida, Baksida, Sida) as tactile cards with camera icons
  - Tap-to-upload with instant preview via `URL.createObjectURL`
  - "Lägg till ytterligare bilder" button adds removable extra slots
  - On submit: all files upload to `progress-photos/{client_id}/{entry_id}/{type}-{timestamp}.{ext}` and `progress_photos` rows are created
- **Coach Framsteg page** rebuilt:
  - Omkrets grid uses new order, includes Stuss + Längd
  - Check-in historik rows show Steg, photo thumbnails (inline, tap to open), expandable "Visa veckans reflektion" with 9 Swedish-labeled answers
  - New "Framstegsbilder" gallery section grouped by check-in date
  - Photos served via 1-hour server-side signed URLs

**Task 4: Client account settings + avatar red line** (commit `f46729b`, no SQL)
- New `/portal/settings` page with 3 tabs: Profil, E-post, Lösenord
  - Profile pic upload with camera badge corner icon
  - Name + phone editing
  - Email change via `supabase.auth.updateUser({email})` with "Kolla din e-post!" confirmation
  - Password change (min 6 chars, must match)
- Avatar upload writes to existing `avatars` bucket, updates `profiles.avatar_url`, dispatches `profile-updated` event
- **ClientHeader** now shows tappable avatar circle → `/portal/settings`, re-fetches on route change and on `profile-updated` event
- Client layout fetches + passes initial avatar_url to avoid flash
- Red line audit: grep found 6 coach files reading `profile.avatar_url` via joins. All server components, no cache layer. Automatic red line.

**Task 5: Complete workout flow rebuild** (commit `d1ee35f`, migration `00021`)
- **Critical bug fix:** `/portal/workouts` used `.single()` on active workout plans which returned null silently when a client had 0 or 2+ active plans (we allow multi-active). Root cause of "client can't see workouts" report. Fixed by fetching array.
- Migration 00021: added `workout_plans.image_url`, created `client_exercise_notes` table with RLS
- **New client workout flow (3 pages)** mirroring Alice's Zenfit screenshots:
  1. `/portal/workouts` — hero image per plan (fallback slate gradient + Dumbbell icon), plan title, description, "Plan översikt" day list with thumbnail (later removed), exercise count, set count
  2. `/portal/workouts/day/[dayId]` — day detail with Utrustning + Målmuskler chips (Swedish-translated via label maps for muscle/equipment slugs), exercise list with thumbnails + "X set · Y reps · Z vila", sticky "Starta träningspasset" button
  3. `/portal/workouts/log?day=xxx` — active session with sticky progress bar (green gradient), per-exercise cards with name + "Tilldelad: X reps" + tappable thumbnail, set rows (number | reps input | kg input | green check), prefilled from last session. Sticky "Slutför" button creates `workout_logs` + `workout_log_sets` rows
- **Exercise video + note modal:** tap thumbnail → modal opens with embedded video (YouTube/Vimeo URL → embed URL, direct links → `<video>` tag), muscle/equipment chips, "Min anteckning" textarea upserted to `client_exercise_notes`
- **Red line on coach side** (`/clients/[id]/traning`):
  - Existing plans table kept
  - New "Senaste träningspass" section: last 10 logs, each expandable to show every exercise with per-set reps/kg/Klar-or-Ej pills
  - New "Klientens övningsanteckningar" section: all saved client notes with exercise names and last-updated dates

**Task 6: Meal plan editor Livsmedel/Recept tabs** (commit `830ff7d`, no SQL)
- Added 2-tab switcher at top of meal plan editor sidebar: **Livsmedel** | **Recept**
- Shared search input (placeholder switches based on active tab)
- `DraggableSidebarFood` component with `sidebar-food-{id}` prefix
- `addFoodToMeal` function: default amount = `food.serving_size_g` (fallback 100g), macros scaled from per-100g columns using `grams/100` factor, written to `meal_items.food_id` (column was already nullable, just wasn't being used before)
- `handleDragEnd` branches on `sidebar-recipe-` vs `sidebar-food-` prefix
- Existing grams-change logic works for both types because `handleGramsChange` scales by ratio regardless of source

**Task 7: Workout plan image upload + thumbnail fallback + UI polish** (commit `03a74be`, no SQL)
- **Coach workout editor** — added Camera button in top bar (exact pattern from meal editor). Uploads to `recipe-images/workout-plans/{coach_id}/{ts}.ext`, saves to `workout_plans.image_url`. `handleAssignToClient` now copies `image_url` when cloning template
- **Client `/portal/workouts`** — shrunk hero from `aspect-[16/10]` to `h-36`; removed thumbnail square on each day card in Plan översikt (per Daniel's feedback: text-only is cleaner)
- **Day detail page** — exercises now use `ex.thumbnail_url || getYouTubeThumbnail(ex.video_url)` so YouTube links produce auto-thumbnails (same helper coach editor uses). Coach notes (`workout_exercises.notes`) changed from `text-xs italic text-text-muted` to `text-sm font-bold text-text-primary`
- **Session page** — same YouTube thumbnail fallback applied to tappable exercise thumbnail (was blank before). Coach note line also bold for consistency
- Result: coach uploads hero → `workout_plans.image_url` → client landing shows it. Coach sets `video_url` on exercise → both coach and client render identical YouTube thumbnails

## 14. CONVENTIONS REMINDER

- Swedish is the primary UI language. English planned for Icelandic clients (toggle not yet built).
- Templates are DUPLICATED when assigned to a client (`is_template: false, client_id: X, is_active: true`) — original template stays intact.
- Multiple active plans per client are allowed (both meal and workout). Do NOT deactivate other plans when assigning.
- Leads pipeline: Ny → Kontaktad → Vunnen. Lost leads are deleted (no "Förlorad" status).
- File is `proxy.ts` NOT `middleware.ts`.
- Build: `npm run build --webpack`. Dev: `npm run dev --webpack`.
- No billing/payments (Alice uses Swish separately).

## 15. WHAT'S NOT BUILT YET (OPEN ITEMS)

### High priority (client-facing polish)
- No client-side gallery / viewer for their own past progress photos (only on coach side via signed URLs)
- Before/after photo comparison viewer
- Weight/measurements charts (recharts installed, not wired)
- Exercise progression tracking (automatic weight increase suggestions)
- Client-facing content/lessons viewer in portal

### Coach-facing
- ~20 missing personal exercises from Zenfit (90/110 imported, rest can be added manually via `/workouts/new-exercise`)
- Recipe images (data imported, photos need manual upload via recipe editor)
- Functional client list filter tabs (Nyligen Startat, Ny Check-in, Missad Check-in — UI exists, logic not)
- Functional client list search (UI exists, logic not)

### Infra
- Multi-coach support (currently assumes single coach)
- Mobile app (PWA or native)
- Custom domain (currently on `team-possible.vercel.app`)
- English language toggle

### Data
- `zenfit-recipes-extracted.json` — 75 entries (71 unique) at `C:\Users\danth\Desktop\Possible ZENFIT\`
- `zenfit-exercises-personal.json` — 90 exercises at same path

## 16. DANIEL'S COMMUNICATION STYLE

- Very warm, friendly, calls Claude "partner" / "brother"
- Often says "Incredible work" + immediate new task
- Emphasizes "no stress", "take your time", "one step at a time"
- Provides screenshots often (from Alice's Zenfit views) — when he does, match them closely
- Uses all caps for emphasis ("RED-LINE", "TAKE YOUR TIME")
- Happy to answer clarifying questions but rarely needs to — his asks are detailed
- Not a developer himself — explain trade-offs in plain language when relevant
- Uses notepad workflow for SQL — opens file with `start notepad "path"` after writing migration

## 17. QUICK VERIFICATION CHECKLIST

Before claiming work done:
1. `npm run build --webpack` — must pass (look for the route list at the end)
2. `git status` — specific files staged, no secrets
3. Commit message explains the WHY in first line and details in body
4. `git push` — deploys to Vercel automatically
5. If SQL required: `start notepad "supabase/migrations/000XX_description.sql"` AND tell Daniel which step requires his action on the Supabase dashboard
6. State what was done + what requires Daniel's action in a short, readable summary
7. Check the red line: did I update the coach-side display if I changed client-facing data, or vice versa?

---

**Everything in section 13 corresponds to actual deployed commits. Git log from `main` is the source of truth if this file falls out of date.**
