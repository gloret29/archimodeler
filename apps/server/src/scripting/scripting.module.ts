import { Module } from '@nestjs/common';
import { ScriptingService } from './scripting.service';
import { ScriptingController } from './scripting.controller';
import { ModelModule } from '../model/model.module';

@Module({
    imports: [ModelModule],
    providers: [ScriptingService],
    controllers: [ScriptingController],
    exports: [ScriptingService],
})
export class ScriptingModule { }
