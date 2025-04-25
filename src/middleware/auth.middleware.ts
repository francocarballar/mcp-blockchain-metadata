import { Context } from 'hono'

/**
 * @function authMiddleware
 * @description Middleware de autenticación para proteger endpoints MCP
 * Verifica que el token de autorización sea válido antes de permitir el acceso
 * @param {string} authToken - Token de autorización para validar solicitudes
 * @returns {Function} Middleware para usar con Hono
 */
export const createAuthMiddleware = (authToken?: string) => {
  /**
   * @function authMiddlewareHandler
   * @description Handler del middleware de autenticación
   * @param {Context} c - Contexto de Hono
   * @param {Function} next - Función para continuar al siguiente middleware
   * @returns {Promise<Response>} Respuesta de error o continúa al siguiente middleware
   */
  return async (c: Context, next: () => Promise<void>) => {
    if (authToken) {
      const authHeader = c.req.header('authorization')
      if (
        !authHeader ||
        !authHeader.startsWith('Bearer ') ||
        authHeader.slice(7) !== authToken
      ) {
        return c.json(
          {
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'No autorizado'
            },
            id: null
          },
          401
        )
      }
    }
    await next()
  }
}
