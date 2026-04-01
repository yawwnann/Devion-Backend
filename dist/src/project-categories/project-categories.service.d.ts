import { PrismaService } from '../prisma';
import { CreateProjectCategoryDto } from './dto/create-project-category.dto';
import { UpdateProjectCategoryDto } from './dto/update-project-category.dto';
export declare class ProjectCategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateProjectCategoryDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        userId: string;
    }>;
    findAll(userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        userId: string;
    }[]>;
    update(id: string, userId: string, dto: UpdateProjectCategoryDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        userId: string;
    }>;
    remove(id: string, userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        userId: string;
    }>;
}
