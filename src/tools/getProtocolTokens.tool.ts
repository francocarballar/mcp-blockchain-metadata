import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Repository } from '../types/repository'
import type { TokenInfo } from '../types/tokens'
import { z } from 'zod'
import { getRepository } from '../services/repository'
import { getTokensByProtocol } from '../services/tokens'

/**
 * @description Esquema de validación para protocolos
 */
const ProtocolSchema = z
  .string()
  .min(1)
  .describe(
    'Nombre del protocolo para obtener tokens. Ejemplo: "uniswap", "aave", "curve"'
  )

/**
 * @description Esquema de validación para IDs de cadenas
 */
const ChainIdSchema = z
  .union([z.string(), z.number(), z.null()])
  .transform(val => {
    if (val === null) return undefined
    return typeof val === 'string' ? parseInt(val, 10) : val
  })
  .refine(val => val === undefined || !isNaN(val as number), {
    message: 'Chain ID debe ser un número válido o null'
  })
  .describe(
    'ID de la cadena de bloques. Ejemplo: 1 (Ethereum), 137 (Polygon). Puede ser null para no filtrar por cadena.'
  )

/**
 * @description Esquema para limitar resultados
 */
const LimitSchema = z
  .number()
  .min(1)
  .max(100)
  .optional()
  .default(50)
  .describe('Número máximo de tokens a retornar (1-100). Por defecto: 50')

/**
 * @description Esquema para ordenar resultados
 */
const SortSchema = z
  .enum(['name', 'symbol', 'popularity'])
  .optional()
  .default('popularity')
  .describe(
    'Campo para ordenar los resultados. Opciones: "name", "symbol", "popularity". Por defecto: "popularity"'
  )

/**
 * @description Interfaz para los parámetros de la herramienta
 */
interface TokenParams {
  protocol?: string
  chainId?: number | string
  limit?: number
  sort?: 'name' | 'symbol' | 'popularity'
}

/**
 * @description Registra la herramienta get_protocol_tokens en el servidor MCP
 */
export function registerGetProtocolTokensTool (server: McpServer) {
  server.tool(
    'get_protocol_tokens',
    'Obtiene los tokens de un protocolo específico, opcionalmente filtrados por chain ID',
    {
      protocol: ProtocolSchema,
      chainId: ChainIdSchema.optional(),
      limit: LimitSchema,
      sort: SortSchema
    },
    async (params: TokenParams) => {
      try {
        const { protocol, chainId, limit = 50, sort = 'popularity' } = params

        // Validar los parámetros
        if (!protocol) {
          return createErrorResponse(
            'Se requiere el nombre del protocolo. Por favor, proporciona un protocolo válido como "uniswap", "aave", o "curve".'
          )
        }

        // Si chainId es null o undefined, lo tratamos como undefined
        const numericChainId =
          chainId === null
            ? undefined
            : typeof chainId === 'string'
            ? parseInt(chainId, 10)
            : chainId

        if (
          chainId !== null &&
          chainId !== undefined &&
          isNaN(numericChainId as number)
        ) {
          return createErrorResponse(
            'El Chain ID proporcionado no es válido. Debe ser un número como 1 (Ethereum), 137 (Polygon).'
          )
        }

        // Obtener los datos del repositorio
        const repository = await getRepository()

        // Verificar si el protocolo existe
        const validProtocols = getValidProtocols(repository)
        if (!validProtocols.includes(protocol.toLowerCase())) {
          return createErrorResponse(
            `El protocolo "${protocol}" no se encuentra disponible. Protocolos válidos: ${validProtocols.join(
              ', '
            )}`
          )
        }

        // Buscar tokens para el protocolo y chain ID especificados
        const tokens = await getTokensByProtocol(protocol, chainId?.toString())

        if (tokens.length === 0) {
          return createEmptyResponse(protocol, numericChainId, validProtocols)
        }

        // Ordenar tokens según el criterio especificado
        const sortedTokens = sortTokens(tokens, sort)

        // Aplicar límite
        const limitedTokens = sortedTokens.slice(0, limit)

        // Formatea la respuesta con metadatos enriquecidos
        const formattedResponse = formatTokensResponse(limitedTokens, {
          protocol,
          chainId: numericChainId,
          totalTokens: tokens.length,
          returnedTokens: limitedTokens.length,
          supportedProtocols: validProtocols,
          timestamp: new Date().toISOString(),
          sort
        })

        return {
          content: [{ type: 'text' as const, text: formattedResponse }]
        }
      } catch (error) {
        return createErrorResponse(
          `Error al obtener tokens: ${
            error instanceof Error ? error.message : 'Error desconocido'
          }. Por favor, verifica los parámetros e intenta nuevamente.`
        )
      }
    }
  )
}

/**
 * @description Crea una respuesta de error formateada
 */
function createErrorResponse (message: string) {
  return {
    content: [{ type: 'text' as const, text: message }],
    isError: true
  }
}

