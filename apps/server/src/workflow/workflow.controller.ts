import { Controller, Get, Post, Body, Param, UseGuards, Request, Put } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('workflow')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class WorkflowController {
    constructor(private readonly workflowService: WorkflowService) { }

    @Post('change-requests')
    @Roles('Designer', 'Lead Designer', 'System Administrator')
    create(@Request() req: any, @Body() body: { modelPackageId: string; title: string; description?: string }) {
        return this.workflowService.createChangeRequest(req.user.userId, body.modelPackageId, body.title, body.description);
    }

    @Get('change-requests')
    findAll() {
        return this.workflowService.findAll();
    }

    @Get('change-requests/:id')
    findOne(@Param('id') id: string) {
        return this.workflowService.findOne(id);
    }

    @Put('change-requests/:id/submit')
    @Roles('Designer', 'Lead Designer', 'System Administrator')
    submit(@Param('id') id: string) {
        return this.workflowService.submitForReview(id);
    }

    @Put('change-requests/:id/approve')
    @Roles('Lead Designer', 'System Administrator')
    approve(@Request() req: any, @Param('id') id: string) {
        return this.workflowService.approveChangeRequest(id, req.user.userId);
    }

    @Put('change-requests/:id/reject')
    @Roles('Lead Designer', 'System Administrator')
    reject(@Request() req: any, @Param('id') id: string) {
        return this.workflowService.rejectChangeRequest(id, req.user.userId);
    }

    @Put('change-requests/:id/publish')
    @Roles('Lead Designer', 'System Administrator')
    publish(@Param('id') id: string) {
        return this.workflowService.publishChangeRequest(id);
    }
}
