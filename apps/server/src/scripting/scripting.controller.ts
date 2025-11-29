import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ScriptingService } from './scripting.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('scripts')
export class ScriptingController {
    constructor(private readonly scriptingService: ScriptingService) { }

    @Post('execute')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('Designer', 'Lead Designer', 'System Administrator')
    async execute(@Body() body: { script: string; context?: any }) {
        return this.scriptingService.executeScript(body.script, body.context);
    }
}
