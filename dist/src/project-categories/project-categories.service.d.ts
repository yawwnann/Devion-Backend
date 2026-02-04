import { PrismaService } from '../prisma';
import { CreateProjectCategoryDto } from './dto/create-project-category.dto';
import { UpdateProjectCategoryDto } from './dto/update-project-category.dto';
export declare class ProjectCategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateProjectCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        color: string;
    }>;
    findAll(userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        color: string;
    }[]>;
    update(id: string, userId: string, dto: UpdateProjectCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        color: string;
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        color: string;
    }>;
}
