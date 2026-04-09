# POSSIBLE - Fitness Coaching Platform - Complete Summary

## What This Is
A fitness coaching platform built for one coach (Alice) and her 24+ Swedish/Nordic clients. Replaces zenfit.io with a custom platform. Brand: "Possible". Baby blue + white theme. Swedish UI.

## Tech Stack
- **Next.js 16.2.3** (App Router, TypeScript, `proxy.ts` instead of `middleware.ts`)
- **Supabase** (PostgreSQL, Auth, Storage, RLS)
- **Tailwind CSS 4** (custom `@theme inline` tokens)
- **@dnd-kit** (drag-and-drop in workout + meal plan builders)
- **Vercel** hosting at `team-possible.vercel.app`
- **GitHub**: github.com/Milotheoneandonly/TeamPossible

## Supabase Config
- URL: `https://yqfliqqwwqjsitaolias.supabase.co`
- Storage buckets: `avatars` (public), `progress-photos` (private), `exercise-media` (public), `recipe-images` (public)
- Auth: email/password, custom access token hook for role in JWT
- Build uses `--webpack` flag (Turbopack blocked on this machine)

## Database (20+ tables)
- `profiles` (extends auth.users — role: coach/client, name, email, avatar_url, locale: sv)
- `clients` (coach_id, status, goals, dietary_preferences[], allergies[], height, target_weight)
- `exercises` (name, name_sv, video_url, muscle_groups[], equipment[], difficulty)
- `exercise_categories` (name, name_sv)
- `workout_plans` (coach_id, client_id nullable, is_template, is_active)
- `workout_days` (plan_id, day_number, name, sort_order)
- `workout_exercises` (day_id, exercise_id, sets, reps, rest_seconds, tempo, notes, superset_group)
- `workout_logs` + `workout_log_sets` (client workout logging)
- `foods` (name, name_sv, macros per 100g, category — 150+ Swedish foods seeded)
- `recipes` (coach_id, name, macros, tags[], instructions, prep_time)
- `recipe_ingredients` (recipe_id, food_id, amount_g)
- `meal_plans` (coach_id, client_id nullable, is_template, target macros)
- `meal_plan_days` → `meals` → `meal_items` (food OR recipe per item)
- `check_in_templates` → `check_in_questions` → `check_ins` → `check_in_responses`
- `progress_entries` (weight, measurements, energy, stress, sleep, steps)
- `progress_photos` (storage_path, photo_type: front/side/back)
- `messages` (simple inbox, not real-time)

## RLS Security
- `is_coach()` and `my_client_id()` SQL helper functions
- Coach: full CRUD on everything
- Client: read own data, write own check-ins/progress/workout logs/messages

## All Routes (32 total)

### Public
- `/` — Landing page (hero, features, testimonials, CTA, footer)
- `/login` — Email/password login

### Coach (`/(coach)` group with sidebar)
- `/dashboard` — Stats cards, recent check-ins, recent clients with avatars
- `/clients` — Table: Namn, Vecka, Check-in, Scheman, Meddelanden
- `/clients/invite` — Add client (creates auth account, shows temp password)
- `/clients/[id]` — Overview: weight diff, check-in countdown, kostschema, träning cards
- `/clients/[id]/naring` — Client's assigned meal plans (table with delete)
- `/clients/[id]/traning` — Client's assigned workout programs (table with delete)
- `/clients/[id]/framsteg` — Check-in summary, body stats, weight history, measurements, check-in history
- `/foods` — **Näring** hub with 3 tabs: Mallar, Recept, Livsmedel
- `/foods/new-recipe` — Recipe creator with ingredient search + auto macro calc
- `/foods/new-food` — Add custom food/ingredient
- `/meal-plans/new` — Create kostplan (auto-creates 7 days + 5 meal types)
- `/meal-plans/[id]` — Meal plan editor (add recipes to meal slots, drag to reorder, add extra meals)
- `/workouts` — **Träning** hub with 2 tabs: Mallar, Övningar
- `/workouts/new` — Create workout program with custom days
- `/workouts/new-exercise` — Add exercise (muscles, equipment, difficulty, YouTube URL, notes)
- `/workouts/[id]` — Workout builder (sidebar exercise picker, drag-and-drop, inline Set/Vikt/Reps/Vila editing, YouTube video popup)
- `/check-ins` — Pending + reviewed check-ins
- `/messages` — Message center with unread badges

