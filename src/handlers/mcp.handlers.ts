import { Context } from 'hono'
import { randomUUID } from 'crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { ServerResponse, IncomingMessage } from 'http'

// Mapa para almacenar transportes por ID de sesión
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {}

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
 * @function handlePostRequest
 * @description Maneja solicitudes POST para comunicación cliente-servidor
 * Gestiona inicialización de sesiones y procesamiento de mensajes JSON-RPC
 * @param {Array<Function>} tools - Funciones para registrar herramientas en el servidor
 * @returns {Function} Handler para ruta POST de MCP
 */
export function handlePostRequest (tools: Array<(server: McpServer) => void>) {
  return async (c: Context) => {
    const requestBody = await c.req.json()

    // Verificar ID de sesión existente
    const sessionId = c.req.header('mcp-session-id')
    let transport: StreamableHTTPServerTransport

    if (sessionId && transports[sessionId]) {
      // Reutilizar transporte existente
      transport = transports[sessionId]
    } else if (!sessionId && isInitializeRequest(requestBody)) {
      // Nueva solicitud de inicialización
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: sessionId => {
          // Almacenar el transporte por ID de sesión
          transports[sessionId] = transport
        }
      })

      // Limpiar transporte cuando se cierre
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId]
        }
      }

      const server = createMcpServer(tools)

      // Conectar al servidor MCP
      await server.connect(transport)
    } else {
      // Solicitud inválida
      return c.json(
        {
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message:
              'Solicitud incorrecta: No se proporcionó un ID de sesión válido'
          },
          id: null
        },
        400
      )
    }

    // Para StreamableHTTPServerTransport, podemos pasar la solicitud sin procesar y usar la Response de Hono
    try {
      // Procesar la solicitud usando StreamableHTTPServerTransport
      const response = new Response(
        new ReadableStream({
          start (controller) {
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

            // Manejar la solicitud
            transport
              .handleRequest(
                c.req.raw as unknown as IncomingMessage,
                customRes,
                requestBody
              )
              .catch(error => {
                console.error('Error al manejar la solicitud:', error)
                controller.enqueue(
                  Buffer.from(
                    JSON.stringify({
                      jsonrpc: '2.0',
                      error: {
                        code: -32603,
                        message: 'Error interno del servidor'
                      },
                      id: null
                    })
                  )
                )
                controller.close()
              })
          }
        })
      )

      return response
    } catch (error) {
      console.error('Error al manejar solicitud StreamableHTTP:', error)
      return c.json(
        {
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Error interno del servidor' },
          id: null
        },
        500
      )
    }
  }
}

/**
 * @function handleGetRequest
 * @description Maneja solicitudes GET para notificaciones servidor-cliente vía SSE
 * Establece una conexión de eventos para transmitir notificaciones al cliente
 * @returns {Function} Handler para ruta GET de MCP
 */
export function handleGetRequest () {
  return async (c: Context) => {
    const sessionId = c.req.header('mcp-session-id')
    if (!sessionId || !transports[sessionId]) {
      return c.text('ID de sesión inválido o faltante', 400)
    }

    const transport = transports[sessionId]

    // Respuesta SSE
    return new Response(
      new ReadableStream({
        start (controller) {
          const customRes = new ServerResponse(
            c.req.raw as unknown as IncomingMessage
          )

          customRes.write = chunk => {
            controller.enqueue(chunk)
            return true
          }

          customRes.end = chunk => {
            if (chunk) controller.enqueue(chunk)
            controller.close()
            return customRes
          }

          transport
            .handleRequest(c.req.raw as unknown as IncomingMessage, customRes)
            .catch(error => {
              console.error('Error al manejar solicitud GET:', error)
              controller.enqueue(Buffer.from('Error interno del servidor'))
              controller.close()
            })
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive'
        }
      }
    )
  }
}

/**
 * @function handleDeleteRequest
 * @description Maneja solicitudes DELETE para terminación de sesiones
 * Elimina sesiones y libera recursos asociados
 * @returns {Function} Handler para ruta DELETE de MCP
 */
export function handleDeleteRequest () {
  return async (c: Context) => {
    const sessionId = c.req.header('mcp-session-id')
    if (!sessionId || !transports[sessionId]) {
      return c.text('ID de sesión inválido o faltante', 400)
    }

    const transport = transports[sessionId]

    // Manejar solicitud DELETE
    return new Response(
      new ReadableStream({
        start (controller) {
          const customRes = new ServerResponse(
            c.req.raw as unknown as IncomingMessage
          )

          customRes.write = chunk => {
            controller.enqueue(chunk)
            return true
          }

          customRes.end = chunk => {
            if (chunk) controller.enqueue(chunk)
            controller.close()
            return customRes
          }

          transport
            .handleRequest(c.req.raw as unknown as IncomingMessage, customRes)
            .catch(error => {
              console.error('Error al manejar solicitud DELETE:', error)
              controller.enqueue(Buffer.from('Error interno del servidor'))
              controller.close()
            })
        }
      })
    )
  }
}
