# vercel-baml-esm-error

## Overview

Reproduction repository for BAML ESM compatibility issues when deploying TanStack Start + Nitro to Vercel.

## Package Manager

This project uses **pnpm**.

## Commands

```bash
pnpm install        # Install dependencies
pnpm dev            # Start dev server (http://localhost:3000)
pnpm build          # Build for production
pnpm preview        # Preview production build
pnpm baml:generate  # Generate BAML client
```

## Tech Stack

### Core
- **TanStack Start** - Full-stack SSR framework
- **TanStack Router** - Type-safe file-system routing
- **Vite 8** - Build tool
- **Nitro 3.0** - Server deployment adapter

### AI
- **BAML** - BoundaryML AI function definitions
- **Vercel AI SDK** - AI streaming

### UI
- **Tailwind CSS 4.1** - Utility-first CSS

## Project Structure

```
├── baml_src/             # BAML configuration
├── src/
│   ├── routes/           # File-system routes
│   │   ├── index.tsx     # Home page (BAML test)
│   │   └── api/chat/     # Streaming API endpoint
│   └── lib/              # Utilities
└── vite.config.ts        # Vite + Nitro config
```

## The Issue

When deploying to Vercel, BAML causes ESM errors:

```
__filename is not defined in ES module scope
```

This happens because:
1. Nitro bundles server code as ESM
2. BAML uses native Node.js modules expecting CommonJS
3. The bundled ESM code references `__filename`/`__dirname` which don't exist in ESM

## Development Guidelines

### Path Aliases
- `~/` points to `src/` directory

### Styling
- Use Tailwind CSS
- Use shadcn/ui CSS variables

## Environment Variables

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
```
