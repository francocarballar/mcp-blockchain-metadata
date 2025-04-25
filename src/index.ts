import { Hono } from 'hono'
import { setupMcpRoutes } from './mcp-http'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Configurar las rutas MCP reutilizando la lógica existente
setupMcpRoutes(app)

export default app
