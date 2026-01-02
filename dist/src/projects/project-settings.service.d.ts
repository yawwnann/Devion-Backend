import { PrismaService } from '../prisma';
export declare class ProjectSettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSettings(userId: string): Promise<{
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        icon: string | null;
        description: string | null;
    }>;
    updateSettings(userId: string, dto: {
        title?: string;
        description?: string;
        icon?: string;
    }): Promise<{
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        icon: string | null;
        description: string | null;
    }>;
    uploadCover(userId: string, file: Express.Multer.File): Promise<{
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        icon: string | null;
        description: string | null;
    }>;
    removeCover(userId: string): Promise<{
        id: string;
        cover: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        icon: string | null;
        description: string | null;
    }>;
}
