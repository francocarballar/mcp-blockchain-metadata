import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

/**
 * @type McpToolRegistration
 * @description Tipo para funciones que registran herramientas en el servidor MCP
 */
export type McpToolRegistration = (server: McpServer) => void

/**
 * @type SessionStore
 * @description Tipo para almacenamiento de sesiones
 */
export type SessionStore = {
  [sessionId: string]: StreamableHTTPServerTransport
}

/**
 * @interface McpRequest
 * @description Estructura estándar de solicitud JSON-RPC para MCP
 */
export interface McpRequest {
  jsonrpc: '2.0'
  method: string
  params?: any
  id: string | number | null
}

/**
 * @interface McpResponse
 * @description Estructura estándar de respuesta JSON-RPC para MCP
 */
export interface McpResponse {
  jsonrpc: '2.0'
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
  id: string | number | null
}

/**
 * @interface ServerConfig
 * @description Configuración del servidor MCP
 */
export interface ServerConfig {
  name: string
  version: string
  description: string
  author: string | { name: string; email?: string; url?: string }
  repository: string | { type: string; url: string }
  homepage: string
}

/**
 * @interface TransportConfig
 * @description Configuración para el transporte HTTP
 */
export interface TransportConfig {
  sessionTimeout?: number // Tiempo de expiración de sesión en milisegundos
  maxSessions?: number // Número máximo de sesiones simultáneas
  keepAliveInterval?: number // Intervalo para mantener la conexión activa
}

/**
 * @enum HttpMethod
 * @description Métodos HTTP soportados
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  DELETE = 'DELETE'
}
