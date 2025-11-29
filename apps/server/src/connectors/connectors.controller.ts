import { Controller, Get, Post, Body, Param, Post as HttpPost } from '@nestjs/common';
import { ConnectorsService } from './connectors.service';
import { Prisma } from '@repo/database';

@Controller('connectors')
export class ConnectorsController {
    constructor(private readonly connectorsService: ConnectorsService) { }

    @Post()
    create(@Body() data: Prisma.DataSourceCreateInput) {
        return this.connectorsService.createDataSource(data);
    }

    @Get()
    findAll() {
        return this.connectorsService.findAll();
    }

    @HttpPost(':id/sync')
    sync(@Param('id') id: string) {
        return this.connectorsService.syncDataSource(id);
    }
}
