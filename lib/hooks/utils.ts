/**
 * Hook utilities for error handling
 * @module lib/hooks/utils
 */

import { toast } from "sonner";

/**
 * Default error handler for mutations.
 * Shows toast notification on error.
 */
export function handleMutationError(error: Error, context?: string) {
  const message = context 
    ? `${context}: ${error.message}` 
    : error.message;
  
  console.error("[Mutation Error]", error);
  toast.error(message);
}

/**
 * Default success handler for mutations.
 * Shows toast notification on success.
 */
export function handleMutationSuccess(message: string) {
  toast.success(message);
}
