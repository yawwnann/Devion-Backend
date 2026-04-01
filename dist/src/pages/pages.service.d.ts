import { PrismaService } from '../prisma';
import { CreatePageDto, UpdatePageDto } from './dto';
import { PageStatus } from './enums/page-status.enum';
export declare class PagesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreatePageDto): Promise<{
        subpages: {
            id: string;
            cover: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.PageStatus;
            title: string;
            icon: string | null;
            publishedAt: Date | null;
            isArchived: boolean;
            isFavorite: boolean;
            parentId: string | null;
        }[];
    } & {
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.PageStatus;
        title: string;
        icon: string | null;
        publishedAt: Date | null;
        isArchived: boolean;
        isFavorite: boolean;
        parentId: string | null;
    }>;
    findAll(userId: string): Promise<({
        subpages: {
            id: string;
            cover: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.PageStatus;
            title: string;
            icon: string | null;
            publishedAt: Date | null;
            isArchived: boolean;
            isFavorite: boolean;
            parentId: string | null;
        }[];
    } & {
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.PageStatus;
        title: string;
        icon: string | null;
        publishedAt: Date | null;
        isArchived: boolean;
        isFavorite: boolean;
        parentId: string | null;
    })[]>;
    findAllByStatus(userId: string, status: PageStatus): Promise<({
        subpages: {
            id: string;
            cover: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.PageStatus;
            title: string;
            icon: string | null;
            publishedAt: Date | null;
            isArchived: boolean;
            isFavorite: boolean;
            parentId: string | null;
        }[];
    } & {
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.PageStatus;
        title: string;
        icon: string | null;
        publishedAt: Date | null;
        isArchived: boolean;
        isFavorite: boolean;
        parentId: string | null;
    })[]>;
    findPublished(): Promise<({
        user: {
            name: string | null;
            id: string;
            avatar: string | null;
        };
    } & {
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.PageStatus;
        title: string;
        icon: string | null;
        publishedAt: Date | null;
        isArchived: boolean;
        isFavorite: boolean;
        parentId: string | null;
    })[]>;
    findPublicPage(id: string): Promise<{
        user: {
            name: string | null;
            id: string;
            avatar: string | null;
        };
        blocks: ({
            children: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                order: number;
                type: string;
                content: import("@prisma/client/runtime/client").JsonValue;
                pageId: string;
                parentBlockId: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            order: number;
            type: string;
            content: import("@prisma/client/runtime/client").JsonValue;
            pageId: string;
            parentBlockId: string | null;
        })[];
    } & {
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.PageStatus;
        title: string;
        icon: string | null;
        publishedAt: Date | null;
        isArchived: boolean;
        isFavorite: boolean;
        parentId: string | null;
    }>;
    findFavorites(userId: string): Promise<{
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.PageStatus;
        title: string;
        icon: string | null;
        publishedAt: Date | null;
        isArchived: boolean;
        isFavorite: boolean;
        parentId: string | null;
    }[]>;
    findArchived(userId: string): Promise<{
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.PageStatus;
        title: string;
        icon: string | null;
        publishedAt: Date | null;
        isArchived: boolean;
        isFavorite: boolean;
        parentId: string | null;
    }[]>;
    findOne(id: string, userId: string): Promise<{
        subpages: {
            id: string;
            cover: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.PageStatus;
            title: string;
            icon: string | null;
            publishedAt: Date | null;
            isArchived: boolean;
            isFavorite: boolean;
            parentId: string | null;
        }[];
        blocks: ({
            children: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                order: number;
                type: string;
                content: import("@prisma/client/runtime/client").JsonValue;
                pageId: string;
                parentBlockId: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            order: number;
            type: string;
            content: import("@prisma/client/runtime/client").JsonValue;
            pageId: string;
            parentBlockId: string | null;
        })[];
    } & {
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.PageStatus;
        title: string;
        icon: string | null;
        publishedAt: Date | null;
        isArchived: boolean;
        isFavorite: boolean;
        parentId: string | null;
    }>;
    update(id: string, userId: string, dto: UpdatePageDto): Promise<{
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.PageStatus;
        title: string;
        icon: string | null;
        publishedAt: Date | null;
        isArchived: boolean;
        isFavorite: boolean;
        parentId: string | null;
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.PageStatus;
        title: string;
        icon: string | null;
        publishedAt: Date | null;
        isArchived: boolean;
        isFavorite: boolean;
        parentId: string | null;
    }>;
    private verifyOwnership;
}
