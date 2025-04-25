// Modules and main functions
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

// Middleware
import { createAuthMiddleware } from '@/middleware/auth.middleware'

// Handlers
import {
  handlePostRequest,
  handleGetRequest,
  handleDeleteRequest
} from '@/handlers/mcp.handlers'

// Utils
import { setupErrorHandlers } from '@/utils/error.handler'

// Config
import { ENV } from '@/config/environment'

// Tools
import { registerGetMiniAppEndpointsTool } from '@/tools/getMiniAppEndpoints.tool'
import { registerGetProtocolTokensTool } from '@/tools/getProtocolTokens.tool'
import { registerGetMetadataOfTemplateTool } from '@/tools/getMetadataOfTemplate.tool'

// Configurar manejo de errores mejorado
process.on('uncaughtException', error => {
  console.error('Excepción no capturada:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Rechazo no manejado en:', promise, 'razón:', reason)
})

/**
 * @function main
 * @description Función principal que inicializa y ejecuta el servidor MCP con transporte HTTP.
 * Configura rutas, middleware de autenticación y gestión de sesiones.
 * @returns {Promise<void>}
 */
async function main () {
  console.log(`Iniciando servidor MCP en modo ${ENV.NODE_ENV}`)

  // Configurar manejadores de errores globales
  setupErrorHandlers()

  // Herramientas a registrar en el servidor MCP
  const mcpTools = [
    registerGetMiniAppEndpointsTool,
    registerGetProtocolTokensTool,
    registerGetMetadataOfTemplateTool
  ]

  const app = new Hono()

  // Crear middleware de autenticación
  const authMiddleware = createAuthMiddleware(ENV.AUTH_TOKEN)

  // Aplicar middleware de autenticación a endpoints MCP
  app.use('/mcp', authMiddleware)

  // Configurar rutas MCP
  app.post('/mcp', handlePostRequest(mcpTools))
  app.get('/mcp', handleGetRequest())
  app.delete('/mcp', handleDeleteRequest())

  // Iniciar el servidor con el adaptador de servidor node de Hono
  serve(
    {
      fetch: app.fetch,
      port: Number(ENV.PORT)
    },
    (info: { port: number }) => {
      console.log(`Servidor MCP ejecutándose en el puerto ${info.port}`)
    }
  )
}

main().catch(error => {
  console.error('Error en el servidor HTTP MCP:', error)
  process.exit(1)
})
