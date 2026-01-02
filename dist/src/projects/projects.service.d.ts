import { PrismaService } from '../prisma';
import { CreateProjectDto, UpdateProjectDto } from './dto';
export declare class ProjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateProjectDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        order: string | null;
        lastSyncedAt: Date | null;
        status: string;
        information: string | null;
        orderNum: number;
        githubRepo: string | null;
        githubUrl: string | null;
        categoryId: string | null;
        paymentId: string | null;
    }>;
    findAll(userId: string): Promise<({
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
        lastSyncedAt: Date | null;
        status: string;
        information: string | null;
        orderNum: number;
        githubRepo: string | null;
        githubUrl: string | null;
        categoryId: string | null;
        paymentId: string | null;
    })[]>;
    findOne(id: string, userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        order: string | null;
        lastSyncedAt: Date | null;
        status: string;
        information: string | null;
        orderNum: number;
        githubRepo: string | null;
        githubUrl: string | null;
        categoryId: string | null;
        paymentId: string | null;
    }>;
    update(id: string, userId: string, dto: UpdateProjectDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        order: string | null;
        lastSyncedAt: Date | null;
        status: string;
        information: string | null;
        orderNum: number;
        githubRepo: string | null;
        githubUrl: string | null;
        categoryId: string | null;
        paymentId: string | null;
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        order: string | null;
        lastSyncedAt: Date | null;
        status: string;
        information: string | null;
        orderNum: number;
        githubRepo: string | null;
        githubUrl: string | null;
        categoryId: string | null;
        paymentId: string | null;
    }>;
    getStats(userId: string): Promise<{
        total: number;
        todo: number;
        inProgress: number;
        done: number;
    }>;
    exportToCsv(userId: string): Promise<string>;
    importFromCsv(userId: string, file: Express.Multer.File): Promise<{
        imported: number;
        errors: string[];
    }>;
    private parseCsvLine;
    exportToXlsx(userId: string): Promise<Buffer>;
    importFromXlsx(userId: string, file: Express.Multer.File): Promise<{
        imported: number;
        errors: string[];
    }>;
}
