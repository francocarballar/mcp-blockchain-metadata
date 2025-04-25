import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { MiniAppEndpoint, Repository } from '@/types/repository'
import { z } from 'zod'
import { getRepository } from '@/services/repository'

/**
 * @description Esquema de validación para las categorías de mini aplicaciones
 * @constant {z.ZodType}
 */
const RepositoryCategorySchema = z.preprocess(
  val => (typeof val === 'string' ? val.toLocaleLowerCase() : val),
  z.enum(['all', 'defi', 'gaming', 'nft', 'social'])
  //'all', 'DeFi', 'Gaming', 'NFT', 'Social'
)

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
 * @param {McpServer} server - Instancia del servidor MCP
 */
export function registerGetMiniAppEndpointsTool (server: McpServer) {
  /**
   * Retrieves a list of Mini App endpoints from the repository, optionally filtered by category.
   *
   * @param {string} [category] - The category to filter by (e.g., "defi", "gaming", "nft", "social"). If omitted or "all", returns all endpoints.
   * @returns {Promise<{content: [{type: "text", text: string}]}>} A JSON string representing the list of filtered Mini App endpoints.
   */
  server.tool(
    'get_miniapp_endpoints',
    { category: RepositoryCategorySchema.optional() },
    async ({ category }, _extra) => {
      try {
        const repositoryData = await getRepository()

        // Obtener endpoints filtrados por categoría
        const filteredEndpoints = filterEndpointsByCategory(
          repositoryData,
          category
        )

        if (filteredEndpoints.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `No se encontraron endpoints para la categoría: ${
                  category || 'cualquiera'
                }`
              }
            ]
          }
        }

        // Formatea los endpoints para la respuesta
        const formattedEndpoints = formatEndpointsResponse(filteredEndpoints)

        return {
          content: [{ type: 'text' as const, text: formattedEndpoints }]
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido'
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error al obtener endpoints de mini aplicaciones: ${errorMessage}`
            }
          ]
        }
      }
    }
  )
}

/**
 * @description Filtra endpoints de mini aplicaciones por categoría
 * @param {Repository} repository - Datos del repositorio
 * @param {string | undefined} category - Categoría para filtrar (opcional)
 * @returns {MiniAppEndpoint[]} Lista de endpoints filtrados
 */
function filterEndpointsByCategory (
  repository: Repository,
  category?: string
): MiniAppEndpoint[] {
  // Si no hay categoría o es 'all', devolver todos los endpoints
  if (!category || category.toLowerCase() === 'all') {
    return repository.miniAppEndpoints
  }

  const lowerCaseCategory = category.toLowerCase()

  return repository.miniAppEndpoints.filter(
    endpoint => endpoint.category.toLowerCase() === lowerCaseCategory
  )
}

/**
 * @description Formatea los endpoints para la respuesta de la herramienta
 * @param {MiniAppEndpoint[]} endpoints - Lista de endpoints a formatear
 * @returns {string} JSON formateado con los endpoints
 */
function formatEndpointsResponse (endpoints: MiniAppEndpoint[]): string {
  // Enriquece los datos con información adicional si es necesario
  const enhancedEndpoints = endpoints.map(endpoint => ({
    ...endpoint,
    fullUrl: `${endpoint.protocol}://${endpoint.host}${endpoint.endpoint}`
  }))

  return JSON.stringify(enhancedEndpoints, null, 2)
}
