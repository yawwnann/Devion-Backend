import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  GenerativeModel,
  SchemaType,
} from '@google/generative-ai';
import Groq from 'groq-sdk';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ToolCall,
  ToolResult,
  FUNCTION_CALLING_SYSTEM_PROMPT,
  TOOL_RESPONSE_PROMPT,
  ChatbotProvider,
  GroqTool,
  GroqMessage,
} from './chatbot.types';
import {
  getProjects,
  getTodos,
  getCalendarEvents,
  getGitHubStats,
  TOOL_DEFINITIONS,
} from './tools';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly geminiModel?: GenerativeModel;
  private readonly groqClient?: Groq;
  private readonly ollamaClient?: any;
  private readonly modelName: string;
  private readonly provider: ChatbotProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.provider = this.configService.get<ChatbotProvider>(
      'CHATBOT_PROVIDER',
      'groq',
    );
    this.modelName = this.configService.get<string>(
      this.provider === 'groq'
        ? 'GROQ_MODEL'
        : this.provider === 'gemini'
          ? 'GEMINI_MODEL'
          : 'OLLAMA_MODEL',
      this.provider === 'groq'
        ? 'llama-3.1-8b-instant'
        : this.provider === 'gemini'
          ? 'gemini-2.0-flash'
          : 'qwen2.5',
    );

    if (this.provider === 'groq') {
      const apiKey = this.configService.get<string>('GROQ_API_KEY');
      if (!apiKey) {
        this.logger.warn(
          'GROQ_API_KEY not configured. Please set your API key in .env file.',
        );
      } else {
        this.groqClient = new Groq({ apiKey });
        this.logger.log(
          `ChatbotService initialized with Groq model: ${this.modelName}`,
        );
      }
    } else if (this.provider === 'gemini') {
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (!apiKey || apiKey === 'your-api-key-here') {
        this.logger.warn(
          'GEMINI_API_KEY not configured. Please set your API key in .env file.',
        );
      } else {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.geminiModel = genAI.getGenerativeModel({
          model: this.modelName,
        });
        this.logger.log(
          `ChatbotService initialized with Gemini model: ${this.modelName}`,
        );
      }
    } else {
      const { Ollama } = require('ollama');
      const host = this.configService.get<string>(
        'OLLAMA_HOST',
        'http://localhost:11434',
      );
      this.ollamaClient = new Ollama({ host });
      this.logger.log(
        `ChatbotService initialized with Ollama model: ${this.modelName}`,
      );
    }
  }

  private getGroqToolDefinitions(): GroqTool[] {
    return TOOL_DEFINITIONS.map((tool) => ({
      type: 'function',
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: {
          type: 'object',
          properties: Object.entries(
            tool.function.parameters.properties,
          ).reduce(
            (acc, [key, value]) => {
              acc[key] = {
                type: value.type,
                description: value.description,
                ...(value.enum && { enum: value.enum }),
              };
              return acc;
            },
            {} as Record<string, any>,
          ),
          required: tool.function.parameters.required || [],
        },
      },
    }));
  }

  private getGeminiToolDefinitions() {
    return TOOL_DEFINITIONS.map((tool) => ({
      functionDeclarations: [
        {
          name: tool.function.name,
          description: tool.function.description,
          parameters: {
            type: SchemaType.OBJECT,
            properties: Object.entries(
              tool.function.parameters.properties,
            ).reduce(
              (acc, [key, value]) => {
                const schemaType =
                  value.type === 'string'
                    ? SchemaType.STRING
                    : value.type === 'number'
                      ? SchemaType.NUMBER
                      : value.type === 'boolean'
                        ? SchemaType.BOOLEAN
                        : SchemaType.ARRAY;

                if (value.enum) {
                  acc[key] = {
                    type: SchemaType.STRING,
                    format: 'enum',
                    enum: value.enum,
                    description: value.description,
                  };
                } else {
                  acc[key] = {
                    type: schemaType,
                    description: value.description,
                  };
                }
                return acc;
              },
              {} as Record<string, any>,
            ),
            required: tool.function.parameters.required || [],
          },
        },
      ],
    }));
  }

  async chat(request: ChatRequest, userId: string): Promise<ChatResponse> {
    const { message, conversationHistory = [] } = request;

    this.logger.log(`Processing chat request: ${message}`);

    try {
      if (this.provider === 'groq' && this.groqClient) {
        return this.chatWithGroq(message, conversationHistory, userId);
      } else if (this.provider === 'gemini' && this.geminiModel) {
        return this.chatWithGemini(message, conversationHistory, userId);
      } else {
        return this.chatWithOllama(message, conversationHistory, userId);
      }
    } catch (error) {
      this.logger.error('Chat error:', error);
      throw error;
    }
  }

  private async chatWithGroq(
    message: string,
    conversationHistory: ChatMessage[],
    userId: string,
  ): Promise<ChatResponse> {
    if (!this.groqClient) {
      throw new Error('Groq not configured');
    }

    const systemPrompt = FUNCTION_CALLING_SYSTEM_PROMPT.replace(
      '{{CURRENT_DATE}}',
      new Date().toISOString().split('T')[0],
    );

    // Build messages for Groq
    const messages: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })) as GroqMessage[]),
      { role: 'user', content: message },
    ];

    try {
      // Step 1: Call Groq with tools
      const response = await this.groqClient.chat.completions.create({
        model: this.modelName,
        messages,
        tools: this.getGroqToolDefinitions(),
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 2048,
      });

      const assistantMessage = response.choices[0]?.message;

      if (!assistantMessage) {
        throw new Error('No response from Groq');
      }

      // Check for tool calls
      if (
        assistantMessage.tool_calls &&
        assistantMessage.tool_calls.length > 0
      ) {
        this.logger.log(
          `Groq tool calls detected: ${assistantMessage.tool_calls.length}`,
        );

        const toolCalls: ToolCall[] = [];
        const toolResults: { name: string; result: ToolResult }[] = [];

        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments || '{}');

          this.logger.log(`Groq calling tool: ${functionName}`);

          const toolCallData: ToolCall = {
            name: functionName,
            parameters: functionArgs,
          };

          toolCalls.push(toolCallData);

          const toolResult = await this.executeTool(toolCallData, userId);
          toolResults.push({ name: functionName, result: toolResult });
        }

        // Format tool results
        const formattedResults = toolResults
          .map((tr) => {
            const formattedData = this.formatDataForContext(
              tr.name,
              tr.result.data,
            );
            return `${tr.name}: ${formattedData}`;
          })
          .join('\n\n');

        // Check if ALL tools returned empty data
        const allEmpty = toolResults.every((tr) => {
          const data = tr.result.data as any[];
          return !data || (Array.isArray(data) && data.length === 0);
        });

        // If all data is empty, respond directly without AI
        if (allEmpty) {
          const emptyResponses: Record<string, string> = {
            getProjects:
              'Anda belum memiliki project sama sekali. Klik "New Project" untuk menambahkan project pertama Anda! 🚀',
            getTodos:
              'Anda belum memiliki tugas sama sekali. Selamat! Anda bebas tugas! 🎉',
            getCalendarEvents:
              'Anda belum memiliki event di kalender. Kalender Anda masih kosong! 📅',
            getGitHubStats:
              'GitHub belum terhubung atau tidak ada repository. Hubungkan GitHub Anda untuk melihat stats! 🐙',
          };

          let directResponse = '';
          for (const tr of toolResults) {
            if (emptyResponses[tr.name]) {
              directResponse += emptyResponses[tr.name] + '\n\n';
            }
          }

          const updatedHistory: ChatMessage[] = [
            ...conversationHistory,
            { role: 'user', content: message },
            { role: 'assistant', content: directResponse.trim() },
          ];

          return {
            response: directResponse.trim(),
            toolCalls,
            conversationHistory: updatedHistory,
          };
        }

        // Step 2: Send tool results back to Groq for final response
        messages.push({
          role: 'assistant',
          content: assistantMessage.content || '',
          tool_calls: assistantMessage.tool_calls.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        });

        // Add tool results as user message with explicit instruction to show ALL data
        const responsePrompt = `Based on the data below, respond in Indonesian (Bahasa Indonesia).

      CRITICAL RULES:
      1. If you see "[EMPTY DATA]" - the user has ZERO items. Say "Anda belum memiliki [item] sama sekali" clearly.
      2. If you see "[DATA FOUND]" with count - ALWAYS mention the exact count first (e.g., "Anda memiliki 121 project keseluruhan")
      3. List items from the data - DO NOT fabricate or add items not in the data
      4. If there are many items (>20), show first 20 and mention "dan X lainnya..."
      5. ONLY use information from TOOL RESULTS - do not make up data
      6. Be honest - if data is empty, acknowledge it clearly

      USER QUERY: ${message}

      TOOL RESULTS:
      ${formattedResults}

      Your response:`;

        messages.push({ role: 'user', content: responsePrompt });

        const finalResponse = await this.groqClient.chat.completions.create({
          model: this.modelName,
          messages,
          temperature: 0.7,
          max_tokens: 8192,
        });

        const finalContent =
          finalResponse.choices[0]?.message?.content ||
          'Maaf, saya tidak dapat memproses permintaan Anda.';

        this.logger.log(
          `Response generated: ${finalContent.substring(0, 150)}...`,
        );

        const updatedHistory: ChatMessage[] = [
          ...conversationHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: finalContent },
        ];

        return {
          response: finalContent,
          toolCalls,
          conversationHistory: updatedHistory,
        };
      } else {
        // No tool calls, respond directly
        const directResponse =
          assistantMessage.content ||
          'Maaf, saya tidak dapat memproses permintaan Anda.';

        this.logger.log(
          `Direct response: ${directResponse.substring(0, 150)}...`,
        );

        const updatedHistory: ChatMessage[] = [
          ...conversationHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: directResponse },
        ];

        return {
          response: directResponse,
          toolCalls: [],
          conversationHistory: updatedHistory,
        };
      }
    } catch (error) {
      this.logger.error('Groq chat error:', error);
      // Fallback to Ollama if Groq fails and Ollama is available
      const ollamaHost = this.configService.get<string>('OLLAMA_HOST');
      if (ollamaHost && this.ollamaClient) {
        this.logger.warn('Falling back to Ollama due to Groq error');
        return this.chatWithOllama(message, conversationHistory, userId);
      }
      throw error;
    }
  }

  private async chatWithGemini(
    message: string,
    conversationHistory: ChatMessage[],
    userId: string,
  ): Promise<ChatResponse> {
    if (!this.geminiModel) {
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (!apiKey || apiKey === 'your-api-key-here') {
        throw new Error(
          'GEMINI_API_KEY not configured. Please set your API key in .env file.',
        );
      }
      this.logger.warn('Gemini not configured, falling back to Ollama');
      return this.chatWithOllama(message, conversationHistory, userId);
    }

    const systemPrompt = FUNCTION_CALLING_SYSTEM_PROMPT.replace(
      '{{CURRENT_DATE}}',
      new Date().toISOString().split('T')[0],
    );

    // Build conversation history for Gemini
    const contents = conversationHistory.slice(-10).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Add system prompt as first user message if conversation is new
    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
      contents.push({
        role: 'model',
        parts: [{ text: 'Understood. I will follow these guidelines.' }],
      });
    }

    // Add current user message
    contents.push({ role: 'user', parts: [{ text: message }] });

    try {
      const result = await this.geminiModel.generateContent({
        contents,
        tools: this.getGeminiToolDefinitions(),
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
        },
      });

      const response = result.response;
      const candidate = response.candidates?.[0];
      const content = candidate?.content;

      if (!content) {
        throw new Error('No content from Gemini');
      }

      // Check for function calls
      const functionCalls = content.parts?.filter((p) => p.functionCall);

      if (functionCalls && functionCalls.length > 0) {
        // Execute tools based on function calls
        const toolResults: { name: string; result: ToolResult }[] = [];
        const toolCalls: ToolCall[] = [];

        for (const part of functionCalls) {
          const functionCall = part.functionCall!;
          this.logger.log(`Gemini function call: ${functionCall.name}`);

          const toolCall: ToolCall = {
            name: functionCall.name,
            parameters: functionCall.args as Record<string, unknown>,
          };

          toolCalls.push(toolCall);

          const toolResult = await this.executeTool(toolCall, userId);
          toolResults.push({ name: functionCall.name, result: toolResult });
        }

        // Format tool results for response
        const formattedResults = toolResults
          .map((tr) => {
            const formattedData = this.formatDataForContext(
              tr.name,
              tr.result.data,
            );
            return `${tr.name}: ${formattedData}`;
          })
          .join('\n\n');

        // Send tool results back to Gemini for response generation
        const toolResponseParts = toolResults.map((tr) => ({
          functionResponse: {
            name: tr.name,
            response: { result: tr.result },
          },
        }));

        // Add user message with function responses
        contents.push({
          role: 'user',
          parts: toolResponseParts as any,
        });

        // Add prompt for natural response
        const responsePrompt = TOOL_RESPONSE_PROMPT.replace(
          '{{USER_QUERY}}',
          message,
        ).replace('{{TOOL_RESULTS}}', formattedResults);

        contents.push({ role: 'user', parts: [{ text: responsePrompt }] });

        const finalResult = await this.geminiModel.generateContent({
          contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
          },
        });

        const finalResponse =
          finalResult.response.candidates?.[0]?.content?.parts?.[0]?.text ||
          'Maaf, saya tidak dapat memproses permintaan Anda.';

        this.logger.log(
          `Response generated: ${finalResponse.substring(0, 150)}...`,
        );

        const updatedHistory: ChatMessage[] = [
          ...conversationHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: finalResponse },
        ];

        return {
          response: finalResponse,
          toolCalls,
          conversationHistory: updatedHistory,
        };
      } else {
        // No function call, respond directly
        const directResponse =
          content.parts?.[0]?.text ||
          'Maaf, saya tidak dapat memproses permintaan Anda.';

        this.logger.log(
          `Direct response: ${directResponse.substring(0, 150)}...`,
        );

        const updatedHistory: ChatMessage[] = [
          ...conversationHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: directResponse },
        ];

        return {
          response: directResponse,
          toolCalls: [],
          conversationHistory: updatedHistory,
        };
      }
    } catch (error) {
      this.logger.error('Gemini chat error:', error);
      // Only fallback to Ollama if Ollama is configured
      const ollamaHost = this.configService.get<string>('OLLAMA_HOST');
      if (ollamaHost) {
        this.logger.warn('Falling back to Ollama due to Gemini error');
        return this.chatWithOllama(message, conversationHistory, userId);
      }
      // Throw error if Ollama not available
      throw error;
    }
  }

  private async chatWithOllama(
    message: string,
    conversationHistory: ChatMessage[],
    userId: string,
  ): Promise<ChatResponse> {
    if (!this.ollamaClient) {
      throw new Error('Ollama not configured');
    }

    this.logger.log(`Using Ollama for chat: ${message}`);

    // Step 1: Use LLM to detect intent with structured output
    const intentPrompt = `You are an intent classifier. Analyze the user's query and respond with ONLY a JSON object.

Available intents:
- getProjects: Questions about projects, proyek, deadline project, status project
- getTodos: Questions about tasks, todos, tugas, checklist, what to do
- getCalendarEvents: Questions about schedule, jadwal, calendar, events, meetings, deadlines
- getGitHubStats: Questions about GitHub, repositories, commits, pull requests
- general: Greetings, general questions, or unclear queries

User query: "${message}"

Respond with ONLY this JSON format (no other text):
{"intent": "intentName", "parameters": {}}

Examples:
User: "Apa proyek saya yang belum selesai?"
Response: {"intent": "getProjects", "parameters": {"status": "TODO"}}

User: "Tugas apa yang harus saya kerjakan?"
Response: {"intent": "getTodos", "parameters": {"status": "pending"}}

User: "Halo, apa kabar?"
Response: {"intent": "general", "parameters": {}}
`;

    const intentResponse = await this.ollamaClient.chat({
      model: this.modelName,
      messages: [{ role: 'user', content: intentPrompt }],
      stream: false,
      options: {
        temperature: 0.1,
        top_p: 0.9,
      },
    });

    // Parse intent from response
    const intentContent = intentResponse.message.content.trim();
    const jsonMatch = intentContent.match(/\{[\s\S]*\}/);
    let intent = 'general';
    let parameters: Record<string, unknown> = {};

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as {
          intent: string;
          parameters?: Record<string, unknown>;
        };
        intent = parsed.intent || 'general';
        parameters = parsed.parameters || {};
        this.logger.log(`Detected intent: ${intent}`);
      } catch (e) {
        this.logger.warn('Failed to parse intent, using fallback');
        intent = this.detectIntentFallback(message);
      }
    } else {
      intent = this.detectIntentFallback(message);
    }

    // Step 2: If general intent, respond directly
    if (intent === 'general') {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: FUNCTION_CALLING_SYSTEM_PROMPT.replace(
            '{{CURRENT_DATE}}',
            new Date().toISOString().split('T')[0],
          ),
        },
        ...conversationHistory.slice(-10),
        { role: 'user', content: message },
      ];

      const response = await this.ollamaClient.chat({
        model: this.modelName,
        messages: messages as { role: string; content: string }[],
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        },
      });

      const updatedHistory: ChatMessage[] = [
        ...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: response.message.content },
      ];

      return {
        response: response.message.content,
        toolCalls: [],
        conversationHistory: updatedHistory,
      };
    }

    // Step 3: Execute tool to get data
    const toolCall: ToolCall = {
      name: intent,
      parameters: parameters,
    };

    this.logger.log(`Executing tool: ${toolCall.name}`);
    const toolResult = await this.executeTool(toolCall, userId);

    // Step 4: Format data for response
    const formattedData = this.formatDataForContext(
      toolCall.name,
      toolResult.data,
    );
    this.logger.log(`Retrieved data: ${formattedData.substring(0, 200)}...`);

    // Step 5: Generate response with data
    const responsePrompt = TOOL_RESPONSE_PROMPT.replace(
      '{{USER_QUERY}}',
      message,
    ).replace('{{TOOL_RESULTS}}', `${intent}: ${formattedData}`);

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: FUNCTION_CALLING_SYSTEM_PROMPT.replace(
          '{{CURRENT_DATE}}',
          new Date().toISOString().split('T')[0],
        ),
      },
      ...conversationHistory.slice(-10),
      { role: 'user', content: responsePrompt },
    ];

    const finalResponse = await this.ollamaClient.chat({
      model: this.modelName,
      messages: messages as { role: string; content: string }[],
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
      },
    });

    this.logger.log(
      `Response generated: ${finalResponse.message.content?.substring(0, 150)}...`,
    );

    const updatedHistory: ChatMessage[] = [
      ...conversationHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: finalResponse.message.content },
    ];

    return {
      response: finalResponse.message.content,
      toolCalls: [toolCall],
      conversationHistory: updatedHistory,
    };
  }

  /**
   * Fallback intent detection using keyword matching
   */
  private detectIntentFallback(message: string): string {
    const lower = message.toLowerCase();

    if (lower.includes('proyek') || lower.includes('project'))
      return 'getProjects';
    if (
      lower.includes('tugas') ||
      lower.includes('todo') ||
      lower.includes('task')
    )
      return 'getTodos';
    if (
      lower.includes('jadwal') ||
      lower.includes('calendar') ||
      lower.includes('event')
    )
      return 'getCalendarEvents';
    if (
      lower.includes('github') ||
      lower.includes('repo') ||
      lower.includes('commit')
    )
      return 'getGitHubStats';

    return 'general';
  }

  /**
   * Format data for LLM context
   */
  private formatDataForContext(toolName: string, data: unknown): string {
    if (!data) {
      return '[EMPTY DATA] Tidak ada data.';
    }

    if (toolName === 'getProjects') {
      const projects = data as any[];
      if (projects.length === 0) {
        return '[EMPTY DATA] User belum memiliki project sama sekali. Database kosong.';
      }

      let context = `[DATA FOUND] User memiliki ${projects.length} project:\n`;
      projects.forEach((p, i) => {
        context += `${i + 1}. **${p.name}** - Status: ${p.status}`;
        if (p.dueDate) {
          const dueDate = new Date(p.dueDate);
          context += `, Deadline: ${dueDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
        }
        if (p.information) {
          context += `\n   Info: ${p.information}`;
        }
        context += '\n';
      });
      return context.trim();
    }

    if (toolName === 'getTodos') {
      const todos = data as any[];
      if (todos.length === 0) {
        return '[EMPTY DATA] User tidak memiliki tugas sama sekali. Database kosong.';
      }

      let context = `[DATA FOUND] User memiliki ${todos.length} tugas:\n`;
      todos.forEach((t, i) => {
        const priorityEmoji: Record<string, string> = {
          HIGH: '🔴',
          MEDIUM: '🟡',
          LOW: '🟢',
        };
        context += `${i + 1}. **${t.title}** - ${priorityEmoji[t.priority] || '⚪'} ${t.priority}`;
        context += `, Status: ${t.status}`;
        if (t.day) {
          context += `, Hari: ${t.day}`;
        }
        if (t.dueDate) {
          const dueDate = new Date(t.dueDate);
          context += `, Deadline: ${dueDate.toLocaleDateString('id-ID')}`;
        }
        context += '\n';
      });
      return context.trim();
    }

    if (toolName === 'getCalendarEvents') {
      const events = data as any[];
      if (events.length === 0) {
        return 'User tidak memiliki event di kalender.';
      }

      let context = `User memiliki ${events.length} event di kalender:\n`;
      events.forEach((e, i) => {
        const typeEmoji: Record<string, string> = {
          project: '📁',
          todo: '📝',
          github: '🐙',
          custom: '📌',
        };
        const startDate = new Date(e.startDate);
        context += `${i + 1}. **${e.title}** - ${typeEmoji[e.eventType] || '📅'} ${e.eventType}`;
        context += `, ${startDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
        if (e.description) {
          context += `\n   ${e.description}`;
        }
        context += '\n';
      });
      return context.trim();
    }

    if (toolName === 'getGitHubStats') {
      const stats = data as any;
      if (!stats.githubConnected) {
        return 'GitHub belum terhubung.';
      }

      let context = `GitHub Stats:\n`;
      context += `Username: @${stats.githubUsername}\n`;
      context += `Total Repositories: ${stats.totalRepos}\n`;
      context += `Total Stars: ${stats.totalStars}\n`;

      if (stats.repos && stats.repos.length > 0) {
        context += `\nTop Repositories:\n`;
        stats.repos.slice(0, 5).forEach((r: any) => {
          context += `• **${r.name}** - ${r.stars} ⭐, ${r.forks} 🔱`;
          if (r.language) {
            context += ` (${r.language})`;
          }
          context += '\n';
        });
      }

      if (stats.languageStats) {
        context += `\nLanguages:\n`;
        Object.entries(stats.languageStats).forEach(([lang, count]) => {
          context += `• ${lang}: ${count} repo\n`;
        });
      }

      return context.trim();
    }

    return JSON.stringify(data, null, 2);
  }

  private async executeTool(
    toolCall: ToolCall,
    userId: string,
  ): Promise<ToolResult> {
    this.logger.log(`Executing tool: ${toolCall.name} for user ${userId}`);

    try {
      switch (toolCall.name) {
        case 'getProjects':
          return await getProjects(
            this.prisma,
            toolCall.parameters as any,
            userId,
          );
        case 'getTodos':
          return await getTodos(
            this.prisma,
            toolCall.parameters as any,
            userId,
          );
        case 'getCalendarEvents':
          return await getCalendarEvents(
            this.prisma,
            toolCall.parameters as any,
            userId,
          );
        case 'getGitHubStats':
          return await getGitHubStats(
            this.prisma,
            toolCall.parameters as any,
            userId,
          );
        default:
          return {
            success: false,
            data: null,
            error: `Unknown tool: ${toolCall.name}`,
          };
      }
    } catch (error) {
      this.logger.error(`Tool execution error for ${toolCall.name}:`, error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Tool execution failed',
      };
    }
  }

  async healthCheck(): Promise<{
    provider: ChatbotProvider;
    connected: boolean;
    model: string;
    modelLoaded?: boolean;
  }> {
    if (this.provider === 'groq') {
      const isConnected = !!this.groqClient;
      return {
        provider: 'groq',
        connected: isConnected,
        model: this.modelName,
      };
    } else if (this.provider === 'gemini') {
      const isConnected = !!this.geminiModel;
      return {
        provider: 'gemini',
        connected: isConnected,
        model: this.modelName,
      };
    } else {
      try {
        const localModels = await this.ollamaClient.list();
        const modelLoaded = localModels.models.some((m) =>
          m.name.includes(this.modelName),
        );

        return {
          provider: 'ollama',
          connected: true,
          model: this.modelName,
          modelLoaded,
        };
      } catch (error) {
        return {
          provider: 'ollama',
          connected: false,
          model: this.modelName,
          modelLoaded: false,
        };
      }
    }
  }
}
