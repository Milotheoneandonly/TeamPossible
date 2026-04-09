export const APP_NAME = "Possible";
export const APP_DESCRIPTION = "Din personliga fitness coach";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  AUTH_CALLBACK: "/callback",
  // Coach routes
  COACH_DASHBOARD: "/dashboard",
  COACH_CLIENTS: "/clients",
  COACH_MEAL_PLANS: "/meal-plans",
  COACH_WORKOUTS: "/workouts",
  COACH_EXERCISES: "/exercises",
  COACH_FOODS: "/foods",
  COACH_CHECK_INS: "/check-ins",
  COACH_MESSAGES: "/messages",
  // Client routes (all under /portal)
  CLIENT_PORTAL: "/portal",
  CLIENT_MEALS: "/portal/meals",
  CLIENT_WORKOUTS: "/portal/workouts",
  CLIENT_PROGRESS: "/portal/progress",
  CLIENT_CHECK_IN: "/portal/check-in",
  CLIENT_MESSAGES: "/portal/messages",
} as const;

export const PUBLIC_ROUTES = [ROUTES.HOME, ROUTES.LOGIN, ROUTES.AUTH_CALLBACK];
