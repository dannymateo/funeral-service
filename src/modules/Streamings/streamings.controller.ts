import { Controller, Get, Put, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

import { StreamingsService } from './streamings.service';
import { PaginationDto } from '../../common/dtos/pagination.dto';

@ApiTags('streamings')
@Controller('streamings')
export class StreamingsController {
    constructor(private readonly streamingsService: StreamingsService) { }

    @ApiOperation({ summary: 'Get PTZs for a specific service' })
    @ApiParam({
        name: 'id',
        description: 'ID of the service to retrieve PTZs for',
        type: String,
        example: 'uuid',
    })
    @Get('/getPTZs/:id')
    getPTZs(@Param('id') id: string) {
        return this.streamingsService.getPTZs(id);
    }

    @ApiOperation({ summary: 'Execute PTZ movements for a specific service' })
    @ApiParam({
        name: 'id',
        description: 'ID of the service to execute PTZ movements for',
        type: String,
        example: 'uuid',
    })
    @Put('/execPTZ/:id')
    execPTZ(@Param('id') id: string) {
        return this.streamingsService.execPTZ(id);
    }
}