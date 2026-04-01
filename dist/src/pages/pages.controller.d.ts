import type { User } from '@prisma/client';
import { PagesService } from './pages.service';
import { CreatePageDto, UpdatePageDto } from './dto';
import { PageStatus } from './enums/page-status.enum';
export declare class PagesController {
    private pagesService;
    constructor(pagesService: PagesService);
    create(user: User, dto: CreatePageDto): Promise<{
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
    findAll(user: User): Promise<({
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
    findAllByStatus(user: User, status: PageStatus): Promise<({
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
    findFavorites(user: User): Promise<{
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
    findArchived(user: User): Promise<{
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
    findOne(id: string, user: User): Promise<{
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
    update(id: string, user: User, dto: UpdatePageDto): Promise<{
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
    remove(id: string, user: User): Promise<{
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
}
