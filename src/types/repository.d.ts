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
 * @property {string} host - El host del punto de conexión.
 * @property {'trusted' | 'pending' | 'rejected'} state - El estado de verificación del punto de conexión.
 * @property {string} category - La categoría a la que pertenece la mini aplicación.
 * @property {string} subcategory - La subcategoría opcional a la que pertenece la mini aplicación.
 * @property {string} verifiedAt - La fecha y hora en que se verificó el punto de conexión.
 * @property {string} protocol - El protocolo utilizado por la mini aplicación.
 * @property {string} endpoint - La ruta específica del punto de conexión.
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
 * @description Representa una plantilla de mini aplicación disponible en el repositorio.
 * @property {string} id - El identificador único de la plantilla.
 * @property {string} name - El nombre descriptivo de la plantilla.
 * @property {string} protocol - El protocolo compatible con la plantilla.
 * @property {string} endpoint - El punto de conexión asociado a la plantilla.
 */
export interface Template {
  id: string
  name: string
  protocol: string
  endpoint: string
}

/**
 * @interface TemplateCategory
 * @description Representa una categoría que agrupa plantillas relacionadas.
 * @property {string} id - El identificador único de la categoría.
 * @property {string} name - El nombre descriptivo de la categoría.
 * @property {Template[]} templates - La lista de plantillas pertenecientes a esta categoría.
 */
export interface TemplateCategory {
  id: string
  name: string
  templates: Template[]
}

/**
 * @interface TemplatesRepository
 * @description Representa la estructura del repositorio de plantillas disponibles.
 * @property {string} baseUrl - La URL base desde donde se sirven las plantillas.
 * @property {TemplateCategory[]} categories - Las categorías de plantillas disponibles.
 */
export interface TemplatesRepository {
  baseUrl: string
  categories: TemplateCategory[]
}

/**
 * @interface MaliciousDomain
 * @description Representa un dominio identificado como malicioso o fraudulento.
 * @property {string} domain - La dirección del dominio malicioso.
 * @property {string} reportedAt - La fecha y hora en que se reportó como malicioso.
 * @property {string} reportReason - El motivo por el cual se considera malicioso.
 * @property {string} similarTo - Opcional: dominio legítimo al que intenta suplantar.
 */
export interface MaliciousDomain {
  domain: string
  reportedAt: string
  reportReason: string
  similarTo?: string
}

/**
 * @interface Repository
 * @description Representa la estructura principal del repositorio de metadatos de blockchain.
 * @property {string} lastUpdated - La fecha y hora de la última actualización del repositorio.
 * @property {string} version - La versión actual del repositorio.
 * @property {IntegratorDomain[]} integratorDomains - Lista de dominios de integradores registrados.
 * @property {MiniAppEndpoint[]} miniAppEndpoints - Lista de puntos de conexión de mini aplicaciones.
 * @property {TemplatesRepository[]} templates - Colección de repositorios de plantillas disponibles.
 * @property {MaliciousDomain[]} maliciousDomains - Lista de dominios identificados como maliciosos.
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
 * @description Parámetros de búsqueda para filtrar mini aplicaciones.
 * @property {string} query - Término de búsqueda textual.
 * @property {string} category - Filtro por categoría específica.
 * @property {string} subcategory - Filtro por subcategoría específica.
 * @property {string} protocol - Filtro por protocolo compatible.
 */
export interface MiniAppSearchParams {
  query?: string
  category?: string
  subcategory?: string
  protocol?: string
}

/**
 * @interface MiniAppSearchResult
 * @description Resultado obtenido tras una búsqueda de mini aplicaciones.
 * @property {MiniAppEndpoint} endpoint - El punto de conexión de la mini aplicación encontrada.
 * @property {number} relevance - Puntuación numérica de relevancia respecto a la búsqueda.
 * @property {string} matchReason - Explicación de por qué este resultado coincide con la búsqueda.
 */
export interface MiniAppSearchResult {
  endpoint: MiniAppEndpoint
  relevance: number
  matchReason: string
}

/**
 * @interface CustomizeMiniAppEndpointParams
 * @description Parámetros para personalizar una mini aplicación mediante un punto de conexión directo.
 * @property {string} type - Tipo de personalización, siempre 'endpoint' para este caso.
 * @property {string} host - El host del punto de conexión que se utilizará.
 * @property {string} endpoint - La ruta específica del punto de conexión.
 * @property {Record<string, any>} params - Parámetros adicionales para la configuración.
 */
export interface CustomizeMiniAppEndpointParams {
  type: 'endpoint'
  host: string
  endpoint: string
  params: Record<string, any>
}

/**
 * @interface CustomizeMiniAppTemplateParams
 * @description Parámetros para personalizar una mini aplicación utilizando una plantilla predefinida.
 * @property {string} type - Tipo de personalización, siempre 'template' para este caso.
 * @property {string} categoryId - El identificador de la categoría de la plantilla.
 * @property {string} templateId - El identificador de la plantilla específica.
 * @property {Record<string, any>} params - Parámetros adicionales para configurar la plantilla.
 */
export interface CustomizeMiniAppTemplateParams {
  type: 'template'
  categoryId: string
  templateId: string
  params: Record<string, any>
}

/**
 * @type {CustomizeMiniAppParams}
 * @description Tipo unión que representa las dos posibles formas de personalizar una mini aplicación.
 * @property {CustomizeMiniAppEndpointParams | CustomizeMiniAppTemplateParams} params - Los parámetros específicos según el método de personalización elegido.
 */
export type CustomizeMiniAppParams =
  | CustomizeMiniAppEndpointParams
  | CustomizeMiniAppTemplateParams
