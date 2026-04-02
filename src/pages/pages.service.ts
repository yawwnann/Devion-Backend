import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreatePageDto, UpdatePageDto } from './dto';
import { PageStatus } from './enums/page-status.enum';

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePageDto) {
    // Verify parent page belongs to user if provided
    if (dto.parentId) {
      await this.verifyOwnership(dto.parentId, userId);
    }

    return this.prisma.page.create({
      data: {
        ...dto,
        userId,
        status: dto.status || PageStatus.DRAFT,
      },
      include: { subpages: true },
    });
  }

  async findAll(userId: string) {
    return this.prisma.page.findMany({
      where: { userId, isArchived: false, parentId: null },
      orderBy: { updatedAt: 'desc' },
      include: {
        subpages: {
          where: { isArchived: false },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });
  }

  async findAllByStatus(userId: string, status: PageStatus) {
    return this.prisma.page.findMany({
      where: { userId, status, isArchived: false, parentId: null },
      orderBy: { updatedAt: 'desc' },
      include: {
        subpages: {
          where: { isArchived: false },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });
  }

  async findPublished() {
    const result = await this.prisma.page.findMany({
      where: {
        status: PageStatus.PUBLISHED,
        isArchived: false,
        parentId: null,
      },
      orderBy: { publishedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
    console.log(
      `[PagesService] findPublished: found ${result.length} published pages`,
    );
    return result;
  }

  async findPublicPage(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        blocks: {
          where: { parentBlockId: null },
          orderBy: { order: 'asc' },
          include: {
            children: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!page) throw new NotFoundException('Page not found');
    if (page.status !== PageStatus.PUBLISHED) {
      throw new ForbiddenException('This page is not published');
    }

    return page;
  }

  async findFavorites(userId: string) {
    return this.prisma.page.findMany({
      where: { userId, isFavorite: true, isArchived: false },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findArchived(userId: string) {
    return this.prisma.page.findMany({
      where: { userId, isArchived: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        subpages: {
          where: { isArchived: false },
          orderBy: { updatedAt: 'desc' },
        },
        blocks: {
          where: { parentBlockId: null },
          orderBy: { order: 'asc' },
          include: {
            children: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!page) throw new NotFoundException('Page not found');
    if (page.userId !== userId) throw new ForbiddenException();

    return page;
  }

  async update(id: string, userId: string, dto: UpdatePageDto) {
    await this.verifyOwnership(id, userId);

    // Auto-set publishedAt when status changes to PUBLISHED
    const data: any = { ...dto };
    if (dto.status === PageStatus.PUBLISHED) {
      const currentPage = await this.prisma.page.findUnique({
        where: { id },
        select: { status: true, publishedAt: true },
      });
      if (currentPage && currentPage.status !== PageStatus.PUBLISHED) {
        data.publishedAt = new Date();
      }
    }

    return this.prisma.page.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    await this.verifyOwnership(id, userId);

    return this.prisma.page.delete({ where: { id } });
  }

  private async verifyOwnership(pageId: string, userId: string) {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      select: { userId: true },
    });

    if (!page) throw new NotFoundException('Page not found');
    if (page.userId !== userId) throw new ForbiddenException();
  }
}
