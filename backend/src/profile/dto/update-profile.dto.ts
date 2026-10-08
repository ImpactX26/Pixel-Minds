import { IsArray, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LanguageItemDto {
  @IsString()
  language: string;

  @IsString()
  level: string;
}

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
  @ValidateNested({ each: true })
  @Type(() => LanguageItemDto)
  languages?: LanguageItemDto[];

  @IsOptional()
  @IsArray()
  workExperience?: Array<Record<string, any>>;

  @IsOptional()
  @IsObject()
  additionalInfo?: Record<string, any>;
}
