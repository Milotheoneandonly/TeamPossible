# POSSIBLE - Fitness Coaching Platform - Complete Summary

## What This Is
A fitness coaching platform built for one coach (Alice) and her 30 Swedish/Nordic clients. Replaces zenfit.io with a custom platform. Brand: "Possible". Baby blue + white theme. Swedish UI.

## Tech Stack
- **Next.js 16.2.3** (App Router, TypeScript, `proxy.ts` instead of `middleware.ts`)
- **Supabase** (PostgreSQL, Auth, Storage, RLS)
- **Tailwind CSS 4** (custom `@theme inline` tokens)
- **@dnd-kit** (drag-and-drop in workout + meal plan builders)
- **Vercel** hosting at `team-possible.vercel.app`
- **Vercel Cron** for daily check-in reminders (`vercel.json`)
- **GitHub**: github.com/Milotheoneandonly/TeamPossible

## Supabase Config
- URL: `https://yqfliqqwwqjsitaolias.supabase.co`
- Storage buckets: `avatars` (public), `progress-photos` (private), `exercise-media` (public), `recipe-images` (public), `content-files` (public)
- Auth: email/password, custom access token hook for role in JWT
- Admin client (`createAdminClient`) used for user creation and deletion
- Build uses `--webpack` flag (Turbopack blocked on this machine)

## Database (30+ tables)

### Core
- `profiles` (extends auth.users -- role: coach/client, first_name, last_name, email, phone, avatar_url, locale: sv)
- `clients` (coach_id, profile_id, status, goals, notes, start_date, dietary_preferences[], allergies[], height_cm, target_weight_kg, activity_level, **tags text[] DEFAULT '{}'**, **check_in_day integer CHECK 0-6** — 0=Mon..6=Sun, NULL=no reminder)

### Nutrition
- `foods` (name, name_sv, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category — **260+ Swedish foods** seeded including 58 Zenfit-specific ingredients)
- `recipes` (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags[], instructions, prep_time_minutes, cook_time_minutes, servings, image_url — **71 recipes imported from Zenfit**)
- `recipe_ingredients` (recipe_id, food_id, amount_g, sort_order — **284 ingredient links**)
- `meal_plans` (coach_id, client_id nullable, title, is_template, is_active, target_calories, target_protein_g, target_carbs_g, target_fat_g, image_url)
- `meal_plan_days` (plan_id, day_number, name, sort_order)
- `meals` (day_id, meal_type, name, sort_order)
- `meal_items` (meal_id, food_id or recipe_id, amount_g, servings, sort_order, **calories, protein, carbs, fat, notes** — editable macros per item)

### Training
- `exercises` (name, name_sv, description, description_sv, video_url, thumbnail_url, muscle_groups[], equipment[], difficulty, is_custom, category_id — **90 personal exercises imported from Zenfit** with YouTube URLs)
- `exercise_categories` (name, name_sv)
- `workout_plans` (coach_id, client_id nullable, title, description, is_template, is_active)
- `workout_days` (plan_id, day_number, name, sort_order)
- `workout_exercises` (day_id, exercise_id, sets, reps, rest_seconds, tempo, notes, superset_group, sort_order)
- `workout_logs` + `workout_log_sets` (client workout logging)

### Check-ins & Progress
- `check_in_templates` + `check_in_questions` (configurable check-in forms)
- `check_ins` (client_id, status: pending/submitted/reviewed, submitted_at, reviewed_at, coach_notes)
- `check_in_responses` (check_in_id, question_id, answer)
- `progress_entries` (client_id, date, weight_kg, waist_cm, chest_cm, hips_cm, arm_left_cm, arm_right_cm, thigh_left_cm, thigh_right_cm, energy_level, stress_level, sleep_hours_avg, steps_avg, notes, check_in_id)
- `progress_photos` (progress_entry_id, storage_path, photo_type: front/side/back)

### Content & Documents
- `content_files` (coach_id, title, description, file_url, file_type, file_size_bytes) -- PDFs, images, Word, Excel
- `lessons` (coach_id, title, subtitle, message, media_url, media_type, status: draft/published)
- `client_documents` (client_id, content_file_id OR lesson_id) -- assignment join table

