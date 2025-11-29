import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming this exists or similar

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles('ADMIN')
    findAll() {
        return this.settingsService.getAllSettings();
    }

    @Get(':key')
    findOne(@Param('key') key: string) {
        return this.settingsService.getSetting(key);
    }

    @Post(':key')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles('ADMIN')
    update(@Param('key') key: string, @Body() data: { value: any; description?: string }) {
        return this.settingsService.setSetting(key, data.value, data.description);
    }
}
