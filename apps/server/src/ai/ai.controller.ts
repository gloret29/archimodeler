import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('describe')
    describe(@Body() viewData: any) {
        return this.aiService.generateDiagramDescription(viewData);
    }

    @Post('coach')
    coach(@Body() body: { question: string }) {
        return this.aiService.askCoach(body.question);
    }
}
