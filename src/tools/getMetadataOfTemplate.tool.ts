import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { TemplatesRepository, Template } from '@/types/repository'
import { z } from 'zod'
import { getTemplates } from '@/services/repository'

/**
 * @description Esquema de validación para la categoría de plantilla
 * @constant {z.ZodType}
 */
const CategorySchema = z.preprocess(
  val => (typeof val === 'string' ? val.toLocaleLowerCase() : val),
  z.enum(['swap', 'staking', 'lending'])
)

/**
 * @description Esquema de validación para el nombre del protocolo
 * @constant {z.ZodType}
 */
const ProtocolSchema = z.string().min(1, 'Protocol name is required')

/**
 * @description Tiempo máximo de espera para solicitudes fetch en milisegundos
 * @constant {number}
 */
const FETCH_TIMEOUT_MS = 5000

/**
 * @description Interfaz para los metadatos de una plantilla
 * @interface TemplateMetadata
 */
interface TemplateMetadata {
  templateId: string
  templateName: string
  category: string
  protocol: string
  metadata: Record<string, any>
}

/**
 * @description Registra la herramienta get_metadata_of_template en el servidor MCP
 * @param {McpServer} server - Instancia del servidor MCP
 */
export function registerGetMetadataOfTemplateTool (server: McpServer) {
  server.tool(
    'get_metadata_of_template',
    {
      category: CategorySchema.optional(),
      protocol: ProtocolSchema.optional()
    },
    async ({ category, protocol }) => {
      try {
        const repositoryData = await getTemplates()

        // Filtrar plantillas relevantes basadas en los parámetros
        const matchingTemplates = filterTemplates(
          repositoryData,
          category,
          protocol
        )

        if (matchingTemplates.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No se encontraron plantillas que coincidan con los criterios especificados: ${
                  category ? `categoría=${category}` : ''
                } ${protocol ? `protocolo=${protocol}` : ''}`
              }
            ]
          }
        }

        // Obtener metadatos de plantillas filtradas
        const metadata = await fetchTemplatesMetadata(matchingTemplates)

        if (metadata.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No se pudo obtener metadatos para ninguna de las plantillas encontradas.'
              }
            ]
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(metadata, null, 2)
            }
          ]
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido'
        return {
          content: [
            {
              type: 'text',
              text: `Error al procesar la solicitud de metadatos de plantilla: ${errorMessage}`
            }
          ]
        }
      }
    }
  )
}

/**
 * @description Filtra plantillas según categoría y protocolo
 * @param {TemplatesRepository[]} repositories - Repositorios de plantillas
 * @param {string | undefined} category - Categoría opcional para filtrar
 * @param {string | undefined} protocol - Protocolo opcional para filtrar
 * @returns {Array<{template: Template, baseUrl: string, categoryId: string}>} Plantillas filtradas con información de contexto
 */
function filterTemplates (
  repositories: TemplatesRepository[],
  category?: string,
  protocol?: string
): Array<{ template: Template; baseUrl: string; categoryId: string }> {
  const lowerCaseCategory = category?.toLowerCase()
  const lowerCaseProtocol = protocol?.toLowerCase()

  const results: Array<{
    template: Template
    baseUrl: string
    categoryId: string
  }> = []

  for (const repo of repositories) {
    for (const cat of repo.categories) {
      // Saltar categorías que no coinciden con el filtro
      if (lowerCaseCategory && cat.id.toLowerCase() !== lowerCaseCategory) {
        continue
      }

      for (const template of cat.templates) {
        // Saltar protocolos que no coinciden con el filtro
        if (
          lowerCaseProtocol &&
          !template.protocol.toLowerCase().includes(lowerCaseProtocol)
        ) {
          continue
        }

        results.push({
          template,
          baseUrl: repo.baseUrl,
          categoryId: cat.id
        })
      }
    }
  }

  return results
}

/**
 * @description Obtiene metadatos para un conjunto de plantillas
 * @param {Array<{template: Template, baseUrl: string, categoryId: string}>} templates - Plantillas para obtener metadatos
 * @returns {Promise<TemplateMetadata[]>} Array de metadatos de plantillas
 */
async function fetchTemplatesMetadata (
  templates: Array<{ template: Template; baseUrl: string; categoryId: string }>
): Promise<TemplateMetadata[]> {
  const fetchPromises = templates.map(
    async ({ template, baseUrl, categoryId }) => {
      const metadataUrl = `${baseUrl}${template.endpoint}`

      try {
        // Implementar timeout para evitar solicitudes colgadas
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

        const response = await fetch(metadataUrl, {
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          return null
        }

        const metadata = await response.json()

        return {
          templateId: template.id,
          templateName: template.name,
          category: categoryId,
          protocol: template.protocol,
          metadata
        }
      } catch (error) {
        // No interrumpir otras solicitudes si una falla
        return null
      }
    }
  )

  const results = await Promise.allSettled(fetchPromises)

  return results
    .filter(
      (result): result is PromiseFulfilledResult<TemplateMetadata> =>
        result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value as TemplateMetadata)
}
