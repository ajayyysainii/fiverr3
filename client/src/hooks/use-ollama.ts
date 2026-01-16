import { useQuery } from "@tanstack/react-query";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_MODEL = "gemma3:4b";

interface OllamaStatus {
  available: boolean;
  configured: boolean;
  currentModel?: string;
  models?: string[];
  message?: string;
}

// Check user's LOCAL Ollama instance directly from browser
async function fetchLocalOllamaStatus(): Promise<OllamaStatus> {
  try {
    const response = await fetch(`${DEFAULT_OLLAMA_URL}/api/tags`, {
      method: "GET",
    });

    if (!response.ok) {
      return {
        available: false,
        configured: false,
        message: "Ollama is not responding. Make sure it's running.",
      };
    }

    const data = await response.json();
    const models = data.models?.map((m: { name: string }) => m.name) || [];

    return {
      available: true,
      configured: true,
      currentModel: models.includes(DEFAULT_MODEL) ? DEFAULT_MODEL : models[0] || DEFAULT_MODEL,
      models,
    };
  } catch (error) {
    return {
      available: false,
      configured: false,
      message: "Could not connect to Ollama. Please start Ollama on your computer.",
    };
  }
}

export function useOllamaStatus() {
  return useQuery<OllamaStatus>({
    queryKey: ["local-ollama-status"],
    queryFn: fetchLocalOllamaStatus,
    refetchInterval: 10000, // Check every 10 seconds
    staleTime: 5000,
    retry: false,
  });
}