### Messaging
- `messages` (client_id, sender_id, content, is_read) -- used for coach-client chat AND auto check-in reminders

### Leads (CRM)
- `leads` (coach_id, first_name, last_name, email, phone, country, status CHECK ('ny','kontaktad','vunnen'), tags[], notes, created_at, updated_at) -- with RLS: coach can only access own leads

## Migrations (18 files)
1. `00001_initial_schema.sql` -- Core tables, profiles, clients, exercises, workouts, meals, check-ins, progress, messages
2. `00002_rls_policies.sql` -- RLS with `is_coach()` and `my_client_id()` helper functions
3. `00003_seed_swedish_foods.sql` -- Initial 150+ Swedish foods
4. `00004_expand_foods.sql` -- More foods + spices expansion
5. `00005_storage_policies.sql` -- Avatars bucket storage policies
6. `00006_content_tables.sql` -- `content_files` + `lessons` tables with RLS
7. `00007_client_documents.sql` -- `client_documents` join table
8. `00008_fix_coach_profile_update.sql` -- Allow coach to UPDATE all profiles
9. `00009_client_tags.sql` -- Added `tags text[]` column to clients table
10. `00010_more_foods.sql` -- 50+ additional foods (nuts, drinks, dairy brands, supplements)
11. `00011_recipe_images_storage.sql` -- Storage policies for `recipe-images` bucket
12. `00012_fix_all_storage.sql` -- Storage policies for `content-files` bucket
13. `00013_meal_plan_image.sql` -- Added `image_url` column to `meal_plans`
14. `00014_import_zenfit_recipes.sql` -- **71 recipes + 58 new foods + 284 recipe_ingredients from Zenfit**
15. `00015_meal_item_macros.sql` -- Added calories, protein, carbs, fat, notes columns to `meal_items`
16. `00016_check_in_day.sql` -- Added `check_in_day integer` to `clients` for auto-reminders
17. `00017_leads.sql` -- Created `leads` table with RLS
18. `00018_import_zenfit_exercises.sql` -- **90 personal exercises from Zenfit with YouTube URLs**

## RLS Security
- `is_coach()` and `my_client_id()` SQL helper functions
- Coach: full CRUD on everything
- Client: read own data, write own check-ins/progress/workout logs/messages
- Leads: coach can only access own leads (coach_id = auth.uid())

## All Routes (40+ total)

### Public
- `/` -- Landing page (hero, features, testimonials, CTA, footer)
- `/login` -- Email/password login
- `/callback` -- Auth callback route

### API Routes
- `/api/cron/check-in-reminders` -- Vercel Cron (daily 7am UTC) auto-sends check-in reminder messages to clients whose `check_in_day` matches today. Uses admin Supabase client. Requires `CRON_SECRET` env var.

