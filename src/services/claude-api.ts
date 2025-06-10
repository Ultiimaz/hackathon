interface ClaudeAPIOptions {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export class ClaudeAPIService {
  private apiKey: string;
  private baseURL = '/api/claude'; // Use local proxy endpoint instead of direct API

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(
    messages: Array<{ role: string; content: string }>,
    options: Partial<ClaudeAPIOptions> = {},
    onStream?: (chunk: string) => void
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API key is required');
    }

    const payload = {
      model: options.model || 'claude-3-sonnet-20240229',
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7,
      messages: messages.filter(m => m.role !== 'system'),
      stream: !!onStream,
      apiKey: this.apiKey, // Include API key in payload for proxy
    };

    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'API request failed';
        
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.error?.message || error.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      if (onStream) {
        return this.handleStreamingResponse(response, onStream);
      } else {
        const data = await response.json();
        return data.content[0]?.text || '';
      }
    } catch (error) {
      console.error('Claude API error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to communicate with Claude API');
    }
  }

  private async handleStreamingResponse(
    response: Response,
    onStream: (chunk: string) => void
  ): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Stream reader not available');
    }

    let fullResponse = '';
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta') {
                const text = parsed.delta?.text || '';
                fullResponse += text;
                onStream(text);
              }
            } catch (e) {
              // Ignore parsing errors for malformed chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullResponse;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.sendMessage([{ role: 'user', content: 'Hello' }], { maxTokens: 10 });
      return true;
    } catch {
      return false;
    }
  }
}