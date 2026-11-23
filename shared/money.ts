import { z } from "zod";

// Amounts use the schema's numeric(14,2) boundary. No binary-float decisions.
export const MAX_MONEY_MINOR = 99_999_999_999_999n;
export function moneyMinor(value: string | number): bigint {
  const text = String(value);
  if (!/^-?\d{1,12}(?:\.\d{1,2})?$/.test(text)) throw new Error("Money must be a bounded decimal with at most two fractional digits");
  const negative = text.startsWith("-");
  const [whole, fraction = ""] = text.replace(/^-/, "").split(".");
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (result > MAX_MONEY_MINOR) throw new Error("Money exceeds numeric(14,2)");
  return negative ? -result : result;
}
export function moneyText(minor: bigint): string {
  const absolute = minor < 0n ? -minor : minor;
  return `${minor < 0n ? "-" : ""}${absolute / 100n}.${String(absolute % 100n).padStart(2, "0")}`;
}
export function moneyNumber(minor: bigint): number {
  // Preserve the existing JSON-number contract only within its certified range.
  // Refuse oversized totals instead of silently losing fractional units.
  if (minor > MAX_MONEY_MINOR || minor < -MAX_MONEY_MINOR) throw new Error("Financial aggregate exceeds the supported exact reporting range");
  return Number(moneyText(minor));
}
export function moneySum(values: Iterable<string | number>): number {
  let sum = 0n; for (const value of values) sum += moneyMinor(value);
  return moneyNumber(sum);
}
export const moneyAdd = (a: string | number, b: string | number) => moneySum([a, b]);
export const moneySubtract = (a: string | number, b: string | number) => moneyNumber(moneyMinor(a) - moneyMinor(b));
export const moneyCompare = (a: string | number, b: string | number) => {
  const left = moneyMinor(a), right = moneyMinor(b); return left < right ? -1 : left > right ? 1 : 0;
};
// Explicit half-away-from-zero rounding for an apportioned amount.
export function moneyRatio(value: string | number, numerator: number, denominator: number): number {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || numerator < 0 || denominator <= 0) throw new Error("Invalid monetary apportionment");
  const amount = moneyMinor(value), sign = amount < 0n ? -1n : 1n;
  const product = (amount < 0n ? -amount : amount) * BigInt(numerator), divisor = BigInt(denominator);
  return moneyNumber(sign * ((product * 2n + divisor) / (divisor * 2n)));
}
export function moneyInput(options: { zero?: boolean; signed?: boolean } = {}) {
  return z.union([z.number(), z.string()]).transform((value, context) => {
    try {
      const minor = moneyMinor(value);
      if (!options.signed && minor < 0n || !options.zero && minor === 0n) throw new Error("Money is outside the allowed range");
      return moneyNumber(minor);
    } catch (error) {
      context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Invalid amount" });
      return z.NEVER;
    }
  });
}

export function moneyAverage(a:string|number,b:string|number):number {
  const sum=moneyMinor(a)+moneyMinor(b),sign=sum<0n?-1n:1n,absolute=sum<0n?-sum:sum;
  return moneyNumber(sign*((absolute+1n)/2n));
}
