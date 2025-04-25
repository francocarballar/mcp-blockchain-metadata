import dotenv from 'dotenv'
import { logger } from '../utils/logger'

// Cargar variables de entorno
dotenv.config()

/**
 * Clase de error personalizada para variables de entorno no configuradas
 */
export class EnvVarError extends Error {
  constructor (varName: string) {
    super(`Variable de entorno requerida no configurada: ${varName}`)
    this.name = 'EnvVarError'
  }
}

/**
 * @function getRequiredEnvVar
 * @description Obtiene una variable de entorno requerida o lanza error si no existe
 * @param {string} name - Nombre de la variable de entorno
 * @returns {string} Valor de la variable de entorno
 * @throws {EnvVarError} Si la variable no está definida
 */
function getRequiredEnvVar (name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new EnvVarError(name)
  }
  return value
}

/**
 * @constant ENV
 * @description Configuración de las variables de entorno de la aplicación
 */
export const ENV = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  AUTH_TOKEN: process.env.AUTH_TOKEN, // Opcional: para autenticación simple
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  /**
   * @method isDevelopment
   * @description Verifica si el entorno actual es de desarrollo
   * @returns {boolean} true si es entorno de desarrollo
   */
  isDevelopment (): boolean {
    return this.NODE_ENV === 'development'
  },

  /**
   * @method isProduction
   * @description Verifica si el entorno actual es de producción
   * @returns {boolean} true si es entorno de producción
   */
  isProduction (): boolean {
    return this.NODE_ENV === 'production'
  },

  /**
   * @method isTest
   * @description Verifica si el entorno actual es de pruebas
   * @returns {boolean} true si es entorno de pruebas
   */
  isTest (): boolean {
    return this.NODE_ENV === 'test'
  },

  /**
   * @method validateRequiredVars
   * @description Valida que todas las variables de entorno requeridas estén configuradas
   * @param {Array<string>} requiredVars - Lista de nombres de variables requeridas
   * @throws {EnvVarError} Si alguna variable requerida no está definida
   */
  validateRequiredVars (requiredVars: string[]): void {
    const missingVars: string[] = []

    for (const varName of requiredVars) {
      if (varName in this && this[varName as keyof typeof this] === undefined) {
        missingVars.push(varName)
      }
    }

    if (missingVars.length > 0) {
      throw new EnvVarError(
        `Variables requeridas no configuradas: ${missingVars.join(', ')}`
      )
    }

    logger.info('Variables de entorno requeridas verificadas', { requiredVars })
  }
}
