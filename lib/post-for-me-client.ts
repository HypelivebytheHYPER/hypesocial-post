import PostForMe from "post-for-me";

/**
 * Shared Post For Me SDK client.
 *
 * Auto-reads from environment variables:
 * - POST_FOR_ME_API_KEY (required)
 * - POST_FOR_ME_BASE_URL (defaults to https://api.postforme.dev)
 *
 * Features:
 * - Authorization: Bearer handled automatically
 * - 2 retries with exponential backoff on 429/5xx
 * - Typed responses and errors
 */
export const pfm = new PostForMe();
