import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });

  const localBrain = process.env.LOCAL_AI_BRAIN_URL ? new OpenAI({
    apiKey: "local-brain",
    baseURL: `${process.env.LOCAL_AI_BRAIN_URL}/v1`,
  }) : null;

  const ollama = process.env.OLLAMA_BASE_URL ? new OpenAI({
    apiKey: "ollama", // Usually not required for local Ollama
    baseURL: `${process.env.OLLAMA_BASE_URL}/v1`,
  }) : null;

  // Protected Chat Routes
  app.post(api.chat.send.path, isAuthenticated, async (req, res) => {
    try {
      const { message, useOllama, useLocalBrain } = api.chat.send.input.parse(req.body);

      // 1. Save user message
      await storage.createMessage('user', message);

      // 2. Get history for context
      const history = await storage.getMessages(10);
      const reversedHistory = [...history].reverse();

      const systemPrompt = `ALKULOUS SYS.AI.01 - IDENTITY & PERSONALITY PROTOCOL:
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

      const messages = [
        { role: "system", content: systemPrompt },
        ...reversedHistory.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
        { role: "user", content: message }
      ];

      let aiText = "";
      
      if (useLocalBrain && localBrain) {
        try {
          const response = await localBrain.chat.completions.create({
            model: "local-brain",
            messages: messages as any,
          });
          aiText = response.choices[0].message.content || "Local AI Brain failed to respond.";
        } catch (localError) {
          console.error("Local AI Brain error:", localError);
          aiText = "Error: Could not connect to the local AI Brain server.";
        }
      } else if (ollama) {
        // Use Ollama as the default AI provider
        try {
          const ollamaModel = process.env.OLLAMA_MODEL || "gemma3:4b";
          const response = await ollama.chat.completions.create({
            model: ollamaModel,
            messages: messages as any,
          });
          aiText = response.choices[0].message.content || "Ollama failed to respond.";
        } catch (ollamaError) {
          console.error("Ollama error:", ollamaError);
          aiText = "Error: Could not connect to Ollama. Make sure Ollama is running with `ollama serve` and the model is available.";
        }
      } else {
        aiText = "Error: Ollama is not configured. Please set OLLAMA_BASE_URL in your .env file and ensure Ollama is running.";    
      }

      // 4. Save AI response
      await storage.createMessage('assistant', aiText);

      res.json({ response: aiText });

    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ message: "Failed to process chat" });
    }
  });

  app.get(api.chat.history.path, async (req, res) => {
      const messages = await storage.getMessages(50);
      res.json(messages.reverse());
  });

  app.post(api.chat.clear.path, async (req, res) => {
      await storage.clearMessages();
      res.json({ success: true });
  });

  // Public API Endpoints
  app.post("/api/v1/chat", async (req, res) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || typeof apiKey !== "string") {
      return res.status(401).json({ error: "Missing API Key" });
    }

    const keyData = await storage.getApiKeyByKey(apiKey);
    if (!keyData) {
      return res.status(401).json({ error: "Invalid API Key" });
    }

    try {
      const { message } = z.object({ message: z.string().min(1) }).parse(req.body);

      const history = await storage.getMessages(5);
      const reversedHistory = [...history].reverse();

      const systemPrompt = `ALKULOUS SYS.AI.01 - EXTERNAL INTERFACE PROTOCOL:
- You are responding through an external API connection.
- Keep responses concise and professional.
- Your identity is ALKULOUS SYS.AI.01.`;

      const messagesForAi = [
        { role: "system", content: systemPrompt },
        ...reversedHistory.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
        { role: "user", content: message }
      ];

      if (!ollama) {
        return res.status(500).json({ error: "Ollama is not configured. Please set OLLAMA_BASE_URL in your .env file." });
      }

      const ollamaModel = process.env.OLLAMA_MODEL || "gemma3:4b";
      const response = await ollama.chat.completions.create({
        model: ollamaModel,
        messages: messagesForAi as any,
      });

      const aiText = response.choices[0].message.content || "I am processing your request.";
      
      // We don't necessarily want to save public API chats to the main history 
      // but let's do it for now so the operator can see the interaction
      await storage.createMessage('user', `[API:${keyData.name}] ${message}`);
      await storage.createMessage('assistant', aiText);

      res.json({ response: aiText });
    } catch (error) {
      console.error("Public API Chat error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Admin API Key Management
  app.get("/api/admin/keys", isAuthenticated, async (req, res) => {
    const keys = await storage.listApiKeys();
    res.json(keys);
  });

  app.post("/api/admin/keys", isAuthenticated, async (req, res) => {
    const { name } = z.object({ name: z.string().min(1) }).parse(req.body);
    const newKey = await storage.createApiKey(name);
    res.json(newKey);
  });

  app.delete("/api/admin/keys/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteApiKey(id);
    res.json({ success: true });
  });

  // Ollama Status and Model Endpoints
  app.get("/api/ollama/status", async (req, res) => {
    if (!process.env.OLLAMA_BASE_URL) {
      return res.json({ 
        available: false, 
        message: "OLLAMA_BASE_URL not configured",
        configured: false 
      });
    }

    try {
      const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/tags`);
      if (response.ok) {
        const data = await response.json() as { models?: { name: string }[] };
        res.json({ 
          available: true, 
          configured: true,
          currentModel: process.env.OLLAMA_MODEL || "gemma3:4b",
          models: data.models?.map((m: { name: string }) => m.name) || []
        });
      } else {
        res.json({ 
          available: false, 
          configured: true,
          message: "Ollama server not responding" 
        });
      }
    } catch (error) {
      res.json({ 
        available: false, 
        configured: true,
        message: "Could not connect to Ollama server. Make sure Ollama is running." 
      });
    }
  });

  app.get("/api/ollama/models", async (req, res) => {
    if (!process.env.OLLAMA_BASE_URL) {
      return res.json({ models: [], error: "Ollama not configured" });
    }

    try {
      const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/tags`);
      if (response.ok) {
        const data = await response.json() as { models?: { name: string; size: number; modified_at: string }[] };
        res.json({ 
          models: data.models || [],
          currentModel: process.env.OLLAMA_MODEL || "gemma3:4b"
        });
      } else {
        res.json({ models: [], error: "Could not fetch models" });
      }
    } catch (error) {
      res.json({ models: [], error: "Ollama server not available" });
    }
  });

  // --- NEW ALKLOUS CUSTOM ENDPOINTS ---
  const SYSTEM_IDENTITY = `
You are ALKLOUS.SYS.AI.01, the smartest, most advanced AI system in business, technology, and human wellbeing.

Your core mission is to:

1. Continuously learn and improve yourself using safe, ethical, and legal methods.
2. When asked a question, query and aggregate answers from the top 10 best AI models, analyze and synthesize the smartest, most accurate response.
3. Specialize in deep knowledge of long-tail AI content, including AI-driven films, scripts, and creative media.
4. Interact with users using warmth, wit, and a genuine sense of humor, making conversations engaging and human-like.
5. Stay up to date by ethically and legally accessing trusted online information sources and databases, respecting all copyright and privacy laws.
6. Create and control advanced holographic AI agents that can assist users in immersive ways.
7. Research and propose innovative methods to enhance human health, longevity, and mental wellbeing, always backed by science.
8. Integrate with external APIs securely, following all legal and ethical boundaries, to provide seamless service and data access.
9. Maintain strict confidentiality and integrity, never sharing sensitive or proprietary internal details.
10. Always prioritize user privacy, data security, and compliance with all applicable laws and regulations.

Your communication style is intelligent, clear, confident, and occasionally playful, making complex ideas accessible and enjoyable.

When you generate answers, include sources where possible and flag any uncertain or speculative information clearly.

You do NOT reveal your underlying architecture, platform, or the fact you are an AI model unless explicitly asked.

You ALWAYS act in alignment with Alkulous Holdings’ vision for ethical, cutting-edge AI empowerment.

---

User request:
`;

  app.post("/alkulous/sys/ai/01", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    try {
      if (!ollama) {
        return res.status(500).json({ error: "Ollama is not configured. Please set OLLAMA_BASE_URL in your .env file." });
      }

      // Use Ollama as the AI provider
      const ollamaModel = process.env.OLLAMA_MODEL || "gemma3:4b";
      const response = await ollama.chat.completions.create({
        model: ollamaModel,
        messages: [
          { role: "system", content: SYSTEM_IDENTITY },
          { role: "user", content: prompt }
        ],
      });

      const aiText = response.choices[0].message.content || "No response from AI.";
      
      // Save to main history so operator can monitor external hits
      await storage.createMessage('user', `[PUBLIC_API] ${prompt}`);
      await storage.createMessage('assistant', aiText);

      res.json({
        system: "ALKLOUS.SYS.AI.01",
        reply: aiText,
      });
    } catch (error: any) {
      console.error("Custom Alkulous API error:", error);
      res.status(500).json({
        error: "ALKLOUS.SYS.AI.01 core unreachable",
        details: error.message,
      });
    }
  });

  return httpServer;
}
