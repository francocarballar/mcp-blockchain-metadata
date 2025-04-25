import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { logger } from './logger'
import { SessionStore } from '@/types/mcp'

/**
 * @class SessionManager
 * @description Gestor centralizado de sesiones MCP
 * Proporciona métodos para añadir, obtener y eliminar transportes por ID de sesión
 */
export class SessionManager {
  private static instance: SessionManager
  private sessions: SessionStore = {}
  private sessionTimeouts: Record<string, NodeJS.Timeout> = {}
  private readonly DEFAULT_SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutos por defecto

  /**
   * @constructor
   * @description Crea una instancia del gestor de sesiones
   * @param {number} sessionTimeout - Tiempo de expiración de sesiones inactivas (ms)
   */
  constructor (private sessionTimeout: number = 0) {
    this.sessionTimeout = sessionTimeout || this.DEFAULT_SESSION_TIMEOUT
    logger.info('SessionManager inicializado', {
      sessionTimeout: this.sessionTimeout
    })
  }

  /**
   * @method getInstance
   * @description Obtiene la instancia singleton del SessionManager
   * @returns {SessionManager} Instancia única del gestor de sesiones
   */
  public static getInstance (): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  /**
   * @method getTransport
   * @description Obtiene un transporte por ID de sesión
   * @param {string} sessionId - ID de la sesión
   * @returns {StreamableHTTPServerTransport|undefined} Transporte encontrado o undefined
   */
  public getTransport (
    sessionId: string
  ): StreamableHTTPServerTransport | undefined {
    const transport = this.sessions[sessionId]

    if (transport) {
      // Si la sesión existe, renovar su tiempo de expiración
      this.refreshSessionTimeout(sessionId)
      return transport
    }

    return undefined
  }

  /**
   * @method addTransport
   * @description Añade un nuevo transporte al gestor de sesiones
   * @param {string} sessionId - ID de la sesión
   * @param {StreamableHTTPServerTransport} transport - Transporte a añadir
   */
  public addTransport (
    sessionId: string,
    transport: StreamableHTTPServerTransport
  ): void {
    this.sessions[sessionId] = transport
    logger.debug('Sesión añadida', { sessionId })

    // Configurar timeout para limpiar sesiones inactivas
    this.refreshSessionTimeout(sessionId)
  }

  /**
   * @method removeTransport
   * @description Elimina un transporte del gestor de sesiones
   * @param {string} sessionId - ID de la sesión a eliminar
   */
  public removeTransport (sessionId: string): void {
    if (this.sessions[sessionId]) {
      delete this.sessions[sessionId]
      logger.debug('Sesión eliminada', { sessionId })

      // Limpiar el timeout si existe
      if (this.sessionTimeouts[sessionId]) {
        clearTimeout(this.sessionTimeouts[sessionId])
        delete this.sessionTimeouts[sessionId]
      }
    }
  }

  /**
   * @method getActiveSessions
   * @description Obtiene el número de sesiones activas
   * @returns {number} Número de sesiones activas
   */
  public getActiveSessions (): number {
    return Object.keys(this.sessions).length
  }

  /**
   * @method getSessionIds
   * @description Obtiene los IDs de todas las sesiones activas
   * @returns {string[]} Array con los IDs de sesión
   */
  public getSessionIds (): string[] {
    return Object.keys(this.sessions)
  }

  /**
   * @method clearAllSessions
   * @description Elimina todas las sesiones
   */
  public clearAllSessions (): void {
    // Limpiar todos los timeouts
    Object.keys(this.sessionTimeouts).forEach(sessionId => {
      clearTimeout(this.sessionTimeouts[sessionId])
    })

    // Reiniciar mapa de sesiones y timeouts
    this.sessions = {}
    this.sessionTimeouts = {}
    logger.info('Todas las sesiones han sido eliminadas')
  }

  /**
   * @method refreshSessionTimeout
   * @description Refresca el tiempo de expiración de una sesión
   * @param {string} sessionId - ID de la sesión
   * @private
   */
  private refreshSessionTimeout (sessionId: string): void {
    // Cancelar el timeout anterior si existe
    if (this.sessionTimeouts[sessionId]) {
      clearTimeout(this.sessionTimeouts[sessionId])
    }

    // Establecer nuevo timeout
    this.sessionTimeouts[sessionId] = setTimeout(() => {
      logger.debug('Sesión expirada por inactividad', { sessionId })
      this.removeTransport(sessionId)
    }, this.sessionTimeout)
  }
}
