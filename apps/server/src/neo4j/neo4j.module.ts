import { Module, Global } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';
import { RelationshipsService } from './relationships.service';

@Global()
@Module({
    providers: [Neo4jService, RelationshipsService],
    exports: [Neo4jService, RelationshipsService],
})
export class Neo4jModule { }

