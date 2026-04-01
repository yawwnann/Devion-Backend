import type { User } from '@prisma/client';
import { ProjectCategoriesService } from './project-categories.service';
import { CreateProjectCategoryDto } from './dto/create-project-category.dto';
import { UpdateProjectCategoryDto } from './dto/update-project-category.dto';
export declare class ProjectCategoriesController {
    private service;
    constructor(service: ProjectCategoriesService);
    create(user: User, dto: CreateProjectCategoryDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        userId: string;
    }>;
    findAll(user: User): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        userId: string;
    }[]>;
    update(id: string, user: User, dto: UpdateProjectCategoryDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        userId: string;
    }>;
    remove(id: string, user: User): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        userId: string;
    }>;
}
