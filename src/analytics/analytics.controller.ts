import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { CreateEventDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Post('track')
  track(@CurrentUser() user: User, @Body() dto: CreateEventDto) {
    return this.analyticsService.track(user.id, dto);
  }

  @Get('events')
  getEvents(
    @CurrentUser() user: User,
    @Query('type') eventType: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getEventsByType(
      user.id,
      eventType,
      days ? parseInt(days) : 30,
    );
  }

  @Get('stats')
  getStats(@CurrentUser() user: User, @Query('days') days?: string) {
    return this.analyticsService.getStats(user.id, days ? parseInt(days) : 30);
  }

  @Get('daily')
  getDailyActivity(@CurrentUser() user: User, @Query('days') days?: string) {
    return this.analyticsService.getDailyActivity(
      user.id,
      days ? parseInt(days) : 30,
    );
  }
}
