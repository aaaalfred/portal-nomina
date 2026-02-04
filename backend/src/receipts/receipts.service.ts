import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollReceipt } from './entities/payroll-receipt.entity';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(PayrollReceipt)
    private receiptRepository: Repository<PayrollReceipt>,
  ) {}

  async findAll(): Promise<PayrollReceipt[]> {
    return this.receiptRepository.find({
      order: { fechaPeriodo: 'DESC' },
      relations: ['employee'],
    });
  }

  async findByRfc(rfc: string): Promise<PayrollReceipt[]> {
    return this.receiptRepository.find({
      where: { rfc },
      order: { fechaPeriodo: 'DESC' },
    });
  }

  async findOne(id: number, user: any): Promise<PayrollReceipt> {
    const receipt = await this.receiptRepository.findOne({
      where: { id },
      relations: ['employee'],
    });

    if (!receipt) {
      throw new NotFoundException('Recibo no encontrado');
    }

    // Solo empleados pueden ver solo sus recibos
    if (user.type === 'employee' && receipt.rfc !== user.rfc) {
      throw new ForbiddenException('No tienes acceso a este recibo');
    }

    return receipt;
  }

  async findByRfcFecha(rfcFecha: string): Promise<PayrollReceipt> {
    return this.receiptRepository.findOne({
      where: { rfcFecha },
    });
  }

  async upsert(data: Partial<PayrollReceipt>): Promise<PayrollReceipt> {
    const existing = await this.findByRfcFecha(data.rfcFecha);

    if (existing) {
      // Update only if new files are provided
      const updates: any = {};
      if (data.pdf1Filename) updates.pdf1Filename = data.pdf1Filename;
      if (data.pdf2Filename) updates.pdf2Filename = data.pdf2Filename;
      if (data.xmlFilename) updates.xmlFilename = data.xmlFilename;

      await this.receiptRepository.update(existing.id, updates);
      return this.receiptRepository.findOne({ where: { id: existing.id } });
    }

    const receipt = this.receiptRepository.create(data);
    return this.receiptRepository.save(receipt);
  }

  async getFile(id: number, fileType: 'pdf1' | 'pdf2' | 'xml', user: any) {
    const receipt = await this.findOne(id, user);

    let filename: string;
    
    switch (fileType) {
      case 'pdf1':
        filename = receipt.pdf1Filename;
        break;
      case 'pdf2':
        filename = receipt.pdf2Filename;
        break;
      case 'xml':
        filename = receipt.xmlFilename;
        break;
    }

    if (!filename) {
      throw new NotFoundException('Archivo no disponible');
    }

    // Files are organized by RFC: storage/receipts/{RFC}/{filename}
    const storagePath = process.env.STORAGE_PATH || './storage';
    
    // Try new structure first (organized by RFC)
    let filePath = path.join(storagePath, 'receipts', receipt.rfc, filename);
    
    try {
      await fs.access(filePath);
    } catch {
      // Fallback to old structure (flat) for backwards compatibility
      filePath = path.join(storagePath, 'receipts', filename);
      
      try {
        await fs.access(filePath);
      } catch {
        throw new NotFoundException(`Archivo no encontrado en el servidor: ${filename}`);
      }
    }

    return { file: filePath, filename };
  }
}
