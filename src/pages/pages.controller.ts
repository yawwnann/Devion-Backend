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
import { PagesService } from './pages.service';
import { CreatePageDto, UpdatePageDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('documentation')
@UseGuards(JwtAuthGuard)
export class PagesController {
  constructor(private pagesService: PagesService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreatePageDto) {
    return this.pagesService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.pagesService.findAll(user.id);
  }

  @Get('favorites')
  findFavorites(@CurrentUser() user: User) {
    return this.pagesService.findFavorites(user.id);
  }

  @Get('archived')
  findArchived(@CurrentUser() user: User) {
    return this.pagesService.findArchived(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.pagesService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdatePageDto,
  ) {
    return this.pagesService.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.pagesService.remove(id, user.id);
  }
}
