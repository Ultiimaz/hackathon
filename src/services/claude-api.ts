interface ClaudeAPIOptions {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export class ClaudeAPIService {
  private apiKey: string;
  private baseURL =
    "https://btcdirect.app.n8n.cloud/webhook/7cde46c6-2f20-49ce-b8d7-1dd605947eb0"; // Use local proxy endpoint instead of direct API

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(
    messages: Array<{ role: string; content: string }>,
    options: Partial<ClaudeAPIOptions> = {},
    onStream?: (chunk: string) => void
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("API key is required");
    }

    const payload = {
      model: options.model || "claude-3-sonnet-20240229",
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7,
      messages: messages,
      stream: !!onStream,
      apiKey: this.apiKey, // Include API key in payload for proxy
    };

    try {
      const response = await fetch(`${this.baseURL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("API request failed");
      }

      const json = await response.json();

      return json.text;
    } catch (error) {
      console.error("Claude API error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to communicate with Claude API");
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.sendMessage([{ role: "user", content: "Hello" }], {
        maxTokens: 10,
      });
      return true;
    } catch {
      return false;
    }
  }
}
