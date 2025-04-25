import { Context } from 'hono'
import { createErrorResponse, ErrorCode } from '../utils/error.handler'
import { logger } from '../utils/logger'

/**
 * @function createAuthMiddleware
 * @description Middleware de autenticación para proteger endpoints MCP
 * Verifica que el token de autorización sea válido antes de permitir el acceso
 * @param {string} authToken - Token de autorización para validar solicitudes
 * @returns {Function} Middleware para usar con Hono
 */
export const createAuthMiddleware = (authToken?: string) => {
  if (!authToken) {
    logger.warn(
      'Auth middleware configurado sin token de autenticación. Todas las solicitudes serán permitidas.'
    )
  } else {
    logger.info('Auth middleware configurado con token de autenticación')
  }

  /**
   * @function authMiddlewareHandler
   * @description Handler del middleware de autenticación
   * @param {Context} c - Contexto de Hono
   * @param {Function} next - Función para continuar al siguiente middleware
   * @returns {Promise<Response>} Respuesta de error o continúa al siguiente middleware
   */
  return async (c: Context, next: () => Promise<void>) => {
    // Si no hay token configurado, permitir todas las solicitudes
    if (!authToken) {
      logger.debug('Solicitud permitida (sin autenticación requerida)')
      return next()
    }

    const authHeader = c.req.header('authorization')
    const requestInfo = {
      path: c.req.path,
      method: c.req.method,
      headers: Object.fromEntries(
        Object.entries(c.req.header()).filter(
          ([key]) => !['authorization', 'cookie'].includes(key.toLowerCase())
        )
      )
    }

    // Verificar formato del header de autorización
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(
        'Solicitud rechazada: header Authorization faltante o inválido',
        requestInfo
      )
      return c.json(
        createErrorResponse(
          ErrorCode.UNAUTHORIZED,
          'No autorizado: Header Authorization inválido'
        ),
        401
      )
    }

    // Verificar token
    const token = authHeader.slice(7)
    if (token !== authToken) {
      logger.warn('Solicitud rechazada: token inválido', requestInfo)
      return c.json(
        createErrorResponse(
          ErrorCode.UNAUTHORIZED,
          'No autorizado: Token inválido'
        ),
        401
      )
    }

    // Autenticación exitosa
    logger.debug('Solicitud autenticada correctamente', requestInfo)

    await next()
  }
}
