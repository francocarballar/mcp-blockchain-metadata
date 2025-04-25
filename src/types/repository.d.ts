/**
 * @interface IntegratorDomain
 * @description Representa un dominio de integrador en el repositorio.
 * @property {string} domain - El dominio del integrador.
 * @property {'trusted' | 'pending' | 'rejected'} state - El estado del dominio del integrador.
 * @property {string} verifiedAt - La fecha y hora en que se verificó el dominio del integrador.
 */
export interface IntegratorDomain {
  domain: string
  state: 'trusted' | 'pending' | 'rejected'
  verifiedAt: string
}

/**
 * @interface MiniAppEndpoint
 * @description Representa un punto de conexión de mini aplicación en el repositorio.
 * @property {string} host - El host del punto de conexión de la mini aplicación.
 * @property {'trusted' | 'pending' | 'rejected'} state - El estado del punto de conexión de la mini aplicación.
 * @property {string} category - La categoría del punto de conexión de la mini aplicación.
 * @property {string} subcategory - La subcategoría del punto de conexión de la mini aplicación.
 * @property {string} verifiedAt - La fecha y hora en que se verificó el punto de conexión de la mini aplicación.
 * @property {string} protocol - El protocolo del punto de conexión de la mini aplicación.
 * @property {string} endpoint - El punto de conexión de la mini aplicación.
 */
export interface MiniAppEndpoint {
  host: string
  state: 'trusted' | 'pending' | 'rejected'
  category: string
  subcategory?: string
  verifiedAt: string
  protocol: string
  endpoint: string
}

/**
 * @interface Template
 * @description Representa una plantilla en el repositorio.
 * @property {string} id - El id de la plantilla.
 * @property {string} name - El nombre de la plantilla.
 * @property {string} protocol - El protocolo de la plantilla.
 * @property {string} endpoint - El punto de conexión de la plantilla.
 */
export interface Template {
  id: string
  name: string
  protocol: string
  endpoint: string
}

/**
 * @interface TemplateCategory
 * @description Representa una categoría de plantillas en el repositorio.
 * @property {string} id - El id de la categoría.
 * @property {string} name - El nombre de la categoría.
 * @property {Template[]} templates - Las plantillas en la categoría.
 */
export interface TemplateCategory {
  id: string
  name: string
  templates: Template[]
}

/**
 * @interface TemplatesRepository
 * @description Representa el repositorio de plantillas en el repositorio.
 * @property {string} baseUrl - La URL base del repositorio.
 * @property {TemplateCategory[]} categories - Las categorías de plantillas en el repositorio.
 */
export interface TemplatesRepository {
  baseUrl: string
  categories: TemplateCategory[]
}

/**
 * @interface MaliciousDomain
 * @description Representa un dominio malicioso en el repositorio.
 * @property {string} domain - El dominio del dominio malicioso.
 * @property {string} reportedAt - La fecha y hora en que se reportó el dominio malicioso.
 * @property {string} reportReason - El motivo del reporte del dominio malicioso.
 * @property {string} similarTo - El dominio que es similar al dominio malicioso.
 */
export interface MaliciousDomain {
  domain: string
  reportedAt: string
  reportReason: string
  similarTo?: string
}

/**
 * @interface Repository
 * @description Representa el repositorio del repositorio.
 * @property {string} lastUpdated - La fecha y hora en que se actualizó por última vez el repositorio.
 * @property {string} version - La versión del repositorio.
 * @property {IntegratorDomain[]} integratorDomains - Los dominios de integradores en el repositorio.
 * @property {MiniAppEndpoint[]} miniAppEndpoints - Los puntos de conexión de mini aplicaciones en el repositorio.
 * @property {TemplatesRepository[]} templates - Las plantillas en el repositorio.
 * @property {MaliciousDomain[]} maliciousDomains - Los dominios maliciosos en el repositorio.
 */
export interface Repository {
  lastUpdated: string
  version: string
  integratorDomains: IntegratorDomain[]
  miniAppEndpoints: MiniAppEndpoint[]
  templates: TemplatesRepository[]
  maliciousDomains: MaliciousDomain[]
}

/**
 * @interface MiniAppSearchParams
 * @description Representa los parámetros para la búsqueda de mini aplicaciones.
 * @property {string} query - La consulta para la búsqueda de mini aplicaciones.
 * @property {string} category - La categoría para la búsqueda de mini aplicaciones.
 * @property {string} subcategory - La subcategoría para la búsqueda de mini aplicaciones.
 * @property {string} protocol - El protocolo para la búsqueda de mini aplicaciones.
 */
export interface MiniAppSearchParams {
  query?: string
  category?: string
  subcategory?: string
  protocol?: string
}

/**
 * @interface MiniAppSearchResult
 * @description Representa el resultado de la búsqueda de mini aplicaciones.
 * @property {MiniAppEndpoint} endpoint - El punto de conexión de la mini aplicación.
 * @property {number} relevance - La relevancia de la mini aplicación.
 * @property {string} matchReason - El motivo de la coincidencia de la mini aplicación.
 */
export interface MiniAppSearchResult {
  endpoint: MiniAppEndpoint
  relevance: number
  matchReason: string
}

/**
 * @interface CustomizeMiniAppEndpointParams
 * @description Representa los parámetros para personalizar el punto de conexión de mini aplicaciones.
 * @property {string} type - El tipo del punto de conexión personalizado de mini aplicaciones.
 * @property {string} host - El host del punto de conexión personalizado de mini aplicaciones.
 * @property {string} endpoint - El punto de conexión personalizado de mini aplicaciones.
 * @property {Record<string, any>} params - Los parámetros del punto de conexión personalizado de mini aplicaciones.
 */
export interface CustomizeMiniAppEndpointParams {
  type: 'endpoint'
  host: string
  endpoint: string
  params: Record<string, any>
}

/**
 * @interface CustomizeMiniAppTemplateParams
 * @description Representa los parámetros para personalizar la plantilla de mini aplicaciones.
 * @property {string} type - El tipo de la plantilla personalizada de mini aplicaciones.
 * @property {string} categoryId - El id de la categoría de la plantilla personalizada de mini aplicaciones.
 * @property {string} templateId - El id de la plantilla personalizada de mini aplicaciones.
 * @property {Record<string, any>} params - Los parámetros de la plantilla personalizada de mini aplicaciones.
 */
export interface CustomizeMiniAppTemplateParams {
  type: 'template'
  categoryId: string
  templateId: string
  params: Record<string, any>
}

/**
 * @type {CustomizeMiniAppParams}
 * @description Representa los parámetros para personalizar la mini aplicación.
 * @property {CustomizeMiniAppEndpointParams | CustomizeMiniAppTemplateParams} params - Los parámetros de la mini aplicación personalizada.
 */
export type CustomizeMiniAppParams =
  | CustomizeMiniAppEndpointParams
  | CustomizeMiniAppTemplateParams
