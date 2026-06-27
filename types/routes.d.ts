/**
 * Conexiaa Application Route Type Definitions
 *
 * Provides compile‑time safety for all internal navigation paths.
 * Used by the navigation sidebar, breadcrumbs, and any `router.push` calls.
 */

// ─── Atomic route segments (each page in the App Router) ────────────────
type LandingRoute = "/";
type DashboardRoute = "/dashboard";
type DashboardAnalyticsRoute = "/dashboard/analytics";
type ChatRoute = "/chat";
type ChannelsRoute = "/channels";
type AiBridgeRoute = "/ai-bridge";
type LoginRoute = "/auth/login";
type RegisterRoute = "/auth/register";

// ─── Union of all valid application routes ──────────────────────────────
export type AppRoute =
  | LandingRoute
  | DashboardRoute
  | DashboardAnalyticsRoute
  | ChatRoute
  | ChannelsRoute
  | AiBridgeRoute
  | LoginRoute
  | RegisterRoute;

// ─── Route metadata for navigation components ───────────────────────────
export interface RouteInfo {
  path: AppRoute;
  label: string;
  /** Optional icon name (matches Lucide icon component name) */
  icon?: string;
  description?: string;
  /** Children routes for nested navigation */
  children?: RouteInfo[];
}

// ─── Main navigation configuration (typed, can be imported directly) ────
export const MAIN_ROUTES: RouteInfo[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
    description: "Overview & analytics",
    children: [
      {
        path: "/dashboard/analytics",
        label: "Analytics",
        icon: "TrendingUp",
        description: "Channel & response metrics",
      },
    ],
  },
  {
    path: "/chat",
    label: "Chat",
    icon: "MessageSquare",
    description: "Unified conversation thread",
  },
  {
    path: "/channels",
    label: "Channels",
    icon: "Radio",
    description: "Manage SMS, Social, Voice",
  },
  {
    path: "/ai-bridge",
    label: "AI Bridge",
    icon: "Zap",
    description: "Test Featherless & ElevenLabs",
  },
] as const satisfies readonly RouteInfo[];

// ─── Auth routes (used separately) ──────────────────────────────────────
export const AUTH_ROUTES: RouteInfo[] = [
  { path: "/auth/login", label: "Sign In", icon: "LogIn" },
  { path: "/auth/register", label: "Register", icon: "UserPlus" },
];

// ─── Type guard to check if an unknown string is a valid route ──────────
export function isAppRoute(path: string): path is AppRoute {
  return (
    path === "/" ||
    path === "/dashboard" ||
    path === "/dashboard/analytics" ||
    path === "/chat" ||
    path === "/channels" ||
    path === "/ai-bridge" ||
    path === "/auth/login" ||
    path === "/auth/register"
  );
}