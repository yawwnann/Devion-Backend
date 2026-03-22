import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { AuthService } from '../auth.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

@Injectable()
export class RefreshTokenInterceptor implements NestInterceptor {
  constructor(
    private authService: AuthService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Skip refresh for certain routes (login, register, refresh itself)
    const skipRoutes = this.reflector.get<string[]>(
      'skipTokenRefresh',
      context.getHandler(),
    );

    if (skipRoutes) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // If user is authenticated, generate new tokens
    if (user && user.id) {
      return next.handle().pipe(
        tap((data: unknown) => {
          try {
            // Generate new tokens
            const tokens = this.authService.generateTokens(user.id, user.email);

            // Add tokens to response headers
            const response = context.switchToHttp().getResponse<Response>();
            // Set new access token in header
            response.setHeader('X-Access-Token', tokens.accessToken);
            response.setHeader('X-Refresh-Token', tokens.refreshToken);
            // Also add to response body if it's an object
            if (data && typeof data === 'object' && data !== null) {
              (data as Record<string, any>)._tokens = {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
              };
            }
          } catch (error) {
            // Silently fail - don't break the response
            console.error('Failed to refresh tokens:', error);
          }
        }),
      );
    }

    return next.handle();
  }
}
