# HypePostSocial

Social Media Management Platform built with Next.js 16, React 19, and Post For Me API.

## Features

- Multi-platform social media posting (X, Facebook, Instagram, LinkedIn, etc.)
- Content calendar and scheduling
- Analytics and reporting
- Media upload and management
- Team collaboration

## Tech Stack

- **Framework**: Next.js 16.1.6 with App Router
- **React**: 19.2.4 with Server Components
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Auth**: NextAuth.js v5
- **API**: Post For Me MCP SDK

## Post For Me MCP Integration

This project uses the `post-for-me-mcp` package for social media API operations.

### Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Add your Post For Me API key to `.env.local`:
   ```
   POSTFORME_API_KEY=your_api_key
   ```

### MCP Server Configuration

The MCP servers are configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "post_for_me_api": {
      "command": "npx",
      "args": ["-y", "post-for-me-mcp"],
      "env": {
        "POSTFORME_API_KEY": "${POSTFORME_API_KEY}"
      }
    },
    "shadcn_ui": {
      "command": "npx",
      "args": ["-y", "@magnusrodseth/shadcn-mcp-server"]
    }
  }
}
```

## shadcn/ui MCP Integration

This project includes `@magnusrodseth/shadcn-mcp-server` for AI-powered component generation.

### Available Tools

- `list_components` - List all available shadcn/ui components
- `get_component` - Get source code and examples for a specific component
- `list_blocks` - List available shadcn/ui blocks
- `get_block` - Get source code for a specific block

### Usage

Ask your AI assistant to fetch component code:

- "Add a button component with loading state"
- "Create a data table with sorting and pagination"
- "Build a dialog form with validation"

## Development

```bash
# Run dev server with Turbopack
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint

# Testing
pnpm test
```

## Project Structure

```
app/              # Next.js App Router
  (dashboard)/    # Dashboard route group
  api/            # API routes
  actions/        # Server Actions
components/       # React components
  ui/             # shadcn/ui components
lib/              # Utility functions
  api/            # API clients
  db/             # Database operations
  hooks/          # Custom React hooks
public/           # Static assets
types/            # TypeScript types
```

## Debugging

### VS Code + Chrome DevTools Setup

1. **Install Chrome Launcher**:

   ```bash
   pnpm add -D chrome-launcher
   ```

2. **VS Code Launch Configurations** (`.vscode/launch.json`):
   - `Next.js: debug` - Start dev server with Chrome debugging
   - `Next.js: debug full stack` - Debug server-side code
   - `Next.js: attach to Chrome` - Attach to running Chrome instance

3. **React Developer Tools** (Chrome Extension):
   - Install from [Chrome Web Store](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
   - Press `F12` or `Cmd+Option+I` to open DevTools
   - Look for the ⚛️ Components and ⚛️ Profiler tabs

4. **Start Debugging in VS Code**:
   - Press `F5` or go to Run > Start Debugging
   - Select "Next.js: debug" configuration
   - Chrome will open automatically with DevTools attached

### Debug Scripts

```bash
# Debug with inspect flag
pnpm dev:debug

# Attach debugger to Node.js
node --inspect node_modules/.bin/next dev
```

## License

Private - Hypelive Projects
