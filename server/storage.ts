import { db } from "./db";
import { messages, apiKeys, type Message, type InsertMessage, type ApiKey } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Messages
  createMessage(role: string, content: string): Promise<Message>;
  getMessages(limit?: number): Promise<Message[]>;
  clearMessages(): Promise<void>;
  
  // API Keys
  getApiKeyByKey(key: string): Promise<ApiKey | undefined>;
  createApiKey(name: string): Promise<ApiKey>;
  listApiKeys(): Promise<ApiKey[]>;
  deleteApiKey(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createMessage(role: string, content: string): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({ role, content })
      .returning();
    return message;
  }

  async getMessages(limit: number = 50): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .orderBy(desc(messages.timestamp))
      .limit(limit);
  }

  async clearMessages(): Promise<void> {
      await db.delete(messages);
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.key, key));
    return apiKey;
  }

  async createApiKey(name: string): Promise<ApiKey> {
    const key = `ak_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const [apiKey] = await db.insert(apiKeys).values({ key, name }).returning();
    return apiKey;
  }

  async listApiKeys(): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).orderBy(desc(apiKeys.id));
  }

  async deleteApiKey(id: number): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }
}

export const storage = new DatabaseStorage();
