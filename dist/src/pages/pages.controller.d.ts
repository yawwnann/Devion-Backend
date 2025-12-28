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
            parentId: string | null;
            isArchived: boolean;
            isFavorite: boolean;
            userId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        parentId: string | null;
        isArchived: boolean;
        isFavorite: boolean;
        userId: string;
    }>;
    findAll(user: User): Promise<({
        subpages: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            icon: string | null;
            cover: string | null;
            parentId: string | null;
            isArchived: boolean;
            isFavorite: boolean;
            userId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        parentId: string | null;
        isArchived: boolean;
        isFavorite: boolean;
        userId: string;
    })[]>;
    findFavorites(user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        parentId: string | null;
        isArchived: boolean;
        isFavorite: boolean;
        userId: string;
    }[]>;
    findArchived(user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        parentId: string | null;
        isArchived: boolean;
        isFavorite: boolean;
        userId: string;
    }[]>;
    findOne(id: string, user: User): Promise<{
        subpages: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            icon: string | null;
            cover: string | null;
            parentId: string | null;
            isArchived: boolean;
            isFavorite: boolean;
            userId: string;
        }[];
        blocks: ({
            children: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                parentBlockId: string | null;
                order: number;
                type: string;
                content: import("@prisma/client/runtime/client").JsonValue;
                pageId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            parentBlockId: string | null;
            order: number;
            type: string;
            content: import("@prisma/client/runtime/client").JsonValue;
            pageId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        parentId: string | null;
        isArchived: boolean;
        isFavorite: boolean;
        userId: string;
    }>;
    update(id: string, user: User, dto: UpdatePageDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        parentId: string | null;
        isArchived: boolean;
        isFavorite: boolean;
        userId: string;
    }>;
    remove(id: string, user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        parentId: string | null;
        isArchived: boolean;
        isFavorite: boolean;
        userId: string;
    }>;
}
