import { Context } from 'hono'
import { randomUUID } from 'crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { ServerResponse, IncomingMessage } from 'http'
import { createErrorResponse, ErrorCode } from '../utils/error.handler'
import { SessionManager } from '../utils/session.manager'
import { logger } from '../utils/logger'

// Obtener la instancia singleton del gestor de sesiones
const sessionManager = SessionManager.getInstance()

/**
 * @function createMcpServer
 * @description Crea una instancia del servidor MCP con la configuración predeterminada
 * y registra todas las herramientas necesarias.
 * @param {Array<Function>} tools - Funciones para registrar herramientas en el servidor
 * @returns {McpServer} Instancia configurada del servidor MCP
 */
export function createMcpServer (
  tools: Array<(server: McpServer) => void>
): McpServer {
  const server = new McpServer({
    name: 'mcp-blockchain-metadata',
    version: '1.0.0',
    description: 'MCP Blockchain Metadata',
    author: 'Franco Carballar',
    repository:
      'https://github.com/francocarballar/mcp-blockchain-metadata.git',
    homepage: 'https://www.francocarballar.com/'
  })

  // Registrar herramientas
  tools.forEach(register => register(server))

  return server
}

/**
 * @function createStreamResponse
 * @description Crea una Response usando ReadableStream para manejar solicitudes MCP
 * @param {Context} c - Contexto de Hono
 * @param {StreamableHTTPServerTransport} transport - Transporte MCP
 * @param {any} [requestBody] - Cuerpo de la solicitud (opcional para GET/DELETE)
 * @returns {Response} Respuesta para devolver al cliente
 */
function createStreamResponse (
  c: Context,
  transport: StreamableHTTPServerTransport,
  requestBody?: any
): Response {
  try {
    const responseHeaders =
      c.req.method === 'GET'
        ? {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive'
          }
        : undefined

    return new Response(
      new ReadableStream({
        start (controller) {
          // Crear una pseudo-respuesta de servidor para capturar la salida
          const customRes = new ServerResponse(
            c.req.raw as unknown as IncomingMessage
          )

          // Capturar los datos de respuesta
          customRes.write = chunk => {
            controller.enqueue(chunk)
            return true
          }

          customRes.end = chunk => {
            if (chunk) controller.enqueue(chunk)
            controller.close()
            return customRes
          }

          // Determinar qué método de transporte usar según existe el cuerpo de solicitud
          const handleRequest = () => {
            return requestBody
              ? transport.handleRequest(
                  c.req.raw as unknown as IncomingMessage,
                  customRes,
                  requestBody
                )
              : transport.handleRequest(
                  c.req.raw as unknown as IncomingMessage,
                  customRes
                )
          }

          // Manejar la solicitud y capturar posibles errores
          handleRequest().catch(error => {
            logger.error(`Error al manejar solicitud ${c.req.method}`, error)

            // Crear respuesta de error según el tipo de solicitud
            const errorResponse =
              c.req.method === 'GET' || c.req.method === 'DELETE'
                ? Buffer.from('Error interno del servidor')
                : Buffer.from(
                    JSON.stringify(
                      createErrorResponse(
                        ErrorCode.INTERNAL_ERROR,
                        'Error interno del servidor'
                      )
                    )
                  )

            controller.enqueue(errorResponse)
            controller.close()
          })
        }
      }),
      { headers: responseHeaders }
    )
  } catch (error) {
    logger.error('Error al crear respuesta de stream', error)
    return new Response(
      JSON.stringify(
        createErrorResponse(
          ErrorCode.INTERNAL_ERROR,
          'Error interno del servidor al crear respuesta'
        )
      ),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

/**
 * @function handlePostRequest
 * @description Maneja solicitudes POST para comunicación cliente-servidor
 * Gestiona inicialización de sesiones y procesamiento de mensajes JSON-RPC
 * @param {Array<Function>} tools - Funciones para registrar herramientas en el servidor
 * @returns {Function} Handler para ruta POST de MCP
 */
export function handlePostRequest (tools: Array<(server: McpServer) => void>) {
  return async (c: Context) => {
    try {
      const requestBody = await c.req.json()
      const sessionId = c.req.header('mcp-session-id')

      // Caso 1: Sesión existente
      if (sessionId) {
        const transport = sessionManager.getTransport(sessionId)
        if (transport) {
          logger.debug('Reutilizando sesión existente', { sessionId })
          return createStreamResponse(c, transport, requestBody)
        }
      }

      // Caso 2: Nueva solicitud de inicialización
      if (!sessionId && isInitializeRequest(requestBody)) {
        logger.info('Inicializando nueva sesión MCP')
        try {
          const transport = await initializeSession(tools)
          return createStreamResponse(c, transport, requestBody)
        } catch (error) {
          logger.error('Error al inicializar sesión', error)
          return c.json(
            createErrorResponse(
              ErrorCode.INTERNAL_ERROR,
              'Error al inicializar sesión'
            ),
            500
          )
        }
      }

      // Caso 3: Solicitud inválida
      logger.warn('Solicitud POST inválida, sin sesión válida')
      return c.json(
        createErrorResponse(
          ErrorCode.INVALID_SESSION,
          'Solicitud incorrecta: No se proporcionó un ID de sesión válido'
        ),
        400
      )
    } catch (error) {
      logger.error('Error al procesar solicitud POST', error)
      return c.json(
        createErrorResponse(
          ErrorCode.INTERNAL_ERROR,
          'Error interno del servidor'
        ),
        500
      )
    }
  }
}

/**
 * @function initializeSession
 * @description Inicializa una nueva sesión con su transporte
 * @param {Array<Function>} tools - Funciones para registrar herramientas
 * @returns {Promise<StreamableHTTPServerTransport>} Transporte inicializado
 */
async function initializeSession (
  tools: Array<(server: McpServer) => void>
): Promise<StreamableHTTPServerTransport> {
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: sessionId => {
        sessionManager.addTransport(sessionId, transport)
        logger.info('Nueva sesión inicializada', { sessionId })
      }
    })

    // Limpiar transporte cuando se cierre
    transport.onclose = () => {
      if (transport.sessionId) {
        logger.info('Sesión cerrada', { sessionId: transport.sessionId })
        sessionManager.removeTransport(transport.sessionId)
      }
    }

    const server = createMcpServer(tools)
    await server.connect(transport)

    return transport
  } catch (error) {
    logger.error('Error en initializeSession', error)
    throw error // Propagar el error para manejo adecuado
  }
}

