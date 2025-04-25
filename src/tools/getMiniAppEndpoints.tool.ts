import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { MiniAppEndpoint, Repository } from '../types/repository'
import { z } from 'zod'
import { getRepository } from '../services/repository'

/**
 * @description Esquema de validación para las categorías de mini aplicaciones
 */
const RepositoryCategorySchema = z
  .preprocess(
    val => (typeof val === 'string' ? val.toLocaleLowerCase() : val),
    z.enum(['all', 'defi', 'gaming', 'nft', 'social'])
  )
  .describe(
    'Categoría de la mini aplicación. Opciones: "all", "defi", "gaming", "nft", "social". Por defecto: "all"'
  )

/**
 * @description Esquema para filtrar por estado de verificación
 */
const StateFilterSchema = z
  .enum(['all', 'trusted', 'pending', 'rejected'])
  .optional()
  .default('all')
  .describe(
    'Estado de verificación de los endpoints. Opciones: "all", "trusted", "pending", "rejected". Por defecto: "all"'
  )

/**
 * @description Esquema para búsqueda por texto
 */
const SearchQuerySchema = z
  .union([z.string(), z.null()])
  .transform(val => (val === null ? '' : val))
  .optional()
  .describe(
    'Texto para buscar en el host, endpoint o categoría. Ejemplo: "swap". Puede ser null para no filtrar por texto.'
  )

/**
 * @description Esquema para el protocolo de la mini aplicación
 */
