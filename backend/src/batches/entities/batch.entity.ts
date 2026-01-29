import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BatchFile } from './batch-file.entity';

export enum BatchStatus {
  CREATED = 'CREATED',
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  FAILED = 'FAILED',
}

@Entity('batches')
export class Batch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'period_type', length: 20 })
  periodType: string; // 'semanal', 'quincenal', 'mensual'

  @Column({ name: 'period_id' })
  periodId: string;

  @Column({ name: 'fecha_periodo', type: 'date' })
  fechaPeriodo: Date;

  @Column({ name: 'zip_filename', nullable: true })
  zipFilename: string;

  @Column({ name: 'zip_url', nullable: true })
  zipUrl: string;

  @Column({
    type: 'enum',
    enum: BatchStatus,
    default: BatchStatus.CREATED,
  })
  status: BatchStatus;

  @Column({ name: 'total_files', default: 0 })
  totalFiles: number;

  @Column({ name: 'processed_files', default: 0 })
  processedFiles: number;

  @Column({ name: 'success_files', default: 0 })
  successFiles: number;

  @Column({ name: 'error_files', default: 0 })
  errorFiles: number;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @OneToMany(() => BatchFile, file => file.batch)
  files: BatchFile[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;
}