/**
 * @function validateSessionAndCreateResponse
 * @description Función común para handlers GET y DELETE
 * @param {Context} c - Contexto de Hono
 * @returns {Response|null} Respuesta o null si la sesión no es válida
 */
function validateSessionAndCreateResponse (c: Context): Response | null {
  try {
    const sessionId = c.req.header('mcp-session-id')
    if (!sessionId) {
      logger.warn('Solicitud sin ID de sesión')
      return null
    }

    const transport = sessionManager.getTransport(sessionId)
    if (!transport) {
      logger.warn('Sesión no encontrada', { sessionId })
      return null
    }

    logger.debug('Sesión validada correctamente', { sessionId })
    return createStreamResponse(c, transport)
  } catch (error) {
    logger.error('Error al validar sesión', error)
    return null
  }
}

/**
 * @function handleGetRequest
 * @description Maneja solicitudes GET para notificaciones servidor-cliente vía SSE
 * @returns {Function} Handler para ruta GET de MCP
 */
export function handleGetRequest () {
  return async (c: Context) => {
    try {
      const response = validateSessionAndCreateResponse(c)
      if (!response) {
        return c.json(
          createErrorResponse(
            ErrorCode.INVALID_SESSION,
            'ID de sesión inválido o faltante'
          ),
          400
        )
      }
      return response
    } catch (error) {
      logger.error('Error en handleGetRequest', error)
      return c.json(
        createErrorResponse(
          ErrorCode.INTERNAL_ERROR,
          'Error interno del servidor'
        ),
        500
      )
    }
  }
}

/**
 * @function handleDeleteRequest
 * @description Maneja solicitudes DELETE para terminación de sesiones
 * @returns {Function} Handler para ruta DELETE de MCP
 */
export function handleDeleteRequest () {
  return (c: Context) => {
    try {
      const streamResponse = validateSessionAndCreateResponse(c)
      if (!streamResponse) {
        logger.warn('Solicitud DELETE inválida, sin ID de sesión válido')
        return c.json(
          createErrorResponse(
            ErrorCode.INVALID_SESSION,
            'Solicitud incorrecta: No se proporcionó un ID de sesión válido'
          ),
          400
        )
      }

      logger.debug('Solicitud DELETE recibida', {
        sessionId: c.req.header('mcp-session-id')
      })

      return streamResponse
    } catch (error) {
      logger.error('Error en handleDeleteRequest', error)
      return c.json(
        createErrorResponse(
          ErrorCode.INTERNAL_ERROR,
          'Error interno del servidor al procesar DELETE'
        ),
        500
      )
    }
  }
}
