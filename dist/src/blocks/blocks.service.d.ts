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
    }>;
    findByPage(pageId: string, userId: string): Promise<({
        children: ({
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
        parentBlockId: string | null;
        order: number;
        type: string;
        content: import("@prisma/client/runtime/client").JsonValue;
        pageId: string;
    })[]>;
    findOne(id: string, userId: string): Promise<{
        page: {
            userId: string;
        };
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
    }>;
    update(id: string, userId: string, dto: UpdateBlockDto): Promise<{
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
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        parentBlockId: string | null;
        order: number;
        type: string;
        content: import("@prisma/client/runtime/client").JsonValue;
        pageId: string;
    }>;
    reorder(pageId: string, userId: string, blockIds: string[]): Promise<{
        success: boolean;
    }>;
    private verifyPageOwnership;
}
