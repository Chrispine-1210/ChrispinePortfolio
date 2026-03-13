import { z } from "zod";

// Form validation schemas
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .min(1, "Email is required");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/[0-9]/, "Must contain number");

export const newsletterSchema = z.object({
  email: emailSchema,
  name: z.string().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: emailSchema,
  message: z.string().min(10, "Message must be at least 10 characters"),
  projectType: z.string().optional(),
  preferredContact: z.string().optional(),
});

export const blogSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  premium: z.boolean().optional(),
});

// Validation helper
export function validateForm<T>(schema: z.ZodSchema, data: unknown): { data?: T; errors?: Record<string, string> } {
  try {
    const validated = schema.parse(data);
    return { data: validated as T };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      err.errors.forEach((error) => {
        const path = error.path.join(".");
        errors[path] = error.message;
      });
      return { errors };
    }
    return { errors: { general: "Validation failed" } };
  }
}
