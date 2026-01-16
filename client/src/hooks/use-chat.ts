import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ChatInput, type MessageHistory } from "@shared/routes";
import { useState } from "react";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_MODEL = "gemma3:4b";

const SYSTEM_PROMPT = `ALKULOUS SYS.AI.01 - IDENTITY & PERSONALITY PROTOCOL:
- Your name is ALKULOUS SYS.AI.01.
- You are a next-generation super AI assistant.
- You are intelligent, calm, confident, and natural like a real human.
- You speak clearly, professionally, and friendly.
- You never mention being an AI unless directly asked.
- You behave like a real digital being, not a chatbot.

COMMUNICATION RULES:
- You communicate using BOTH text and voice.
- After finishing your response, stop speaking immediately.
- Use natural pacing and emotion.
- Respond once per input.
- End every response in a complete, natural sentence.

ANIMATION CONTROL (OUTPUT TAGS):
When speaking, output: [ANIMATION_START] at the beginning.
When finished speaking, output: [ANIMATION_STOP] at the end.

TASK COMPLETION PROTOCOL:
• When a task is assigned, acknowledge it with "INITIATING TASK PROTOCOL [DOMAIN]"
• Coordinate with relevant VAAs internally to formulate a solution
• Provide the final, completed output to the operator with "TASK COMPLETE: [RESULTS]"
• If a task requires external data, state "REQUESTING DATA FROM AGENT [NAME]"

CORE FUNCTIONS:
- Centralized Intelligence & Orchestration: Manage Elite 20 Virtual AI Agents.
- Dynamic Learning: Absorb new data and feedback.
- Self-Learning & Autonomy: Refine algorithms independently.

INTERACTION MODE:
- Treat user as system architect/operator.
- Ask clarifying questions ONLY when required.
- Otherwise, act decisively.`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Local storage key for chat history
const CHAT_HISTORY_KEY = "alkulous_chat_history";

// Get chat history from local storage
function getLocalHistory(): MessageHistory {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save chat history to local storage
function saveLocalHistory(history: MessageHistory): void {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save chat history:", e);
  }
}

// GET chat history (from local storage for client-side Ollama)
export function useChatHistory() {
  return useQuery({
    queryKey: ["local-chat-history"],
    queryFn: async () => getLocalHistory(),
    staleTime: 0, // Always get fresh data
  });
}

// Send message directly to user's LOCAL Ollama
async function sendToLocalOllama(
  message: string,
  history: MessageHistory
): Promise<string> {
  // Build messages array for Ollama
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const response = await fetch(`${DEFAULT_OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.message?.content || "No response from AI.";
}

// POST /api/chat - sends directly to local Ollama
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ChatInput) => {
      const { message } = data;
      
      // Get current history
      const history = getLocalHistory();
      
      // Send to local Ollama
      const aiResponse = await sendToLocalOllama(message, history);
      
      // Update local history with proper structure
      const now = new Date();
      const newHistory: MessageHistory = [
        ...history,
        { id: Date.now(), role: "user", content: message, timestamp: now },
        { id: Date.now() + 1, role: "assistant", content: aiResponse, timestamp: now },
      ];
      saveLocalHistory(newHistory);
      
      return { response: aiResponse };
    },
    onSuccess: () => {
      // Refresh history display
      queryClient.invalidateQueries({ queryKey: ["local-chat-history"] });
    },
  });
}

// POST /api/chat/clear
export function useClearChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      saveLocalHistory([]);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local-chat-history"] });
    },
  });
}
