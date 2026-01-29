import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PayrollReceipt } from '../../receipts/entities/payroll-receipt.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 13 })
  rfc: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  carpeta: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'legacy_id', nullable: true })
  legacyId: number;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => PayrollReceipt, receipt => receipt.employee)
  receipts: PayrollReceipt[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
