import type { User } from '@prisma/client';
import { PagesService } from './pages.service';
import { CreatePageDto, UpdatePageDto } from './dto';
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
            title: string;
            icon: string | null;
            parentId: string | null;
            isArchived: boolean;
            isFavorite: boolean;
        }[];
    } & {
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        icon: string | null;
        parentId: string | null;
        isArchived: boolean;
        isFavorite: boolean;
    }>;
    findAll(user: User): Promise<({
        subpages: {
            id: string;
            cover: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            title: string;
            icon: string | null;
            parentId: string | null;
            isArchived: boolean;
            isFavorite: boolean;
        }[];
    } & {
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        icon: string | null;
        parentId: string | null;
        isArchived: boolean;
        isFavorite: boolean;
    })[]>;
    findFavorites(user: User): Promise<{
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        icon: string | null;
        parentId: string | null;
        isArchived: boolean;
        isFavorite: boolean;
    }[]>;
    findArchived(user: User): Promise<{
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        icon: string | null;
        parentId: string | null;
        isArchived: boolean;
        isFavorite: boolean;
    }[]>;
    findOne(id: string, user: User): Promise<{
        subpages: {
            id: string;
            cover: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            title: string;
            icon: string | null;
            parentId: string | null;
            isArchived: boolean;
            isFavorite: boolean;
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
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        icon: string | null;
        parentId: string | null;
        isArchived: boolean;
        isFavorite: boolean;
    }>;
    update(id: string, user: User, dto: UpdatePageDto): Promise<{
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        icon: string | null;
        parentId: string | null;
        isArchived: boolean;
        isFavorite: boolean;
    }>;
    remove(id: string, user: User): Promise<{
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        icon: string | null;
        parentId: string | null;
        isArchived: boolean;
        isFavorite: boolean;
    }>;
}
