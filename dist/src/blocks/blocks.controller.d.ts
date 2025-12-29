import type { User } from '@prisma/client';
import { BlocksService } from './blocks.service';
import { CreateBlockDto, UpdateBlockDto } from './dto';
export declare class BlocksController {
    private blocksService;
    constructor(blocksService: BlocksService);
    create(user: User, dto: CreateBlockDto): Promise<{
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
    }>;
    findByPage(pageId: string, user: User): Promise<({
        children: ({
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
        parentBlockId: string | null;
        order: number;
        pageId: string;
        type: string;
        content: import("@prisma/client/runtime/client").JsonValue;
    })[]>;
    findOne(id: string, user: User): Promise<{
        page: {
            userId: string;
        };
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
    }>;
    update(id: string, user: User, dto: UpdateBlockDto): Promise<{
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
    }>;
    remove(id: string, user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        parentBlockId: string | null;
        order: number;
        pageId: string;
        type: string;
        content: import("@prisma/client/runtime/client").JsonValue;
    }>;
    reorder(pageId: string, user: User, blockIds: string[]): Promise<{
        success: boolean;
    }>;
}
