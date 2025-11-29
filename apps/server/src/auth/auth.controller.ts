import { Controller, Request, Post, UseGuards, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @UseGuards(AuthGuard('local'))
    @Post('login')
    @ApiOperation({ summary: 'User login', description: 'Authenticate a user with email and password' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'user@example.com' },
                password: { type: 'string', example: 'password123' },
            },
            required: ['email', 'password'],
        },
    })
    @ApiResponse({ status: 200, description: 'Login successful, returns JWT token', schema: { type: 'object', properties: { access_token: { type: 'string' } } } })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Request() req: any) {
        return this.authService.login(req.user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get user profile', description: 'Get the authenticated user profile information' })
    @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getProfile(@Request() req: any) {
        return req.user;
    }
}
