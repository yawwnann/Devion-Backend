import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { BlocksService } from './blocks.service';
import { CreateBlockDto, UpdateBlockDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('blocks')
@UseGuards(JwtAuthGuard)
export class BlocksController {
  constructor(private blocksService: BlocksService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateBlockDto) {
    return this.blocksService.create(user.id, dto);
  }

  @Get('page/:pageId')
  findByPage(
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @CurrentUser() user: User,
  ) {
    return this.blocksService.findByPage(pageId, user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.blocksService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateBlockDto,
  ) {
    return this.blocksService.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.blocksService.remove(id, user.id);
  }

  @Post('page/:pageId/reorder')
  reorder(
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @CurrentUser() user: User,
    @Body('blockIds') blockIds: string[],
  ) {
    return this.blocksService.reorder(pageId, user.id, blockIds);
  }
}
