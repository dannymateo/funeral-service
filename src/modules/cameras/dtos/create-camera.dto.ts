import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsUrl, IsUUID, IsInt, MinLength, MaxLength, Min, Max, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAuthCameraDto {
  @ApiProperty({
    description: 'Username for camera authentication',
    example: 'admin',
  })
  @IsString({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username must be at most 50 characters long' })
  readonly userName: string;

  @ApiProperty({
    description: 'Password for camera authentication',
    example: 'password123',
  })
  @IsString({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(50, { message: 'Password must be at most 50 characters long' })
  readonly password: string;

  @ApiProperty({
    description: 'IP address of the camera',
    example: '192.168.1.10',
  })
  @IsString({ message: 'IP address is required' })
  readonly ipAddress: string;

  @ApiProperty({
    description: 'RTSP port for the camera',
    example: 554,
  })
  @IsInt({ message: 'RTSP port must be an integer' })
  @Min(1, { message: 'RTSP port must be at least 1' })
  @Max(65535, { message: 'RTSP port must be at most 65535' })
  readonly rtspPort: number;

  @ApiProperty({
    description: 'End Point of the RTSP',
    example: '/Streaming/Channels/1',
  })
  @IsString({ message: 'endPointRtsp is required' })
  @MinLength(3, { message: 'endPointRtsp must be at least 3 characters long' })
  @MaxLength(100, { message: 'endPointRtsp must be at most 100 characters long' })
  readonly endPointRtsp: string;

  @ApiProperty({
    description: 'HTTP port for the camera',
    example: 8085,
  })
  @IsInt({ message: 'HTTP port must be an integer' })
  @Min(1, { message: 'HTTP port must be at least 1' })
  @Max(65535, { message: 'HTTP port must be at most 65535' })
  readonly httpPort: number;
  
  @ApiProperty({
    description: 'End Point of the image preview',
    example: '/ISAPI/Streaming/channels/1/picture',
  })
  @IsString({ message: 'endPointImagePreview is required' })
  @MinLength(3, { message: 'endPointImagePreview must be at least 3 characters long' })
  @MaxLength(100, { message: 'endPointImagePreview must be at most 100 characters long' })
  readonly endPointImagePreview?: string;
}

export class CreateMovementsPTZDto {
  @ApiProperty({
    description: 'Name of the PTZ movement',
    example: 'Preset 1',
  })
  @IsString({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Name must be at most 50 characters long' })
  readonly name: string;

  @ApiProperty({
    description: 'Order of the PTZ movement',
    example: 1,
  })
  @IsInt({ message: 'Order must be an integer' })
  @Min(1, { message: 'Order must be at least 1' })
  @Max(999, { message: 'Order must be at most 999' })
  readonly order: number;

  @ApiProperty({
    description: 'End point of the PTZ movement command',
    example: '/ISAPI/PTZCtrl/channels/1/presets/1/goto',
  })
  @IsString({ message: 'EndPoint is required' })
  @MinLength(3, { message: 'EndPoint must be at least 3 characters long' })
  @MaxLength(200, { message: 'EndPoint must be at most 200 characters long' })
  readonly endPoint: string;
}

export class CreateCameraDto {
  @ApiProperty({
    description: 'Name of the camera',
    example: 'Camera room 1',
  })
  @IsString({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Name must be at most 50 characters long' })
  readonly name: string;

  @ApiProperty({
    description: 'Indicates if the camera is active',
    example: true,
  })
  @IsBoolean({ message: 'Active must be a boolean value' })
  readonly active: boolean;

  @ApiProperty({
    description: 'Indicates if the camera has PTZ capabilities',
    example: false,
  })
  @IsBoolean({ message: 'HasPTZ must be a boolean value' })
  readonly hasPTZ: boolean;

  @ApiProperty({
    description: 'ID of the room where the camera is located',
    example: 'uuid',
  })
  @IsUUID('4', { message: 'RoomId must be a valid UUID' })
  readonly roomId: string;

  @ApiProperty({
    description: 'Authentication details for the camera',
    type: CreateAuthCameraDto,
  })
  @ValidateNested()
  @Type(() => CreateAuthCameraDto)
  readonly authCamera: CreateAuthCameraDto;

  @ApiProperty({
    description: 'List of the PTZ movements',
    type: [CreateMovementsPTZDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMovementsPTZDto)
  readonly movementsPTZ?: CreateMovementsPTZDto[];
}
