import type { DefaultSession } from "next-auth";

import type { Role } from "@/generated/prisma/enums";

// Adds the user's id and role to the session and the JWT (see callbacks in src/lib/auth.ts).
declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
  }
}

// next-auth/jwt re-exports this module, so the JWT type has to be extended here.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
