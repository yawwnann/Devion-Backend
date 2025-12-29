import { PrismaService } from '../prisma';
export declare class ProjectSettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSettings(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        userId: string;
        description: string | null;
    }>;
    updateSettings(userId: string, dto: {
        title?: string;
        description?: string;
        icon?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        userId: string;
        description: string | null;
    }>;
    uploadCover(userId: string, file: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        userId: string;
        description: string | null;
    }>;
    removeCover(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        icon: string | null;
        cover: string | null;
        userId: string;
        description: string | null;
    }>;
}
