import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { TokenInfo } from '@/types/tokens'
import { z } from 'zod'
import { getTokensByProtocol } from '@/services/tokens'

/**
 * @description Esquema de validación para el nombre del protocolo
 * @constant {z.ZodType}
 */
const ProtocolSchema = z.string().min(1, 'Protocol name is required')

/**
 * @description Esquema de validación para el identificador de cadena
 * @constant {z.ZodType}
 */
const ChainIdSchema = z.string().optional()

/**
 * @description Registra la herramienta get_protocol_tokens en el servidor MCP
 * @param {McpServer} server - Instancia del servidor MCP
 */
export function registerGetProtocolTokensTool (server: McpServer) {
  server.tool(
    'get_protocol_tokens',
    {
      protocol: ProtocolSchema,
      chainId: ChainIdSchema
    },
    async ({ protocol, chainId }, _extra) => {
      try {
        // Validar parámetros
        if (!protocol?.trim()) {
          return createErrorResponse('El nombre del protocolo es obligatorio')
        }

        // Obtener tokens
        const tokens = await getTokensByProtocol(protocol, chainId)

        // Comprobar si se encontraron tokens
        if (!tokens || tokens.length === 0) {
          return createEmptyResponse(protocol, chainId)
        }

        // Enriquecer y formatear la respuesta
        const formattedResponse = formatTokensResponse(
          tokens,
          protocol,
          chainId
        )

        return {
          content: [{ type: 'text' as const, text: formattedResponse }]
        }
      } catch (error) {
        return createErrorResponse(
          `Error al obtener tokens para el protocolo ${protocol}${
            chainId ? ` en la cadena ${chainId}` : ''
          }: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }
  )
}

/**
 * @description Crea una respuesta de error formateada
 * @param {string} message - Mensaje de error
 * @returns {Object} Respuesta de error formateada
 */
function createErrorResponse (message: string) {
  return {
    content: [{ type: 'text' as const, text: message }],
    isError: true
  }
}

/**
 * @description Crea una respuesta para cuando no se encuentran tokens
 * @param {string} protocol - Nombre del protocolo
 * @param {string | undefined} chainId - Identificador de cadena opcional
 * @returns {Object} Respuesta formateada
 */
function createEmptyResponse (protocol: string, chainId?: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text: `No se encontraron tokens para el protocolo ${protocol}${
          chainId ? ` en la cadena ${chainId}` : ''
        }`
      }
    ]
  }
}

/**
 * @description Formatea y enriquece la respuesta de tokens
 * @param {TokenInfo[]} tokens - Lista de tokens
 * @param {string} protocol - Nombre del protocolo
 * @param {string | undefined} chainId - Identificador de cadena opcional
 * @returns {string} JSON formateado con información enriquecida
 */
function formatTokensResponse (
  tokens: TokenInfo[],
  protocol: string,
  chainId?: string
): string {
  // Añadir metadatos útiles a la respuesta
  const response = {
    metadata: {
      protocol,
      chainId: chainId || 'all',
      count: tokens.length,
      timestamp: new Date().toISOString()
    },
    tokens: tokens.map(token => ({
      ...token,
      formattedDecimals: `${token.decimals} decimales`,
      formattedSymbol: token.symbol.toUpperCase(),
      explorerUrl: token.isNative
        ? null
        : `https://snowtrace.io/address/${token.address}`
    }))
  }

  return JSON.stringify(response, null, 2)
}
