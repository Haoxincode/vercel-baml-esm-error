import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { b } from '@baml'

export const testBAML = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const version = b.version
    return {
      success: true,
      version,
      message: 'BAML loaded successfully on Vercel + Nitro'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to load BAML'
    }
  }
})

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => {
    const result = await testBAML()
    return result
  },
})

function Home() {
  const data = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <span className="text-2xl">🧪</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                TanStack Start + Nitro + BAML
              </h1>
              <p className="text-sm text-slate-300">
                Vercel Deployment Test
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <span className="text-slate-300 font-medium">Status</span>
              <span className={`flex items-center gap-2 font-bold ${
                data.success ? 'text-green-400' : 'text-red-400'
              }`}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{
                  backgroundColor: data.success ? 'rgb(74 222 128)' : 'rgb(248 113 113)'
                }} />
                {data.success ? 'Success' : 'Failed'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <span className="text-slate-300 font-medium">BAML Version</span>
              <span className="text-white font-mono text-sm">
                {data.success ? data.version : 'N/A'}
              </span>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-slate-300 font-medium mb-2">Message</p>
              <p className="text-white text-sm">
                {data.message}
              </p>
              {!data.success && data.error && (
                <pre className="mt-3 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-300 text-xs overflow-x-auto">
                  {data.error}
                </pre>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="mt-8 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <p className="text-sm text-cyan-100 leading-relaxed">
              <strong>Testing:</strong> This project tests BAML ESM compatibility with TanStack Start and Nitro on Vercel.
              If you see this message without errors, the deployment is working correctly!
            </p>
          </div>

          {/* Links */}
          <div className="mt-6 flex gap-4">
            <a
              href="https://github.com/Haoxincode/vercel-tanstackstart-test"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition-all"
            >
              <span>📦</span>
              <span>GitHub Repo</span>
            </a>
            <a
              href="https://github.com/BoundaryML/baml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition-all"
            >
              <span>🤖</span>
              <span>BAML Docs</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
