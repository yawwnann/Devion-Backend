import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../prisma';
import { LoginHistoryService } from '../login-history';
import { Request } from 'express';

export interface GoogleUser {
  googleId: string;
  email: string;
  name?: string;
  avatar?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private loginHistoryService: LoginHistoryService,
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async register(email: string, password: string, name: string) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    return this.generateTokens(user.id, user.email);
  }

  async login(email: string, password: string, request?: Request) {
    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.password) {
        if (request) {
          await this.loginHistoryService.logLogin(
            null,
            request,
            false,
            'User not found or no password',
          );
        }
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        if (request) {
          await this.loginHistoryService.logLogin(
            user.id,
            request,
            false,
            'Invalid password',
          );
        }
        throw new UnauthorizedException('Invalid credentials');
      }

      // Log successful login
      if (request) {
        await this.loginHistoryService.logLogin(user.id, request, true);
      }

      return this.generateTokens(user.id, user.email);
    } catch (error) {
      // Re-throw if already UnauthorizedException
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw error;
    }
  }

  async validateGoogleUser(googleUser: GoogleUser, request?: Request) {
    const { googleId, email, name, avatar } = googleUser;

    // First, check if Google ID already exists
    let user = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (!user) {
      // Check if email exists (for account linking)
      user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Link Google account to existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            name: name || user.name,
            avatar: avatar || user.avatar,
          },
        });
        // Log successful account linking
        if (request) {
          await this.loginHistoryService.logLogin(user.id, request, true);
        }
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            googleId,
            email,
            name,
            avatar,
          },
        });
        // Log new user registration via Google
        if (request) {
          await this.loginHistoryService.logLogin(user.id, request, true);
        }
      }
    } else {
      // Update user info on each login
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { name, avatar },
      });
      // Log successful Google login
      if (request) {
        await this.loginHistoryService.logLogin(user.id, request, true);
      }
    }

    return user;
  }

  generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m', // Short-lived access token
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      expiresIn: '7d', // Long-lived refresh token
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      });

      // Verify user still exists
      const user = await this.prisma.user.findUnique({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user.id, user.email);
    } catch (error) {
      throw new UnauthorizedException(error, 'Invalid refresh token');
    }
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      bio?: string;
      avatar?: string;
      cover?: string;
      githubUsername?: string;
    },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
    const { password, googleId, ...safeUser } = user as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return safeUser;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException(
        'Password change not available for OAuth users',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async getStatistics(userId: string) {
    const [projectsCount, todosCount, pagesCount] = await Promise.all([
      this.prisma.project.count({ where: { userId } }),
      this.prisma.todo.count({
        where: { week: { userId } },
      }),
      this.prisma.page.count({ where: { userId } }),
    ]);

    return {
      projects: projectsCount,
      todos: todosCount,
      pages: pagesCount,
    };
  }

  async uploadImage(
    userId: string,
    file: Express.Multer.File,
    type: 'avatar' | 'cover',
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `devion/profile/${type}`,
            transformation: [
              {
                width: type === 'avatar' ? 500 : 1200,
                height: type === 'avatar' ? 500 : 400,
                crop: 'fill',
              },
            ],
          },
          (error, result) => {
            if (error) {
              reject(new Error(error.message));
            } else {
              resolve(result);
            }
          },
        )
        .end(file.buffer);
    });

    const updateData =
      type === 'avatar'
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          { avatar: result.secure_url }
        : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          { cover: result.secure_url };

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
    const { password, googleId, ...safeUser } = user as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return safeUser;
  }

  async unlinkGoogleAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user has password (can't unlink if no password)
    if (!user.password) {
      throw new UnauthorizedException(
        'Cannot unlink Google account. Please set a password first.',
      );
    }

    // Unlink Google account
    await this.prisma.user.update({
      where: { id: userId },
      data: { googleId: null },
    });

    return { message: 'Google account unlinked successfully' };
  }

  async linkGoogleToExistingUser(userId: string, googleUser: GoogleUser) {
    const { googleId, email, name, avatar } = googleUser;

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if Google ID is already linked to another account
    const existingGoogleUser = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (existingGoogleUser && existingGoogleUser.id !== userId) {
      throw new ConflictException(
        'This Google account is already linked to another user',
      );
    }

    // Link Google account
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleId,
        name: name || user.name,
        avatar: avatar || user.avatar,
      },
    });

    return updatedUser;
  }
}
