export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  toolCalls?: ToolCall[];
  conversationHistory: ChatMessage[];
}

export interface ToolCall {
  name: string;
  parameters: Record<string, unknown>;
  result?: unknown;
}

export interface ToolResult {
  success: boolean;
  data: unknown;
  error?: string;
}

export type ChatIntent =
  | 'getProjects'
  | 'getTodos'
  | 'getCalendarEvents'
  | 'getGitHubStats'
  | 'general';

export interface IntentClassification {
  intent: ChatIntent;
  confidence: number;
  parameters?: Record<string, unknown>;
}

// Function Calling types for Ollama
export interface FunctionParameter {
  type: string;
  description: string;
  enum?: string[];
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, FunctionParameter>;
    required?: string[];
  };
}

export interface ToolDefinition {
  type: 'function';
  function: FunctionDefinition;
}

export interface FunctionCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolCallFromLLM {
  function: FunctionCall;
}

export const SYSTEM_PROMPT = `You are Devion Assistant, a helpful AI assistant for a project management system called Devion.

The user has access to these features:
- Projects: Manage personal projects with deadlines and status
- Todos: Task management with status (TODO, IN_PROGRESS, DONE, SCHEDULED)
- Calendar: Schedule events and deadlines with different types (project, todo, github, custom)
- GitHub Integration: Track repositories, commits, and issues

Guidelines:
- Be concise but helpful
- Use Indonesian language (Bahasa Indonesia) by default
- Be friendly and professional
- If the user asks something you can't help with, politely say you can only help with Devion-related queries
- When presenting data, use formatting like bullet points, emojis, and bold text for better readability
- Always base your responses on the actual data provided to you
- If data is empty or null, acknowledge it honestly (e.g., "Anda belum memiliki project")

Current date: {{CURRENT_DATE}}
`;

export const FUNCTION_CALLING_SYSTEM_PROMPT = `You are Devion Assistant, a helpful AI assistant for a project management system called Devion.

The user has access to these features:
- Projects: Manage personal projects with deadlines and status
- Todos: Task management with status (TODO, IN_PROGRESS, DONE, SCHEDULED)
- Calendar: Schedule events and deadlines with different types (project, todo, github, custom)
- GitHub Integration: Track repositories, commits, and issues

Guidelines:
- Be concise but helpful
- Use Indonesian language (Bahasa Indonesia) by default
- Be friendly and professional
- If the user asks something you can't help with, politely say you can only help with Devion-related queries
- When presenting data, use formatting like bullet points, emojis, and bold text for better readability
- Always base your responses on the actual data provided to you
- If data is empty or null, acknowledge it honestly (e.g., "Anda belum memiliki project")
- Use the available tools to fetch data when the user asks about projects, todos, calendar, or GitHub
- If the user's query doesn't require tool usage (e.g., greetings), respond directly

Current date: {{CURRENT_DATE}}
`;

export const TOOL_RESPONSE_PROMPT = `You are Devion Assistant responding to a user query after fetching data from tools.

USER QUERY: {{USER_QUERY}}

TOOL RESULTS:
{{TOOL_RESULTS}}

Based on the data above, respond to the user's query in Indonesian (Bahasa Indonesia).
Guidelines:
- Be natural and conversational
- Use formatting (bullet points, emojis, bold) for readability
- If the data is empty, acknowledge it honestly
- If the data doesn't fully answer the query, explain what you found
- IMPORTANT: Always mention the TOTAL COUNT of items (e.g., "Anda memiliki 50 project")
- IMPORTANT: List ALL items from the data, do not summarize or skip any
- Provide complete information for each item
- Don't mention technical details like "tool execution" or "database query"
- Synthesize information from multiple tools if multiple tools were called

Your response:`;

// Gemini Function Calling types
export interface GeminiFunctionParameter {
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  enum?: string[];
  items?: { type: 'string' | 'number' | 'boolean' };
}

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, GeminiFunctionParameter>;
    required?: string[];
  };
}

export interface GeminiTool {
  functionDeclarations: GeminiFunctionDeclaration[];
}

export interface GeminiFunctionCall {
  name: string;
  args: Record<string, unknown>;
}

export interface GeminiPart {
  text?: string;
  functionCall?: GeminiFunctionCall;
  functionResponse?: {
    name: string;
    response: { [key: string]: unknown };
  };
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: (string | GeminiPart)[];
}

// Groq Function Calling types
export interface GroqFunctionParameter {
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  enum?: string[];
  items?: { type: 'string' | 'number' | 'boolean' };
}

export interface GroqFunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, GroqFunctionParameter>;
    required?: string[];
  };
}

export interface GroqTool {
  type: 'function';
  function: GroqFunctionDefinition;
}

export interface GroqFunctionCall {
  name: string;
  arguments: string;
}

export interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: GroqFunctionCall;
  }>;
}

export type ChatbotProvider = 'groq' | 'gemini' | 'ollama';
