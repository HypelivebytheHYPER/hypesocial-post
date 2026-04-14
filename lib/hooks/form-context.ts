"use client";

import { createFormHookContexts } from "@tanstack/react-form";

/**
 * Field and form contexts for the app-wide TanStack Form setup.
 *
 * Kept in its own module so that `components/ui/form.tsx` can consume
 * `useFieldContext` without creating a cycle with `use-app-form.tsx`,
 * which registers those form components as pre-bound field components.
 */
export const {
  fieldContext,
  formContext,
  useFieldContext,
  useFormContext,
} = createFormHookContexts();
