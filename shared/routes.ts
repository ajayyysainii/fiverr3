import { z } from 'zod';
import { insertMessageSchema, messages } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  chat: {
    send: {
      method: 'POST' as const,
      path: '/api/chat',
      input: z.object({
        message: z.string().min(1),
        useOllama: z.boolean().optional(),
        useLocalBrain: z.boolean().optional(),
      }),
      responses: {
        200: z.object({
          response: z.string()
        }),
        400: errorSchemas.validation,
        500: errorSchemas.internal
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/chat/history',
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    clear: {
        method: 'POST' as const,
        path: '/api/chat/clear',
        responses: {
            200: z.object({ success: z.boolean() })
        }
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ChatInput = z.infer<typeof api.chat.send.input>;
export type ChatResponse = z.infer<typeof api.chat.send.responses[200]>;
export type MessageHistory = z.infer<typeof api.chat.history.responses[200]>;