const ProtocolFilterSchema = z
  .union([z.string(), z.null()])
  .transform(val => (val === null ? '' : val))
  .optional()
  .describe(
    'Protocolo específico a filtrar. Ejemplo: "https", "http". Puede ser null para no filtrar por protocolo.'
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
  .describe('Número máximo de endpoints a retornar (1-100). Por defecto: 50')

/**
 * @description Interfaz para los parámetros de la herramienta
 */
interface EndpointParams {
  category?: string
  state?: 'all' | 'trusted' | 'pending' | 'rejected'
  query?: string
  protocol?: string
  limit?: number
}

/**
 * @description Estructura de la respuesta de la herramienta
 * @interface ToolResponse
 */
export interface ToolResponse {
  content: Array<{
    type: string
    text: string
  }>
}

/**
 * @description Registra la herramienta get_miniapp_endpoints en el servidor MCP
 */
export function registerGetMiniAppEndpointsTool (server: McpServer) {
  server.tool(
    'get_miniapp_endpoints',
    'Obtiene y filtra endpoints de mini aplicaciones blockchain por categoría, estado, protocolo y otros criterios. USAR ESTA HERRAMIENTA cuando se necesite información sobre endpoints, URLs, conectar a una dApp, mini-apps disponibles, integrar aplicaciones blockchain, o buscar servicios DeFi, gaming, NFT o sociales en la blockchain. La herramienta devuelve una lista estructurada en JSON con todos los detalles necesarios para conectarse a aplicaciones blockchain, incluyendo URLs completas, estado de verificación, y categorización. Es útil para desarrolladores, integradores y usuarios que necesitan conocer los puntos de acceso disponibles en el ecosistema blockchain. Las categorías disponibles incluyen DeFi (exchanges, lending, staking), Gaming, NFTs y aplicaciones Sociales.',
    {
      category: RepositoryCategorySchema,
      state: StateFilterSchema,
      query: SearchQuerySchema,
      protocol: ProtocolFilterSchema,
      limit: LimitSchema
    },
    async (params: EndpointParams) => {
      try {
        const {
          category = 'all',
          state = 'all',
          query,
          protocol,
          limit = 50
        } = params

        // Proporcionar instrucciones de ayuda si no hay parámetros específicos
        if (category === 'all' && state === 'all' && !query && !protocol) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `
# Directorio de Endpoints de Mini Apps Blockchain

Esta herramienta proporciona acceso a endpoints verificados para mini aplicaciones blockchain.

## Categorías disponibles:
- **defi**: Aplicaciones financieras descentralizadas (swaps, lending, staking)
- **gaming**: Juegos basados en blockchain
- **nft**: Mercados y aplicaciones relacionadas con NFTs
- **social**: Redes sociales descentralizadas

## Filtros adicionales:
- **state**: Filtrar por estado de verificación (trusted, pending, rejected)
- **query**: Buscar términos específicos en hosts o endpoints
- **protocol**: Filtrar por protocolo (https, http)
- **limit**: Número máximo de resultados (1-100)

## Ejemplos de uso:
- Para todos los endpoints DeFi verificados: category="defi", state="trusted"
- Para endpoints relacionados con swaps: category="defi", query="swap"

Los endpoints se devuelven como JSON estructurado con URLs completas y metadatos.
`
              }
            ]
          }
        }

        const repositoryData = await getRepository()

        // Si se especificó una categoría específica, registrarla para analítica
        if (category && category !== 'all') {
          console.error(
            `Búsqueda de endpoints para categoría: ${category}, estado: ${state}`
          )
        }

        // Obtener endpoints filtrados según todos los criterios
        const filteredEndpoints = filterEndpoints(repositoryData, {
          category,
          state,
          query,
          protocol,
          limit
        })

        if (filteredEndpoints.length === 0) {
          return createEmptyResponse({ category, state, query, protocol })
        }

        // Aplicar límite
        const limitedEndpoints = filteredEndpoints.slice(0, limit)

        // Formatea los endpoints para la respuesta
        const formattedResponse = formatEndpointsResponse(limitedEndpoints, {
          category,
          state,
          query,
          protocol,
          totalEndpoints: filteredEndpoints.length,
          returnedEndpoints: limitedEndpoints.length,
          timestamp: new Date().toISOString()
        })

        return {
          content: [{ type: 'text' as const, text: formattedResponse }]
        }
      } catch (error) {
        return createErrorResponse(
          `Error al obtener endpoints de mini aplicaciones: ${
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
 * @description Crea una respuesta para cuando no se encuentran endpoints
 */
function createEmptyResponse (filters: {
  category?: string
  state?: string
  query?: string
  protocol?: string
}) {
  let message = `No se encontraron endpoints de mini aplicaciones`

  const appliedFilters = []
  if (filters.category && filters.category !== 'all') {
    appliedFilters.push(`categoría: "${filters.category}"`)
  }
  if (filters.state && filters.state !== 'all') {
    appliedFilters.push(`estado: "${filters.state}"`)
  }
  if (filters.query) {
    appliedFilters.push(`búsqueda: "${filters.query}"`)
  }
  if (filters.protocol) {
    appliedFilters.push(`protocolo: "${filters.protocol}"`)
  }

  if (appliedFilters.length > 0) {
    message += ` con los filtros: ${appliedFilters.join(', ')}`
  }

  message += `. Intenta con otros filtros o utiliza "all" como categoría para ver todos los endpoints disponibles.`

  return {
    content: [{ type: 'text' as const, text: message }]
  }
}

/**
 * @description Filtra endpoints según múltiples criterios
 */
function filterEndpoints (
  repository: Repository,
  filters: {
    category?: string
    state?: string
    query?: string
    protocol?: string
    limit?: number
  }
): MiniAppEndpoint[] {
  let results = [...repository.miniAppEndpoints]

  // Filtrar por categoría
  if (filters.category && filters.category !== 'all') {
    const lowerCaseCategory = filters.category.toLowerCase()
    results = results.filter(
      endpoint => endpoint.category.toLowerCase() === lowerCaseCategory
    )
  }

  // Filtrar por estado
  if (filters.state && filters.state !== 'all') {
    results = results.filter(endpoint => endpoint.state === filters.state)
  }

  // Filtrar por protocolo
  if (filters.protocol) {
    const lowerCaseProtocol = filters.protocol.toLowerCase()
    results = results.filter(
      endpoint => endpoint.protocol.toLowerCase() === lowerCaseProtocol
    )
  }

  // Filtrar por texto de búsqueda
  if (filters.query) {
    const lowerCaseQuery = filters.query.toLowerCase()
    results = results.filter(
      endpoint =>
        endpoint.host.toLowerCase().includes(lowerCaseQuery) ||
        endpoint.endpoint.toLowerCase().includes(lowerCaseQuery) ||
        endpoint.category.toLowerCase().includes(lowerCaseQuery) ||
        (endpoint.subcategory &&
          endpoint.subcategory.toLowerCase().includes(lowerCaseQuery))
    )
  }

  return results
}

/**
 * @description Formatea los endpoints para la respuesta de la herramienta
 */
function formatEndpointsResponse (
  endpoints: MiniAppEndpoint[],
  metadata: {
    category?: string
    state?: string
    query?: string
    protocol?: string
    totalEndpoints: number
    returnedEndpoints: number
    timestamp: string
  }
): string {
  // Enriquece los datos con información adicional
  const enhancedEndpoints = endpoints.map(endpoint => ({
    ...endpoint,
    fullUrl: `${endpoint.protocol}://${endpoint.host}${endpoint.endpoint}`,
    // Información adicional útil
    displayName: `${endpoint.host}${endpoint.endpoint}`,
    verificationStatus: getVerificationStatus(endpoint.state),
    categoryDisplay: endpoint.subcategory
      ? `${endpoint.category} / ${endpoint.subcategory}`
      : endpoint.category
  }))

  // Construir la respuesta con metadatos
  const response = {
    metadata: {
      ...metadata,
      availableCategories: ['defi', 'gaming', 'nft', 'social'],
      availableStates: ['trusted', 'pending', 'rejected'],
      dataFreshness: 'Los datos pueden tener hasta 5 minutos de antigüedad'
    },
    endpoints: enhancedEndpoints
  }

  return JSON.stringify(response, null, 2)
}

/**
 * @description Convierte el estado técnico a una descripción más amigable
 */
function getVerificationStatus (state: string): string {
  switch (state) {
    case 'trusted':
      return 'Verificado'
    case 'pending':
      return 'Pendiente de verificación'
    case 'rejected':
      return 'Rechazado'
    default:
      return 'Estado desconocido'
  }
}
