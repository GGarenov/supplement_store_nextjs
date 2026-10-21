import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-4 px-4 py-12">
      <h1 className="text-4xl font-bold tracking-wide uppercase">
        About Healthy Street
      </h1>
      <p className="text-muted-foreground">
        Healthy Street is a demo online store for sports supplements, built to
        practise full-stack development with Next.js, React, PostgreSQL, Prisma,
        Auth.js and Stripe.
      </p>
      <p className="text-muted-foreground">
        It is not a real shop. No products are sold or shipped, and all payments
        run in Stripe test mode, so no real money is ever charged.
      </p>
    </section>
  );
}
