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
    }>;
    login(email: string, password: string): Promise<{
        accessToken: string;
    }>;
    validateGoogleUser(googleUser: GoogleUser): Promise<{
        id: string;
        email: string;
        googleId: string | null;
        name: string | null;
        avatar: string | null;
        password: string | null;
        githubUsername: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateTokens(userId: string, email: string): {
        accessToken: string;
    };
}
export {};
