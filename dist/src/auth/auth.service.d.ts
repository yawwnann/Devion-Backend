import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma';
interface GoogleUser {
    googleId: string;
    email: string;
    name?: string;
    avatar?: string;
}
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(email: string, password: string, name: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    validateGoogleUser(googleUser: GoogleUser): Promise<{
        id: string;
        email: string;
        googleId: string | null;
        name: string | null;
        bio: string | null;
        avatar: string | null;
        cover: string | null;
        password: string | null;
        githubUsername: string | null;
        githubAccessToken: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateTokens(userId: string, email: string): {
        accessToken: string;
        refreshToken: string;
    };
    refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    updateProfile(userId: string, data: {
        name?: string;
        bio?: string;
        avatar?: string;
        cover?: string;
        githubUsername?: string;
    }): Promise<any>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    getStatistics(userId: string): Promise<{
        projects: number;
        todos: number;
        pages: number;
    }>;
    uploadImage(userId: string, file: Express.Multer.File, type: 'avatar' | 'cover'): Promise<any>;
}
export {};
