import { Module } from '@nestjs/common';
import { ScriptingService } from './scripting.service';
import { ScriptingController } from './scripting.controller';

@Module({
    providers: [ScriptingService],
    controllers: [ScriptingController],
    exports: [ScriptingService],
})
export class ScriptingModule { }
