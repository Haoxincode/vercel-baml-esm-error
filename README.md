# vercel-baml-esm-error

> **Reproduction of BAML ESM error with TanStack Start + Nitro**

Minimal reproduction for BAML ESM compatibility issues. **Reproducible locally** - no Vercel deployment required.

## The Problem

When Nitro bundles server code as ESM, BAML fails to load due to missing `__filename` variable.

### Error

```
ReferenceError: __filename is not defined in ES module scope
    at file:///.output/server/chunks/_/baml_client-BqK7FfZN.mjs:4:26
```

### Root Cause

1. Nitro bundles server code as ESM (`.mjs`)
2. BAML's `native.js` uses `require = createRequire(__filename)`
3. `__filename` doesn't exist in ESM modules
4. Runtime error occurs

## Reproduce Locally

```bash
# 1. Clone
git clone https://github.com/Haoxincode/vercel-baml-esm-error.git
cd vercel-baml-esm-error

# 2. Install
pnpm install

# 3. Build
pnpm build

# 4. Run - ERROR occurs here
pnpm start
```

**Expected output:**
```
➜ Listening on: http://localhost:3001/
ReferenceError: __filename is not defined in ES module scope
    at file:///.output/server/chunks/_/baml_client-BqK7FfZN.mjs:4:26
```

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | [TanStack Start](https://tanstack.com/start) | v1.149+ |
| Router | [TanStack Router](https://tanstack.com/router) | v1.147+ |
| Server | [Nitro](https://nitro.unjs.io/) | v3.0 |
| Build Tool | [Vite](https://vitejs.dev/) | v8 |
| AI | [BAML](https://www.boundaryml.com/) | v0.217 |

## Solution

Add ESM polyfill via Nitro's `rollupConfig.output.banner`:

```typescript
// vite.config.ts
import { nitro } from 'nitro/vite'

const esmPolyfillBanner = `
import { fileURLToPath as __polyfill_fileURLToPath } from 'node:url';
import { dirname as __polyfill_dirname } from 'node:path';
import { createRequire as __polyfill_createRequire } from 'node:module';
const __filename = __polyfill_fileURLToPath(import.meta.url);
const __dirname = __polyfill_dirname(__filename);
const require = __polyfill_createRequire(import.meta.url);
`

export default defineConfig({
  plugins: [
    nitro({
      rollupConfig: {
        output: {
          banner: esmPolyfillBanner,
        },
      },
    }),
    // ... other plugins
  ],
})
```

## Project Structure

```
├── baml_src/               # BAML configuration
│   ├── chat.baml           # BAML schema and functions
│   ├── clients.baml        # LLM client config
│   └── generators.baml     # Code generation config
├── src/
│   ├── routes/
│   │   ├── __root.tsx      # Root layout
│   │   ├── index.tsx       # Home page (BAML test)
│   │   └── api/chat/
│   │       └── stream.ts   # Streaming API endpoint
│   └── lib/
│       ├── baml-stream.ts  # BAML streaming adapter
│       └── id-mapper.ts    # ID mapping utilities
└── vite.config.ts          # Vite + Nitro config
```

## Environment Variables (Optional)

```env
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
```

## Related

- [BAML GitHub Issues](https://github.com/BoundaryML/baml/issues)
- [Nitro GitHub Issues](https://github.com/unjs/nitro/issues)
- [TanStack Start](https://tanstack.com/start/latest)

## License

MIT
