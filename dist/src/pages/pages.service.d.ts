import { PrismaService } from '../prisma';
import { CreatePageDto, UpdatePageDto } from './dto';
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
    findAll(userId: string): Promise<({
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
    findFavorites(userId: string): Promise<{
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
    findArchived(userId: string): Promise<{
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
    findOne(id: string, userId: string): Promise<{
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
    update(id: string, userId: string, dto: UpdatePageDto): Promise<{
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
    remove(id: string, userId: string): Promise<{
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
    private verifyOwnership;
}
