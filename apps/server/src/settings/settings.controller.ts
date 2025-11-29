import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming this exists or similar

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all settings', description: 'Retrieve all system settings' })
    @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
    findAll() {
        return this.settingsService.getAllSettings();
    }

    @Get(':key')
    @ApiOperation({ summary: 'Get setting by key', description: 'Retrieve a specific setting by its key' })
    @ApiParam({ name: 'key', description: 'Setting key', example: 'palette' })
    @ApiResponse({ status: 200, description: 'Setting retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Setting not found' })
    findOne(@Param('key') key: string) {
        return this.settingsService.getSetting(key);
    }

    @Post(':key')
    @ApiOperation({ summary: 'Update or create a setting', description: 'Update an existing setting or create a new one' })
    @ApiParam({ name: 'key', description: 'Setting key', example: 'palette' })
    @ApiResponse({ status: 200, description: 'Setting updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    update(@Param('key') key: string, @Body() data: { value: any; description?: string }) {
        return this.settingsService.setSetting(key, data.value, data.description);
    }
}
