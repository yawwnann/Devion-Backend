import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import { AuthService, GoogleUser } from './auth.service';
import { LoginHistoryService } from '../login-history';
import { RegisterDto, LoginDto, UpdateProfileDto, ChangePasswordDto } from './dto';
export declare class AuthController {
    private authService;
    private configService;
    private loginHistoryService;
    constructor(authService: AuthService, configService: ConfigService, loginHistoryService: LoginHistoryService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto, req: Request): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    googleAuth(): void;
    getGoogleAuthUrl(): {
        url: string;
    };
    googleCallback(req: Request & {
        user: GoogleUser;
    }, res: Response, state?: string): Promise<void>;
    getMe(user: User): any;
    updateProfile(user: User, dto: UpdateProfileDto): Promise<any>;
    changePassword(user: User, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getStatistics(user: User): Promise<{
        projects: number;
        todos: number;
        pages: number;
    }>;
    uploadAvatar(user: User, file: Express.Multer.File): Promise<any>;
    uploadCover(user: User, file: Express.Multer.File): Promise<any>;
    getLoginHistory(user: User, limit?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        device: string | null;
        ipAddress: string;
        country: string | null;
        city: string | null;
        region: string | null;
        timezone: string | null;
        browser: string | null;
        os: string | null;
        userAgent: string;
        isSuccess: boolean;
        failureReason: string | null;
    }[]>;
    unlinkGoogle(user: User): Promise<{
        message: string;
    }>;
    getGoogleLinkUrl(user: User): {
        url: string;
    };
}
