import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsObject()
  education?: Record<string, any>;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  languages?: Array<{ language: string; level: string }>;

  @IsOptional()
  @IsArray()
  workExperience?: Array<Record<string, any>>;

  @IsOptional()
  @IsObject()
  additionalInfo?: Record<string, any>;
}
