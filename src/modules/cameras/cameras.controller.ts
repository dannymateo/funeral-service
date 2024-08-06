import { Controller, Get, Post, Body, Put, Param, Delete, Ip, Query, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CamerasService } from './cameras.service';
import { CreateCameraDto } from './dtos/create-camera.dto';
import { UpdateCameraDto } from './dtos/update-camera.dto';
import { CameraFailDto } from './dtos/camera-fail.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';

@ApiTags('cameras')
@Controller('cameras')
export class CamerasController {
	constructor(private readonly camerasService: CamerasService) { }

	@Post()
	create(@Body() createCameraDto: CreateCameraDto) {
		return this.camerasService.create(createCameraDto);
	}

	@Get()
	findAll(@Query() query: PaginationDto) {
		return this.camerasService.findAll(query);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.camerasService.findOne(id);
	}

	@Get('/imagePreview/:id')
	getImagePreview(@Param('id') id: string) {
		return this.camerasService.getImagePreview(id);
	}

	@Put(':id')
	update(
		@Param('id') id: string,
		@Body() updateCameraDto: UpdateCameraDto,
	) {
		return this.camerasService.update(id, updateCameraDto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.camerasService.remove(id);
	}

	@Patch('/cameraFail/:id')
	cameraFail(@Param('id') id: string, @Body() cameraFailDto: CameraFailDto) {
		return this.camerasService.cameraFail(id, cameraFailDto.message);
	}
}