import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { TemplatesRepository, Template } from '../types/repository'
import { z } from 'zod'
import { getTemplates } from '../services/repository'

/**
 * @description Esquema de validación para la categoría de plantilla
 */
const CategorySchema = z
  .preprocess(
    val => (typeof val === 'string' ? val.toLocaleLowerCase() : val),
    z.enum(['swap', 'staking', 'lending'])
  )
  .describe('Categoría de la plantilla. Opciones: "swap", "staking", "lending"')

/**
 * @description Esquema de validación para el nombre del protocolo
 */
const ProtocolSchema = z
  .string()
  .min(1, 'Protocol name is required')
  .optional()
  .describe(
    'Nombre del protocolo para filtrar plantillas. Ejemplo: "traderjoe", "aave"'
  )

/**
 * @description Esquema para la búsqueda de texto en plantillas
 */
const SearchQuerySchema = z
  .union([z.string(), z.null()])
  .transform(val => (val === null ? '' : val))
  .optional()
  .describe(
    'Texto para buscar en nombres o identificadores de plantillas. Puede ser null para no filtrar por texto.'
  )

/**
 * @description Esquema para formato de respuesta
 */
const FormatSchema = z
  .enum(['full', 'summary'])
  .optional()
  .default('full')
  .describe(
    'Formato de los metadatos. "full" incluye todos los detalles, "summary" solo información básica. Por defecto: "full"'
  )

/**
 * @description Tiempo máximo de espera para solicitudes fetch en milisegundos
 */
const FETCH_TIMEOUT_MS = 8000

/**
 * @description URL de respaldo para usar cuando los endpoints reales no están disponibles (404)
 */
const FALLBACK_ENDPOINT_URL =
  'https://staging.sherry.social/api/examples/token-mill-swap'

/**
 * @description Interfaz para los metadatos de una plantilla
 */
interface TemplateMetadata {
  templateId: string
  templateName: string
  category: string
  protocol: string
  metadata: Record<string, any>
}

/**
 * @description Lista de protocolos comunes para blockchains
 */
const COMMON_PROTOCOLS = [
  'traderjoe',
  'uniswap',
  'pancakeswap',
  'aave',
  'compound',
  'curve'
]

/**
 * @description Lista de categorías disponibles
 */
const AVAILABLE_CATEGORIES = ['swap', 'staking', 'lending']

/**
 * @description Interfaz para los parámetros de la herramienta
 */
interface TemplateParams {
  category?: 'swap' | 'staking' | 'lending'
  protocol?: string
  query?: string
  format?: 'full' | 'summary'
}

/**
 * @description Registra la herramienta get_metadata_of_template en el servidor MCP
 */
