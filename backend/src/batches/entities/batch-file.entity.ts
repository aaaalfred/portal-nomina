import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Batch } from './batch.entity';

export enum FileStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum FileType {
  PDF = 'PDF',
  XML = 'XML',
  UNKNOWN = 'UNKNOWN',
}

@Entity('batch_files')
export class BatchFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'batch_id' })
  batchId: number;

  @ManyToOne(() => Batch, batch => batch.files)
  @JoinColumn({ name: 'batch_id' })
  batch: Batch;

  @Column()
  filename: string;

  @Column({
    name: 'file_type',
    type: 'enum',
    enum: FileType,
  })
  fileType: FileType;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.PENDING,
  })
  status: FileStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'rfc_extracted', nullable: true })
  rfcExtracted: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'processed_at', nullable: true })
  processedAt: Date;
}
