/**
 * @interface TokenInfo
 * @description Representa información de un token.
 * @property {string} name - El nombre del token.
 * @property {string} symbol - El símbolo del token.
 * @property {string} address - La dirección del token.
 * @property {number} decimals - El número de decimales del token.
 * @property {string} chainId - El ID de la cadena del token.
 * @property {string} logoURI - La URL del logo del token.
 * @property {any[]} tags - Las etiquetas del token.
 * @property {boolean} isNative - Indica si el token es un token nativo.
 * @property {Object} price - El precio del token.
 */
export interface TokenInfo {
  name: string
  symbol: string
  address: string
  decimals: number
  chainId: string
  logoURI?: string
  tags?: any[]
  isNative?: boolean
  price?: {
    usd: number
    lastUpdated: string
  }
}
