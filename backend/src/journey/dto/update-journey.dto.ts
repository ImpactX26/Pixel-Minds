import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { JourneyStage } from '../../common/enums';

export class UpdateJourneyDto {
  @IsOptional()
  @IsEnum(JourneyStage, {
    message: `currentStage must be one of: ${Object.values(JourneyStage).join(', ')}`,
  })
  currentStage?: JourneyStage;

  @IsOptional()
  @IsInt({ message: 'progress must be an integer' })
  @Min(0, { message: 'progress must be at least 0' })
  @Max(100, { message: 'progress cannot exceed 100' })
  progress?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;
}
