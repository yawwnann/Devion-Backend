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
    findAll(userId: string): Promise<({
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
    findFavorites(userId: string): Promise<{
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
    findArchived(userId: string): Promise<{
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
    findOne(id: string, userId: string): Promise<{
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
    update(id: string, userId: string, dto: UpdatePageDto): Promise<{
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
    remove(id: string, userId: string): Promise<{
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
    private verifyOwnership;
}
