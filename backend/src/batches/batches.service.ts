import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { Batch, BatchStatus } from './entities/batch.entity';
import { BatchFile } from './entities/batch-file.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class BatchesService {
  constructor(
    @InjectRepository(Batch)
    private batchRepository: Repository<Batch>,
    @InjectRepository(BatchFile)
    private batchFileRepository: Repository<BatchFile>,
    @InjectQueue('batch-processing')
    private batchQueue: Queue,
  ) {}

  async create(createBatchDto: CreateBatchDto, user: any): Promise<Batch> {
    const batch = this.batchRepository.create({
      ...createBatchDto,
      createdBy: user.username || user.rfc,
      status: BatchStatus.CREATED,
    });

    return this.batchRepository.save(batch);
  }

  async uploadZip(id: number, file: Express.Multer.File): Promise<Batch> {
    const batch = await this.findOne(id);

    if (!batch) {
      throw new NotFoundException('Lote no encontrado');
    }

    // Update batch with file info
    batch.zipFilename = file.filename;
    batch.zipUrl = file.path;
    batch.status = BatchStatus.UPLOADED;

    await this.batchRepository.save(batch);

    // Add job to queue for processing
    await this.batchQueue.add('process-batch', {
      batchId: batch.id,
      zipPath: file.path,
    });

    return batch;
  }

  async findAll(): Promise<Batch[]> {
    return this.batchRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Batch> {
    const batch = await this.batchRepository.findOne({
      where: { id },
    });

    if (!batch) {
      throw new NotFoundException('Lote no encontrado');
    }

    return batch;
  }

  async getFiles(batchId: number): Promise<BatchFile[]> {
    return this.batchFileRepository.find({
      where: { batchId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateStatus(id: number, status: BatchStatus): Promise<Batch> {
    await this.batchRepository.update(id, { status });
    return this.findOne(id);
  }
}
