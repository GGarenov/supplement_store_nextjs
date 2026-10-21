import "dotenv/config";

import { defineConfig } from "prisma/config";

// Migrations need a direct (non-pooled) connection; see .env.example.
// It's optional here so `prisma generate` works before a database exists.
const directUrl = process.env.DIRECT_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  ...(directUrl && { datasource: { url: directUrl } }),
});
