import { z } from "zod";

const optionalNonEmptyString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    ADMIN_AUTH_MODE: z.enum(["temporary", "database"]).default("temporary"),
    DATABASE_URL: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().url().optional(),
    ),
    AUTH_SECRET: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(32, "AUTH_SECRET must contain at least 32 characters").optional(),
    ),
    AUTH_KEY_PEPPER: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(32, "AUTH_KEY_PEPPER must contain at least 32 characters").optional(),
    ),
    ADMIN_EMAIL: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().email().optional(),
    ),
    ADMIN_PASSWORD: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(12, "ADMIN_PASSWORD must contain at least 12 characters").optional(),
    ),
    STRIPE_SECRET_KEY: optionalNonEmptyString,
    STRIPE_WEBHOOK_SECRET: optionalNonEmptyString,
  })
  .superRefine((environment, context) => {
    if (environment.ADMIN_AUTH_MODE === "database") {
      if (!environment.DATABASE_URL) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "DATABASE_URL is required for database authentication",
          path: ["DATABASE_URL"],
        });
      }
      if (!environment.AUTH_KEY_PEPPER) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "AUTH_KEY_PEPPER is required for database authentication",
          path: ["AUTH_KEY_PEPPER"],
        });
      }
    }
    const authValues = [
      environment.AUTH_SECRET,
      environment.ADMIN_EMAIL,
      environment.ADMIN_PASSWORD,
    ];
    const configuredAuthValues = authValues.filter(Boolean).length;
    if (configuredAuthValues !== 0 && configuredAuthValues !== authValues.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "AUTH_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD must be configured together",
        path: ["AUTH_SECRET"],
      });
    }

    const stripeValues = [environment.STRIPE_SECRET_KEY, environment.STRIPE_WEBHOOK_SECRET];
    const configuredStripeValues = stripeValues.filter(Boolean).length;
    if (configuredStripeValues !== 0 && configuredStripeValues !== stripeValues.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must be configured together",
        path: ["STRIPE_SECRET_KEY"],
      });
    }
  });

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(source: NodeJS.ProcessEnv): Environment {
  const result = environmentSchema.safeParse(source);
  if (!result.success) {
    const messages = result.error.issues.map(
      (issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`,
    );
    throw new Error(`Invalid environment configuration:\n${messages.join("\n")}`);
  }
  return result.data;
}

export const env = parseEnvironment(process.env);
