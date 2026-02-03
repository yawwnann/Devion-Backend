import { PrismaService } from '../prisma';
import { CreateProjectCategoryDto } from './dto/create-project-category.dto';
import { UpdateProjectCategoryDto } from './dto/update-project-category.dto';
export declare class ProjectCategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateProjectCategoryDto): Promise<{
        id: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    findAll(userId: string): Promise<{
        id: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }[]>;
    update(id: string, userId: string, dto: UpdateProjectCategoryDto): Promise<{
        id: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
}
