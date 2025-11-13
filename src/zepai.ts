import { ZepClient } from '@getzep/zep-cloud';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface MemoryResult {
  sessionId: string;
  messages: Message[];
  summary?: string;
}

export interface SearchResult {
  content: string;
  score: number;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export class ZepAI {
  private client: ZepClient;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Zep API key is required');
    }
    this.client = new ZepClient({ apiKey });
  }

  /**
   * Create or update a memory for a session
   */
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

  /**
   * Retrieve memory history for a session
   */
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

  /**
   * Search across all memories using semantic search
   */
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