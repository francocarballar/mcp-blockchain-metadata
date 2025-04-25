import { ENV } from '@/config/environment'

/**
 * @enum LogLevel
 * @description Niveles de log soportados
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

/**
 * @interface LogEntry
 * @description Formato de entrada de log estructurado
 */
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: any
  context?: Record<string, any>
}

/**
 * @type LogFormatter
 * @description Tipo para función que formatea entradas de log
 */
export type LogFormatter = (entry: LogEntry) => string

/**
 * @class Logger
 * @description Clase para logging estructurado
 */
export class Logger {
  private static instance: Logger
  private minLevel: LogLevel = ENV.isProduction()
    ? LogLevel.INFO
    : LogLevel.DEBUG

  private constructor () {}

  /**
   * @method getInstance
   * @description Obtiene la instancia singleton del logger
   * @returns {Logger} Instancia del logger
   */
  public static getInstance (): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  /**
   * @method setMinLevel
   * @description Establece el nivel mínimo de log
   * @param {LogLevel} level - Nivel mínimo de log
   */
  public setMinLevel (level: LogLevel): void {
    this.minLevel = level
  }

  /**
   * @method formatLog
   * @description Formatea una entrada de log como string
   * @param {LogEntry} entry - Entrada de log
   * @returns {string} Entrada formateada
   */
  private formatLog (entry: LogEntry): string {
    const { level, message, timestamp, data, context } = entry

    const logParts = [`[${timestamp}]`, `[${level}]`, message]

    if (data !== undefined || context !== undefined) {
      const extraData = JSON.stringify(
        { data, context },
        null,
        ENV.isDevelopment() ? 2 : 0
      )
      logParts.push(extraData)
    }

    return logParts.join(' ')
  }

  /**
   * @method shouldLog
   * @description Determina si un nivel de log debe ser registrado
   * @param {LogLevel} level - Nivel de log a verificar
   * @returns {boolean} true si el nivel debe ser registrado
   */
  private shouldLog (level: LogLevel): boolean {
    const levels = Object.values(LogLevel)
    return levels.indexOf(level) >= levels.indexOf(this.minLevel)
  }

  /**
   * @method log
   * @description Registra una entrada de log
   * @param {LogLevel} level - Nivel de log
   * @param {string} message - Mensaje de log
   * @param {any} [data] - Datos adicionales
   * @param {Record<string, any>} [context] - Contexto adicional
   */
  public log (
    level: LogLevel,
    message: string,
    data?: any,
    context?: Record<string, any>
  ): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(data !== undefined ? { data } : {}),
      ...(context !== undefined ? { context } : {})
    }

    const formattedLog = this.formatLog(entry)

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedLog)
        break
      case LogLevel.INFO:
        console.info(formattedLog)
        break
      case LogLevel.WARN:
        console.warn(formattedLog)
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedLog)
        break
      default:
        console.log(formattedLog)
    }
  }

  /**
   * @method debug
   * @description Registra un log de nivel DEBUG
   * @param {string} message - Mensaje de log
   * @param {any} [data] - Datos adicionales
   * @param {Record<string, any>} [context] - Contexto adicional
   */
  public debug (
    message: string,
    data?: any,
    context?: Record<string, any>
  ): void {
    this.log(LogLevel.DEBUG, message, data, context)
  }

  /**
   * @method info
   * @description Registra un log de nivel INFO
   * @param {string} message - Mensaje de log
   * @param {any} [data] - Datos adicionales
   * @param {Record<string, any>} [context] - Contexto adicional
   */
  public info (
    message: string,
    data?: any,
    context?: Record<string, any>
  ): void {
    this.log(LogLevel.INFO, message, data, context)
  }

  /**
   * @method warn
   * @description Registra un log de nivel WARN
   * @param {string} message - Mensaje de log
   * @param {any} [data] - Datos adicionales
   * @param {Record<string, any>} [context] - Contexto adicional
   */
  public warn (
    message: string,
    data?: any,
    context?: Record<string, any>
  ): void {
    this.log(LogLevel.WARN, message, data, context)
  }

  /**
   * @method error
   * @description Registra un log de nivel ERROR
   * @param {string} message - Mensaje de log
   * @param {any} [data] - Datos adicionales
   * @param {Record<string, any>} [context] - Contexto adicional
   */
  public error (
    message: string,
    data?: any,
    context?: Record<string, any>
  ): void {
    this.log(LogLevel.ERROR, message, data, context)
  }

  /**
   * @method fatal
   * @description Registra un log de nivel FATAL
   * @param {string} message - Mensaje de log
   * @param {any} [data] - Datos adicionales
   * @param {Record<string, any>} [context] - Contexto adicional
   */
  public fatal (
    message: string,
    data?: any,
    context?: Record<string, any>
  ): void {
    this.log(LogLevel.FATAL, message, data, context)
  }
}

export const logger = Logger.getInstance()
