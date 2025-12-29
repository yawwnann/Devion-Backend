import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateBlockDto, UpdateBlockDto } from './dto';

@Injectable()
export class BlocksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBlockDto) {
    await this.verifyPageOwnership(dto.pageId, userId);

    // Get max order if not provided
    if (dto.order === undefined) {
      const maxOrder = await this.prisma.block.aggregate({
        where: { pageId: dto.pageId, parentBlockId: dto.parentBlockId ?? null },
        _max: { order: true },
      });
      dto.order = (maxOrder._max.order ?? -1) + 1;
    }

    return this.prisma.block.create({
      data: dto,
      include: { children: true },
    });
  }

  async findByPage(pageId: string, userId: string) {
    // Verify ownership and get blocks in one query
    const page = await this.prisma.page.findUnique({
      where: { id: pageId, userId },
      include: {
        blocks: {
          where: { parentBlockId: null },
          orderBy: { order: 'asc' },
          include: {
            children: {
              orderBy: { order: 'asc' },
              include: {
                children: { orderBy: { order: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!page) throw new NotFoundException('Page not found or access denied');

    return page.blocks;
  }

  async findOne(id: string, userId: string) {
    const block = await this.prisma.block.findUnique({
      where: { id },
      include: {
        page: { select: { userId: true } },
        children: { orderBy: { order: 'asc' } },
      },
    });

    if (!block) throw new NotFoundException('Block not found');
    if (block.page.userId !== userId) throw new ForbiddenException();

    return block;
  }

  async update(id: string, userId: string, dto: UpdateBlockDto) {
    const block = await this.findOne(id, userId);

    return this.prisma.block.update({
      where: { id: block.id },
      data: dto,
      include: { children: true },
    });
  }

  async remove(id: string, userId: string) {
    const block = await this.findOne(id, userId);

    return this.prisma.block.delete({ where: { id: block.id } });
  }

  async reorder(pageId: string, userId: string, blockIds: string[]) {
    await this.verifyPageOwnership(pageId, userId);

    const updates = blockIds.map((id, index) =>
      this.prisma.block.update({
        where: { id },
        data: { order: index },
      }),
    );

    await this.prisma.$transaction(updates);
    return { success: true };
  }

  private async verifyPageOwnership(pageId: string, userId: string) {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      select: { userId: true },
    });

    if (!page) throw new NotFoundException('Page not found');
    if (page.userId !== userId) throw new ForbiddenException();
  }
}
