import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { setupMcpRoutes } from './mcp-http'
import { ENV } from './config/environment'

// Crear la aplicación Hono sin tipos específicos de Cloudflare
const app = new Hono()

// Configurar las rutas MCP reutilizando la lógica existente
setupMcpRoutes(app)

// Definir el puerto desde ENV
const port = typeof ENV.PORT === 'string' ? parseInt(ENV.PORT, 10) : ENV.PORT

console.log(`Servidor Hono escuchando en el puerto ${port}`)

// Exportar el servidor para que pueda ser iniciado
export default serve({
  fetch: app.fetch,
  port: port
})
