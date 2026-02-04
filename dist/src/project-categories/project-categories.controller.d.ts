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
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        color: string;
    }>;
    findAll(user: User): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        color: string;
    }[]>;
    update(id: string, user: User, dto: UpdateProjectCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        color: string;
    }>;
    remove(id: string, user: User): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        color: string;
    }>;
}
