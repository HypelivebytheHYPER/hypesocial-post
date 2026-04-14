"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { useStore } from "@tanstack/react-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useFieldContext } from "@/lib/hooks/form-context";

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

function FormItem({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
}

function useFormField() {
  const field = useFieldContext();
  const itemContext = React.useContext(FormItemContext);

  if (!itemContext) {
    throw new Error("useFormField must be used within <FormItem>");
  }

  const errors = useStore(field.store, (state) => state.meta.errors);
  const isTouched = useStore(field.store, (state) => state.meta.isTouched);
  const showError = isTouched && errors.length > 0;

  const { id } = itemContext;

  return {
    id,
    name: field.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    errors,
    showError,
  };
}

function FormLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Label>) {
  const { formItemId, showError } = useFormField();

  return (
    <Label
      data-error={showError}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

function FormControl({
  ...props
}: React.ComponentPropsWithoutRef<typeof Slot>) {
  const { formItemId, formDescriptionId, formMessageId, showError } =
    useFormField();

  return (
    <Slot
      id={formItemId}
      aria-describedby={
        showError
          ? `${formDescriptionId} ${formMessageId}`
          : formDescriptionId
      }
      aria-invalid={showError}
      {...props}
    />
  );
}

function FormDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"p">) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      id={formDescriptionId}
      className={cn("text-xs text-slate-400", className)}
      {...props}
    />
  );
}

function FormMessage({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"p">) {
  const { formMessageId, errors, showError } = useFormField();

  const body = showError
    ? extractErrorMessage(errors[0]) ?? children
    : children;

  if (!body) return null;

  return (
    <p
      id={formMessageId}
      className={cn(
        "text-xs font-medium text-destructive text-red-600",
        className
      )}
      {...props}
    >
      {body}
    </p>
  );
}

function extractErrorMessage(error: unknown): string | undefined {
  if (!error) return undefined;
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }
  return undefined;
}

export {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
};