### Coach (`/(coach)` group with sidebar)
- `/dashboard` -- Stats cards (active clients, pending check-ins, unread messages), recent check-ins, recent clients
- `/clients` -- Table with COMP badge, Vecka, Check-in, Scheman indicators, Meddelanden badge. Filter tabs + search
- `/clients/invite` -- **3-step wizard**: Step 1 Klientinfo, Step 2 Medlemskap, Step 3 Check-in (**now saves check_in_day to DB**). Success screen with credentials
- `/clients/[id]` -- Overview with sub-tabs. Cards: Klientinstallningar, Vikt, Check-in, Medlemskap, Kostschema, Traning. **Bottom row: Messages card (shows last 3 messages, links to /messages), Documents card (shows up to 5 assigned docs, links to dokument page)**. Danger zone: DeleteClientButton
- `/clients/[id]/naring` -- Client's assigned meal plans
- `/clients/[id]/traning` -- Client's assigned workout programs
- `/clients/[id]/framsteg` -- Full progress tab with check-ins, body stats, measurements
- `/clients/[id]/dokument` -- Assign files/lessons from content library
- `/leads` -- **NEW: Leads CRM page** with filter tabs (Alla/Ny/Kontaktad/Vunnen with count badges), search, table (Namn/Telefon/Status badge/Skapad den/edit+delete). Create modal (Förnamn, Efternamn, Land, E-post, Telefon, Intern anteckning). Edit modal with status dropdown
- `/foods` -- **Naring** hub with 3 tabs: Mallar, Recept (71 recipes with macros/tags), Livsmedel (260+ foods, limit 500)
- `/foods/new-recipe` -- Recipe creator with image upload, ingredient search, tags
- `/foods/recipe/[id]` -- Recipe edit page
- `/foods/new-food` -- Add custom food/ingredient
- `/meal-plans/new` -- **Simplified**: just Name + Description + Save as template (no pre-set macros, totals auto-calculated)
- `/meal-plans` -- Meal plans listing
- `/meal-plans/[id]` -- **REDESIGNED meal plan editor** matching workout editor pattern: tab-based meals at top (Måltid 1, 2, 3... + "+" to add), left sidebar with recipe search + drag-and-drop, SortableMealItemRow with inline editable Kcal/Protein/Karbs/Fett + notes per item. Macros pre-populated from recipe on drag. Client assignment flow preserved.
- `/workouts` -- **Traning** hub with 2 tabs: Mallar, Ovningar (exercise list with edit)
- `/workouts/new` -- **Simplified**: just Name + Description + Save as template (auto-creates "Dag 1", coach adds/renames in editor)
- `/workouts/new-exercise` -- Add exercise
- `/workouts/[id]` -- Workout builder with DnD sidebar, SortableExerciseRow, inline editing
- `/content` -- Innehall hub (Filer + Lektioner tabs)
- `/content/new-file` -- File upload
- `/content/new-lesson` -- Lesson creator
- `/check-ins` -- Pending + reviewed check-ins
- `/messages` -- **REDESIGNED: Split-pane chat** — left panel client list with search/unread badges/latest message preview, right panel full conversation thread with chat bubbles (coach blue right, client white left), timestamps, text input + send button. Auto-marks messages as read on selection.

### Client (`/(client)` group with bottom nav, all under `/portal/`)
- `/portal` -- Home: greeting, latest weight, action cards
- `/portal/meals` -- Meal plan viewer + shopping list
- `/portal/workouts` -- Workout plan viewer
- `/portal/workouts/log` -- Workout logger
- `/portal/check-in` -- Weekly check-in form
- `/portal/progress` -- Weight/measurements history
- `/portal/messages` -- Chat with coach (functional: send/receive messages, timestamps, read receipts)

## Key Components

### Coach Components (`src/components/coach/`)
- `Sidebar` -- Coach nav: Dashboard, Klienter, **Leads**, Näring, Träning, Innehåll, Check-ins, Meddelanden. Mobile hamburger. Logout
- `AvatarUpload`, `ClientTagToggle`, `ExerciseEditModal`, `ExerciseList`, `VideoModal`
- `DeleteMealPlanButton`, `DeleteWorkoutPlanButton`, `DeleteClientButton`

### Client Components (`src/components/client/`)
- `BottomNav`, `ClientHeader`

### UI Components (`src/components/ui/`)
- `AvatarCircle`, `Button`, `Card`/`CardContent`, `Input`

## Server Actions (5 files)

### `src/actions/clients.ts`
- `getClients()`, `getClient(id)`, `inviteClient(formData)` **(now accepts check_in_day)**, `updateClient(id, data)`, `getClientStats()`

### `src/actions/recipes.ts`
- `getRecipes()`, `getRecipe(id)`, `createRecipe()`, `updateRecipe()`, `deleteRecipe()`, `searchRecipes()`

### `src/actions/meal-plans.ts`
- `getMealPlanTemplates()`, `getMealPlan()` **(includes calories/protein/carbs/fat/notes on meal_items)**, `createMealPlan()` **(simplified: 1 day + 1 default meal)**, `assignMealPlanToClient()`, `addMealItem()`, `removeMealItem()`, `searchFoods()`, `createFood()`

### `src/actions/workouts.ts`
- `getWorkoutPlanTemplates()`, `getWorkoutPlan()`, `createWorkoutPlan()`, `addExerciseToDay()`, `removeExerciseFromDay()`, `updateWorkoutExercise()`, `assignWorkoutPlanToClient()`, `getExercises()`, `getExerciseCategories()`, `createExercise()`

### `src/actions/delete.ts`
- `deleteMealPlan(id)`, `deleteWorkoutPlan(id)`, `deleteClient(id)`

