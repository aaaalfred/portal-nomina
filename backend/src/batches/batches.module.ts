import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { BatchesService } from './batches.service';
import { BatchesController } from './batches.controller';
import { Batch } from './entities/batch.entity';
import { BatchFile } from './entities/batch-file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Batch, BatchFile]),
    BullModule.registerQueue({
      name: 'batch-processing',
    }),
  ],
  controllers: [BatchesController],
  providers: [BatchesService],
  exports: [BatchesService],
})
export class BatchesModule {}
