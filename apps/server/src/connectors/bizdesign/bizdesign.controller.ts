import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { BizDesignService } from './bizdesign.service';
import type { BizDesignConfig } from './bizdesign.service';

@ApiTags('Connectors - BizDesign')
@Controller('connectors/bizdesign')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class BizDesignController {
    constructor(private readonly bizDesignService: BizDesignService) {}

    @Post('test-connection')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Test connection to BizDesign API' })
    @ApiResponse({ status: 200, description: 'Connection test result' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                url: { type: 'string', example: 'https://bizdesign.example.com' },
                username: { type: 'string', example: 'admin' },
                password: { type: 'string', example: 'password' },
            },
            required: ['url', 'username', 'password'],
        },
    })
    async testConnection(@Body() config: BizDesignConfig) {
        return this.bizDesignService.testConnection(config);
    }

    @Post('repositories')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get list of BizDesign repositories' })
    @ApiResponse({ status: 200, description: 'List of repositories' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                url: { type: 'string' },
                username: { type: 'string' },
                password: { type: 'string' },
            },
            required: ['url', 'username', 'password'],
        },
    })
    async getRepositories(@Body() config: BizDesignConfig) {
        return this.bizDesignService.getRepositories(config);
    }

    @Post('import')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Import a BizDesign repository to a ModelPackage' })
    @ApiResponse({ status: 200, description: 'Import result' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                url: { type: 'string' },
                username: { type: 'string' },
                password: { type: 'string' },
                repositoryId: { type: 'string' },
                targetPackageId: { type: 'string' },
                overwrite: { type: 'boolean' },
                newPackageName: { type: 'string' },
            },
            required: ['url', 'username', 'password', 'repositoryId'],
        },
    })
    async importRepository(
        @Body()
        body: BizDesignConfig & {
            repositoryId: string;
            targetPackageId?: string;
            overwrite?: boolean;
            newPackageName?: string;
        }
    ) {
        const { repositoryId, targetPackageId, overwrite, newPackageName, ...config } = body;
        return this.bizDesignService.importRepository(
            config,
            repositoryId,
            targetPackageId,
            { overwrite, newPackageName }
        );
    }
}

