#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ZepAI } from './zepai.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.ZEPAPIKEY) {
  console.error('Error: ZEPAPIKEY environment variable is required');
  console.error('Please create a .env file with your Zep API key');
  process.exit(1);
}

const server = new Server(
  {
    name: 'zep-poke-mcp-v2',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize Zep AI client
const zepClient = new ZepAI(process.env.ZEPAPIKEY);

// Register available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_memory',
        description: 'Create or update a memory in Zep for a user session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Unique session identifier',
            },
            message: {
              type: 'string',
              description: 'Message content to store',
            },
            role: {
              type: 'string',
              enum: ['user', 'assistant'],
              description: 'Role of the message sender',
            },
          },
          required: ['sessionId', 'message', 'role'],
        },
      },
      {
        name: 'get_memory',
        description: 'Retrieve memory history for a user session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session identifier to retrieve memories for',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'search_memory',
        description: 'Search across all memories using semantic search',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results',
              default: 10,
            },
          },
          required: ['query'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'create_memory': {
        const result = await zepClient.createMemory(
          args.sessionId as string,
          args.message as string,
          args.role as 'user' | 'assistant'
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_memory': {
        const result = await zepClient.getMemory(args.sessionId as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'search_memory': {
        const result = await zepClient.searchMemory(
          args.query as string,
          (args.limit as number) || 10
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Zep MCP Server v2 running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});