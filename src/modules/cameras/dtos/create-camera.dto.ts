import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsUrl, IsUUID, IsInt, MinLength, MaxLength, Min, Max } from 'class-validator';

export class AuthCameraDto {
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
    description: 'End Point of the RTPSP',
    example: '/Streaming/Channels/1',
  })
  @IsUrl({}, { message: 'RTSP URL must be a valid URL' })
  readonly endPointRtsp: string;

  @ApiProperty({
    description: 'HTTP port for the camera',
    example: 80,
  })
  @IsInt({ message: 'HTTP port must be an integer' })
  @Min(1, { message: 'HTTP port must be at least 1' })
  @Max(65535, { message: 'HTTP port must be at most 65535' })
  readonly httpPort: number;
  
  @ApiProperty({
    description: 'End Point of the image preview',
    example: '/Streaming/channels/1/picture',
  })
  @IsUrl({}, { message: 'Image preview URL must be a valid URL' })
  readonly endPointImagePreview?: string;
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
  })
  readonly authCamera: AuthCameraDto;
}
