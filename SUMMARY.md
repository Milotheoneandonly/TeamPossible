# POSSIBLE - Fitness Coaching Platform - Complete Summary

## What This Is
A fitness coaching platform built for one coach (Alice) and her 30 Swedish/Nordic clients. Replaces zenfit.io with a custom platform. Brand: "Possible". Baby blue + white theme. Swedish UI.

## Tech Stack
- **Next.js 16.2.3** (App Router, TypeScript, `proxy.ts` instead of `middleware.ts`)
- **Supabase** (PostgreSQL, Auth, Storage, RLS)
- **Tailwind CSS 4** (custom `@theme inline` tokens)
- **@dnd-kit** (drag-and-drop in workout + meal plan builders)
- **Vercel** hosting at `team-possible.vercel.app`
- **GitHub**: github.com/Milotheoneandonly/TeamPossible

## Supabase Config
- URL: `https://yqfliqqwwqjsitaolias.supabase.co`
- Storage buckets: `avatars` (public), `progress-photos` (private), `exercise-media` (public), `recipe-images` (public), `content-files` (public)
- Auth: email/password, custom access token hook for role in JWT
- Admin client (`createAdminClient`) used for user creation and deletion
- Build uses `--webpack` flag (Turbopack blocked on this machine)

## Database (25+ tables)

### Core
- `profiles` (extends auth.users -- role: coach/client, first_name, last_name, email, phone, avatar_url, locale: sv)
- `clients` (coach_id, profile_id, status, goals, notes, start_date, dietary_preferences[], allergies[], height_cm, target_weight_kg, activity_level, **tags text[] DEFAULT '{}'**)

### Nutrition
- `foods` (name, name_sv, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category -- 200+ Swedish foods seeded including nuts, drinks, supplements, sauces, frozen items)
- `recipes` (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags[], instructions, prep_time_minutes, cook_time_minutes, servings, **image_url**)
- `recipe_ingredients` (recipe_id, food_id, amount_g, sort_order)
- `meal_plans` (coach_id, client_id nullable, title, is_template, is_active, target_calories, target_protein_g, target_carbs_g, target_fat_g, **image_url**)
- `meal_plan_days` (plan_id, day_number, name, sort_order)
- `meals` (day_id, meal_type, sort_order)
- `meal_items` (meal_id, food_id or recipe_id, amount_g, sort_order)

### Training
- `exercises` (name, name_sv, description, description_sv, video_url, muscle_groups[], equipment[], difficulty, category_id)
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
- `client_documents` (client_id, content_file_id OR lesson_id) -- assignment join table with CHECK constraint ensuring exactly one FK is set

### Messaging
- `messages` (client_id, sender_id, body, is_read)

## Migrations (13 files)
1. `00001_initial_schema.sql` -- Core tables, profiles, clients, exercises, workouts, meals, check-ins, progress, messages
2. `00002_rls_policies.sql` -- RLS with `is_coach()` and `my_client_id()` helper functions
3. `00003_seed_swedish_foods.sql` -- Initial 150+ Swedish foods
4. `00004_expand_foods.sql` -- More foods expansion
5. `00005_storage_policies.sql` -- Avatars bucket storage policies (SELECT/INSERT/UPDATE/DELETE for authenticated)
6. `00006_content_tables.sql` -- `content_files` + `lessons` tables with RLS, indexes, updated_at trigger
7. `00007_client_documents.sql` -- `client_documents` join table with file-or-lesson CHECK constraint
8. `00008_fix_coach_profile_update.sql` -- Allow coach to UPDATE all profiles (for avatar upload)
9. `00009_client_tags.sql` -- Added `tags text[]` column to clients table
10. `00010_more_foods.sql` -- 50+ additional foods (nuts, drinks, dairy brands, supplements, sauces, frozen items)
11. `00011_recipe_images_storage.sql` -- Storage policies for `recipe-images` bucket
12. `00012_fix_all_storage.sql` -- Storage policies for `content-files` bucket (was missing, causing upload errors)
13. `00013_meal_plan_image.sql` -- Added `image_url` column to `meal_plans` table for cover images

## RLS Security
- `is_coach()` and `my_client_id()` SQL helper functions
- Coach: full CRUD on everything
- Client: read own data, write own check-ins/progress/workout logs/messages
- Content files: coach full CRUD, clients can view all
- Lessons: coach full CRUD, clients can view published only
- Client documents: coach full CRUD, client can view own assignments

