import type { Response } from 'express';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    googleAuth(): void;
    googleCallback(req: any, res: Response): Promise<void>;
    getMe(user: User): {
        googleId: string;
        email: string;
        name: string | null;
        avatar: string | null;
        id: string;
        githubUsername: string | null;
        createdAt: Date;
        updatedAt: Date;
    };
}
