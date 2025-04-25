import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerGetMiniAppEndpointsTool } from './tools/getMiniAppEndpoints.tool'
import { registerGetProtocolTokensTool } from './tools/getProtocolTokens.tool'
import { registerGetMetadataOfTemplateTool } from './tools/getMetadataOfTemplate.tool'

async function main () {
  // Crear instancia del servidor MCP
  const server = new McpServer({
    name: 'mcp-blockchain-metadata',
    version: '1.0.0',
    description: 'MCP Blockchain Metadata',
    author: 'Franco Carballar',
    repository:
      'https://github.com/francocarballar/mcp-blockchain-metadata.git',
    homepage: 'https://www.francocarballar.com/'
  })

  // Registrar las herramientas pasando la instancia del servidor
  registerGetMiniAppEndpointsTool(server)
  registerGetProtocolTokensTool(server)
  registerGetMetadataOfTemplateTool(server)

  // Crear un transporte stdio para la comunicación con el inspector
  const transport = new StdioServerTransport()

  // Conectar el servidor al transporte
  await server.connect(transport)

  // El transporte maneja automáticamente stdin/stdout
  console.error('MCP server ready with stdio transport')
}

main().catch(error => {
  console.error('Error in MCP stdio server:', error)
  process.exit(1)
})
