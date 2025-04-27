import dotenv from 'dotenv'
import { logger } from '../utils/logger'

// Cargar variables de entorno solo en entorno Node.js
try {
  dotenv.config()
} catch (error) {
  // En Cloudflare Workers, dotenv no funciona
  console.debug('No se pudo cargar dotenv, posiblemente ejecutando en Workers')
}

/**
 * Clase de error personalizada para variables de entorno no configuradas
 */
export class EnvVarError extends Error {
  constructor (varName: string) {
    super(`Variable de entorno requerida no configurada: ${varName}`)
    this.name = 'EnvVarError'
  }
}

// Crear un objeto para almacenar variables de entorno que funcione en todos los entornos
let envVars: Record<string, any> = {}

// Función para inicializar variables de entorno desde Cloudflare Workers
export function initializeEnv (cfEnv?: Record<string, any>) {
  if (cfEnv) {
    // Estamos en Cloudflare Workers
    envVars = {
      PORT: cfEnv.PORT || 3000,
      NODE_ENV: cfEnv.NODE_ENV || 'production',
      AUTH_TOKEN: cfEnv.AUTH_TOKEN,
      LOG_LEVEL: cfEnv.LOG_LEVEL || 'info'
    }
  } else if (typeof process !== 'undefined' && process.env) {
    // Estamos en Node.js
    envVars = {
      PORT: process.env.PORT || 3000,
      NODE_ENV: process.env.NODE_ENV || 'development',
      AUTH_TOKEN: process.env.AUTH_TOKEN,
      LOG_LEVEL: process.env.LOG_LEVEL || 'info'
    }
  } else {
    // Fallback por defecto
    envVars = {
      PORT: 3000,
      NODE_ENV: 'production',
      AUTH_TOKEN: undefined,
      LOG_LEVEL: 'info'
    }
  }
}

// Inicializar con valores por defecto
initializeEnv()

/**
 * @function getRequiredEnvVar
 * @description Obtiene una variable de entorno requerida o lanza error si no existe
 * @param {string} name - Nombre de la variable de entorno
 * @returns {string} Valor de la variable de entorno
 * @throws {EnvVarError} Si la variable no está definida
 */
function getRequiredEnvVar (name: string): string {
  const value = envVars[name]
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
  get PORT (): number | string {
    return envVars.PORT
  },
  get NODE_ENV (): string {
    return envVars.NODE_ENV
  },
  get AUTH_TOKEN (): string | undefined {
    return envVars.AUTH_TOKEN
  },
  get LOG_LEVEL (): string {
    return envVars.LOG_LEVEL
  },

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
    // En Cloudflare Workers, no validamos PORT y NODE_ENV
    if (typeof process === 'undefined') {
      return
    }

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