export function registerGetMetadataOfTemplateTool (server: McpServer) {
  server.tool(
    'get_metadata_of_template',
    'Obtiene estructuras JSON completas y oficiales de templates/plantillas de aplicaciones blockchain, configuradas para casos de uso específicos. USAR ESTA HERRAMIENTA cuando se solicite: código para DeFi, estructura de swap, template de intercambio, plantilla para staking, código para lending/préstamos, ejemplo funcional de TraderJoe, implementación de Uniswap, código de PancakeSwap, o cualquier solicitud relacionada con obtener estructuras predefinidas para aplicaciones DeFi. Esta herramienta proporciona metadatos detallados de plantillas reales utilizadas en producción, incluyendo componentes, funciones, interfaces y configuraciones necesarias para operar con protocolos específicos. Soporta filtrado por categorías (swap, staking, lending), protocolos (traderjoe, uniswap, pancakeswap, aave, compound, curve, etc.), con formato completo o resumido. NO GENERA CÓDIGO NUEVO, sino que devuelve templates verificados y listos para usar. El resultado es un JSON estructurado que contiene todos los elementos necesarios para implementar la funcionalidad solicitada en aplicaciones blockchain.',
    {
      category: CategorySchema,
      protocol: ProtocolSchema,
      query: SearchQuerySchema,
      format: FormatSchema
    },
    async (params: TemplateParams) => {
      try {
        const { category, protocol, query, format = 'full' } = params

        // Proporcionar instrucciones de ayuda si se solicita un template sin parámetros específicos
        if (!category && !protocol) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `
# Catálogo de Templates Blockchain - Estructuras oficiales para DeFi

Esta herramienta proporciona plantillas verificadas y predefinidas para implementaciones blockchain, sin necesidad de crear código desde cero. Las plantillas son estructuras JSON completas listas para usar.

## Categorías disponibles (requerido):
- **swap**: Interfaces y componentes para intercambio de tokens (DEX)
- **staking**: Sistemas para depositar y obtener recompensas por tokens
- **lending**: Plataformas de préstamos y depósitos con interés

## Protocolos soportados (recomendado):
${COMMON_PROTOCOLS.map(
  p =>
    `- **${p}**: Template oficial para ${
      p.charAt(0).toUpperCase() + p.slice(1)
    }`
).join('\n')}
- Y otros protocolos DeFi disponibles

## Ejemplos de uso:
- Para un template oficial de intercambio en TraderJoe: category="swap", protocol="traderjoe"
- Para obtener la implementación de staking en Aave: category="staking", protocol="aave"
- Para todas las opciones de lending disponibles: category="lending"

## Formato de respuesta:
- **full**: Estructura JSON completa con todos los detalles (predeterminado)
- **summary**: Versión resumida con información básica

Los templates contienen toda la información necesaria para implementar la funcionalidad en tu aplicación, sin necesidad de escribir código adicional.
`
              }
            ]
          }
        }

        const repositoryData = await getTemplates()

        // Si se especificó un protocolo, registrarlo para analítica
        if (protocol) {
          console.error(
            `Solicitud de template para protocolo: ${protocol}, categoría: ${
              category || 'cualquiera'
            }`
          )
        }

        // Filtrar plantillas relevantes basadas en los parámetros
        const matchingTemplates = filterTemplates(
          repositoryData,
          category,
          protocol,
          query
        )

        if (matchingTemplates.length === 0) {
          return createEmptyResponse({ category, protocol, query })
        }

        // Obtener metadatos de plantillas filtradas
        const metadata = await fetchTemplatesMetadata(matchingTemplates, format)

        if (metadata.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'No se pudo obtener metadatos para ninguna de las plantillas encontradas. Intenta con otros filtros o verifica la conexión.'
              }
            ]
          }
        }

        // Formatear respuesta final
        const response = formatMetadataResponse(metadata, {
          category,
          protocol,
          query,
          format,
          totalTemplates: matchingTemplates.length,
          fetchedTemplates: metadata.length,
          timestamp: new Date().toISOString()
        })

        return {
          content: [
            {
              type: 'text' as const,
              text: response
            }
          ]
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido'
        return createErrorResponse(
          `Error al procesar la solicitud de metadatos de plantilla: ${errorMessage}. ` +
            `Verifica tu conexión y los parámetros proporcionados. ` +
            `Categorías disponibles: ${AVAILABLE_CATEGORIES.join(', ')}. ` +
            `Ejemplos de protocolo: ${COMMON_PROTOCOLS.slice(0, 3).join(', ')}.`
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
 * @description Crea una respuesta para cuando no se encuentran plantillas
 */
function createEmptyResponse (filters: {
  category?: string
  protocol?: string
  query?: string
}) {
  let message = `No se encontraron plantillas`

  const appliedFilters = []
  if (filters.category) {
    appliedFilters.push(`categoría: "${filters.category}"`)
  }
  if (filters.protocol) {
    appliedFilters.push(`protocolo: "${filters.protocol}"`)
  }
  if (filters.query) {
    appliedFilters.push(`búsqueda: "${filters.query}"`)
  }

  if (appliedFilters.length > 0) {
    message += ` con los filtros: ${appliedFilters.join(', ')}`
  }

  message +=
    `. Categorías disponibles: ${AVAILABLE_CATEGORIES.join(', ')}. ` +
    `Prueba con otros filtros o utiliza valores más generales.`

  return {
    content: [{ type: 'text' as const, text: message }]
  }
}

/**
 * @description Filtra plantillas según categoría, protocolo y texto de búsqueda
 */
function filterTemplates (
  repositories: TemplatesRepository[],
  category?: string,
  protocol?: string,
  query?: string
): Array<{ template: Template; baseUrl: string; categoryId: string }> {
  console.error(
    `Buscando plantillas con: categoria=${
      category || 'cualquiera'
    }, protocolo=${protocol || 'cualquiera'}, query=${query || 'ninguna'}`
  )

  const lowerCaseCategory = category?.toLowerCase()
  const lowerCaseProtocol = protocol?.toLowerCase()
  const lowerCaseQuery = query?.toLowerCase()

  const results: Array<{
    template: Template
    baseUrl: string
    categoryId: string
  }> = []

  for (const repo of repositories) {
    console.error(`Explorando repositorio con baseUrl: ${repo.baseUrl}`)

    for (const cat of repo.categories) {
      // Saltar categorías que no coinciden con el filtro
      if (lowerCaseCategory && cat.id.toLowerCase() !== lowerCaseCategory) {
        continue
      }

      console.error(
        `Explorando categoría: ${cat.id} con ${cat.templates.length} plantillas`
      )

      for (const template of cat.templates) {
        // Saltar protocolos que no coinciden con el filtro
        if (
          lowerCaseProtocol &&
          !template.protocol.toLowerCase().includes(lowerCaseProtocol)
        ) {
          continue
        }

        // Saltar plantillas que no coinciden con la búsqueda de texto
        if (
          lowerCaseQuery &&
          !template.name.toLowerCase().includes(lowerCaseQuery) &&
          !template.id.toLowerCase().includes(lowerCaseQuery)
        ) {
          continue
        }

        console.error(
          `Plantilla encontrada: ${template.id} (${template.name}) del protocolo ${template.protocol} - endpoint: ${template.endpoint}`
        )

        results.push({
          template,
          baseUrl: repo.baseUrl,
          categoryId: cat.id
        })
      }
    }
  }

  console.error(`Total de plantillas encontradas: ${results.length}`)
  return results
}

/**
 * @description Obtiene metadatos para un conjunto de plantillas
 */
async function fetchTemplatesMetadata (
  templates: Array<{ template: Template; baseUrl: string; categoryId: string }>,
  format: string = 'full'
): Promise<TemplateMetadata[]> {
  // Log cuántas plantillas se encontraron
  console.error(
    `Encontradas ${templates.length} plantillas que coinciden con los criterios`
  )

  const fetchPromises = templates.map(
    async ({ template, baseUrl, categoryId }) => {
      const metadataUrl = `${baseUrl}${template.endpoint}`
      console.error(`Intentando obtener datos de: ${metadataUrl}`)

      try {
        // Implementar timeout para evitar solicitudes colgadas
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

        const response = await fetch(metadataUrl, {
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          console.error(
            `Error en la respuesta para ${metadataUrl}: ${response.status} ${response.statusText}`
          )

          // Si es un error 404, usar el endpoint de respaldo
          if (response.status === 404) {
            console.error(`Usando URL de respaldo: ${FALLBACK_ENDPOINT_URL}`)

            try {
              const fallbackController = new AbortController()
              const fallbackTimeoutId = setTimeout(
                () => fallbackController.abort(),
                FETCH_TIMEOUT_MS
              )

              const fallbackResponse = await fetch(FALLBACK_ENDPOINT_URL, {
                signal: fallbackController.signal
              })
              clearTimeout(fallbackTimeoutId)

              if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json()
                console.error(
                  `Datos obtenidos correctamente del endpoint de respaldo`
                )

                return {
                  templateId: template.id,
                  templateName: template.name,
                  category: categoryId,
                  protocol: template.protocol,
                  metadata:
                    format === 'summary' && fallbackData
                      ? simplifyMetadata(fallbackData)
                      : fallbackData,
                  usedFallback: true
                }
              } else {
                console.error(
                  `También falló el endpoint de respaldo: ${fallbackResponse.status} ${fallbackResponse.statusText}`
                )
              }
            } catch (fallbackError) {
              console.error(
                `Error al obtener datos del endpoint de respaldo: ${
                  fallbackError instanceof Error
                    ? fallbackError.message
                    : String(fallbackError)
                }`
              )
            }
          }

          // Guardar el código de error para manejarlo específicamente
          return {
            templateId: template.id,
            templateName: template.name,
            category: categoryId,
            protocol: template.protocol,
            metadata: null,
            error: {
              code: response.status,
              message: response.statusText
            }
          }
        }

        const metadata = await response.json()
        console.error(`Datos obtenidos correctamente de ${metadataUrl}`)

        return {
          templateId: template.id,
          templateName: template.name,
          category: categoryId,
          protocol: template.protocol,
          metadata:
            format === 'summary' && metadata
              ? simplifyMetadata(metadata)
              : metadata
        }
      } catch (error) {
        // No interrumpir otras solicitudes si una falla
        console.error(
          `Error obteniendo datos de ${metadataUrl}: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
        return {
          templateId: template.id,
          templateName: template.name,
          category: categoryId,
          protocol: template.protocol,
          metadata: null,
          error: {
            code:
              error instanceof Error && error.name === 'AbortError' ? 408 : 500,
            message: error instanceof Error ? error.message : String(error)
          }
        }
      }
    }
  )

  const results = await Promise.allSettled(fetchPromises)

  // Modificamos para contar cuántos errores 404 hay
  const successful = results.filter(
    r =>
      r.status === 'fulfilled' && r.value !== null && r.value.metadata !== null
  ).length

  const notFoundCount = results.filter(
    r =>
      r.status === 'fulfilled' &&
      r.value !== null &&
      r.value.error?.code === 404
  ).length

  const usedFallbackCount = results.filter(
    r =>
      r.status === 'fulfilled' &&
      r.value !== null &&
      r.value.usedFallback === true
  ).length

  console.error(
    `De ${templates.length} plantillas encontradas, se obtuvieron datos para ${successful}, con ${notFoundCount} errores 404 y ${usedFallbackCount} usando URL de respaldo`
  )

  // Si todos son errores 404 y ninguno usó fallback exitosamente, mostrar mensaje de error
  if (notFoundCount === templates.length && usedFallbackCount === 0) {
    return [
      {
        templateId: 'error',
        templateName: 'Error 404',
        category: 'error',
        protocol: 'error',
        metadata: {
          error:
            'Todos los recursos solicitados devolvieron 404 Not Found. Es posible que la API haya cambiado o que las plantillas no estén disponibles temporalmente.'
        }
      }
    ]
  }

  return results
    .filter(
      (result): result is PromiseFulfilledResult<TemplateMetadata> =>
        result.status === 'fulfilled' &&
        result.value !== null &&
        result.value.metadata !== null
    )
    .map(result => result.value as TemplateMetadata)
}

/**
 * @description Simplifica el metadata para el formato resumido
 */
function simplifyMetadata (metadata: Record<string, any>): Record<string, any> {
  // Extraer solo información básica para resumir
  const simplifiedMetadata: Record<string, any> = {}

  // Incluir solo propiedades de nivel superior para resumir
  const keysToInclude = [
    'name',
    'description',
    'version',
    'author',
    'type',
    'category'
  ]

  for (const key of keysToInclude) {
    if (metadata[key] !== undefined) {
      simplifiedMetadata[key] = metadata[key]
    }
  }

  // Incluir conteo de elementos si hay arrays
  for (const [key, value] of Object.entries(metadata)) {
    if (Array.isArray(value)) {
      simplifiedMetadata[`${key}Count`] = value.length
    }
  }

  return simplifiedMetadata
}

/**
 * @description Formatea la respuesta final de metadatos
 */
function formatMetadataResponse (
  metadata: TemplateMetadata[],
  contextInfo: {
    category?: string
    protocol?: string
    query?: string
    format: string
    totalTemplates: number
    fetchedTemplates: number
    timestamp: string
  }
): string {
  // Determinar si el resultado contiene un mensaje de error específico
  if (metadata.length === 1 && metadata[0].templateId === 'error') {
    return metadata[0].metadata.error
  }

  // Agregar una nota si algunos datos provienen del endpoint de respaldo
  const usedFallback = metadata.some((item: any) => item.usedFallback === true)

  const response = {
    metadata: {
      ...contextInfo,
      availableCategories: AVAILABLE_CATEGORIES,
      commonProtocols: COMMON_PROTOCOLS,
      dataFreshness: 'Los datos pueden tener hasta 5 minutos de antigüedad',
      note: usedFallback
        ? 'Algunos datos se obtuvieron de un endpoint de respaldo porque los originales no estaban disponibles.'
        : undefined
    },
    templates: metadata.map(item => {
      // Crear una copia sin la propiedad usedFallback en la respuesta final
      const { usedFallback, ...rest } = item as any
      return rest
    })
  }

  return JSON.stringify(response, null, 2)
}
