// These values come from the server's platform environment, never request headers.
// Production still requires an explicit APP_BASE_URL; only Vercel Preview may derive one.
export function trustedPreviewOrigin(
  platform: NodeJS.ProcessEnv,
): string | null {
  if (platform.VERCEL !== "1" || platform.VERCEL_ENV !== "preview") return null;
  const hostname = platform.VERCEL_URL ?? "";
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.vercel\.app$/.test(hostname))
    return null;
  return `https://${hostname}`;
}
