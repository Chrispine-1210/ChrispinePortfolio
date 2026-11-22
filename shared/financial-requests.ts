export const financialRequestKeyPattern = /^[A-Za-z0-9_-]{20,100}$/;
export function isFinancialWrite(method: string, url: string) {
  const path = url.split("?")[0].replace(/\/+$/, "");
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase()) &&
    (/^\/api\/admin\/(revenue|capital|treasury)(\/|$)/.test(path) ||
      /^\/api\/admin\/acquisition\/spend(\/|$)/.test(path));
}

// JSON values only. Property order must not create another financial operation.
export function canonicalRequestJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return "[" + value.map(canonicalRequestJson).join(",") + "]";
  return "{" + Object.entries(value).filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([k, v]) => JSON.stringify(k) + ":" + canonicalRequestJson(v)).join(",") + "}";
}
