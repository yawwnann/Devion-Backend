import type { User } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
export declare class ProjectsController {
    private projectsService;
    constructor(projectsService: ProjectsService);
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
