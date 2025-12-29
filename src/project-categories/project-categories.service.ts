import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateProjectCategoryDto } from './dto/create-project-category.dto';
import { UpdateProjectCategoryDto } from './dto/update-project-category.dto';

@Injectable()
export class ProjectCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectCategoryDto) {
    try {
      return await this.prisma.projectCategory.create({
        data: { ...dto, userId },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Category name already exists');
      }
      throw error;
    }
  }

  async findAll(userId: string) {
    return this.prisma.projectCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, userId: string, dto: UpdateProjectCategoryDto) {
    const category = await this.prisma.projectCategory.findUnique({
      where: { id },
    });
    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category not found');
    }
    return this.prisma.projectCategory.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const category = await this.prisma.projectCategory.findUnique({
      where: { id },
    });
    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category not found');
    }
    return this.prisma.projectCategory.delete({ where: { id } });
  }
}
