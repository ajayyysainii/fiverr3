import { useQuery } from "@tanstack/react-query";

interface OllamaStatus {
  available: boolean;
  configured: boolean;
  currentModel?: string;
  models?: string[];
  message?: string;
}

async function fetchOllamaStatus(): Promise<OllamaStatus> {
  const response = await fetch("/api/ollama/status");
  if (!response.ok) {
    throw new Error("Failed to fetch Ollama status");
  }
  return response.json();
}

export function useOllamaStatus() {
  return useQuery<OllamaStatus>({
    queryKey: ["/api/ollama/status"],
    queryFn: fetchOllamaStatus,
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 10000, // Consider fresh for 10 seconds
  });
}
