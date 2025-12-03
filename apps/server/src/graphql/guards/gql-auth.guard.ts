import { ExecutionContext, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../../auth/constants';

/**
 * Guard GraphQL pour l'authentification JWT.
 * Extrait le token depuis les headers HTTP ou les paramètres de connexion WebSocket.
 */
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  constructor(@Inject(JwtService) private jwtService: JwtService) {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req, connection } = ctx.getContext();

    // For WebSocket subscriptions
    if (connection) {
      const token = connection.context?.token;
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: jwtConstants.secret,
        });
        connection.context.user = {
          userId: payload.sub,
          username: payload.username,
          roles: payload.roles,
        };
        return true;
      } catch {
        throw new UnauthorizedException('Invalid token');
      }
    }

    // For HTTP requests
    return super.canActivate(context) as Promise<boolean>;
  }
}