## All Routes (38 total)

### Public
- `/` -- Landing page (hero, features, testimonials, CTA, footer)
- `/login` -- Email/password login
- `/callback` -- Auth callback route

### Coach (`/(coach)` group with sidebar)
- `/dashboard` -- Stats cards (active clients, pending check-ins, unread messages), recent check-ins, recent clients with avatars
- `/clients` -- Table: Namn (with COMP badge), Vecka, Check-in, Scheman (meal+workout indicators), Meddelanden (unread badge). Filter tabs: Alla Aktiva, Nyligen Startat, Ny Check-In, Missad Check-In. Search bar
- `/clients/invite` -- **3-step wizard**: Step 1 Klientinfo (name, email, phone with +46 prefix, country, language, goals), Step 2 Medlemskap (start date, duration, notes), Step 3 Check-in (frequency, period, day). Success screen with credentials + copy-to-clipboard message
- `/clients/[id]` -- Overview: avatar upload, COMP tag toggle, status badge, sub-tabs (Oversikt/Naring/Traning/Framsteg). Cards: Klientinstallningar, Vikt (with diff), Check-in countdown, Medlemskap (week number), Kostschema (kcal + meal count), Traning (pass count). Bottom row: Messages link, Dokument link. Danger zone: DeleteClientButton
- `/clients/[id]/naring` -- Client's assigned meal plans with delete buttons, assign from templates
- `/clients/[id]/traning` -- Client's assigned workout programs with delete buttons, assign from templates
- `/clients/[id]/framsteg` -- Full Framsteg tab: Check-in section (wellness ratings grid, client goals), Body stats (weight with trend arrows, waist, steps), Kroppsstatistik (weight history table with per-entry diff, body measurements grid with change tracking), Check-in historik (status badges, coach notes), Framstegsbilder placeholder
- `/clients/[id]/dokument` -- **Client documents page**: assign files/lessons from content library picker, remove assignments, grouped by type (Filer/Lektioner)
- `/foods` -- **Naring** hub with 3 tabs: Mallar (template cards with delete + assigned plans section), Recept (table with macros/tags), Livsmedel (full food database table)
- `/foods/new-recipe` -- Recipe creator with **image upload** (to recipe-images bucket), ingredient search with auto macro calculation, tags (Frukost/Lunch/Middag/Mellanmal/Proteinrik/Snabb/Vegansk/Vegetarisk), prep/cook time, servings
- `/foods/recipe/[id]` -- **Recipe edit page**: edit name, macros, instructions, tags, image. Delete recipe button. Click any recipe in Recept tab to open
- `/foods/new-food` -- Add custom food/ingredient
- `/meal-plans/new` -- Create kostplan (auto-creates 7 days x 5 meal types)
- `/meal-plans` -- Meal plans listing
- `/meal-plans/[id]` -- Meal plan editor with **drag-and-drop** (SortableMealCard with GripVertical handle via @dnd-kit), add recipes/foods to meal slots, day tabs, assign-to-client flow, **cover image upload**
- `/workouts` -- **Traning** hub with 2 tabs: Mallar (template cards with delete + assigned plans), Ovningar (exercise list with click-to-edit). Assign flow with client banner
- `/workouts/new` -- Create workout program with custom days
- `/workouts/new-exercise` -- Add exercise (muscles, equipment, difficulty, YouTube URL, notes)
- `/workouts/[id]` -- Workout builder with **drag-and-drop** (DraggableSidebarExercise from sidebar, SortableExerciseRow in day, via @dnd-kit), inline Set/Vikt/Reps/Vila editing, YouTube thumbnail previews, VideoModal popup, assign-to-client flow
- `/exercises` -- Standalone exercise library page (grouped by category)
- `/content` -- **Innehall** hub with 2 tabs: Filer (uploaded files table with title/description/type/date), Lektioner (lessons table with title/status/date)
- `/content/new-file` -- File upload page (title, description, drag-and-drop file picker, supports PDF/images/Word/Excel up to 50MB, uploads to content-files bucket)
- `/content/new-lesson` -- Lesson creator (title, subtitle, rich message text, media upload for images/video/PDF, publish/draft status toggle)
- `/check-ins` -- Pending + reviewed check-ins
- `/messages` -- Message center with unread badges

