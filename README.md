# vercel-baml-esm-error

> **Reproduction of BAML ESM error when deploying TanStack Start to Vercel**

This repository demonstrates an ESM compatibility issue when deploying a TanStack Start application with BAML (BoundaryML) to Vercel.

## The Problem

When deploying to Vercel, the runtime fails with ESM-related errors. BAML uses native Node.js modules that are incompatible with ESM bundling in the Nitro server environment.

### Error Example

```
ReferenceError: __filename is not defined in ES module scope
    at file:///var/task/chunks/_/router-xxx.mjs:23:26
```

### Root Cause

- BAML's `native.js` uses `require = createRequire(__filename)`
- `__filename` doesn't exist in ESM modules
- Nitro bundled BAML as ESM instead of externalizing it

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | [TanStack Start](https://tanstack.com/start) | v1.149+ |
| Router | [TanStack Router](https://tanstack.com/router) | v1.147+ |
| Server | [Nitro](https://nitro.unjs.io/) | v3.0 |
| Build Tool | [Vite](https://vitejs.dev/) | v8 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | v4.1 |
| AI | [BAML](https://www.boundaryml.com/) | v0.217 |
| AI SDK | [Vercel AI SDK](https://sdk.vercel.ai/) | v6.0 |

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 10+

### Setup

```bash
# Install dependencies
pnpm install

# Generate BAML client
pnpm run baml:generate

# (Optional) Setup environment variables for AI features
cp .env.example .env
# Edit .env with your API keys
```

### Development

```bash
pnpm dev
```

Visit http://localhost:3000

The home page will display:
- ✅ BAML version (if loaded successfully)
- ✅ Success/failure status
- ❌ Error message (if BAML fails to load)

### Build & Deploy

```bash
# Local build
pnpm build

# Test locally
pnpm preview

# Deploy to Vercel
vercel --prod
```

## Testing Objective

Deploy to Vercel and verify:

1. **Default Nitro Behavior**
   - Does Nitro auto-externalize `@boundaryml/baml`?
   - Are native modules (`.node` files) copied to `.output/server/node_modules/`?

2. **Runtime Behavior**
   - Does BAML load successfully?
   - Or does it throw `ReferenceError: __filename is not defined in ES module scope`?

## Expected Outcomes

### Scenario 1: Nitro Auto-Externalizes BAML ✅

**Expected Result**:
- ✅ Build succeeds
- ✅ Deployment succeeds
- ✅ App runs normally
- ✅ BAML loads via CommonJS `require()` from externalized `node_modules/`

**Evidence**:
- Check `.output/server/node_modules/@boundaryml/`
- Native modules (`.node` files) should be present
- Nitro's `externals` config auto-detected BAML

### Scenario 2: BAML Gets Bundled into ESM ❌

**Expected Result**:
- ⚠️ Build may succeed
- ❌ Runtime error on Vercel:
  ```
  ReferenceError: __filename is not defined in ES module scope
      at file:///var/task/chunks/_/router-xxx.mjs:23:26
  ```

**Solution**:
- Apply ESM polyfill via Nitro's `rollupConfig.output.banner`

## Environment Variables

Create a `.env` file:

```env
# Optional - for testing AI functionality
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
```

## Project Structure

```
├── baml_src/               # BAML configuration
│   ├── chat.baml           # BAML schema and functions
│   ├── clients.baml        # LLM client config
│   └── generators.baml     # Code generation config
├── baml_client/            # Auto-generated BAML client (gitignored)
├── src/
│   ├── routes/
│   │   ├── __root.tsx      # Root layout
│   │   ├── index.tsx       # Home page (BAML test UI)
│   │   └── api/chat/
│   │       └── stream.ts   # AI chat streaming endpoint
│   ├── lib/
│   │   ├── baml-stream.ts  # BAML streaming adapter
│   │   └── id-mapper.ts    # ID mapping utilities
│   └── styles/
│       └── app.css         # Tailwind styles
└── vite.config.ts          # Vite + TanStack Start + Nitro config
```

## Possible Solutions

1. **Externalize BAML in Nitro config** - Add BAML to `nitro.externals`
2. **ESM Polyfills** - Add `__filename`/`__dirname` polyfills via Rollup banner:
   ```js
   // vite.config.ts
   nitro: {
     rollupConfig: {
       output: {
         banner: `
           import { fileURLToPath } from 'url';
           import { dirname } from 'path';
           const __filename = fileURLToPath(import.meta.url);
           const __dirname = dirname(__filename);
         `
       }
     }
   }
   ```
3. **CommonJS target** - Force Nitro to output CommonJS for server functions

## Related Issues

- [BAML GitHub Issues](https://github.com/BoundaryML/baml/issues)
- [Nitro GitHub Issues](https://github.com/unjs/nitro/issues)

## Official Documentation

- [BAML Documentation](https://docs.boundaryml.com/)
- [TanStack Start](https://tanstack.com/start/latest)
- [Nitro](https://nitro.unjs.io/)
- [Vercel AI SDK](https://sdk.vercel.ai/)

## License

MIT
