import { PrismaService } from '../prisma';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { CalendarService } from '../calendar';
import { NotificationsService } from '../notifications';
export declare class ProjectsService {
    private prisma;
    private calendarService;
    private notificationsService;
    constructor(prisma: PrismaService, calendarService: CalendarService, notificationsService: NotificationsService);
    create(userId: string, dto: CreateProjectDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        order: string | null;
        status: string;
        information: string | null;
        orderNum: number;
        dueDate: Date | null;
        startDate: Date | null;
        githubRepo: string | null;
        githubUrl: string | null;
        lastSyncedAt: Date | null;
        categoryId: string | null;
        paymentId: string | null;
    }>;
    findAll(userId: string): Promise<({
        category: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            color: string;
            userId: string;
        } | null;
        payment: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            color: string;
            userId: string;
        } | null;
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        order: string | null;
        status: string;
        information: string | null;
        orderNum: number;
        dueDate: Date | null;
        startDate: Date | null;
        githubRepo: string | null;
        githubUrl: string | null;
        lastSyncedAt: Date | null;
        categoryId: string | null;
        paymentId: string | null;
    })[]>;
    findOne(id: string, userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        order: string | null;
        status: string;
        information: string | null;
        orderNum: number;
        dueDate: Date | null;
        startDate: Date | null;
        githubRepo: string | null;
        githubUrl: string | null;
        lastSyncedAt: Date | null;
        categoryId: string | null;
        paymentId: string | null;
    }>;
    update(id: string, userId: string, dto: UpdateProjectDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        order: string | null;
        status: string;
        information: string | null;
        orderNum: number;
        dueDate: Date | null;
        startDate: Date | null;
        githubRepo: string | null;
        githubUrl: string | null;
        lastSyncedAt: Date | null;
        categoryId: string | null;
        paymentId: string | null;
    }>;
    remove(id: string, userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        order: string | null;
        status: string;
        information: string | null;
        orderNum: number;
        dueDate: Date | null;
        startDate: Date | null;
        githubRepo: string | null;
        githubUrl: string | null;
        lastSyncedAt: Date | null;
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
