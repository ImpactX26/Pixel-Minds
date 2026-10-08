import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NextAction } from './entities/next-action.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NextAction])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class NextActionModule {}
