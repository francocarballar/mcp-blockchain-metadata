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
 * Configures MCP routes on the provided Hono app instance
 * @param app Hono app instance to configure
 * @returns The configured Hono app
 */
export function setupMcpRoutes<T extends object = {}> (app: Hono<T>) {
  // Herramientas a registrar en el servidor MCP
  const mcpTools: McpToolRegistration[] = [
    registerGetMiniAppEndpointsTool,
    registerGetProtocolTokensTool,
    registerGetMetadataOfTemplateTool
  ]

  try {
    // Crear middleware de autenticación
    const authMiddleware = createAuthMiddleware(ENV.AUTH_TOKEN)

    // Aplicar middleware de autenticación a endpoints MCP
    app.use('/sse', authMiddleware)

    // Configurar rutas MCP
    app.post('/sse', handlePostRequest(mcpTools))
    app.get('/sse', handleGetRequest())
    app.delete('/sse', handleDeleteRequest())

    logger.info('Rutas MCP configuradas correctamente')
  } catch (error) {
    logger.error('Error al configurar rutas MCP', error)
  }

  return app
}

/**
 * @function main
 * @description Función principal que inicializa y ejecuta el servidor MCP con transporte HTTP.
 * Configura rutas, middleware de autenticación y gestión de sesiones.
 * @returns {Promise<void>}
 */
async function main () {
  try {
    // Solo ejecutar esta validación en entorno Node.js
    if (typeof process !== 'undefined' && process.env) {
      // Validar variables de entorno requeridas
      ENV.validateRequiredVars(['PORT', 'NODE_ENV'])
    }

    // Configurar manejadores de errores globales
    setupErrorHandlers()

    logger.info(`Iniciando servidor MCP en modo ${ENV.NODE_ENV}`, {
      port: ENV.PORT,
      auth: ENV.AUTH_TOKEN ? 'configurado' : 'no configurado'
    })

    const app = new Hono()

    // Configurar rutas MCP
    setupMcpRoutes(app)

    // Iniciar el servidor con el adaptador de servidor node de Hono
    // Solo ejecutar si estamos en un entorno Node.js
    if (typeof process !== 'undefined' && process.env) {
      serve(
        {
          fetch: app.fetch,
          port: Number(ENV.PORT)
        },
        (info: { port: number }) => {
          logger.info(`Servidor MCP ejecutándose en el puerto ${info.port}`)
        }
      )
    }
  } catch (error) {
    logger.fatal('Error fatal al iniciar el servidor MCP', error)
    if (typeof process !== 'undefined') {
      process.exit(1)
    }
  }
}

// Verificación compatible con ESM y entornos como Cloudflare Workers
// Solo ejecuta main cuando este archivo es ejecutado directamente
if (
  typeof globalThis !== 'undefined' &&
  globalThis.process &&
  typeof process.argv !== 'undefined'
) {
  main().catch(error => {
    logger.fatal('Error no manejado en la función principal', error)
    process.exit(1)
  })
}
