import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthService, GoogleUser } from './auth.service';
import { GoogleAuthGuard } from './guards/google.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { SkipTokenRefresh } from './decorators/skip-token-refresh.decorator';
import { LoginHistoryService } from '../login-history';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private loginHistoryService: LoginHistoryService,
  ) {}

  @Post('register')
  @SkipThrottle()
  @SkipTokenRefresh()
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name);
  }

  @Post('login')
  @SkipThrottle()
  @SkipTokenRefresh()
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto.email, dto.password, req);
  }

  @Post('refresh')
  @SkipThrottle()
  @SkipTokenRefresh()
  async refresh(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    return this.authService.refreshTokens(refreshToken);
  }

  @Get('google')
  @SkipThrottle()
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    console.log('🔵 [BACKEND] Google auth endpoint hit');
    // Redirects to Google OAuth
  }

  @Get('google/url')
  @SkipThrottle()
  getGoogleAuthUrl() {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    const callbackUrl = this.configService.get<string>(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:3000/api/auth/google/callback',
    );

    const params = new URLSearchParams({
      client_id: this.configService.get<string>('GOOGLE_CLIENT_ID') || '',
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  }

  @Get('google/callback')
  @SkipThrottle()
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request & { user: GoogleUser },
    @Res() res: Response,
    @Query('state') state?: string,
  ) {
    console.log('🟢 [BACKEND] Google callback hit');
    console.log('🟢 [BACKEND] User from Google:', req.user);
    console.log('🟢 [BACKEND] State:', state);

    // Check if this is an account linking request
    let isLinking = false;
    let linkingUserId: string | null = null;

    if (state) {
      try {
        const decoded = JSON.parse(
          Buffer.from(state, 'base64').toString('utf-8'),
        );
        if (decoded.action === 'link' && decoded.userId) {
          isLinking = true;
          linkingUserId = decoded.userId;
          console.log('🟢 [BACKEND] Account linking for user:', linkingUserId);
        }
      } catch (e) {
        console.log(
          '🟡 [BACKEND] Failed to decode state, treating as normal login',
        );
      }
    }

    // If linking, update existing user with Google ID
    if (isLinking && linkingUserId) {
      try {
        const existingUser = await this.authService.linkGoogleToExistingUser(
          linkingUserId,
          req.user,
        );
        console.log('🟢 [BACKEND] Account linked successfully');

        const frontendUrl = this.configService.get<string>(
          'FRONTEND_URL',
          'http://localhost:5173',
        );

        // Redirect to settings with success message
        res.redirect(`${frontendUrl}/settings?linked=success`);
        return;
      } catch (error) {
        console.error('🔴 [BACKEND] Failed to link account:', error);
        const frontendUrl = this.configService.get<string>(
          'FRONTEND_URL',
          'http://localhost:5173',
        );
        res.redirect(`${frontendUrl}/settings?linked=error`);
        return;
      }
    }

    // Normal login flow
    const user = await this.authService.validateGoogleUser(req.user, req);
    console.log('🟢 [BACKEND] User validated:', user.email);

    const tokens = this.authService.generateTokens(user.id, user.email);
    console.log('🟢 [BACKEND] Tokens generated');

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );

    const redirectUrl = `${frontendUrl}/auth/callback?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
    console.log('🟢 [BACKEND] Redirecting to:', redirectUrl);

    res.redirect(redirectUrl);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: User) {
    // Exclude sensitive fields but include hasPassword and hasGoogleLinked indicators
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { googleId, password, ...safeUser } = user as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      ...safeUser,
      hasPassword: !!password, // boolean to indicate if user has password
      hasGoogleLinked: !!googleId, // boolean to indicate if Google is linked
    };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  getStatistics(@CurrentUser() user: User) {
    return this.authService.getStatistics(user.id);
  }

  @Post('upload-avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.authService.uploadImage(user.id, file, 'avatar');
  }

  @Post('upload-cover')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadCover(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.authService.uploadImage(user.id, file, 'cover');
  }

  @Get('login-history')
  @UseGuards(JwtAuthGuard)
  getLoginHistory(@CurrentUser() user: User, @Query('limit') limit?: string) {
    return this.loginHistoryService.getUserLoginHistory(
      user.id,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Post('unlink-google')
  @UseGuards(JwtAuthGuard)
  unlinkGoogle(@CurrentUser() user: User) {
    return this.authService.unlinkGoogleAccount(user.id);
  }

  @Get('google/link')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  getGoogleLinkUrl(@CurrentUser() user: User) {
    // Return Google OAuth URL with state parameter for account linking
    const callbackUrl = this.configService.get<string>(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:3000/api/auth/google/callback',
    );

    // Use user ID as state to identify linking request
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        action: 'link',
      }),
    ).toString('base64');

    const params = new URLSearchParams({
      client_id: this.configService.get<string>('GOOGLE_CLIENT_ID') || '',
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state,
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  }
}
