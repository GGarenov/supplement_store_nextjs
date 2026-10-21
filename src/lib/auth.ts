import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validators/auth";

/** Google login is offered only when its credentials are configured. */
export const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

const providers: NextAuthConfig["providers"] = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const user = await db.user.findUnique({
        where: { email: parsed.data.email },
      });
      // Users who signed up with Google have no password and can't log in this way.
      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(
        parsed.data.password,
        user.passwordHash,
      );
      if (!valid) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      };
    },
  }),
];

if (googleEnabled) {
  providers.push(
    // Reads AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET. Google verifies email addresses,
    // so it's safe to link a Google login to an existing account with the same email.
    Google({ allowDangerousEmailAccountLinking: true }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // The adapter stores OAuth users and accounts. Its types expect the classic
  // @prisma/client; our client is generated into src/generated/prisma instead.
  adapter: PrismaAdapter(db as unknown as Parameters<typeof PrismaAdapter>[0]),
  // The Credentials provider only works with JWT sessions (no Session rows).
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    // Runs on sign-in (with `user`) and on every session read (without it).
    // The role is copied once at sign-in, so a role change applies after the next login.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role ?? "USER";
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
    // Used by src/proxy.ts. Pages and Server Actions check again (see auth-guards.ts).
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/admin")) {
        if (!auth) return false; // → /login?callbackUrl=…
        return auth.user.role === "ADMIN"
          ? true
          : Response.redirect(new URL("/", request.nextUrl));
      }
      if (pathname.startsWith("/account")) return Boolean(auth);
      return true;
    },
  },
});
