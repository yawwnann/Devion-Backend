import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { ChatbotService } from './chatbot.service';
import type { ChatRequest } from './chatbot.types';

@Controller('chatbot')
@UseGuards(AuthGuard('jwt'))
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);

  constructor(private readonly chatbotService: ChatbotService) {}

  @Get('health')
  async healthCheck() {
    return this.chatbotService.healthCheck();
  }

  @Post('chat')
  async chat(
    @Body() request: ChatRequest,
    @CurrentUser() user: User,
  ): Promise<{ response: string; conversationHistory: unknown[] }> {
    this.logger.log(`Chat request from user ${user.id}: ${request.message}`);

    const result = await this.chatbotService.chat(request, user.id);

    return {
      response: result.response,
      conversationHistory: result.conversationHistory,
    };
  }
}
