import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ChatRequestDto {
  @IsUUID('4', { message: 'applicantId must be a valid UUID v4' })
  @IsNotEmpty({ message: 'applicantId is required' })
  applicantId: string;

  @IsString({ message: 'message must be a string' })
  @IsNotEmpty({ message: 'message must not be empty' })
  message: string;
}
