import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChatRequestDto {
  @IsString({ message: 'applicantId must be a string' })
  @IsOptional()
  applicantId?: string;

  @IsString({ message: 'message must be a string' })
  @IsNotEmpty({ message: 'message must not be empty' })
  message: string;
}
