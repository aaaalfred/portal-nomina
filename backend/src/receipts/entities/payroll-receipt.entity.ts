import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('payroll_receipts')
@Index(['rfc', 'fechaPeriodo'], { unique: true })
export class PayrollReceipt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @ManyToOne(() => Employee, employee => employee.receipts)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ length: 13 })
  rfc: string;

  @Column({ name: 'fecha_periodo', type: 'date' })
  fechaPeriodo: Date;

  @Column({ name: 'rfc_fecha', unique: true })
  rfcFecha: string; // RFC + '_' + fecha_periodo

  @Column({ name: 'period_type', length: 20 })
  periodType: string; // 'semanal', 'quincenal', 'mensual'

  @Column({ name: 'period_id', nullable: true })
  periodId: string;

  @Column({ name: 'pdf1_filename', nullable: true })
  pdf1Filename: string;

  @Column({ name: 'pdf2_filename', nullable: true })
  pdf2Filename: string;

  @Column({ name: 'xml_filename', nullable: true })
  xmlFilename: string;

  @Column({ name: 'batch_id', nullable: true })
  batchId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
