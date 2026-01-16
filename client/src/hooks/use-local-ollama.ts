import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

// Default Ollama URL (user's local machine)
const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_MODEL = "gemma3:4b";

export interface LocalOllamaStatus {
  available: boolean;
  models: string[];
  currentModel: string;
  error?: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Check if user's local Ollama is running
async function checkLocalOllama(): Promise<LocalOllamaStatus> {
  try {
    const response = await fetch(`${DEFAULT_OLLAMA_URL}/api/tags`, {
      method: "GET",
      // No CORS headers needed for localhost to localhost,
      // but user needs to configure Ollama for cross-origin if accessing from hosted site
    });
    
    if (!response.ok) {
      return {
        available: false,
        models: [],
        currentModel: DEFAULT_MODEL,
        error: "Ollama server not responding",
      };
    }
    
    const data = await response.json();
    const models = data.models?.map((m: { name: string }) => m.name) || [];
    
    return {
      available: true,
      models,
      currentModel: models.includes(DEFAULT_MODEL) ? DEFAULT_MODEL : models[0] || DEFAULT_MODEL,
    };
  } catch (error) {
    return {
      available: false,
      models: [],
      currentModel: DEFAULT_MODEL,
      error: "Could not connect to Ollama. Make sure Ollama is running on your computer.",
    };
  }
}

// Hook to check local Ollama status
export function useLocalOllamaStatus() {
  return useQuery<LocalOllamaStatus>({
    queryKey: ["local-ollama-status"],
    queryFn: checkLocalOllama,
    refetchInterval: 10000, // Check every 10 seconds
    staleTime: 5000,
    retry: false, // Don't retry on failure - user needs to start Ollama
  });
}

// Send a chat message directly to user's local Ollama
export async function sendToLocalOllama(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL,
  onStream?: (chunk: string) => void
): Promise<string> {
  const response = await fetch(`${DEFAULT_OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: !!onStream, // Enable streaming if callback provided
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  if (onStream && response.body) {
    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(Boolean);

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            fullResponse += json.message.content;
            onStream(json.message.content);
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }

    return fullResponse;
  } else {
    // Non-streaming response
    const data = await response.json();
    return data.message?.content || "";
  }
}

// Hook for sending messages to local Ollama with state management
export function useLocalOllamaChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingResponse, setStreamingResponse] = useState("");

  const sendMessage = useCallback(
    async (
      messages: ChatMessage[],
      model: string = DEFAULT_MODEL,
      enableStreaming: boolean = true
    ): Promise<string> => {
      setIsLoading(true);
      setError(null);
      setStreamingResponse("");

      try {
        const response = await sendToLocalOllama(
          messages,
          model,
          enableStreaming
            ? (chunk) => {
                setStreamingResponse((prev) => prev + chunk);
              }
            : undefined
        );

        setStreamingResponse("");
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get response from Ollama";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    sendMessage,
    isLoading,
    error,
    streamingResponse,
  };
}
