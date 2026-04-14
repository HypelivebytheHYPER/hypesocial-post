"use client";

import { createFormHook } from "@tanstack/react-form";

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { fieldContext, formContext } from "./form-context";

/**
 * App-wide TanStack Form hook with shadcn field primitives pre-bound.
 *
 * Usage:
 *   const form = useAppForm({ defaultValues, validators, onSubmit });
 *   <form.AppField name="email">
 *     {(field) => (
 *       <field.FormItem>
 *         <field.FormLabel>Email</field.FormLabel>
 *         <field.FormControl><Input ... /></field.FormControl>
 *         <field.FormMessage />
 *       </field.FormItem>
 *     )}
 *   </form.AppField>
 */
export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
  },
  formComponents: {},
});

export { useFieldContext, useFormContext } from "./form-context";
