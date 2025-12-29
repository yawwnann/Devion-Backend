import { PrismaService } from '../prisma';
export declare class HealthController {
    private prisma;
    constructor(prisma: PrismaService);
    check(): Promise<{
        status: string;
        timestamp: string;
        database: string;
    }>;
}
