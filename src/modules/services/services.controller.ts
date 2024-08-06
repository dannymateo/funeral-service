import { Controller, Get, Post, Body, Put, Param, Delete, Ip, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';

@ApiTags('services')
@Controller('services')
export class ServicesController {
	constructor(private readonly servicesService: ServicesService) { }

	@Post()
	create(
		@Body() createServiceDto: CreateServiceDto,
	) {
		return this.servicesService.create(createServiceDto);
	}

	// @Get()
	// findAll(@Query() query: PaginationDto) {
	// 	return this.servicesService.findAll(query);
	// }

	// @Get(':id')
	// findOne(@Param('id') id: string) {
	// 	return this.servicesService.findOne(id);
	// }

	// @Put(':id')
	// update(
	// 	@Param('id') id: string,
	// 	@Body() updateServiceDto: UpdateServiceDto,
	// ) {
	// 	return this.servicesService.update(id, updateServiceDto);
	// }

	// @Delete(':id')
	// remove(@Param('id') id: string) {
	// 	return this.servicesService.remove(id);
	// }
}