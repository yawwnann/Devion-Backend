import { PrismaService } from '../prisma';
import { CreateBlockDto, UpdateBlockDto } from './dto';
export declare class BlocksService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateBlockDto): Promise<{
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
    }>;
    findByPage(pageId: string, userId: string): Promise<({
        children: ({
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
        createdAt: Date;
        updatedAt: Date;
        order: number;
        type: string;
        content: import("@prisma/client/runtime/client").JsonValue;
        pageId: string;
        parentBlockId: string | null;
    })[]>;
    findOne(id: string, userId: string): Promise<{
        page: {
            userId: string;
        };
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
    }>;
    update(id: string, userId: string, dto: UpdateBlockDto): Promise<{
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
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        order: number;
        type: string;
        content: import("@prisma/client/runtime/client").JsonValue;
        pageId: string;
        parentBlockId: string | null;
    }>;
    reorder(pageId: string, userId: string, blockIds: string[]): Promise<{
        success: boolean;
    }>;
    private verifyPageOwnership;
}
