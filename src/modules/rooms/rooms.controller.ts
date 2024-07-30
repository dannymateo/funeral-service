import { Controller, Get, Post, Body, Put, Param, Delete, Ip, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
	constructor(private readonly roomsService: RoomsService) {}

	@Post()
	create(
		@Body() createRoomDto: CreateRoomDto,
		@Ip() ip: string,
	) {
		return this.roomsService.create(createRoomDto, ip);
	}

	@Get()
	findAll(@Query() query: PaginationDto) {
		return this.roomsService.findAll(query);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.roomsService.findOne(id);
	}

	@Put(':id')
	update(
		@Param('id') id: string,
		@Body() pdateRoomDto: UpdateRoomDto,
		@Ip() ip: string,
	) {
		return this.roomsService.update(id, pdateRoomDto, ip);
	}

	@Delete(':id')
	remove(@Param('id') id: string, @Ip() ip: string) {
		return this.roomsService.remove(id, ip);
	}
}