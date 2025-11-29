import { ApiProperty } from '@nestjs/swagger';

export class CreateRelationshipDto {
    @ApiProperty({ description: 'Name of the relationship (optional)', example: 'Serves' })
    name?: string;

    @ApiProperty({ description: 'Documentation for the relationship (optional)' })
    documentation?: string;

    @ApiProperty({ description: 'Additional properties (optional)', type: 'object', additionalProperties: true })
    properties?: Record<string, any>;

    @ApiProperty({ description: 'ID of the relation type', example: 'rel-type-123' })
    relationTypeId: string;

    @ApiProperty({ description: 'ID of the source element', example: 'elem-123' })
    sourceId: string;

    @ApiProperty({ description: 'ID of the target element', example: 'elem-456' })
    targetId: string;

    @ApiProperty({ description: 'ID of the model package', example: 'pkg-123' })
    modelPackageId: string;
}

export class UpdateRelationshipDto {
    @ApiProperty({ description: 'Name of the relationship (optional)' })
    name?: string;

    @ApiProperty({ description: 'Documentation for the relationship (optional)' })
    documentation?: string;

    @ApiProperty({ description: 'Additional properties (optional)', type: 'object', additionalProperties: true })
    properties?: Record<string, any>;

    @ApiProperty({ description: 'Valid to date (optional)' })
    validTo?: Date;
}

