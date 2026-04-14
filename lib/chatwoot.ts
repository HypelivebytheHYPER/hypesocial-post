/**
 * Chatwoot API Channel Integration
 * https://www.chatwoot.com/docs/product/channels/api/
 */

// Environment variables are accessed via process.env

export interface ChatwootConfig {
  channelName: string;
  inboxId: string;
  accountId: string;
  apiToken: string;
  webhookUrl?: string;
  chatwootUrl: string;
}

export interface ChatwootMessage {
  event: "message_created" | "message_updated" | "conversation_created" | "conversation_status_changed";
  data: {
    id: number;
    content: string;
    message_type: "incoming" | "outgoing";
    content_type: string;
    private: boolean;
    sender: {
      id: number;
      name: string;
      email?: string;
      avatar_url?: string;
    };
    conversation: {
      id: number;
      status: "open" | "resolved" | "pending";
      contact_inbox: {
        source_id: string;
      };
    };
    created_at: string;
  };
}

export interface ChatwootContact {
  email?: string;
  name?: string;
  phone_number?: string;
  identifier?: string;
  avatar_url?: string;
}

/**
 * Send a message to Chatwoot via API Channel
 * https://www.chatwoot.com/developers/api/#operation/create-a-message
 */
export async function sendMessageToChatwoot(
  config: ChatwootConfig,
  conversationId: number,
  message: string,
  messageType: "incoming" | "outgoing" = "incoming"
): Promise<void> {
  const url = `${config.chatwootUrl}/api/v1/accounts/${config.accountId}/conversations/${conversationId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Access-Token": config.apiToken,
    },
    body: JSON.stringify({
      content: message,
      message_type: messageType,
      private: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chatwoot API error: ${response.status} ${response.statusText}`);
  }
}

/**
 * Create a new conversation in Chatwoot
 */
export async function createConversation(
  config: ChatwootConfig,
  sourceId: string,
  contact: ChatwootContact
): Promise<number> {
  const url = `${config.chatwootUrl}/api/v1/accounts/${config.accountId}/conversations`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Access-Token": config.apiToken,
    },
    body: JSON.stringify({
      inbox_id: parseInt(config.inboxId),
      contact_id: contact.identifier,
      source_id: sourceId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create conversation: ${response.status}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Create or update a contact in Chatwoot
 */
export async function createContact(
  config: ChatwootConfig,
  contact: ChatwootContact
): Promise<number> {
  const url = `${config.chatwootUrl}/api/v1/accounts/${config.accountId}/contacts`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Access-Token": config.apiToken,
    },
    body: JSON.stringify({
      email: contact.email,
      name: contact.name || "Anonymous",
      phone_number: contact.phone_number,
      identifier: contact.identifier,
      avatar_url: contact.avatar_url,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create contact: ${response.status}`);
  }

  const data = await response.json();
  return data.payload.contact.id;
}

/**
 * Verify webhook signature from Chatwoot
 */
export function verifyWebhookSignature(
  _payload: string,
  _signature: string,
  _secret: string
): boolean {
  // Chatwoot doesn't sign webhooks by default, but you can add custom validation
  // This is a placeholder for future implementation
  return true;
}

/**
 * Generate a unique source ID for a user
 */
export function generateSourceId(userId: string): string {
  return `hypesocial-${userId}-${Date.now()}`;
}

/**
 * Parse incoming Chatwoot webhook
 */
export function parseWebhookPayload(body: unknown): ChatwootMessage | null {
  if (!body || typeof body !== "object") return null;
  
  const payload = body as Partial<ChatwootMessage>;
  
  if (!payload.event || !payload.data) return null;
  
  return payload as ChatwootMessage;
}
