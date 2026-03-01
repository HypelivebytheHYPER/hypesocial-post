# AI Integration - Post For Me MCP

This project includes AI-powered posting capabilities through the **Model Context Protocol (MCP)**.

## What is MCP?

The Model Context Protocol (MCP) enables AI assistants like Claude Desktop, Cursor, or VS Code to interact with the Post For Me API using natural language commands.

## Setup

The MCP server is already configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "post_for_me_api": {
      "command": "npx",
      "args": ["-y", "post-for-me-mcp"],
      "env": {
        "POST_FOR_ME_API_KEY": "${POST_FOR_ME_API_KEY}"
      }
    }
  }
}
```

### Requirements

1. **API Key** - Get your API key from the Post For Me dashboard
2. **Compatible AI Client** - Claude Desktop, Cursor, or VS Code with MCP support
3. **Node.js** - For running the MCP server

### Installation

1. Set your API key as an environment variable:

   ```bash
   export POST_FOR_ME_API_KEY="your_api_key_here"
   ```

2. The MCP server will be installed automatically when you use AI features

## Usage Examples

Once connected, you can ask your AI assistant to:

### Posting

- "Schedule a post for Instagram next Tuesday at 9 AM"
- "Post this image to Facebook and Twitter"
- "Create a draft post about our product launch"

### Analytics

- "Check the analytics for my last YouTube video"
- "Show me engagement stats for last week's posts"
- "Which platform performed best this month?"

### Account Management

- "List all my connected accounts"
- "Check if my Instagram connection is working"
- "What's the status of my scheduled posts?"

## How It Works

1. **Docs Search** - The AI searches Post For Me documentation to understand the API
2. **Code Generation** - The AI generates TypeScript SDK code to execute your request
3. **Sandboxed Execution** - Code runs in a secure environment with your API key
4. **Results** - You see the results directly in your AI chat

## Security Considerations

⚠️ **Important Security Notes:**

- The AI receives **full access** to all connected social accounts
- The AI can query social data, publish posts, and delete scheduled content
- There are **no user-level restrictions** - the AI uses your admin API key
- Only use this feature in trusted environments
- Be careful with the prompts you provide to the AI

## Features Available via AI

| Feature        | Natural Language Example                          |
| -------------- | ------------------------------------------------- |
| Create Post    | "Post 'Hello world' to Twitter"                   |
| Schedule Post  | "Schedule an Instagram post for tomorrow at 2 PM" |
| View Analytics | "Show me last week's engagement stats"            |
| List Accounts  | "What accounts do I have connected?"              |
| Check Feed     | "Show my recent TikTok posts"                     |
| Delete Post    | "Delete the draft post about the sale"            |

## Troubleshooting

### MCP Server Not Found

Make sure you have the Post For Me MCP package installed:

```bash
npx -y post-for-me-mcp@latest
```

### API Key Issues

Ensure your `POST_FOR_ME_API_KEY` environment variable is set correctly.

### AI Doesn't Understand

Be specific with your requests. Instead of "post this," say "post this content to my connected Instagram account."

## Resources

- [Post For Me MCP Documentation](https://www.postforme.dev/resources/let-ai-post-for-you)
- [Post For Me API Docs](https://api.postforme.dev/docs)
- [MCP Specification](https://modelcontextprotocol.io/)
