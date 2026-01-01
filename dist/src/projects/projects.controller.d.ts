import type { Response } from 'express';
import type { User } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { ProjectSettingsService } from './project-settings.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
export declare class ProjectsController {
    private projectsService;
    private settingsService;
    constructor(projectsService: ProjectsService, settingsService: ProjectSettingsService);
    getSettings(user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        userId: string;
        description: string | null;
    }>;
    updateSettings(user: User, dto: {
        title?: string;
        description?: string;
        icon?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        userId: string;
        description: string | null;
    }>;
    uploadCover(user: User, file: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        userId: string;
        description: string | null;
    }>;
    removeCover(user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        userId: string;
        description: string | null;
    }>;
    create(user: User, dto: CreateProjectDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        order: string | null;
        status: string;
        categoryId: string | null;
        paymentId: string | null;
        information: string | null;
        orderNum: number;
    }>;
    findAll(user: User): Promise<({
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            color: string;
        } | null;
        payment: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            color: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        order: string | null;
        status: string;
        categoryId: string | null;
        paymentId: string | null;
        information: string | null;
        orderNum: number;
    })[]>;
    getStats(user: User): Promise<{
        total: number;
        todo: number;
        inProgress: number;
        done: number;
    }>;
    exportCsv(user: User, res: Response): Promise<void>;
    importCsv(user: User, file: Express.Multer.File): Promise<{
        imported: number;
        errors: string[];
    }>;
    exportXlsx(user: User, res: Response): Promise<void>;
    importXlsx(user: User, file: Express.Multer.File): Promise<{
        imported: number;
        errors: string[];
    }>;
    findOne(id: string, user: User): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        order: string | null;
        status: string;
        categoryId: string | null;
        paymentId: string | null;
        information: string | null;
        orderNum: number;
    }>;
    update(id: string, user: User, dto: UpdateProjectDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        order: string | null;
        status: string;
        categoryId: string | null;
        paymentId: string | null;
        information: string | null;
        orderNum: number;
    }>;
    remove(id: string, user: User): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        order: string | null;
        status: string;
        categoryId: string | null;
        paymentId: string | null;
        information: string | null;
        orderNum: number;
    }>;
}
