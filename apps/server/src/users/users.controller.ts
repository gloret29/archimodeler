import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Prisma } from '@repo/database';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles('System Administrator', 'Lead Designer')
    @ApiOperation({ summary: 'Get all users', description: 'Retrieve all users in the system. Requires System Administrator or Lead Designer role.' })
    @ApiResponse({ status: 200, description: 'List of users retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    @Roles('System Administrator', 'Lead Designer')
    @ApiOperation({ summary: 'Get user by ID', description: 'Retrieve a specific user by their ID. Requires System Administrator or Lead Designer role.' })
    @ApiParam({ name: 'id', description: 'User ID', example: 'user-123' })
    @ApiResponse({ status: 200, description: 'User retrieved successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Post()
    @Roles('System Administrator')
    @ApiOperation({ summary: 'Create a new user', description: 'Create a new user account. Requires System Administrator role.' })
    @ApiResponse({ status: 201, description: 'User created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    async create(@Body() data: Prisma.UserCreateInput) {
        try {
            return await this.usersService.create(data);
        } catch (error: any) {
            console.error('Error creating user:', error);
            throw new HttpException(
                error.message || 'Failed to create user',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Put(':id')
    @Roles('System Administrator')
    @ApiOperation({ summary: 'Update a user', description: 'Update an existing user. Requires System Administrator role.' })
    @ApiParam({ name: 'id', description: 'User ID', example: 'user-123' })
    @ApiResponse({ status: 200, description: 'User updated successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    async update(@Param('id') id: string, @Body() data: Prisma.UserUpdateInput) {
        try {
            // If password is being updated and provided, hash it
            if ((data as any).password && (data as any).password.trim() !== '') {
                const bcrypt = require('bcrypt');
                (data as any).password = await bcrypt.hash((data as any).password, 10);
            } else {
                // Remove password from update if empty
                delete (data as any).password;
            }
            return await this.usersService.update(id, data);
        } catch (error: any) {
            console.error('Error updating user:', error);
            throw new HttpException(
                error.message || 'Failed to update user',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Delete(':id')
    @Roles('System Administrator')
    @ApiOperation({ summary: 'Delete a user', description: 'Delete a user from the system. Requires System Administrator role.' })
    @ApiParam({ name: 'id', description: 'User ID', example: 'user-123' })
    @ApiResponse({ status: 200, description: 'User deleted successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    async remove(@Param('id') id: string) {
        try {
            return await this.usersService.delete(id);
        } catch (error: any) {
            console.error('Error deleting user:', error);
            throw new HttpException(
                error.message || 'Failed to delete user',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
