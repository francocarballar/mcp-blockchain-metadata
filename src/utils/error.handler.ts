/**
 * @function setupErrorHandlers
 * @description Configura manejadores globales para errores no capturados y promesas rechazadas
 */
export function setupErrorHandlers (): void {
  // Manejar excepciones no capturadas
  process.on('uncaughtException', error => {
    console.error('Excepción no capturada:', error)
    // Aquí se podría agregar lógica para enviar a un servicio de monitoreo
  })

  // Manejar rechazos de promesas no manejados
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Rechazo no manejado en:', promise, 'razón:', reason)
    // Aquí se podría agregar lógica para enviar a un servicio de monitoreo
  })
}

/**
 * @enum ErrorCode
 * @description Códigos de error estandarizados para respuestas JSON-RPC
 */
export enum ErrorCode {
  UNAUTHORIZED = -32000,
  INVALID_SESSION = -32001,
  INTERNAL_ERROR = -32603
}

/**
 * @interface ErrorResponse
 * @description Estructura estandarizada para respuestas de error
 */
export interface ErrorResponse {
  jsonrpc: '2.0'
  error: {
    code: ErrorCode
    message: string
  }
  id: null
}

/**
 * @function createErrorResponse
 * @description Crea una respuesta de error estandarizada para JSON-RPC
 * @param {ErrorCode} code - Código del error
 * @param {string} message - Mensaje descriptivo del error
 * @returns {ErrorResponse} Respuesta de error formateada
 */
export function createErrorResponse (
  code: ErrorCode,
  message: string
): ErrorResponse {
  return {
    jsonrpc: '2.0',
    error: {
      code,
      message
    },
    id: null
  }
}
