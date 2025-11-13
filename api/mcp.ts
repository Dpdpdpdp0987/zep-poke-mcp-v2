import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ZepClient } from '@getzep/zep-cloud';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Define ZepAI class inline for Vercel deployment
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface MemoryResult {
  sessionId: string;
  messages: Message[];
  summary?: string;
}

interface SearchResult {
  content: string;
  score: number;
  sessionId?: string;
  metadata?: Record<string, any>;
}

class ZepAI {
  private client: ZepClient;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Zep API key is required');
    }
    this.client = new ZepClient({ apiKey });
  }

  async createMemory(
    sessionId: string,
    message: string,
    role: 'user' | 'assistant'
  ): Promise<{ success: boolean; sessionId: string }> {
    try {
      await this.client.memory.add(sessionId, {
        messages: [
          {
            role,
            content: message,
          },
        ],
      });

      return {
        success: true,
        sessionId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create memory: ${errorMessage}`);
    }
  }

  async getMemory(sessionId: string): Promise<MemoryResult> {
    try {
      const memory = await this.client.memory.get(sessionId);

      return {
        sessionId,
        messages: memory.messages?.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content || '',
          timestamp: msg.created_at,
        })) || [],
        summary: memory.summary?.content,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to retrieve memory: ${errorMessage}`);
    }
  }

  async searchMemory(query: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      const results = await this.client.memory.search(
        {
          text: query,
        },
        limit
      );

      return results.map((result) => ({
        content: result.message?.content || '',
        score: result.score || 0,
        sessionId: result.session_id,
        metadata: result.metadata,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to search memory: ${errorMessage}`);
    }
  }
}

// Validate required environment variables
const ZEPAPIKEY = process.env.ZEPAPIKEY;
if (!ZEPAPIKEY) {
  throw new Error('ZEPAPIKEY environment variable is required');
}

// Initialize Zep AI client
const zepClient = new ZepAI(ZEPAPIKEY);

// Create MCP server
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

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Create SSE transport for this request
  const transport = new SSEServerTransport('/mcp', res);

  // Connect server to transport
  await server.connect(transport);

  // Keep connection alive for SSE
  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);
}
