import { PrismaService } from '../prisma';
import { CreatePageDto, UpdatePageDto } from './dto';
export declare class PagesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreatePageDto): Promise<{
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
    findAll(userId: string): Promise<({
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
    findFavorites(userId: string): Promise<{
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
    findArchived(userId: string): Promise<{
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
    findOne(id: string, userId: string): Promise<{
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
    update(id: string, userId: string, dto: UpdatePageDto): Promise<{
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
    remove(id: string, userId: string): Promise<{
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
    private verifyOwnership;
}