### Client (`/(client)` group with bottom nav, all under `/portal/`)
- `/portal` -- Home: greeting, latest weight, action cards
- `/portal/meals` -- Meal plan viewer (days, meals, macros per meal, shopping list link)
- `/portal/meals/shopping-list` -- Auto-generated shopping list with checkboxes
- `/portal/workouts` -- Workout plan viewer (days, exercises, sets/reps/rest)
- `/portal/workouts/log` -- Workout logger (per-set weight/reps input, completion checkmarks)
- `/portal/check-in` -- Weekly check-in form (weight, 7 measurements, energy/stress sliders, sleep, notes)
- `/portal/progress` -- Weight history, measurements grid, energy/sleep display
- `/portal/messages` -- Simple message board with coach

## Key Components (14 total)

### Coach Components (`src/components/coach/`)
- `Sidebar` -- Coach nav: Dashboard, Klienter, Naring, Traning, **Innehall**, Check-ins, Meddelanden. Mobile hamburger menu with overlay. Logout button
- `AvatarUpload` -- Click-to-upload profile photo with camera hover overlay, uploads to avatars bucket, updates profile, supports sm/md/lg sizes
- `ClientTagToggle` -- Toggle COMP tag on/off for a client, updates clients.tags array in DB
- `ExerciseEditModal` -- Full exercise editor modal (name, muscle groups pill selector, equipment pill selector, difficulty 3-button toggle, description textarea, video URL input, delete button)
- `ExerciseList` -- Clickable exercise table (name with video icon, muscle groups, equipment, difficulty badge), opens ExerciseEditModal on click
- `VideoModal` -- Embedded YouTube/Vimeo player popup with auto-embed URL extraction
- `DeleteMealPlanButton` -- Confirm-delete button for meal plans with loading spinner
- `DeleteWorkoutPlanButton` -- Confirm-delete button for workout plans with loading spinner
- `DeleteClientButton` -- Double-confirm delete for clients (cascades all data + deletes auth user via admin API)

### Client Components (`src/components/client/`)
- `BottomNav` -- Client mobile nav (Hem, Kost, Traning, Framsteg, Meddelanden)
- `ClientHeader` -- Client portal header

### UI Components (`src/components/ui/`)
- `AvatarCircle` -- Reusable avatar display (photo or initials fallback, 5 sizes: xs/sm/md/lg/xl)
- `Button` -- Styled button (variants: default/secondary/ghost/danger, sizes: sm/md/lg)
- `Card` / `CardContent` -- Card container components
- `Input` -- Styled input with label

### Landing Components (`src/components/landing/`)
- `Hero`, `Features`, `Testimonials`, `CtaSection`, `Footer`, `Navbar`

## Server Actions (5 files)

### `src/actions/clients.ts`
- `getClients()` -- All clients with profiles
- `getClient(id)` -- Single client with full profile
- `inviteClient(formData)` -- Creates auth user via admin API, sets role metadata, creates client record, returns temp password
- `updateClient(id, data)` -- Update client fields (status, goals, notes, dietary prefs, allergies, height, target weight, activity level)
- `getClientStats()` -- Dashboard stats (active clients count, pending check-ins, unread messages)

### `src/actions/recipes.ts`
- `getRecipes()`, `createRecipe()`, `updateRecipe()`, `deleteRecipe()`, `searchRecipes()`

### `src/actions/meal-plans.ts`
- `getMealPlanTemplates()`, `getMealPlan()`, `createMealPlan()`, `assignMealPlanToClient()`, `addMealItem()`, `removeMealItem()`, `searchFoods()`, `createFood()`

### `src/actions/workouts.ts`
- `getWorkoutPlanTemplates()`, `getWorkoutPlan()`, `createWorkoutPlan()`, `addExerciseToDay()`, `removeExerciseFromDay()`, `updateWorkoutExercise()`, `assignWorkoutPlanToClient()`, `getExercises()`, `getExerciseCategories()`, `createExercise()`

### `src/actions/delete.ts`
- `deleteMealPlan(id)` -- Deletes meal plan, revalidates paths
- `deleteWorkoutPlan(id)` -- Deletes workout plan, revalidates paths
- `deleteClient(id)` -- Deletes client record (cascades via FK), then deletes auth user via admin API

