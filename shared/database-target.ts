// Keep runtime and operational tools on the same explicit application target.
export function runtimeDatabaseUrl(source: { APP_DATABASE_URL?: string; DATABASE_URL?: string }): string | undefined {
  return source.APP_DATABASE_URL || source.DATABASE_URL || undefined;
}
