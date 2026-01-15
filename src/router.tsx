import {
  createBrowserHistory,
  createMemoryHistory,
  createRouter as createTanStackRouter,
} from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const history =
    typeof document === 'undefined'
      ? createMemoryHistory({ initialEntries: ['/'] })
      : createBrowserHistory()

  const router = createTanStackRouter({
    routeTree,
    history,
    scrollRestoration: true,
  })

  return router
}

export const createRouter = getRouter

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
