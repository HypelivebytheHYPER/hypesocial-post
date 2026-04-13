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

/**
 * Fetch full social account details from Post For Me API
 * Use when webhook only sends ID reference
 */
export async function getSocialAccount(accountId: string): Promise<{
  id: string;
  platform: string;
  username: string | null;
  user_id: string;
  profile_photo_url: string | null;
  status: string;
  external_id: string | null;
  [key: string]: unknown;
} | null> {
  try {
    const response = await pfm.get(`/v1/social-accounts/${accountId}`);
    return response as {
      id: string;
      platform: string;
      username: string | null;
      user_id: string;
      profile_photo_url: string | null;
      status: string;
      external_id: string | null;
      [key: string]: unknown;
    };
  } catch (error) {
    console.error("[PFM] Failed to fetch social account:", accountId, error);
    return null;
  }
}
