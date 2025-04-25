# MCP Blockchain Metadata 🧩

## 📚 Tabla de Contenidos

- [¿Qué es MCP?](#qué-es-mcp)
- [Acerca de este Proyecto](#acerca-de-este-proyecto)
- [Arquitectura](#arquitectura)
- [Instalación y Configuración](#instalación-y-configuración)
- [Desarrollo](#desarrollo)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Componentes Principales](#componentes-principales)
  - [Servidor MCP](#servidor-mcp)
  - [Transportes](#transportes)
  - [Gestión de Sesiones](#gestión-de-sesiones)
  - [Sistema de Logging](#sistema-de-logging)
  - [Herramientas Blockchain](#herramientas-blockchain)
- [Seguridad](#seguridad)
- [Despliegue en Producción](#despliegue-en-producción)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

## 🔍 ¿Qué es MCP?

**Model Context Protocol (MCP)** es un protocolo de comunicación diseñado para mejorar la interacción entre modelos de lenguaje (LLMs) y sistemas externos. MCP permite que los modelos de IA, como Claude de Anthropic, accedan a herramientas y contextos adicionales, expandiendo sus capacidades más allá de su conocimiento base.

### Conceptos clave del MCP

- **JSON-RPC**: MCP utiliza JSON-RPC 2.0 como protocolo base para la comunicación entre clientes y servidores, permitiendo llamadas a procedimientos remotos con mensajes en formato JSON.
- **Sesiones**: Comunicación persistente entre un cliente (modelo de IA) y un servidor MCP que mantiene el estado y contexto durante la interacción.
- **Herramientas (Tools)**: Funcionalidades específicas que un servidor MCP expone para ser utilizadas por los modelos, definidas por un nombre, descripción, esquema de parámetros y función de implementación.
- **Transportes**: Mecanismos de comunicación entre cliente y servidor (HTTP, WebSockets, stdio) que definen cómo se transmiten los mensajes MCP.

<div align="center">
  <img src="./public/img/conceptos-mcp.png" alt="Diagrama conceptual MCP" width="700"/>
  <p><em>Diagrama conceptual: Interacción entre LLMs y servidores MCP</em></p>
</div>

## 🎯 Acerca de este Proyecto

**MCP Blockchain Metadata** es un servidor MCP especializado que proporciona herramientas y metadatos relacionados con blockchain. Este servidor permite a los modelos de IA:

- Consultar información detallada sobre tokens y protocolos blockchain (símbolos, direcciones de contratos, precio, decimales, cadenas compatibles)
- Acceder a metadatos de plantillas blockchain para generación de contratos inteligentes
- Obtener endpoints de mini aplicaciones relacionadas con blockchain para facilitar integración con servicios DeFi

Este servidor actúa como un puente entre los modelos de lenguaje y el ecosistema blockchain, permitiendo que los asistentes de IA ofrezcan respuestas más precisas y actualizadas sobre temas relacionados con criptomonedas, DeFi, NFTs y tecnología blockchain en general.

## 🏗️ Arquitectura

Este proyecto implementa un servidor MCP con las siguientes características arquitectónicas:

- **Arquitectura modular**: Componentes desacoplados y de responsabilidad única que facilitan el mantenimiento y extensión
- **Patrón Singleton**: Para gestores de recursos compartidos (sesiones, logging) que necesitan mantener estado global
- **Middleware**: Para autenticación y validación de peticiones, asegurando que solo clientes autorizados puedan acceder
- **Gestión de errores centralizada**: Sistema consistente de manejo de errores con niveles de detalle apropiados
- **Sistema de logging estructurado**: Logs en formato JSON con metadatos para facilitar monitoreo y depuración

<div align="center">
  <img src="./public/img/arquitectura-server-mcp.png" alt="Arquitectura del Servidor MCP" width="700"/>
  <p><em>Arquitectura del Servidor MCP-Blockchain-Metadata</em></p>
</div>

### Diagrama de Componentes

```
┌────────────────────────┐      ┌────────────────────────┐
│                        │      │                        │
│  Cliente MCP (LLM)     │◄────►│  Transportes MCP       │
│                        │      │  (HTTP/stdio)          │
└────────────────────────┘      └──────────┬─────────────┘
                                           │
                                           ▼
┌────────────────────────┐      ┌────────────────────────┐
│                        │      │                        │
│  Middleware            │◄────►│  Servidor MCP          │
│  Autenticación         │      │                        │
└────────────────────────┘      └──────────┬─────────────┘
                                           │
                 ┌─────────────────────────┼─────────────────────────┐
                 │                         │                         │
                 ▼                         ▼                         ▼
┌────────────────────────┐    ┌────────────────────────┐   ┌─────────────────────┐
│ Tool:                  │    │ Tool:                  │   │ Tool:               │
│ getProtocolTokens      │    │ getMetadataOfTemplate  │   │ getMiniAppEndpoints │
└────────────────────────┘    └────────────────────────┘   └─────────────────────┘
```

### Flujo de una Petición

```mermaid
sequenceDiagram
    participant Cliente as Cliente MCP (LLM)
    participant Server as Servidor MCP
    participant Auth as Middleware Auth
    participant Handler as Request Handler
    participant Session as Session Manager
    participant Tool as Herramienta Blockchain

    Cliente->>Server: Petición JSON-RPC
    Server->>Auth: Verificar token
    Auth->>Server: Autorizado
    Server->>Session: Validar/Crear sesión
    Server->>Handler: Procesar petición
    Handler->>Tool: Ejecutar herramienta
    Tool->>Handler: Resultado
    Handler->>Server: Respuesta
    Server->>Cliente: Respuesta JSON-RPC
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- [Node.js](https://nodejs.org/) (v18+) o [Bun](https://bun.sh/) (recomendado para mejor rendimiento)
- Conexión a Internet para descargar dependencias
- Git para clonar el repositorio

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/francocarballar/mcp-blockchain-metadata.git
cd mcp-blockchain-metadata

# Instalación con Bun (recomendado)
bun install

# Instalación con NPM (alternativa)
npm install
```

### Configuración

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Configuración del servidor
PORT=3000                # Puerto en el que se ejecutará el servidor HTTP
NODE_ENV=development     # Entorno: 'development' o 'production'

# Seguridad
AUTH_TOKEN=tu_token_secreto_aqui    # Token para autenticar peticiones

# Logging (opcional)
LOG_LEVEL=info           # Nivel de detalle de logs: 'debug', 'info', 'warn', 'error', 'fatal'
```

#### Variables de Entorno Requeridas

| Variable     | Descripción                      | Valores Posibles                 | Requerida |
| ------------ | -------------------------------- | -------------------------------- | --------- |
| `PORT`       | Puerto para el servidor HTTP     | Número entero (ej: 3000)         | Sí        |
| `NODE_ENV`   | Entorno de ejecución             | 'development', 'production'      | Sí        |
| `AUTH_TOKEN` | Token para autenticar peticiones | String (generar token seguro)    | Sí        |
| `LOG_LEVEL`  | Nivel de detalle de los logs     | 'debug', 'info', 'warn', 'error' | No        |

## 💻 Desarrollo

### Usando transporte stdio (para testing con MCP Inspector)

El transporte `stdio` permite probar el servidor con herramientas como el MCP Inspector, facilitando el desarrollo y depuración.

```bash
# Con Bun
bunx -y @modelcontextprotocol/inspector bun run dev:stdio

# Con NPM
npx -y @modelcontextprotocol/inspector npm run dev:stdio

# Con pnpm
pnpm dlx -y @modelcontextprotocol/inspector pnpm run dev:stdio

# Con Yarn
yarn dlx -y @modelcontextprotocol/inspector yarn run dev:stdio
```

Este comando:

1. Instala y ejecuta el MCP Inspector (una herramienta visual para interactuar con servidores MCP)
2. Inicia nuestro servidor MCP en modo stdio
3. Conecta ambos, permitiendo enviar peticiones y recibir respuestas en la interfaz gráfica

<div align="center">
  <img src="./public/img/mcp-inspector.png" alt="Screenshot de MCP Inspector" width="700"/>
  <p><em>Inspector MCP conectado al servidor mediante stdio</em></p>
</div>

### Usando transporte HTTP (para desarrollo local)

El transporte HTTP permite la comunicación a través de peticiones web, ideal para integrar con aplicaciones:

```bash
# Con Bun
bun run dev:http

# Con NPM
npm run dev:http

# Con pnpm
pnpm run dev:http

# Con Yarn
yarn run dev:http
```

Una vez iniciado, puedes enviar peticiones JSON-RPC al endpoint `/mcp`:

```bash
# Ejemplo de petición con curl
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_token_secreto_aqui" \
  -d '{
    "jsonrpc": "2.0",
    "method": "getProtocolTokens",
    "params": {
      "protocol": "uniswap",
      "limit": 5
    },
    "id": "1"
  }'
```

## 📂 Estructura del Proyecto

```
mcp-blockchain-metadata/
├── src/                       # Código fuente
│   ├── config/                # Configuración del servidor
│   │   └── environment.ts     # Variables de entorno (dotenv)
│   ├── constants/             # Constantes globales
│   ├── handlers/              # Manejadores de peticiones
│   │   └── mcp.handlers.ts    # Manejadores de rutas MCP
│   ├── middleware/            # Middleware
│   │   └── auth.middleware.ts # Middleware de autenticación
│   ├── services/              # Servicios compartidos
│   │   ├── repository.ts      # Acceso a datos de repositorio
│   │   └── tokens.ts          # Servicios para información de tokens
│   ├── tools/                 # Herramientas MCP
│   │   ├── getMiniAppEndpoints.tool.ts  # Endpoints de mini-apps
│   │   ├── getMetadataOfTemplate.tool.ts  # Metadatos de plantillas
│   │   └── getProtocolTokens.tool.ts    # Tokens por protocolo
│   ├── types/                 # Definiciones de tipos
│   │   ├── mcp.ts             # Tipos para MCP
│   │   ├── repository.ts      # Tipos para repositorio
│   │   └── tokens.ts          # Tipos para tokens
│   ├── utils/                 # Utilidades
│   │   ├── error.handler.ts   # Manejo centralizado de errores
│   │   ├── logger.ts          # Sistema de logs estructurados
│   │   └── session.manager.ts # Gestor de sesiones
│   ├── index.ts               # Punto de entrada (Cloudflare Workers)
│   ├── mcp-http.ts            # Servidor MCP con transporte HTTP
│   └── mcp-stdio.ts           # Servidor MCP con transporte stdio
├── public/                    # Archivos estáticos
│   └── img/                   # Imágenes para documentación
├── .env                       # Variables de entorno (crear localmente)
├── package.json               # Configuración del proyecto
├── tsconfig.json              # Configuración de TypeScript
├── wrangler.jsonc             # Configuración de Cloudflare Workers
└── README.md                  # Documentación
```

## 🧩 Componentes Principales

### Servidor MCP

El núcleo del proyecto es una implementación del servidor MCP que proporciona:

- Registro y exposición de herramientas blockchain
- Manejo de sesiones persistentes
- Procesamiento de mensajes JSON-RPC
- Múltiples transportes (HTTP, stdio)

#### Ejemplo: Creación del servidor MCP

```typescript
// src/mcp-http.ts (simplificado)
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { createAuthMiddleware } from './middleware/auth.middleware'
import { ENV } from './config/environment'
import {
  registerGetMiniAppEndpointsTool,
  registerGetProtocolTokensTool,
  registerGetMetadataOfTemplateTool
} from './tools'

async function main() {
  // Validar variables de entorno
  ENV.validateRequiredVars(['PORT', 'NODE_ENV'])

  // Herramientas a registrar
  const mcpTools = [
    registerGetMiniAppEndpointsTool,
    registerGetProtocolTokensTool,
    registerGetMetadataOfTemplateTool
  ]

  const app = new Hono()

  // Middleware de autenticación
  const authMiddleware = createAuthMiddleware(ENV.AUTH_TOKEN)
  app.use('/mcp', authMiddleware)

  // Rutas MCP
  app.post('/mcp', handlePostRequest(mcpTools))
  app.get('/mcp', handleGetRequest())
  app.delete('/mcp', handleDeleteRequest())

  // Iniciar servidor
  serve(
    {
      fetch: app.fetch,
      port: Number(ENV.PORT)
    },
    info => {
      logger.info(`Servidor MCP ejecutándose en puerto ${info.port}`)
    }
  )
}
```

### Transportes

El proyecto soporta dos tipos de transporte:

1. **HTTP (StreamableHTTPServerTransport)**:

   - Para integración con aplicaciones web y servicios
   - Comunicación RESTful con endpoints JSON-RPC
   - Soporte para SSE (Server-Sent Events) para notificaciones en tiempo real
   - Configuración de CORS para permitir peticiones desde dominios específicos

   ```typescript
   // Ejemplo de configuración del transporte HTTP
   import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/transports/http.js'

   const httpTransport = new StreamableHTTPServerTransport({
     cors: {
       origin: ['https://ejemplo.com'],
       credentials: true
     },
     auth: req => {
       const token = req.headers.get('Authorization')?.split(' ')[1]
       return token === process.env.AUTH_TOKEN
     }
   })
   ```

2. **Stdio (StdioServerTransport)**:

   - Para testing y desarrollo local
   - Comunicación directa a través de la entrada/salida estándar
   - Ideal para herramientas como MCP Inspector

   ```typescript
   // Ejemplo de configuración del transporte Stdio
   import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/transports/stdio.js'

   const stdioTransport = new StdioServerTransport()
   await server.connect(stdioTransport)
   ```

### Gestión de Sesiones

El sistema implementa un sofisticado gestor de sesiones con las siguientes características:

- **Persistencia de sesión**: Mantiene el contexto entre peticiones usando un identificador único
- **Expiración automática**: Limpia sesiones inactivas después de un período configurable para liberar recursos
- **Thread-safe**: Diseñado para ser seguro en entornos con múltiples hilos usando técnicas de sincronización
- **Almacenamiento eficiente**: Utiliza un Map optimizado para almacenar los datos de sesión en memoria

#### Implementación del gestor de sesiones

```typescript
// src/utils/session.manager.ts (simplificado)

export class SessionManager {
  private static instance: SessionManager
  private sessions: Map<string, SessionData>
  private readonly sessionTimeout: number

  private constructor() {
    this.sessions = new Map()
    this.sessionTimeout = 30 * 60 * 1000 // 30 minutos por defecto
    this.startCleanupScheduler()
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  // Obtener transporte por ID de sesión
  public getTransport(sessionId: string): Transport | undefined {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.lastActivity = Date.now()
      return session.transport
    }
    return undefined
  }

  // Añadir nuevo transporte a una sesión
  public addTransport(sessionId: string, transport: Transport): void {
    this.sessions.set(sessionId, {
      transport,
      createdAt: Date.now(),
      lastActivity: Date.now()
    })
  }

  // Eliminar una sesión
  public removeTransport(sessionId: string): boolean {
    return this.sessions.delete(sessionId)
  }

  // Programador para limpiar sesiones expiradas
  private startCleanupScheduler(): void {
    setInterval(() => {
      const now = Date.now()
      for (const [sessionId, session] of this.sessions.entries()) {
        if (now - session.lastActivity > this.sessionTimeout) {
          this.sessions.delete(sessionId)
        }
      }
    }, 5 * 60 * 1000) // Ejecutar cada 5 minutos
  }
}
```

<div align="center">
  <img src="./public/img/gestion-de-sesiones.png" alt="Diagrama de Gestión de Sesiones" width="700"/>
  <p><em>Ciclo de vida de las sesiones MCP</em></p>
</div>

### Sistema de Logging

El proyecto incluye un sistema de logging estructurado que facilita el monitoreo y depuración:

- **Niveles de log**: DEBUG, INFO, WARN, ERROR, FATAL con filtrado configurable
- **Formato estructurado**: Logs JSON con metadatos para fácil parseo y análisis
- **Contextual**: Incluye información adicional como timestamp, nivel, componente, correlationId
- **Optimizado por entorno**: Configuración automática según el entorno (desarrollo/producción)
- **Soporte para transports**: Salida configurable a consola, archivos o servicios externos

```typescript
// src/utils/logger.ts (simplificado)
import { ENV } from '../config/environment'

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
}

class Logger {
  private readonly minLevel: number

  constructor() {
    // Definir nivel mínimo de log según configuración
    const configuredLevel = (ENV.LOG_LEVEL || 'info').toLowerCase() as LogLevel
    this.minLevel = LOG_LEVELS[configuredLevel] || LOG_LEVELS.info
  }

  // Métodos para cada nivel de log
  public debug(message: string, ...meta: any[]): void {
    this.log('debug', message, ...meta)
  }

  public info(message: string, ...meta: any[]): void {
    this.log('info', message, ...meta)
  }

  public warn(message: string, ...meta: any[]): void {
    this.log('warn', message, ...meta)
  }

  public error(message: string, error?: Error, ...meta: any[]): void {
    this.log('error', message, ...[error, ...meta])
  }

  public fatal(message: string, error?: Error, ...meta: any[]): void {
    this.log('fatal', message, ...[error, ...meta])
  }

  private log(level: LogLevel, message: string, ...meta: any[]): void {
    // Verificar si el nivel de log está habilitado
    if (LOG_LEVELS[level] < this.minLevel) return

    // Construir objeto de log estructurado
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: ENV.NODE_ENV,
      meta: meta.length ? meta : undefined
    }

    // En producción, salida como JSON para fácil procesamiento
    if (ENV.NODE_ENV === 'production') {
      console[level === 'fatal' ? 'error' : level](JSON.stringify(logEntry))
    } else {
      // En desarrollo, formato más legible
      console[level === 'fatal' ? 'error' : level](
        `[${logEntry.timestamp}] [${level.toUpperCase()}] ${message}`,
        ...(meta.length ? meta : [])
      )
    }
  }
}

export const logger = new Logger()
```

### Herramientas Blockchain

El servidor expone tres herramientas principales relacionadas con blockchain:

1. **getMiniAppEndpoints**:

   - **Descripción**: Proporciona URLs de mini aplicaciones blockchain para integración con servicios externos
   - **Parámetros**:
     - `type`: Tipo de aplicación (ej: "dex", "lending", "nft") [requerido]
     - `filter`: Filtro adicional (ej: cadena, protocolo) [opcional]
   - **Ejemplo de respuesta**:

     ```json
     {
       "endpoints": [
         {
           "name": "Uniswap Interface",
           "description": "Interfaz de intercambio descentralizado Uniswap",
           "url": "https://app.uniswap.org",
           "protocol": "uniswap",
           "chains": [1, 10, 137, 42161]
         }
       ]
     }
     ```

2. **getProtocolTokens**:

   - **Descripción**: Obtiene información detallada sobre tokens de protocolos DeFi
   - **Parámetros**:
     - `protocol`: Nombre del protocolo (ej: "uniswap", "aave") [requerido]
     - `chainId`: ID de la cadena blockchain (ej: 1 = Ethereum) [opcional]
     - `limit`: Número máximo de tokens a devolver (1-100) [opcional, default: 50]
     - `sort`: Campo para ordenar resultados ("name", "symbol", "popularity") [opcional, default: "popularity"]
   - **Ejemplo de respuesta**:

     ```json
     {
       "metadata": {
         "protocol": "uniswap",
         "chainId": 1,
         "totalTokens": 150,
         "returnedTokens": 5,
         "supportedProtocols": ["uniswap", "aave", "curve"],
         "timestamp": "2023-05-15T14:30:45Z",
         "sort": "popularity"
       },
       "tokens": [
         {
           "name": "Ethereum",
           "symbol": "ETH",
           "address": "0x0000000000000000000000000000000000000000",
           "decimals": 18,
           "chainId": "1",
           "displayName": "Ethereum (ETH)",
           "chainName": "Ethereum",
           "explorerUrl": "https://etherscan.io/token/0x0000000000000000000000000000000000000000"
         }
       ]
     }
     ```

3. **getMetadataOfTemplate**:

   - **Descripción**: Proporciona metadatos sobre plantillas de contratos inteligentes
   - **Parámetros**:
     - `templateId`: Identificador único de la plantilla [requerido]
     - `version`: Versión específica de la plantilla [opcional]
   - **Ejemplo de respuesta**:

     ```json
     {
       "templateId": "erc20-standard",
       "version": "1.0.0",
       "name": "ERC-20 Token Estándar",
       "description": "Implementación del estándar ERC-20 para tokens fungibles",
       "compatibility": ["ethereum", "polygon", "arbitrum"],
       "abi": [...],
       "bytecode": "0x...",
       "deploymentInstructions": "...",
       "securityConsiderations": [...]
     }
     ```

## 🔒 Seguridad

El proyecto implementa varias capas de seguridad:

### Autenticación

- **Autenticación basada en tokens**: Middleware que valida el token Bearer en el header Authorization
- **Verificación por transporte**: Cada método de transporte implementa su propia validación de autenticación
- **Mensajes de error seguros**: Respuestas de error que no revelan información interna del sistema

```typescript
// src/middleware/auth.middleware.ts (simplificado)
export function createAuthMiddleware(authToken: string) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        {
          error: {
            code: -32001,
            message: 'Unauthorized: Bearer token missing'
          }
        },
        401
      )
    }

    const token = authHeader.split(' ')[1]

    if (token !== authToken) {
      return c.json(
        {
          error: {
            code: -32001,
            message: 'Unauthorized: Invalid token'
          }
        },
        401
      )
    }

    await next()
  }
}
```

### Validación de Entradas

- **Validación mediante Zod**: Esquemas para validar parámetros de entrada con tipos y restricciones precisas
- **Sanitización de datos**: Prevención de XSS y otros ataques de inyección al validar y transformar datos
- **Verificación de tipos**: TypeScript para asegurar integridad de tipos en tiempo de compilación

```typescript
// Ejemplo de validación de parámetros con Zod (simplificado)
const ProtocolSchema = z
  .string()
  .min(1)
  .describe('Nombre del protocolo para obtener tokens')

const ChainIdSchema = z
  .union([z.string(), z.number(), z.null()])
  .transform(val => {
    if (val === null) return undefined
    return typeof val === 'string' ? parseInt(val, 10) : val
  })
  .refine(val => val === undefined || !isNaN(val as number), {
    message: 'Chain ID debe ser un número válido o null'
  })
```

### Mejores Prácticas

- **Variables de entorno**: Configuraciones sensibles almacenadas en variables de entorno, no en código
- **Manejo seguro de errores**: Centralización del manejo de errores sin exposición de detalles internos
- **Timeout de sesiones**: Eliminación automática de sesiones inactivas para reducir superficie de ataque
- **Limitación de recursos**: Control en el número de peticiones y datos procesados para evitar DoS

## 🌐 Despliegue en Producción

### 1. Configuración de Entorno

Crea un archivo `.env` con la configuración de producción:

```env
PORT=3000
NODE_ENV=production
AUTH_TOKEN=token_muy_seguro_y_complejo
LOG_LEVEL=info
```

> **IMPORTANTE**: El `AUTH_TOKEN` debe ser una cadena aleatoria compleja. Puedes generarlo con:  
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 2. Iniciar el Servidor

```bash
# Con Bun (recomendado por mejor rendimiento)
bun run start

# Con Node.js
npm run start

# Con pnpm
pnpm run start

# Con Yarn
yarn run start
```

### 3. Opciones de Despliegue

#### Cloudflare Workers

Esta aplicación está configurada para desplegarse en Cloudflare Workers, una plataforma serverless con baja latencia global.

```bash
# Desplegar a Cloudflare Workers
bun run deploy
```

El despliegue utiliza `wrangler`, la CLI oficial de Cloudflare Workers. La configuración se encuentra en `wrangler.jsonc`:

```jsonc
{
  "name": "mcp-blockchain-metadata",
  "main": "src/index.ts",
  "compatibility_date": "2023-12-01",
  "env": {
    "production": {
      "vars": {
        "NODE_ENV": "production"
      },
      "secrets": ["AUTH_TOKEN"]
    }
  }
}
```

#### Servicios basados en Node.js

Estas opciones te permiten ejecutar tu servidor MCP (con Bun o Node.js) en plataformas PaaS sin necesidad de gestionar infraestructura.

---

##### Cloudflare Workers

1. **Prerrequisitos**

   - Cuenta en Cloudflare y la zona “Workers” habilitada en tu panel.
   - Wrangler CLI instalado:

     ```bash
     # Con NPM/yarn/pnpm
     npm install -g wrangler
     # o con Bun
     bun add -g wrangler
     ```

   - Autenticación con tu cuenta:

     ```bash
     wrangler login
     ```

2. **Configuración de `wrangler.toml`**  
   En la raíz de tu repo crea (o edita) `wrangler.toml`:

   ```toml
   name = "mcp-blockchain-metadata"
   main = "src/index.ts"
   compatibility_date = "2025-04-25"
   workers_dev = true

   # Opcional: mapea tu worker al subdominio raíz
   # routes = ["mcp-blockchain-metadata.workers.dev/*"]

   [env.production]
   # Variables de entorno en producción
   vars = { AUTH_TOKEN = "REPLACE_WITH_YOUR_TOKEN", LOG_LEVEL = "info" }

   [assets]
   binding = "ASSETS"
   directory = "./public"
   ```

   - **`workers_dev = true`** publica automáticamente tu Worker en `https://<name>.<name>.workers.dev`
   - Usa el bloque `[env.production]` para separar tu configuración de producción.

3. **Gestionar secretos**  
   Para no exponer el token en el TOML, usa Wrangler Secrets:

   ```bash
   wrangler secret put AUTH_TOKEN
   # te pedirá el valor y lo almacenará cifrado
   ```

4. **Scripts en `package.json`**  
   Añade:

   ```json
   "scripts": {
     "deploy": "wrangler publish --env production",
     "dev":    "wrangler dev"
   }
   ```

5. **Despliegue**

   - **Desarrollo local** (modo mock de Workers):

     ```bash
     npm run dev
     # o bun run dev
     ```

     Accede a `http://127.0.0.1:8787/mcp` para probar tu endpoint JSON-RPC.

   - **Publicar en Cloudflare**:

     ```bash
     npm run deploy
     # o bun run deploy
     ```

     Tras unos segundos tu Worker quedará activo en:

     ```
     https://mcp-blockchain-metadata.mcp-blockchain-metadata.workers.dev/mcp
     ```

6. **Logs y debugging**

   - Streaming de logs en tiempo real:

     ```bash
     wrangler tail
     ```

   - También puedes revisar los logs y el estado desde el **Dashboard → Workers → Tu Worker → Logs**.

7. **Puntos a tener en cuenta**
   - **Sin servidor**: no gestionas instancias, Cloudflare escala automáticamente.
   - **Límites free**: 100 000 invocaciones/día y 10 ms CPU por invocación en el plan gratuito.
   - **Rutas personalizadas**: si quieres exponer solo `/mcp`, ajusta en `routes` o en el Dashboard (Triggers → Add route).

Con esto tu servidor MCP estará corriendo en un entorno serverless globalmente distribuido, gratis hasta los límites del plan gratuito de Cloudflare Workers.

##### Vercel

1. **Prerrequisitos**

   - Cuenta en Vercel (<https://vercel.com>)
   - Vercel CLI opcional (`npm i -g vercel`)

2. **Configuración**

   - Crea un `vercel.json` en la raíz:

     ```json
     {
       "version": 2,
       "builds": [{ "src": "src/index.ts", "use": "@vercel/node" }],
       "routes": [
         { "src": "/mcp/(.*)", "dest": "src/index.ts" },
         { "src": "/(.*)", "dest": "src/index.ts" }
       ]
     }
     ```

   - En tu `package.json` asegúrate de tener:

     ```json
     "scripts": {
       "start": "bun run start",      // o "node dist/index.js" si construyes
       "build": "tsc"                 // si usas TypeScript con salida en /dist
     }
     ```

3. **Entorno**

   - En el Dashboard de Vercel → Settings → Environment Variables, añade:
     - `PORT` (por ejemplo `3000`)
     - `AUTH_TOKEN`
     - `LOG_LEVEL`

4. **Despliegue**

   ```bash
   vercel --prod
   ```

   Vercel detectará tu `vercel.json`, ejecutará `build` y pondrá en marcha `start`.

   - **Logs**: `vercel logs <deployment-url> --since 1h`

---

##### Railway

1. **Prerrequisitos**

   - Cuenta en Railway (<https://railway.app>)
   - Railway CLI (`npm i -g railway`)

2. **Preparación**

   - En `package.json`:

     ```json
     "scripts": {
       "start": "bun run start",
       "build": "tsc"
     }
     ```

   - (Opcional) Añade un `railway.json` para personalizar builds:

     ```json
     {
       "build": {
         "builder": "bun",
         "command": "bun install && bun run build"
       }
     }
     ```

3. **Variables de entorno**  
   En el panel de tu proyecto → Settings → Variables, crea:

   - `PORT`
   - `AUTH_TOKEN`
   - `LOG_LEVEL`

4. **Despliegue**

   ```bash
   railway init     # si aún no has utilizado Railway
   railway up       # detecta tu proyecto y lo despliega
   ```

5. **Monitoreo**
   - Logs en tiempo real: `railway logs`
   - Envoys métricas en el dashboard

---

##### Heroku

1. **Prerrequisitos**

   - Cuenta en Heroku (<https://heroku.com>)
   - Heroku CLI (`npm i -g heroku`)

2. **Procfile**  
   En la raíz, crea un archivo llamado `Procfile`:

   ```
   web: bun run start
   ```

3. **package.json**  
   Verifica que exista:

   ```json
   "scripts": {
     "start": "bun run start",
     "build": "tsc"
   }
   ```

4. **Despliegue**

   ```bash
   heroku create nombre-de-tu-app
   git push heroku main
   ```

5. **Configuración de entorno**

   ```bash
   heroku config:set AUTH_TOKEN=tu_token_secure
   heroku config:set LOG_LEVEL=info
   ```

6. **Logs**

   ```bash
   heroku logs --tail
   ```

---

##### AWS / GCP / Azure

Puedes desplegar tu servidor como contenedor Docker o directamente en sus servicios Node.js:

1. **Dockerfile** (válido para Cloud Run, App Service, ECS, EB, Azure Container Apps…):

   ```dockerfile
   FROM oven/bun:latest
   WORKDIR /app
   COPY . .
   RUN bun install
   CMD ["bun", "run", "start"]
   ```

2. **Construcción y publicación**

   ```bash
   docker build -t tu-registry/mcp-metadata:latest .
   docker push tu-registry/mcp-metadata:latest
   ```

3. **Despliegue**

   - **Google Cloud Run**:

     ```bash
     gcloud run deploy mcp-metadata \
       --image=tu-registry/mcp-metadata:latest \
       --set-env-vars=AUTH_TOKEN=tu_token,LOG_LEVEL=info \
       --region=us-central1 --platform=managed
     ```

   - **AWS Elastic Container Service / Beanstalk**:

     - ECS: define un servicio apuntando a la imagen, configura vars en el Task Definition.
     - Elastic Beanstalk:

       ```bash
       eb init --platform docker mcp-metadata
       eb create mcp-metadata-env
       eb setenv AUTH_TOKEN=tu_token LOG_LEVEL=info
       ```

   - **Azure Container Apps / App Service**:
     - Container Apps: crea un recurso apuntando a la imagen y añade las variables en la sección de Configuration.
     - App Service (Linux): selecciona Docker, configuración de imagen y app settings para `AUTH_TOKEN`, `LOG_LEVEL`.

4. **Sin Docker (solo Node.js)**

   - **Elastic Beanstalk Node.js**:

     ```bash
     eb init -p node.js mcp-metadata
     eb create mcp-metadata-env
     eb setenv AUTH_TOKEN=tu_token LOG_LEVEL=info
     ```

   - **Azure App Service** (Linux, Node.js stack):

     - Elige Node.js 18+, configura `startup command`:

       ```
       bun run start
       ```

     - Añade Application Settings para variables de entorno.

---

> **Buenas prácticas para todos los despliegues Node.js**
>
> - Nunca subas tu `.env` al repositorio; siempre usa la UI o CLI de la plataforma para definir vars seguras.
> - Usa HTTPS/SSL y revisa los certificados en producción.
> - Configura alertas y métricas (CPU, memoria, latencia) para detectar anomalías.
> - Asegura la puerta de enlace (CORS, rate limiting) si expones tu API públicamente.
> - Mantén actualizadas las dependencias y automatiza builds vía GitHub Actions, GitLab CI o similares.

## 📘 API Reference

### JSON-RPC Endpoints

El servidor expone un endpoint principal para comunicación JSON-RPC:

- **POST /mcp**: Procesa peticiones JSON-RPC 2.0 para ejecutar herramientas
  - Content-Type: application/json
  - Authorization: Bearer TOKEN
- **GET /mcp**: Establece conexión SSE (Server-Sent Events) para notificaciones en tiempo real
  - Accept: text/event-stream
  - Authorization: Bearer TOKEN
- **DELETE /mcp**: Termina sesiones activas
  - Authorization: Bearer TOKEN
  - Query params: sessionId (opcional)

### Formato de Peticiones JSON-RPC

```json
{
  "jsonrpc": "2.0", // Versión del protocolo JSON-RPC (obligatorio)
  "method": "string", // Nombre de la herramienta a ejecutar
  "params": {
    // Parámetros para la herramienta (específicos de cada método)
    "param1": "valor1",
    "param2": "valor2"
  },
  "id": "string|number" // Identificador de la petición (usado en la respuesta)
}
```

### Formato de Respuestas JSON-RPC

**Respuesta exitosa:**

```json
{
  "jsonrpc": "2.0",
  "result": {
    // Resultado de la ejecución
    "content": [
      // Array de bloques de contenido
      {
        "type": "text", // Tipo de contenido
        "text": "..." // Contenido en formato texto o JSON
      }
    ]
  },
  "id": "string|number" // El mismo ID que se envió en la petición
}
```

**Respuesta de error:**

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,       // Código de error
    "message": "Mensaje de error",
    "data": { ... }       // Datos adicionales del error (opcional)
  },
  "id": "string|number"   // El mismo ID que se envió en la petición
}
```

### Herramientas Disponibles

| Método                  | Descripción                               | Parámetros                                                                                              |
| ----------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `getMiniAppEndpoints`   | Obtiene endpoints de mini aplicaciones    | `{ type: string, filter?: string }`                                                                     |
| `getProtocolTokens`     | Obtiene tokens de un protocolo blockchain | `{ protocol: string, chainId?: number\|string, limit?: number, sort?: 'name'\|'symbol'\|'popularity' }` |
| `getMetadataOfTemplate` | Obtiene metadatos de una plantilla        | `{ templateId: string, version?: string }`                                                              |

#### Ejemplos de Peticiones

**Obtener tokens de Uniswap:**

```json
{
  "jsonrpc": "2.0",
  "method": "getProtocolTokens",
  "params": {
    "protocol": "uniswap",
    "chainId": 1,
    "limit": 10,
    "sort": "popularity"
  },
  "id": "1"
}
```

**Obtener endpoints de mini aplicaciones DEX:**

```json
{
  "jsonrpc": "2.0",
  "method": "getMiniAppEndpoints",
  "params": {
    "type": "dex",
    "filter": "ethereum"
  },
  "id": "2"
}
```

**Obtener metadatos de plantilla ERC-20:**

```json
{
  "jsonrpc": "2.0",
  "method": "getMetadataOfTemplate",
  "params": {
    "templateId": "erc20-standard",
    "version": "1.0.0"
  },
  "id": "3"
}
```

## 🔧 Troubleshooting

### Problemas Comunes

#### El servidor no inicia

**Posibles causas:**

- Puerto en uso por otra aplicación
- Variables de entorno mal configuradas
- Dependencias faltantes o incompatibles
- Permisos insuficientes

**Solución:**

```bash
# Verificar que el puerto esté disponible
npx kill-port 3000

# Verificar la configuración
cat .env

# Reinstalar dependencias
rm -rf node_modules
bun install
```

**Logs a revisar:**
Buscar mensajes de error como `EADDRINUSE` (puerto en uso) o `Error fatal al iniciar el servidor MCP`.

#### Error de autenticación

**Posibles causas:**

- Token de autenticación incorrecto o faltante
- Header de autorización mal formateado
- Tokens expirados o no válidos

**Solución:**
Asegúrate de enviar el header de autorización correctamente:

```
Authorization: Bearer tu_token_aqui
```

**Ejemplo con curl:**

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_token_secreto_aqui" \
  -d '{"jsonrpc":"2.0","method":"getProtocolTokens","params":{"protocol":"uniswap"},"id":"1"}'
```

#### Sesión inválida

**Posibles causas:**

- Sesión expirada por inactividad (30 minutos por defecto)
- ID de sesión incorrecto o corrupto
- Sesión eliminada manualmente

**Solución:**
Inicializa una nueva sesión con una petición de inicialización JSON-RPC:

```json
{
  "jsonrpc": "2.0",
  "method": "mcp.initialize",
  "params": {
    "client": {
      "name": "mi-cliente",
      "version": "1.0.0"
    }
  },
  "id": "init"
}
```

#### Errores en respuestas JSON-RPC

**Códigos de error comunes:**

| Código | Descripción                | Posible solución                                   |
| ------ | -------------------------- | -------------------------------------------------- |
| -32700 | Error de parsing JSON      | Verifica la sintaxis del JSON enviado              |
| -32600 | Petición JSON-RPC inválida | Verifica que la estructura cumpla con JSON-RPC 2.0 |
| -32601 | Método no encontrado       | Verifica el nombre del método invocado             |
| -32602 | Parámetros inválidos       | Revisa los parámetros enviados                     |
| -32000 | Error interno del servidor | Contacta al administrador del servidor             |
| -32001 | Error de autenticación     | Verifica el token de autenticación                 |

## ❓ FAQ

### ¿Qué es exactamente MCP?

Model Context Protocol (MCP) es un protocolo que permite a los modelos de lenguaje (LLMs) como Claude acceder a herramientas externas y contexto adicional, expandiendo sus capacidades más allá de su conocimiento base. Utiliza JSON-RPC 2.0 como mecanismo de comunicación y proporciona una interfaz estándar para definir y ejecutar herramientas.

### ¿Puedo integrar este servidor con cualquier LLM?

Este servidor está diseñado para integrarse con LLMs que soportan el protocolo MCP, como Claude de Anthropic. Otros modelos requerirían adaptadores específicos que implementen el cliente MCP. El proyecto [@modelcontextprotocol/sdk](https://github.com/anthropic/model-context-protocol-sdk) proporciona bibliotecas cliente para facilitar esta integración.

### ¿Cómo añadir una nueva herramienta blockchain?

Para añadir una nueva herramienta:

1. Crea un nuevo archivo en `src/tools/` siguiendo la convención de nombres (`miNuevaHerramienta.tool.ts`)
2. Implementa la herramienta siguiendo el patrón de las existentes:

   ```typescript
   export function registerMiNuevaHerramienta(server: McpServer) {
     server.tool(
       'miNuevaHerramienta',
       'Descripción detallada de la herramienta',
       {
         // Esquema de parámetros usando Zod
         parametro1: z.string().describe('Descripción del parámetro')
       },
       async params => {
         // Implementación de la herramienta
         return {
           content: [{ type: 'text', text: 'Respuesta' }]
         }
       }
     )
   }
   ```

3. Registra la herramienta en el servidor MCP (edita `src/mcp-http.ts` y `src/mcp-stdio.ts`)
4. Añade tipos y servicios necesarios en las carpetas correspondientes

### ¿Es seguro usar este servidor en producción?

Sí, siempre que sigas las prácticas de seguridad recomendadas:

1. Usa HTTPS para todas las comunicaciones (obligatorio en producción)
2. Configura un token de autenticación fuerte y único
3. Mantén actualizado el software y las dependencias
4. Implementa monitoreo y alertas para detectar comportamientos anómalos
5. Limita el acceso al servidor mediante reglas de firewall

### ¿Cómo puedo contribuir al proyecto?

Consulta la sección [Contribuir](#contribuir) para más información sobre cómo colaborar con el desarrollo.

## 👥 Contribuir

¡Las contribuciones son bienvenidas! Puedes contribuir de varias formas:

1. **Reportar bugs**: Abre un issue describiendo el problema, pasos para reproducirlo y entorno
2. **Sugerir mejoras**: Comparte tus ideas para mejorar el proyecto con descripción detallada
3. **Enviar pull requests**: Implementa nuevas características o correcciones siguiendo estos pasos:
   - Fork del repositorio
   - Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
   - Commit de tus cambios (`git commit -m 'Add: amazing feature'`)
   - Push a la rama (`git push origin feature/amazing-feature`)
   - Abre un Pull Request

### Guía de Estilo

- Sigue [StandardJS](https://standardjs.com/) para estilo de código
- Utiliza tipos TypeScript para todas las funciones y variables
- Añade comentarios JSDoc a funciones principales
- Mantén los commits atómicos y con mensajes descriptivos
- Incluye tests para nuevas funcionalidades

## 📄 Licencia

Este proyecto está licenciado bajo [Creative Commons Attribution-NonCommercial 4.0 International](LICENSE).

---

<div align="center">
  <p>Desarrollado por <a href="https://www.francocarballar.com/">Franco Carballar</a></p>
  <p>
    <a href="https://github.com/francocarballar/mcp-blockchain-metadata">GitHub</a> ·
    <a href="https://www.francocarballar.com/">Sitio Web</a>
  </p>
</div>
