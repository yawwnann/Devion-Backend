import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma';
export interface JwtPayload {
    sub: string;
    email: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: JwtPayload): Promise<{
        name: string | null;
        id: string;
        email: string;
        bio: string | null;
        avatar: string | null;
        cover: string | null;
        password: string | null;
        googleId: string | null;
        githubUsername: string | null;
        githubAccessToken: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};
