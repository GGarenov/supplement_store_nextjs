"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { registerUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { registerSchema, type RegisterValues } from "@/lib/validators/auth";

import { FormField } from "./form-field";

export function RegisterForm({ callbackUrl }: { callbackUrl?: string }) {
  const [formError, setFormError] = useState<string>();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  // On success the action signs the user in and redirects.
  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    const result = await registerUser(values, callbackUrl);
    if (result.error) setFormError(result.error);
    // Errors the server found (e.g. email taken) appear under their fields.
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      form.setError(
        field as keyof RegisterValues,
        { message },
        { shouldFocus: true },
      );
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormField
          control={form.control}
          name="name"
          label="Name"
          autoComplete="name"
        />
        <FormField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <FormField
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
        />
        {formError && (
          <p role="alert" className="text-destructive text-sm">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </FieldGroup>
    </form>
  );
}
