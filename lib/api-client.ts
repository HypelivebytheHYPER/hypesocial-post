/**
 * Shared fetch wrapper for internal Next.js API routes.
 *
 * Single source of truth — used by all client-side hooks
 * (usePostForMe, useMoodboard, etc.).
 *
 * HTTP standards:
 * - Content-Type: application/json only when a body is present
 * - Accept: application/json on all requests
 * - Handles non-JSON error responses (HTML 502, plain text, etc.)
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type when sending a body (POST, PUT, PATCH)
  if (options.body) {
    headers["Content-Type"] ??= "application/json";
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    let message: string;

    if (contentType.includes("application/json")) {
      const error = await response.json().catch(() => ({}));
      message = error.message || error.error || "";
    } else {
      // Handle non-JSON errors (HTML 502 from proxy, plain text, etc.)
      const text = await response.text().catch(() => "");
      message = text.slice(0, 200);
    }

    throw new Error(
      message || `API error: ${response.status} ${response.statusText}`,
    );
  }

  // 204 No Content has no body
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