/**
 * @description Crea una respuesta para cuando no se encuentran tokens
 */
function createEmptyResponse (
  protocol: string,
  chainId?: number,
  validProtocols?: string[]
) {
  let message = `No se encontraron tokens para el protocolo "${protocol}"`

  if (chainId) {
    message += ` en la cadena con ID ${chainId}`
  }

  message += '.'

  if (validProtocols && validProtocols.length > 0) {
    message += ` Protocolos disponibles: ${validProtocols.join(', ')}.`
  }

  if (chainId) {
    message +=
      ' Prueba con otro chain ID o consulta sin especificar chain ID para ver todos los tokens disponibles para el protocolo.'
  }

  return {
    content: [{ type: 'text' as const, text: message }]
  }
}

/**
 * @description Obtiene la lista de protocolos válidos
 */
function getValidProtocols (repository: Repository): string[] {
  // Extraer protocolos únicos de los miniAppEndpoints
  const protocolSet = new Set<string>()

  repository.miniAppEndpoints.forEach(endpoint => {
    // Extraer protocolo del host o usar una propiedad específica si existe
    if (endpoint.protocol) {
      protocolSet.add(endpoint.protocol.toLowerCase())
    }
  })

  // En este caso no podemos usar repository.tokens porque no existe en el tipo Repository
  // Añadir algunos protocolos comunes conocidos
  const commonProtocols = [
    'uniswap',
    'aave',
    'curve',
    'traderjoe',
    'pancakeswap'
  ]
  commonProtocols.forEach(protocol => protocolSet.add(protocol))

  return Array.from(protocolSet)
}

/**
 * @description Ordena los tokens según el criterio especificado
 */
function sortTokens (
  tokens: TokenInfo[],
  sortBy: 'name' | 'symbol' | 'popularity' = 'popularity'
): TokenInfo[] {
  const tokensCopy = [...tokens]

  switch (sortBy) {
    case 'name':
      return tokensCopy.sort((a, b) => a.name.localeCompare(b.name))
    case 'symbol':
      return tokensCopy.sort((a, b) => a.symbol.localeCompare(b.symbol))
    case 'popularity':
    default:
      // Para popularidad, podemos usar el número de decimales como heurística
      // Asumiendo que tokens con menos decimales suelen ser más populares
      return tokensCopy.sort((a, b) => a.decimals - b.decimals)
  }
}

/**
 * @description Formatea los tokens para la respuesta de la herramienta
 */
function formatTokensResponse (
  tokens: TokenInfo[],
  metadata: {
    protocol: string
    chainId?: number
    totalTokens: number
    returnedTokens: number
    supportedProtocols: string[]
    timestamp: string
    sort: string
  }
): string {
  // Enriquece los datos con información adicional
  const enhancedTokens = tokens.map(token => ({
    ...token,
    // Información adicional útil
    displayName: `${token.name} (${token.symbol})`,
    chainName: getChainName(Number(token.chainId)),
    explorerUrl: token.address
      ? getExplorerUrl(Number(token.chainId), token.address)
      : undefined
  }))

  // Construir la respuesta con metadatos
  const response = {
    metadata: {
      ...metadata,
      supportedChains: getSupportedChains(),
      dataFreshness: 'Los datos pueden tener hasta 5 minutos de antigüedad'
    },
    tokens: enhancedTokens
  }

  return JSON.stringify(response, null, 2)
}

/**
 * @description Obtiene el nombre de la cadena a partir del ID
 */
function getChainName (chainId?: number): string | undefined {
  if (!chainId) return undefined

  const chains: Record<number, string> = {
    1: 'Ethereum',
    10: 'Optimism',
    56: 'BNB Chain',
    137: 'Polygon',
    42161: 'Arbitrum',
    43114: 'Avalanche'
  }

  return chains[chainId] || `Chain ID ${chainId}`
}

/**
 * @description Obtiene la URL del explorador para un token
 */
function getExplorerUrl (
  chainId?: number,
  address?: string
): string | undefined {
  if (!chainId || !address) return undefined

  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/token/',
    10: 'https://optimistic.etherscan.io/token/',
    56: 'https://bscscan.com/token/',
    137: 'https://polygonscan.com/token/',
    42161: 'https://arbiscan.io/token/',
    43114: 'https://snowtrace.io/token/'
  }

  const baseUrl = explorers[chainId]
  return baseUrl ? `${baseUrl}${address}` : undefined
}

/**
 * @description Obtiene la lista de cadenas soportadas
 */
function getSupportedChains (): { id: number; name: string }[] {
  return [
    { id: 1, name: 'Ethereum' },
    { id: 10, name: 'Optimism' },
    { id: 56, name: 'BNB Chain' },
    { id: 137, name: 'Polygon' },
    { id: 42161, name: 'Arbitrum' },
    { id: 43114, name: 'Avalanche' }
  ]
}