## Lib / Utilities
- `src/lib/constants.ts` -- APP_NAME and other constants
- `src/lib/utils.ts` -- `cn()` classname merge utility
- `src/lib/youtube.ts` -- `getYouTubeVideoId()` and `getYouTubeThumbnail()` helpers
- `src/lib/supabase/server.ts` -- Server-side Supabase client
- `src/lib/supabase/client.ts` -- Browser-side Supabase client
- `src/lib/supabase/admin.ts` -- Admin Supabase client (service role key) for user management
- `src/lib/supabase/proxy.ts` -- Next.js 16 proxy (replaces middleware.ts)

## Design Decisions
- Client routes under `/portal/` to avoid route collisions with coach routes
- `proxy.ts` (not `middleware.ts`) -- Next.js 16 breaking change
- No billing/payments -- wife uses Swish separately
- No real-time chat -- wife uses WhatsApp, messages are simple inbox
- Swedish primary language with English toggle planned for Icelandic clients
- Templates are DUPLICATED when assigned to a client (original stays intact)
- Meal plans auto-create 7 days x 5 meal types on creation
- Food database seeded with 200+ common Swedish foods including branded items (Arla Protein, Lindahls kvarg, Oatly Barista, Wasa Husman)
- YouTube thumbnails auto-extracted from video URLs for exercise cards
- COMP tag system on clients for competition prep tracking
- Client invite uses 3-step wizard with auto-generated 12-char temp password
- Delete client requires double confirmation and cascades all data + removes auth user
- Recipe images stored in dedicated `recipe-images` bucket
- Content files (PDFs, documents) stored in `content-files` bucket
- Lessons support draft/published status for controlled visibility

## Recent Session Fix (2026-04-10)
- **Fixed meal plan cover images bug**: `getMealPlanTemplates()` was missing `image_url` in SELECT query. Fixed in 3 files: `src/actions/meal-plans.ts`, `src/app/(coach)/foods/page.tsx`, `src/app/(coach)/meal-plans/page.tsx`. Template cards now show uploaded cover images. Committed and deployed to Vercel.

## ACTIVE TASK: Recipe Migration from Zenfit 2.0

### Status: ALL 76 RECIPES EXTRACTED — READY TO BUILD SQL

### What Was Done
- Manually extracted all 76 recipes from wife's Zenfit 2.0 account via screenshots (76 recipe detail popups screenshotted and data extracted)
- All recipe data saved to: `C:\Users\danth\Desktop\Possible ZENFIT\zenfit-recipes-extracted.json`
- Each recipe includes: name, protein/carbs/fat percentages, total weight, total kcal, ingredients (name + amount_g + kcal each), instructions, prep/cook time, meal type tags, recipe type tags

### Duplicate Recipes to REMOVE (identical ingredients + amounts)
- Entry #25 (duplicate of #24 "Keso med bär - ANNY")
- Entry #38 (duplicate of #36 "Lax och Potatis")
- Entry #39 (duplicate of #36 "Lax och Potatis")
- Entry #43 (duplicate of #41 "LOUISE - GLASS")
- **Final unique recipe count: 71 recipes**

