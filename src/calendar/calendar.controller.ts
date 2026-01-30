import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateEventDto, UpdateEventDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() createEventDto: CreateEventDto,
  ) {
    return this.calendarService.create(userId, createEventDto);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.calendarService.findAll(userId, startDate, endDate);
  }

  @Get('sync/projects')
  syncProjects(@CurrentUser('id') userId: string) {
    return this.calendarService.syncFromProjects(userId);
  }

  @Get('sync/todos')
  syncTodos(@CurrentUser('id') userId: string) {
    return this.calendarService.syncFromTodos(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.calendarService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.calendarService.update(userId, id, updateEventDto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.calendarService.remove(userId, id);
  }
}
