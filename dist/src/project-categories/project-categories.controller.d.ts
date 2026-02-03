import type { User } from '@prisma/client';
import { ProjectCategoriesService } from './project-categories.service';
import { CreateProjectCategoryDto } from './dto/create-project-category.dto';
import { UpdateProjectCategoryDto } from './dto/update-project-category.dto';
export declare class ProjectCategoriesController {
    private service;
    constructor(service: ProjectCategoriesService);
    create(user: User, dto: CreateProjectCategoryDto): Promise<{
        id: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    findAll(user: User): Promise<{
        id: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }[]>;
    update(id: string, user: User, dto: UpdateProjectCategoryDto): Promise<{
        id: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    remove(id: string, user: User): Promise<{
        id: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
}
