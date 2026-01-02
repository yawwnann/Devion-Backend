import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, UpdateProfileDto, ChangePasswordDto } from './dto';
export declare class AuthController {
    private authService;
    private configService;
    constructor(authService: AuthService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
    }>;
    googleAuth(): void;
    googleCallback(req: any, res: Response): Promise<void>;
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
}
