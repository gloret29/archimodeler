import { ApiProperty } from '@nestjs/swagger';

export class CreateElementDto {
    @ApiProperty({ description: 'Name of the element', example: 'Customer Service' })
    name: string;

    @ApiProperty({ description: 'ArchiMate concept type', example: 'BusinessActor' })
    type: string;

    @ApiProperty({ description: 'ArchiMate layer', example: 'Business' })
    layer: string;

    @ApiProperty({ description: 'ID of the model package', example: 'pkg-123' })
    packageId: string;

    @ApiProperty({ description: 'ID of the folder (optional)', example: 'folder-123', required: false })
    folderId?: string;
}

