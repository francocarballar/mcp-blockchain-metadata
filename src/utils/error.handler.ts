import { logger } from './logger'

/**
 * @function setupErrorHandlers
 * @description Configura manejadores globales para errores no capturados y promesas rechazadas
 */
export function setupErrorHandlers (): void {
  // Manejar excepciones no capturadas
  process.on('uncaughtException', error => {
    logger.error('Excepción no capturada', error)
    // Aquí se podría agregar lógica para enviar a un servicio de monitoreo
  })

  // Manejar rechazos de promesas no manejados
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Rechazo no manejado', reason, { promise })
    // Aquí se podría agregar lógica para enviar a un servicio de monitoreo
  })
}

/**
 * @function logError
 * @description Función para loggear errores de forma estructurada
 * @param {string} message - Mensaje descriptivo del error
 * @param {Error|any} error - Objeto de error o razón
 * @param {Object} [context] - Contexto adicional opcional
 */
export function logError (
  message: string,
  error: Error | any,
  context?: Record<string, any>
): void {
  // Procesar error para obtener más información
  const processedError =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      : error

  // Usar el logger para registrar errores de forma consistente
  logger.error(message, processedError, context)
}

/**
 * @enum ErrorCode
 * @description Códigos de error estandarizados para respuestas JSON-RPC
 */
export enum ErrorCode {
  // Códigos estándar JSON-RPC
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,

  // Códigos personalizados para el servidor MCP
  UNAUTHORIZED = -32000,
  INVALID_SESSION = -32001,
  SESSION_EXPIRED = -32002,
  RATE_LIMIT_EXCEEDED = -32003,
  VALIDATION_ERROR = -32004,
  RESOURCE_NOT_FOUND = -32005,
  SERVICE_UNAVAILABLE = -32006
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
    data?: any
  }
  id: null
}

/**
 * @function createErrorResponse
 * @description Crea una respuesta de error estandarizada para JSON-RPC
 * @param {ErrorCode} code - Código del error
 * @param {string} message - Mensaje descriptivo del error
 * @param {any} [data] - Datos adicionales opcionales sobre el error
 * @returns {ErrorResponse} Respuesta de error formateada
 */
export function createErrorResponse (
  code: ErrorCode,
  message: string,
  data?: any
): ErrorResponse {
  const response: ErrorResponse = {
    jsonrpc: '2.0',
    error: {
      code,
      message
    },
    id: null
  }

  if (data !== undefined) {
    response.error.data = data
  }

  // Registrar el error para seguimiento interno
  logger.debug('Creando respuesta de error JSON-RPC', { code, message, data })

  return response
}

/**
 * @function getErrorMessageForCode
 * @description Obtiene un mensaje de error predeterminado para un código de error
 * @param {ErrorCode} code - Código del error
 * @returns {string} Mensaje predeterminado para el código de error
 */
export function getErrorMessageForCode (code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    [ErrorCode.PARSE_ERROR]: 'Error al procesar la solicitud JSON',
    [ErrorCode.INVALID_REQUEST]: 'La solicitud no es válida',
    [ErrorCode.METHOD_NOT_FOUND]: 'Método no encontrado',
    [ErrorCode.INVALID_PARAMS]: 'Parámetros inválidos',
    [ErrorCode.INTERNAL_ERROR]: 'Error interno del servidor',
    [ErrorCode.UNAUTHORIZED]: 'No autorizado',
    [ErrorCode.INVALID_SESSION]: 'Sesión inválida',
    [ErrorCode.SESSION_EXPIRED]: 'La sesión ha expirado',
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Límite de velocidad excedido',
    [ErrorCode.VALIDATION_ERROR]: 'Error de validación',
    [ErrorCode.RESOURCE_NOT_FOUND]: 'Recurso no encontrado',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'Servicio no disponible'
  }

  return messages[code] || 'Error desconocido'
}
