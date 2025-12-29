import type { User } from '@prisma/client';
import { PagesService } from './pages.service';
import { CreatePageDto, UpdatePageDto } from './dto';
export declare class PagesController {
    private pagesService;
    constructor(pagesService: PagesService);
    create(user: User, dto: CreatePageDto): Promise<{
        subpages: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            icon: string | null;
            cover: string | null;
            isArchived: boolean;
            isFavorite: boolean;
            userId: string;
            parentId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        isArchived: boolean;
        isFavorite: boolean;
        userId: string;
        parentId: string | null;
    }>;
    findAll(user: User): Promise<({
        subpages: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            icon: string | null;
            cover: string | null;
            isArchived: boolean;
            isFavorite: boolean;
            userId: string;
            parentId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        isArchived: boolean;
        isFavorite: boolean;
        userId: string;
        parentId: string | null;
    })[]>;
    findFavorites(user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        isArchived: boolean;
        isFavorite: boolean;
        userId: string;
        parentId: string | null;
    }[]>;
    findArchived(user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        isArchived: boolean;
        isFavorite: boolean;
        userId: string;
        parentId: string | null;
    }[]>;
    findOne(id: string, user: User): Promise<{
        subpages: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            icon: string | null;
            cover: string | null;
            isArchived: boolean;
            isFavorite: boolean;
            userId: string;
            parentId: string | null;
        }[];
        blocks: ({
            children: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                parentBlockId: string | null;
                order: number;
                pageId: string;
                type: string;
                content: import("@prisma/client/runtime/client").JsonValue;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            parentBlockId: string | null;
            order: number;
            pageId: string;
            type: string;
            content: import("@prisma/client/runtime/client").JsonValue;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        isArchived: boolean;
        isFavorite: boolean;
        userId: string;
        parentId: string | null;
    }>;
    update(id: string, user: User, dto: UpdatePageDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        isArchived: boolean;
        isFavorite: boolean;
        userId: string;
        parentId: string | null;
    }>;
    remove(id: string, user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        isArchived: boolean;
        isFavorite: boolean;
        userId: string;
        parentId: string | null;
    }>;
}
