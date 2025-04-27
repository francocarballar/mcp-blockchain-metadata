import { Hono } from 'hono'
import { setupMcpRoutes } from './mcp-http'
import { initializeEnv } from './config/environment'

// Definición de tipos para el contexto de Cloudflare Workers
interface Env {
  // Variables de entorno
  PORT?: string | number
  NODE_ENV?: string
  AUTH_TOKEN?: string
  LOG_LEVEL?: string

  // Bindings
  ASSETS: any
}

// Crear la aplicación Hono con bindings de Cloudflare
const app = new Hono<{ Bindings: Env }>()

// Middleware para inicializar variables de entorno en cada solicitud
app.use('*', async (c, next) => {
  // Inicializar variables de entorno desde el contexto de Cloudflare
  initializeEnv(c.env)
  await next()
})

// Configurar las rutas MCP reutilizando la lógica existente
setupMcpRoutes(app)

export default app
