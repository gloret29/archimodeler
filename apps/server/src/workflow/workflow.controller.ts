import { Controller, Get, Post, Body, Param, UseGuards, Request, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Workflow')
@Controller('workflow')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class WorkflowController {
    constructor(private readonly workflowService: WorkflowService) { }

    @Post('change-requests')
    @Roles('Designer', 'Lead Designer', 'System Administrator')
    @ApiOperation({ summary: 'Create a change request', description: 'Create a new change request for a model package' })
    @ApiResponse({ status: 201, description: 'Change request created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    create(@Request() req: any, @Body() body: { modelPackageId: string; title: string; description?: string }) {
        return this.workflowService.createChangeRequest(req.user.userId, body.modelPackageId, body.title, body.description);
    }

    @Get('change-requests')
    @ApiOperation({ summary: 'Get all change requests', description: 'Retrieve all change requests' })
    @ApiResponse({ status: 200, description: 'List of change requests retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findAll() {
        return this.workflowService.findAll();
    }

    @Get('change-requests/:id')
    @ApiOperation({ summary: 'Get change request by ID', description: 'Retrieve a specific change request by its ID' })
    @ApiParam({ name: 'id', description: 'Change request ID', example: 'cr-123' })
    @ApiResponse({ status: 200, description: 'Change request retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Change request not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findOne(@Param('id') id: string) {
        return this.workflowService.findOne(id);
    }

    @Put('change-requests/:id/submit')
    @Roles('Designer', 'Lead Designer', 'System Administrator')
    @ApiOperation({ summary: 'Submit change request for review', description: 'Submit a change request for review' })
    @ApiParam({ name: 'id', description: 'Change request ID', example: 'cr-123' })
    @ApiResponse({ status: 200, description: 'Change request submitted successfully' })
    @ApiResponse({ status: 404, description: 'Change request not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    submit(@Param('id') id: string) {
        return this.workflowService.submitForReview(id);
    }

    @Put('change-requests/:id/approve')
    @Roles('Lead Designer', 'System Administrator')
    @ApiOperation({ summary: 'Approve change request', description: 'Approve a change request. Requires Lead Designer or System Administrator role.' })
    @ApiParam({ name: 'id', description: 'Change request ID', example: 'cr-123' })
    @ApiResponse({ status: 200, description: 'Change request approved successfully' })
    @ApiResponse({ status: 404, description: 'Change request not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    approve(@Request() req: any, @Param('id') id: string) {
        return this.workflowService.approveChangeRequest(id, req.user.userId);
    }

    @Put('change-requests/:id/reject')
    @Roles('Lead Designer', 'System Administrator')
    @ApiOperation({ summary: 'Reject change request', description: 'Reject a change request. Requires Lead Designer or System Administrator role.' })
    @ApiParam({ name: 'id', description: 'Change request ID', example: 'cr-123' })
    @ApiResponse({ status: 200, description: 'Change request rejected successfully' })
    @ApiResponse({ status: 404, description: 'Change request not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    reject(@Request() req: any, @Param('id') id: string) {
        return this.workflowService.rejectChangeRequest(id, req.user.userId);
    }

    @Put('change-requests/:id/publish')
    @Roles('Lead Designer', 'System Administrator')
    @ApiOperation({ summary: 'Publish change request', description: 'Publish an approved change request. Requires Lead Designer or System Administrator role.' })
    @ApiParam({ name: 'id', description: 'Change request ID', example: 'cr-123' })
    @ApiResponse({ status: 200, description: 'Change request published successfully' })
    @ApiResponse({ status: 404, description: 'Change request not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    publish(@Param('id') id: string) {
        return this.workflowService.publishChangeRequest(id);
    }
}
