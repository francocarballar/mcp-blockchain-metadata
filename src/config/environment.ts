import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

/**
 * @constant ENV
 * @description Configuración de las variables de entorno de la aplicación
 */
export const ENV = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  AUTH_TOKEN: process.env.AUTH_TOKEN, // Opcional: para autenticación simple

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
  }
}
