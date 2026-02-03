import { PrismaService } from '../prisma';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { CalendarService } from '../calendar';
export declare class ProjectsService {
    private prisma;
    private calendarService;
    constructor(prisma: PrismaService, calendarService: CalendarService);
    create(userId: string, dto: CreateProjectDto): Promise<{
        id: string;
        name: string;
        order: string | null;
        status: string;
        information: string | null;
        orderNum: number;
        dueDate: Date | null;
        startDate: Date | null;
        githubRepo: string | null;
        githubUrl: string | null;
        lastSyncedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string | null;
        paymentId: string | null;
        userId: string;
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
        order: string | null;
        status: string;
        information: string | null;
        orderNum: number;
        dueDate: Date | null;
        startDate: Date | null;
        githubRepo: string | null;
        githubUrl: string | null;
        lastSyncedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string | null;
        paymentId: string | null;
        userId: string;
    })[]>;
    findOne(id: string, userId: string): Promise<{
        id: string;
        name: string;
        order: string | null;
        status: string;
        information: string | null;
        orderNum: number;
        dueDate: Date | null;
        startDate: Date | null;
        githubRepo: string | null;
        githubUrl: string | null;
        lastSyncedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string | null;
        paymentId: string | null;
        userId: string;
    }>;
    update(id: string, userId: string, dto: UpdateProjectDto): Promise<{
        id: string;
        name: string;
        order: string | null;
        status: string;
        information: string | null;
        orderNum: number;
        dueDate: Date | null;
        startDate: Date | null;
        githubRepo: string | null;
        githubUrl: string | null;
        lastSyncedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string | null;
        paymentId: string | null;
        userId: string;
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        name: string;
        order: string | null;
        status: string;
        information: string | null;
        orderNum: number;
        dueDate: Date | null;
        startDate: Date | null;
        githubRepo: string | null;
        githubUrl: string | null;
        lastSyncedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string | null;
        paymentId: string | null;
        userId: string;
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
