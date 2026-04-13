# Figma MCP Server - Official Setup Guide

Based on [Figma's Official MCP Documentation](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server)

## Overview

The Figma MCP server helps developers explore and implement designs quickly:
- Generate code from selected Figma frames
- Get design context and code from Figma files
- Write directly to Figma canvas (remote server only)
- Capture live UI from browser to Figma (remote server only)

## Server Types

### Remote MCP Server (Preferred)
- **URL:** `https://mcp.figma.com/mcp`
- **Features:** All features including write to canvas, code to canvas
- **Setup:** Requires Figma API token

### Desktop MCP Server
- **Runs locally** through Figma Desktop App
- **Use case:** Organizations/enterprises with specific requirements
- **Limitations:** Fewer features than remote server

## Cursor IDE Setup

### Step 1: Get Figma API Token

1. Go to [Figma Settings](https://www.figma.com/settings)
2. Scroll to **Personal access tokens**
3. Click **Create new token**
4. Copy the token

### Step 2: Add Environment Variable

```bash
# Add to your shell profile (.zshrc, .bashrc, etc.)
export FIGMA_API_TOKEN="your_token_here"
```

### Step 3: Cursor MCP Configuration

The `.cursor/mcp.json` is already configured in this project.

### Step 4: Restart Cursor

1. Close Cursor completely
2. Reopen Cursor
3. The Figma MCP server will start automatically

## Usage

### Get Design Context from Figma

1. **In Figma:** Select a frame or layer
2. **Copy the URL** from browser address bar
3. **In Cursor:** Paste URL and prompt:

```
Generate code for this Figma design: [paste URL]
```

### Send Live UI to Figma (Remote Server Only)

1. Start your Next.js dev server: `npm run dev`
2. In Cursor, prompt: `Capture my localhost UI and send to Figma`
3. Follow the steps to capture pages/elements
4. Get a link to the generated Figma file

## Project Configuration

Next.js is configured to load images from Figma MCP in `next.config.ts`.

## Resources

- [Official Figma MCP Docs](https://help.figma.com/hc/en-us/articles/32132100833559)
- [Figma MCP Tools Reference](https://help.figma.com/hc/en-us/articles/32132100833559#tools)
