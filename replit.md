# Alkulous - Master AI Brain Interface

## Overview

Alkulous is a conversational AI interface designed as a "Master AI Brain" training and communication console. The application provides a cyberpunk-themed UI for interacting with an AI assistant through both text and voice input/output. It features a full-stack architecture with a React frontend and Express backend, connected to a PostgreSQL database for conversation persistence.

The core purpose is to serve as a central intelligence system that can learn from interactions, respond with both voice and text, and maintain conversational context across sessions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for complex UI transitions
- **Voice Features**: 
  - `react-speech-recognition` for voice input (Web Speech API)
  - `window.speechSynthesis` for voice output (TTS)
- **Build Tool**: Vite with path aliases (`@/` for client src, `@shared/` for shared code)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: REST endpoints under `/api/` prefix
- **AI Integration**: OpenAI-compatible API via Replit AI Integrations
  - Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
- **Development**: Vite middleware for HMR in development
- **Production**: Static file serving from built assets

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Migrations**: `drizzle-kit push` for schema sync
- **Tables**:
  - `messages`: Stores conversation history (role, content, timestamp)

### API Structure
- `POST /api/chat`: Send message and get AI response
- `GET /api/chat/history`: Retrieve conversation history
- `POST /api/chat/clear`: Clear conversation history

### Key Design Patterns
- **Shared Types**: Schema and route definitions in `shared/` directory used by both client and server
- **Type-safe APIs**: Zod schemas for input validation and response typing
- **Component Library**: shadcn/ui components with custom cyberpunk theming (neon red palette)
- **Replit Integrations**: Modular integration helpers in `server/replit_integrations/` for batch processing, chat, and image generation

## External Dependencies

### Database
- PostgreSQL (required via `DATABASE_URL` environment variable)
- Drizzle ORM with `drizzle-kit` for migrations

### AI Services
- OpenAI-compatible API endpoint (Replit AI Integrations)
- Required environment variables:
  - `AI_INTEGRATIONS_OPENAI_API_KEY`
  - `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Frontend Libraries
- React ecosystem (React, ReactDOM, React Query)
- Radix UI primitives (full shadcn/ui component set)
- Framer Motion for animations
- Lucide React for icons

### Voice Integration
- Browser Web Speech API for speech recognition
- Browser Speech Synthesis API for text-to-speech
- Note: Requires secure context (HTTPS) in production

### Development Tools
- Vite with React plugin
- Replit-specific plugins for development (cartographer, dev-banner, error overlay)
- TypeScript with strict mode