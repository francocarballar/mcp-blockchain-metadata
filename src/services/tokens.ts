import type { TokenInfo } from '@/types/tokens'
import { PROTOCOL_TOKENLIST_URLS } from '@/constants/url'

/**
 * @description Caché de tokens por protocolo y cadena
 * @type {Record<string, {tokens: TokenInfo[], timestamp: number}>}
 */
const protocolTokenCache: Record<
  string,
  { tokens: TokenInfo[]; timestamp: number }
> = {}

/**
 * @description Mapeo de nombres de cadenas a sus identificadores numéricos
 * @type {Record<string, string>}
 */
const CHAIN_ID_MAPPING: Record<string, string> = {
  avalanche: '43114',
  avax: '43114',
  'avalanche-c': '43114',
  fuji: '43113',
  'fuji-c': '43113',
  'avalanche-fuji': '43113',
  'avalanche-testnet': '43113'
}

// Tiempo de expiración del caché en milisegundos (30 minutos)
const CACHE_EXPIRATION_MS = 30 * 60 * 1000

/**
 * @description Normaliza un identificador de cadena a su formato numérico estándar
 * @param {string} chainId - Identificador de cadena (puede ser un nombre o un ID numérico)
 * @returns {string} El identificador numérico normalizado
 * @throws {Error} Si el nombre de la cadena no está reconocido en el mapeo
 */
function normalizeChainId (chainId: string): string {
  // Si ya es un ID numérico, devolverlo directamente
  if (/^\d+$/.test(chainId)) {
    return chainId
  }

  // Convertir de nombre a ID
  const normalizedChainId = CHAIN_ID_MAPPING[chainId.toLowerCase()]

  if (!normalizedChainId) {
    throw new Error(`Cadena desconocida: ${chainId}`)
  }

  return normalizedChainId
}

/**
 * @description Genera una clave de caché para un protocolo y cadena específicos
 * @param {string} protocolName - Nombre del protocolo
 * @param {string | undefined} targetChainId - ID de cadena (opcional)
 * @returns {string} Clave única para el caché
 */
function getCacheKey (protocolName: string, targetChainId?: string): string {
  const lowerCaseProtocol = protocolName.toLowerCase()
  return targetChainId
    ? `${lowerCaseProtocol}-${targetChainId}`
    : lowerCaseProtocol
}

/**
 * @description Valida un objeto de token y lo convierte al formato TokenInfo
 * @param {any} token - Objeto de token a validar
 * @returns {TokenInfo | null} El token validado o null si es inválido
 */
function validateAndNormalizeToken (token: any): TokenInfo | null {
  if (
    !token?.address ||
    !token?.symbol ||
    !token?.name ||
    typeof token?.decimals !== 'number' ||
    typeof token?.chainId !== 'number'
  ) {
    return null
  }

  return {
    name: token.name,
    symbol: token.symbol,
    address: token.address,
    decimals: token.decimals,
    chainId: String(token.chainId),
    logoURI: token.logoURI || '',
    tags: Array.isArray(token.tags) ? token.tags : [],
    isNative:
      token.address.toLowerCase() ===
      '0x0000000000000000000000000000000000000000'
  }
}

/**
 * @description Recupera tokens de un protocolo específico, opcionalmente filtrados por chainId
 * @param {string} protocolName - Nombre del protocolo (ej: 'lfj', 'traderjoe')
 * @param {string} [chainId] - Identificador de cadena opcional para filtrar los tokens
 * @returns {Promise<TokenInfo[]>} Array de tokens del protocolo
 * @throws {Error} Si el protocolo no está soportado o hay un error al obtener los tokens
 */
export async function getTokensByProtocol (
  protocolName: string,
  chainId?: string
): Promise<TokenInfo[]> {
  if (!protocolName) {
    throw new Error('Nombre de protocolo requerido')
  }

  const lowerCaseProtocol = protocolName.toLowerCase()
  let targetChainId: string | undefined = undefined

  // Normalizar chainId si se proporciona
  if (chainId) {
    try {
      targetChainId = normalizeChainId(chainId)
    } catch (error) {
      throw new Error(
        `Error al normalizar chainId '${chainId}' para protocolo ${protocolName}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  const cacheKey = getCacheKey(lowerCaseProtocol, targetChainId)

  // Verificar caché y su validez
  const cachedData = protocolTokenCache[cacheKey]
  const now = Date.now()

  if (cachedData && now - cachedData.timestamp < CACHE_EXPIRATION_MS) {
    return cachedData.tokens
  }

  // Verificar que el protocolo esté soportado
  const tokenListUrl = PROTOCOL_TOKENLIST_URLS[lowerCaseProtocol]
  if (!tokenListUrl) {
    throw new Error(
      `Protocolo no soportado para listas de tokens: ${protocolName}`
    )
  }

  try {
    // Agregar timeout para evitar solicitudes colgadas
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(tokenListUrl, {
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`)
    }

    const data = (await response.json()) as Record<string, any>

    // Validar, normalizar y filtrar los tokens
    const tokensData = data.tokens || data
    const allTokens = Array.isArray(tokensData) ? tokensData : []

    if (!Array.isArray(allTokens) || allTokens.length === 0) {
      throw new Error('Formato de lista de tokens inválido o vacío')
    }

    const processedTokens: TokenInfo[] = allTokens
      .map(validateAndNormalizeToken)
      .filter((token): token is TokenInfo => token !== null)

    // Filtrar por chainId si se proporciona
    const filteredTokens = targetChainId
      ? processedTokens.filter(token => token.chainId === targetChainId)
      : processedTokens

    // Almacenar en caché con timestamp
    protocolTokenCache[cacheKey] = {
      tokens: filteredTokens,
      timestamp: now
    }

    return filteredTokens
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(
        `Timeout al obtener tokens para protocolo ${protocolName}`
      )
    }

    throw new Error(
      `Error al obtener tokens para protocolo ${protocolName}${
        targetChainId ? ` (Cadena: ${targetChainId})` : ''
      }: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
