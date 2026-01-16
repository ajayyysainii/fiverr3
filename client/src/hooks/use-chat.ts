import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ChatInput, type ChatResponse, type MessageHistory } from "@shared/routes";

// GET /api/chat/history
export function useChatHistory() {
  return useQuery({
    queryKey: [api.chat.history.path],
    queryFn: async () => {
      const res = await fetch(api.chat.history.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch chat history");
      return api.chat.history.responses[200].parse(await res.json());
    },
  });
}

// POST /api/chat
export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ChatInput) => {
      const validated = api.chat.send.input.parse(data);
      const res = await fetch(api.chat.send.path, {
        method: api.chat.send.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
           const error = api.chat.send.responses[400].parse(await res.json());
           throw new Error(error.message);
        }
        throw new Error("Failed to send message");
      }
      
      return api.chat.send.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate history to show new messages
      queryClient.invalidateQueries({ queryKey: [api.chat.history.path] });
    },
  });
}

// POST /api/chat/clear
export function useClearChat() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const res = await fetch(api.chat.clear.path, {
                method: api.chat.clear.method,
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to clear chat");
            return api.chat.clear.responses[200].parse(await res.json());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.chat.history.path] });
        }
    });
}
