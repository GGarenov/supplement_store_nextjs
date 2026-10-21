"use client";

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** A labelled input bound to react-hook-form, with its validation message. */
export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  ...inputProps
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
} & Omit<React.ComponentProps<typeof Input>, "name" | "id">) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input
            id={name}
            aria-invalid={fieldState.invalid}
            {...inputProps}
            {...field}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
