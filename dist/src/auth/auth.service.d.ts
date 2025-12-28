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
    validateGoogleUser(googleUser: GoogleUser): Promise<{
        googleId: string;
        email: string;
        name: string | null;
        avatar: string | null;
        id: string;
        githubUsername: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateTokens(userId: string, email: string): {
        accessToken: string;
    };
}
export {};
