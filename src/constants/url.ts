/**
 * @constant {string} REPOSITORY_BASE_URL
 * @description URL base para acceder a la API del repositorio de metadatos blockchain.
 */
export const REPOSITORY_BASE_URL = 'https://api.sherry.social/v1/repository/v1'

/**
 * @constant {string} TEMPLATES_BASE_URL
 * @description URL base para acceder a las plantillas de mini aplicaciones.
 */
export const TEMPLATES_BASE_URL = 'https://api.sherry.social/templates/v1'

/**
 * @constant {string} LFJ_VERIFIED_TOKENLIST_URL
 * @description URL al listado de tokens verificados de Trader Joe en GitHub.
 */
export const LFJ_VERIFIED_TOKENLIST_URL =
  'https://github.com/traderjoe-xyz/joe-tokenlists-v2/blob/main/verified_tokenlist.json'

/**
 * @constant {string} LFJ_POPULAR_TOKENLIST_URL
 * @description URL al listado de tokens populares de Trader Joe en GitHub.
 */
export const LFJ_POPULAR_TOKENLIST_URL =
  'https://github.com/traderjoe-xyz/joe-tokenlists-v2/blob/main/popular_tokenlist.json'

/**
 * @constant {Record<string, string>} PROTOCOL_TOKENLIST_URLS
 * @description Mapeo de protocolos a sus URLs de tokenlists oficiales.
 * Actualmente incluye los listados para LiquidityForJoe (lfj) y TraderJoe.
 */
export const PROTOCOL_TOKENLIST_URLS: Record<string, string> = {
  lfj: 'https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists-v2/main/verified_tokenlist.json',
  traderjoe:
    'https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists-v2/main/verified_tokenlist.json'
}
