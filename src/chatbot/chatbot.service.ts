import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ToolCall,
  ToolResult,
  SYSTEM_PROMPT,
  INTENT_CLASSIFICATION_PROMPT,
  RAG_RESPONSE_PROMPT,
  ChatIntent,
  IntentClassification,
} from './chatbot.types';
import {
  getProjects,
  getTodos,
  getCalendarEvents,
  getGitHubStats,
} from './tools';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly ollama: Ollama;
  private readonly ollamaSmall: Ollama;
  private readonly modelName: string;
  private readonly smallModelName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const host = this.configService.get<string>('OLLAMA_HOST', 'http://localhost:11434');
    this.modelName = this.configService.get<string>('OLLAMA_MODEL', 'phi3:3.8b');
    this.smallModelName = this.configService.get<string>('OLLAMA_SMALL_MODEL', 'tinyllama:1.1b');

    this.ollama = new Ollama({ host });
    this.ollamaSmall = new Ollama({ host });

    this.logger.log(`ChatbotService initialized with main model: ${this.modelName}, small model: ${this.smallModelName}`);
  }

  async chat(request: ChatRequest, userId: string): Promise<ChatResponse> {
    const { message, conversationHistory = [] } = request;

    this.logger.log(`Processing chat request: ${message}`);

    try {
      // Step 1: Classify intent using LLM
      const classification = await this.classifyIntent(message);
      this.logger.log(`Intent classified: ${classification.intent} (confidence: ${classification.confidence})`);

      // Step 2: If intent is general, respond directly without tool execution
      if (classification.intent === 'general') {
        const messages: ChatMessage[] = [
          { role: 'system', content: SYSTEM_PROMPT.replace('{{CURRENT_DATE}}', new Date().toISOString().split('T')[0]) },
          ...conversationHistory.slice(-10),
          { role: 'user', content: message },
        ];

        const llmResponse = await this.ollama.chat({
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
          { role: 'assistant', content: llmResponse.message.content },
        ];

        return {
          response: llmResponse.message.content,
          toolCalls: [],
          conversationHistory: updatedHistory,
        };
      }

      // Step 3: Execute tool to retrieve data (RAG approach)
      const toolCall: ToolCall = {
        name: classification.intent,
        parameters: classification.parameters || {},
      };

      this.logger.log(`Executing tool: ${toolCall.name}`);
      const toolResult = await this.executeTool(toolCall);

      // Step 4: Format retrieved data for LLM
      const formattedData = this.formatDataForContext(toolCall.name, toolResult.data);
      this.logger.log(`Retrieved data: ${formattedData.substring(0, 200)}...`);

      // Step 5: Generate natural response using LLM with retrieved data (RAG)
      const ragPrompt = RAG_RESPONSE_PROMPT
        .replace('{{USER_QUERY}}', message)
        .replace('{{RETRIEVED_DATA}}', formattedData || 'Tidak ada data yang ditemukan.');

      const messages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT.replace('{{CURRENT_DATE}}', new Date().toISOString().split('T')[0]) },
        { role: 'user', content: ragPrompt },
      ];

      const llmResponse = await this.ollama.chat({
        model: this.modelName,
        messages: messages as { role: string; content: string }[],
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        },
      });

      this.logger.log(`LLM response generated: ${llmResponse.message.content?.substring(0, 150)}...`);

      const updatedHistory: ChatMessage[] = [
        ...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: llmResponse.message.content },
      ];

      return {
        response: llmResponse.message.content,
        toolCalls: [toolCall],
        conversationHistory: updatedHistory,
      };
    } catch (error) {
      this.logger.error('Chat error:', error);
      throw error;
    }
  }

  /**
   * Classify user intent using LLM
   */
  private async classifyIntent(message: string): Promise<IntentClassification> {
    try {
      const prompt = `${INTENT_CLASSIFICATION_PROMPT}

User: "${message}"
Response:`;

      const response = await this.ollamaSmall.chat({
        model: this.smallModelName,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: {
          temperature: 0.1, // Low temperature for consistent classification
          top_p: 0.9,
        },
      });

      // Parse JSON response
      const content = response.message.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as IntentClassification;
        
        // Validate intent
        const validIntents: ChatIntent[] = ['getProjects', 'getTodos', 'getCalendarEvents', 'getGitHubStats', 'general'];
        if (validIntents.includes(parsed.intent)) {
          return parsed;
        }
      }

      // Fallback to keyword-based classification
      return this.classifyIntentFallback(message);
    } catch (error) {
      this.logger.warn('Intent classification failed, using fallback:', error.message);
      return this.classifyIntentFallback(message);
    }
  }

  /**
   * Fallback keyword-based intent classification
   */
  private classifyIntentFallback(message: string): IntentClassification {
    const lowerMessage = message.toLowerCase();

    // Project-related queries
    if (lowerMessage.includes('proyek') || lowerMessage.includes('project')) {
      if (lowerMessage.includes('belum selesai') || lowerMessage.includes('pending') || lowerMessage.includes('todo')) {
        return {
          intent: 'getProjects',
          confidence: 0.8,
          parameters: { status: 'TODO', limit: 50 },
        };
      }
      if (lowerMessage.includes('selesai') || lowerMessage.includes('done')) {
        return {
          intent: 'getProjects',
          confidence: 0.8,
          parameters: { status: 'DONE', limit: 50 },
        };
      }
      return {
        intent: 'getProjects',
        confidence: 0.75,
        parameters: { status: 'all', limit: 50 },
      };
    }

    // Todo-related queries
    if (lowerMessage.includes('tugas') || lowerMessage.includes('todo') || lowerMessage.includes('task') || lowerMessage.includes('apa yang harus')) {
      if (lowerMessage.includes('belum selesai') || lowerMessage.includes('pending')) {
        return {
          intent: 'getTodos',
          confidence: 0.8,
          parameters: { status: 'pending', limit: 50 },
        };
      }
      return {
        intent: 'getTodos',
        confidence: 0.75,
        parameters: { status: 'all', limit: 50 },
      };
    }

    // Calendar-related queries
    if (lowerMessage.includes('jadwal') || lowerMessage.includes('calendar') || lowerMessage.includes('event') || lowerMessage.includes('meeting') || lowerMessage.includes('agenda')) {
      return {
        intent: 'getCalendarEvents',
        confidence: 0.8,
        parameters: { limit: 50 },
      };
    }

    // GitHub-related queries
    if (lowerMessage.includes('github') || lowerMessage.includes('commit') || lowerMessage.includes('repo') || lowerMessage.includes('repository')) {
      return {
        intent: 'getGitHubStats',
        confidence: 0.8,
        parameters: { includeRepos: true, includeCommits: false, limit: 20 },
      };
    }

    // Default to general
    return {
      intent: 'general',
      confidence: 0.9,
      parameters: {},
    };
  }

  /**
   * Format data for LLM context
   */
  private formatDataForContext(toolName: string, data: unknown): string {
    if (!data) {
      return 'Tidak ada data.';
    }

    if (toolName === 'getProjects') {
      const projects = data as any[];
      if (projects.length === 0) {
        return 'User belum memiliki project.';
      }

      let context = `User memiliki ${projects.length} project:\n`;
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
        return 'User tidak memiliki tugas.';
      }

      let context = `User memiliki ${todos.length} tugas:\n`;
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

  private async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    this.logger.log(`Executing tool: ${toolCall.name}`);

    try {
      switch (toolCall.name) {
        case 'getProjects':
          return await getProjects(this.prisma, toolCall.parameters as any);
        case 'getTodos':
          return await getTodos(this.prisma, toolCall.parameters as any);
        case 'getCalendarEvents':
          return await getCalendarEvents(this.prisma, toolCall.parameters as any);
        case 'getGitHubStats':
          return await getGitHubStats(this.prisma, toolCall.parameters as any);
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
    ollamaConnected: boolean;
    model: string;
    modelLoaded: boolean;
  }> {
    try {
      const localModels = await this.ollama.list();
      const modelLoaded = localModels.models.some(
        (m) => m.name.includes(this.modelName),
      );

      return {
        ollamaConnected: true,
        model: this.modelName,
        modelLoaded,
      };
    } catch (error) {
      return {
        ollamaConnected: false,
        model: this.modelName,
        modelLoaded: false,
      };
    }
  }
}
