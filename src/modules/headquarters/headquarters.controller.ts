import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { headquartersService } from './headquarters.service';
import { CreateHeadquarterDto } from './dto/create-headquarter.dto';
import { UpdateHeadquarterRDto } from './dto/update-headquarter.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';

@ApiTags('headquarters')
@Controller('headquarters')
export class HeadquartersController {
	constructor(private readonly headquartersService: headquartersService) { }

	@Post()
	create(
		@Body() createHeadquarterDto: CreateHeadquarterDto,
	) {
		return this.headquartersService.create(createHeadquarterDto);
	}

	@Get()
	findAll(@Query() query: PaginationDto) {
		return this.headquartersService.findAll(query);
	}

	@Get('/getActive')
    @ApiOperation({ summary: 'It is to obtain the data for the selects' })
	getActive() {
		return this.headquartersService.findActive();
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.headquartersService.findOne(id);
	}

	@Put(':id')
	update(
		@Param('id') id: string,
		@Body() updateHeadquarterRDto: UpdateHeadquarterRDto,
	) {
		return this.headquartersService.update(id, updateHeadquarterRDto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.headquartersService.remove(id);
	}
}