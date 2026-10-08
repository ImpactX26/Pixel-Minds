import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Qualification } from './entities/qualification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Qualification])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class QualificationModule {}
