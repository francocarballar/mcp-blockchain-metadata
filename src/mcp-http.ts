// Modules and main functions
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

// Middleware
import { createAuthMiddleware } from './middleware/auth.middleware'

// Handlers
import {
  handlePostRequest,
  handleGetRequest,
  handleDeleteRequest
} from './handlers/mcp.handlers'

// Utils
import { setupErrorHandlers } from './utils/error.handler'
import { logger } from './utils/logger'

// Config
import { ENV } from './config/environment'

// Tools
import { registerGetMiniAppEndpointsTool } from './tools/getMiniAppEndpoints.tool'
import { registerGetProtocolTokensTool } from './tools/getProtocolTokens.tool'
import { registerGetMetadataOfTemplateTool } from './tools/getMetadataOfTemplate.tool'

// Types
import { McpToolRegistration } from './types/mcp'

/**
 * @function main
 * @description Función principal que inicializa y ejecuta el servidor MCP con transporte HTTP.
 * Configura rutas, middleware de autenticación y gestión de sesiones.
 * @returns {Promise<void>}
 */
async function main () {
  try {
    // Validar variables de entorno requeridas
    ENV.validateRequiredVars(['PORT', 'NODE_ENV'])

    // Configurar manejadores de errores globales
    setupErrorHandlers()

    logger.info(`Iniciando servidor MCP en modo ${ENV.NODE_ENV}`, {
      port: ENV.PORT,
      auth: ENV.AUTH_TOKEN ? 'configurado' : 'no configurado'
    })

    // Herramientas a registrar en el servidor MCP
    const mcpTools: McpToolRegistration[] = [
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
        logger.info(`Servidor MCP ejecutándose en el puerto ${info.port}`)
      }
    )
  } catch (error) {
    logger.fatal('Error fatal al iniciar el servidor MCP', error)
    process.exit(1)
  }
}

// Iniciar la aplicación
main().catch(error => {
  logger.fatal('Error no manejado en la función principal', error)
  process.exit(1)
})
