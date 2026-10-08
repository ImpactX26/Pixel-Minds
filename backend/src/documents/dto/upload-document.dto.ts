import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UploadDocumentDto {
  @IsNotEmpty({ message: 'applicantId is required' })
  @IsUUID('4', { message: 'applicantId must be a valid UUID v4' })
  applicantId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  type?: string;
}
