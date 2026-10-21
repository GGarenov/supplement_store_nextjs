"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

import { Prisma } from "@/generated/prisma/client";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  loginSchema,
  registerSchema,
  safeCallbackUrl,
  type LoginValues,
  type RegisterValues,
} from "@/lib/validators/auth";

/** What a form action returns when it doesn't redirect. */
export type AuthFormState<Field extends string> = {
  error?: string;
  fieldErrors?: Partial<Record<Field, string>>;
};

const GENERIC_ERROR = "Something went wrong. Please try again.";
const EMAIL_TAKEN = "An account with this email already exists.";

/**
 * Signs in with email and password. On success signIn() throws a redirect
 * (to `callbackUrl`), which must not be caught here.
 */
export async function loginUser(
  values: LoginValues,
  callbackUrl?: string,
): Promise<AuthFormState<keyof LoginValues>> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { error: "Enter your email and password." };

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeCallbackUrl(callbackUrl),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Don't say which of the two was wrong.
      if (error.type === "CredentialsSignin")
        return { error: "Invalid email or password." };
      console.error("loginUser:", error);
      return { error: GENERIC_ERROR };
    }
    throw error; // the success redirect
  }
  return {};
}

/** Creates a credentials account, then signs the new user in. */
export async function registerUser(
  values: RegisterValues,
  callbackUrl?: string,
): Promise<AuthFormState<keyof RegisterValues>> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: AuthFormState<keyof RegisterValues>["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof RegisterValues;
      fieldErrors[field] ??= issue.message;
    }
    return { fieldErrors };
  }
  const { name, email, password } = parsed.data;

  try {
    if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
      return { fieldErrors: { email: EMAIL_TAKEN } };
    }
    await db.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(password, 10) },
    });
  } catch (error) {
    // Two sign-ups with the same email at the same moment: the unique index wins.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { fieldErrors: { email: EMAIL_TAKEN } };
    }
    console.error("registerUser:", error);
    return { error: GENERIC_ERROR };
  }

  return loginUser({ email, password }, callbackUrl);
}

export async function signInWithGoogle(callbackUrl?: string) {
  await signIn("google", { redirectTo: safeCallbackUrl(callbackUrl) });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/" });
}
