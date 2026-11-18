// Intent-only public route loading. Never prefetch authenticated records or third-party media.
const loaders: Record<string, () => Promise<unknown>> = {
  "/journey": () => import("@/pages/EngineeringJourney"),
  "/portfolio": () => import("@/pages/PortfolioAdvanced"),
  "/blog": () => import("@/pages/Blog"),
  "/about": () => import("@/pages/About"),
  "/hire": () => import("@/pages/HireMe"),
};
const pending = new Set<string>();
export function preloadPublicRoute(path: string) {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (
    connection?.saveData ||
    ["slow-2g", "2g"].includes(connection?.effectiveType ?? "") ||
    !loaders[path] ||
    pending.has(path)
  )
    return;
  pending.add(path);
  void loaders[path]().catch(() => pending.delete(path));
}