### All 76 Unique Ingredients Found
1. Smör, saltat
2. Levain, surdegsbröd (Pågen)
3. Gurka
4. Äggvita, pastöriserad
5. Ägg, hela
6. Majskakor
7. SSN isolat (SSN)
8. Alpro mandelmjölk osötad
9. Kalkonpålägg
10. Äpple
11. Kvarg, naturell, 0.2% fett
12. Supermini Keso, 0.2% fett
13. Svartvinbärsgelé
14. ATRON Isolate Proteinpulver
15. Jordnötssmör, minst 99%
16. Whey Berry - Cypern
17. Granola, Kakao & Hallon
18. Annie Yoghurt
19. keso/ havregryn bröd
20. Tomat
21. Majs, konserverad
22. Kycklingbröstfilé, rå
23. Morötter
24. Isbergssallad
25. Olivolja
26. Zucchini/Squash
27. Sötmandel
28. Kaseinpulver, vaniljsmak
29. Hallon, frysta
30. Kolhydrater (IGNITE ATRON)
31. FINAL - ATRON
32. Färskost, Philadelphia Original
33. Kallrökt lax
34. Rågkusar 6P (Fazer)
35. Havredryck, iKaffe (Oatly)
36. Choklad, 70%
37. Granola, Hasselnötter &...
38. Cottage Cheese 2,0%
39. Blåbär, frysta
40. Linfrön
41. Hallon
42. Keso, 4%
43. Banan
44. Avokado, färsk
45. Gröna bönor/Haricots verts
46. Potatis
47. Vitt ris, alla sorter, okokt
48. Virgin Kokosolja Kallpressad
49. Ananas
50. Laxfilé (Pacific brand)
51. Bladspenat
52. Grapefrukt
53. Kakaopulver
54. Honung
55. Havregryn
56. Röd paprika
57. Nötfärs, Finmalen, Fetthalt 12%
58. Grekisk yoghurt, 0% fett
59. Citron
60. Mandeldryck, naturell, osötad
61. Lättmjölk, 0.5% fett, laktosfri
62. Nötfärs, 3-7% fett, rå
63. Mellanmjölk, 1.5% fett, laktosfri
64. Blåbär
65. Mandelsmör, 100% mandlar
66. Havregryn, Gyllenhammar
67. MCT olja
68. Kimchi
69. Mellanmjölk, 1.5% fett
70. Kycklingbröstfilé, grillad/stekt
71. Mager ost, 11% fett, valfri
72. Majonnäs (Hellmann's)
73. Riskaka
74. Tonfisk, i vatten, konserverad
75. Sej/Alaska pollock, utan skinn
76. Maxi Pack (yogur)

### What Needs To Be Done NEXT
1. **Cross-reference** all 76 ingredients against existing `foods` table in Supabase (200+ foods already seeded). Many common ones (Ägg, Gurka, Tomat, Potatis, Kyckling, Olivolja, Banan, etc.) likely already exist
2. **Calculate per-100g macros** for each missing ingredient using the kcal data from the recipes (kcal / amount_g * 100)
3. **Build ONE SQL migration script** (migration #00014) that:
   - INSERTs all missing ingredients into `foods` table
   - INSERTs all 71 unique recipes into `recipes` table (needs coach_id — query it from profiles where role='coach')
   - INSERTs all recipe_ingredients linking each recipe to its foods with correct amount_g and sort_order
4. **Open the SQL in Notepad** for the user to copy/paste into Supabase SQL Editor
5. **User uploads recipe images manually later** (images not transferred, only data)
6. **Deploy** — recipes will appear on the site immediately after SQL runs

### Key Data File
- **Full recipe data JSON**: `C:\Users\danth\Desktop\Possible ZENFIT\zenfit-recipes-extracted.json`
- Contains all 75 entries (76 raw minus 1 merged during extraction), 4 more to remove as duplicates = 71 final unique recipes
- Each entry has: number, name, macros, total_weight_g, total_kcal, instructions, prep/cook time, tags, type, ingredients array

### Database Schema for Recipes (for reference)
```sql
-- recipes table
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  name_sv TEXT,
  total_calories NUMERIC,
  total_protein NUMERIC,
  total_carbs NUMERIC,
  total_fat NUMERIC,
  tags TEXT[],
  instructions TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER DEFAULT 1,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- recipe_ingredients table
CREATE TABLE recipe_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  amount_g NUMERIC NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- foods table
CREATE TABLE foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_sv TEXT,
  calories_per_100g NUMERIC,
  protein_per_100g NUMERIC,
  carbs_per_100g NUMERIC,
  fat_per_100g NUMERIC,
  category TEXT
);
```

### Tag Mapping (Zenfit → Our system)
Zenfit meal type tags map to our recipe tags array:
- Frukost → breakfast
- Lunch → lunch  
- Middag → dinner
- Mellanmål → snack
Zenfit "Typ" tags (Bodybuilding, Enkla måltider, Sallad, Fingermat, etc.) can be stored as additional tags.

## What's NOT Built Yet
- Leads management system (Alla, Ny, Kontaktad, Pausad, Vunnen, Forlorad)
- Multi-coach support
- Progress photo upload from client check-in (placeholder exists in Framsteg tab)
- Before/after photo comparison viewer
- Weight/measurements charts (recharts ready but not implemented)
- Mobile app (PWA or native) -- clients use browser for now
- Custom domain (using team-possible.vercel.app)
- English language toggle
- Advanced exercise progression tracking (PB, 1RM calculations)
- Client-facing content/lessons viewer in portal (backend ready, portal route needed)
- Functional client list filter tabs (Nyligen Startat, Ny Check-In, Missad Check-In -- tabs shown but not wired)
- Functional client list search (search input shown but not wired to filtering)
