/**
 * Form schemas shared by the login/register forms (client-side validation)
 * and the Server Actions and Credentials provider (the checks that count).
 */
import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be at most 50 characters"),
    email,
    // bcrypt only uses the first 72 bytes, so longer passwords would be silently cut.
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type RegisterValues = z.infer<typeof registerSchema>;

/**
 * Only allows redirects back into this site, so a crafted login link can't
 * send users elsewhere. Auth.js passes absolute URLs ("http://host/account"),
 * so for those only the path is kept: "https://evil.com/x" becomes "/x" here.
 */
export function safeCallbackUrl(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || value === "") return fallback;

  let path = value;
  if (!value.startsWith("/")) {
    try {
      const url = new URL(value);
      path = url.pathname + url.search + url.hash;
    } catch {
      return fallback;
    }
  }
  // "//evil.com" and "/\evil.com" are treated as other hosts by browsers.
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return fallback;
  }
  return path;
}