### Client (`/(client)` group with bottom nav, all under `/portal/`)
- `/portal` — Home: greeting, latest weight, action cards
- `/portal/meals` — Meal plan viewer (days, meals, macros per meal, shopping list link)
- `/portal/meals/shopping-list` — Auto-generated shopping list with checkboxes
- `/portal/workouts` — Workout plan viewer (days, exercises, sets/reps/rest)
- `/portal/workouts/log` — Workout logger (per-set weight/reps input, completion checkmarks)
- `/portal/check-in` — Weekly check-in form (weight, 7 measurements, energy/stress sliders, sleep, notes)
- `/portal/progress` — Weight history, measurements grid, energy/sleep display
- `/portal/messages` — Simple message board with coach

## Key Components
- `Sidebar` — Coach nav (Dashboard, Klienter, Näring, Träning, Check-ins, Meddelanden)
- `BottomNav` — Client mobile nav (Hem, Kost, Träning, Framsteg, Meddelanden)
- `AvatarUpload` — Click-to-upload profile photo (Supabase Storage)
- `AvatarCircle` — Reusable avatar display (photo or initials fallback, 5 sizes)
- `ExerciseEditModal` — Edit exercise (muscles, equipment, difficulty, video URL, delete)
- `VideoModal` — Embedded YouTube/Vimeo player popup
- `SortableExerciseRow` — Draggable exercise in workout builder
- `SortableMealCard` — Draggable meal slot in kostplan editor
- `DeleteMealPlanButton` / `DeleteWorkoutPlanButton` / `DeleteClientButton`

## Server Actions
- `src/actions/clients.ts` — getClients, getClient, inviteClient, updateClient, getClientStats
- `src/actions/recipes.ts` — getRecipes, createRecipe, updateRecipe, deleteRecipe, searchRecipes
- `src/actions/meal-plans.ts` — getMealPlanTemplates, getMealPlan, createMealPlan, assignMealPlanToClient, addMealItem, removeMealItem, searchFoods, createFood
- `src/actions/workouts.ts` — getWorkoutPlanTemplates, getWorkoutPlan, createWorkoutPlan, addExerciseToDay, removeExerciseFromDay, updateWorkoutExercise, assignWorkoutPlanToClient, getExercises, getExerciseCategories, createExercise
- `src/actions/delete.ts` — deleteMealPlan, deleteWorkoutPlan, deleteClient

## Design Decisions
- Client routes under `/portal/` to avoid route collisions with coach routes
- `proxy.ts` (not `middleware.ts`) — Next.js 16 breaking change
- No billing/payments — wife uses Swish separately
- No real-time chat — wife uses WhatsApp, messages are simple inbox
- Swedish primary language with English toggle for Icelandic clients
- Templates are DUPLICATED when assigned (original stays intact)
- Meal plans auto-create 7 days × 5 meal types on creation
- Food database seeded with 150+ common Swedish foods + kryddor
- YouTube thumbnails auto-extracted from video URLs

## What's NOT Built Yet
- Leads management system (Alla, Ny, Kontaktad, Pausad, Vunnen, Förlorad)
- Multi-coach support
- Progress photo upload from client check-in
- Before/after photo comparison viewer
- Weight/measurements charts (recharts ready but not implemented)
- Mobile app (PWA or native) — clients use browser for now
- Custom domain (using team-possible.vercel.app)
- English language toggle
- Content/files sharing (PDFs for clients)
- Advanced exercise progression tracking (PB, 1RM calculations)
