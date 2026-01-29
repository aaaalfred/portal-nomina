import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async findByRfc(rfc: string): Promise<Employee> {
    return this.employeeRepository.findOne({ where: { rfc } });
  }

  async findAll(): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { active: true },
      select: ['id', 'rfc', 'name', 'carpeta', 'createdAt'],
    });
  }

  async create(data: Partial<Employee>): Promise<Employee> {
    if (data.passwordHash) {
      data.passwordHash = await bcrypt.hash(data.passwordHash, 10);
    }
    const employee = this.employeeRepository.create(data);
    return this.employeeRepository.save(employee);
  }

  async update(id: number, data: Partial<Employee>): Promise<Employee> {
    if (data.passwordHash) {
      data.passwordHash = await bcrypt.hash(data.passwordHash, 10);
    }
    await this.employeeRepository.update(id, data);
    return this.findByRfc(data.rfc);
  }
}