## Vercel Cron Configuration
File: `vercel.json`
```json
{ "crons": [{ "path": "/api/cron/check-in-reminders", "schedule": "0 7 * * *" }] }
```
Requires `CRON_SECRET` environment variable in Vercel project settings.

## Design Decisions
- Client routes under `/portal/` to avoid route collisions with coach routes
- `proxy.ts` (not `middleware.ts`) -- Next.js 16 breaking change
- No billing/payments -- wife uses Swish separately
- Swedish primary language with English toggle planned for Icelandic clients
- Templates are DUPLICATED when assigned to a client (original stays intact)
- Meal plan editor uses tab-based meals (not 7-day vertical layout) — matches workout editor pattern exactly
- New meal plans start with 1 meal tab "Måltid 1" (coach adds more via "+" button)
- New workout programs start with "Dag 1" (coach adds/renames in editor)
- Each meal item has editable macros (kcal/P/K/F) pre-populated from recipe + notes field
- Food database has 260+ items (200 base + 58 from Zenfit recipe migration)
- 90 personal exercises imported from Zenfit via GraphQL API interceptor
- 71 recipes imported from Zenfit via manual screenshot extraction
- Leads use simple pipeline: Ny → Kontaktad → Vunnen (lost leads are deleted, no "Förlorad" status)
- Auto check-in reminders sent via Vercel Cron at 7am UTC daily to clients with matching check_in_day
- Coach messages page is split-pane (client list left, chat right) — not separate pages
- COMP tag system on clients for competition prep tracking
- YouTube thumbnails auto-extracted from video URLs for exercise cards

## Data Files (for reference)
- `C:\Users\danth\Desktop\Possible ZENFIT\zenfit-recipes-extracted.json` -- 75 recipe entries (71 unique after removing duplicates #25, #38, #39, #43)
- `C:\Users\danth\Desktop\Possible ZENFIT\zenfit-exercises-personal.json` -- 90 personal exercises extracted from Zenfit GraphQL API

## Session History (2026-04-10)

### Completed in this session:
1. **Recipe Migration** (migration 00014): Built SQL importing 71 recipes + 58 new foods + 284 recipe_ingredients. Cross-referenced 76 ingredients against existing 200+ foods table. Calculated per-100g macros for all missing ingredients.
2. **Meal plan macro display**: Added Protein/Kolhydrater/Fett breakdown with percentages below each meal card header. Removed per-item kcal display.
3. **Meal plan editor redesign** (migration 00015): Complete rewrite to match workout editor — tab-based meals, left sidebar with recipe search/drag, SortableMealItemRow with inline editable macros + notes.
4. **Simplified creation forms**: Removed macro inputs from "Ny kostplan" (auto-calculated). Removed day inputs from "Nytt träningsprogram" (auto-creates Dag 1).
5. **Coach chat** (migration 00016): Rewrote `/messages` as split-pane chat with client list, conversation thread, send functionality. Added `check_in_day` to clients table.
6. **Auto check-in reminders**: Vercel Cron API route at `/api/cron/check-in-reminders` sends daily reminder messages to clients on their check-in day. Updated invite flow to persist check_in_day.
7. **Client overview enhancements**: Messages card shows last 3 messages + links to chat. Documents card shows assigned docs.
8. **Leads CRM** (migration 00017): Full leads management with Alla/Ny/Kontaktad/Vunnen tabs, search, create/edit modals, delete. Added to sidebar.
9. **Exercise import** (migration 00018): Extracted 90 personal exercises from Zenfit via GraphQL API interceptor. Imported with YouTube URLs, descriptions, Swedish muscle groups + equipment.

## What's NOT Built Yet
- ~20 missing personal exercises from Zenfit (90 of 110 imported, rest can be added manually)
- Multi-coach support
- Progress photo upload from client check-in
- Before/after photo comparison viewer
- Weight/measurements charts (recharts ready but not implemented)
- Mobile app (PWA or native)
- Custom domain (using team-possible.vercel.app)
- English language toggle
- Advanced exercise progression tracking
- Client-facing content/lessons viewer in portal
- Functional client list filter tabs (Nyligen Startat, Ny Check-In, Missad Check-In)
- Functional client list search
- Recipe image uploads (data imported, images need manual upload)
