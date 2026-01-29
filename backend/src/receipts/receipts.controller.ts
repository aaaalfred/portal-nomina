import { Controller, Get, Param, Query, UseGuards, Request, StreamableFile, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReceiptsService } from './receipts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as fs from 'fs';

@ApiTags('Recibos')
@ApiBearerAuth()
@Controller('receipts')
@UseGuards(JwtAuthGuard)
export class ReceiptsController {
  constructor(private receiptsService: ReceiptsService) {}

  @ApiOperation({ summary: 'Listar recibos de empleado (propios o todos si admin)' })
  @Get()
  findAll(@Request() req, @Query('rfc') rfc?: string) {
    // Empleados solo ven sus propios recibos
    if (req.user.type === 'employee') {
      return this.receiptsService.findByRfc(req.user.rfc);
    }

    // Usuarios pueden filtrar por RFC o ver todos
    if (rfc) {
      return this.receiptsService.findByRfc(rfc);
    }

    return this.receiptsService.findAll();
  }

  @ApiOperation({ summary: 'Obtener recibo por ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.receiptsService.findOne(+id, req.user);
  }

  @ApiOperation({ summary: 'Descargar archivo PDF o XML de recibo' })
  @Get(':id/download/:fileType')
  async downloadFile(
    @Param('id') id: string,
    @Param('fileType') fileType: 'pdf1' | 'pdf2' | 'xml',
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { file, filename } = await this.receiptsService.getFile(+id, fileType, req.user);

    res.set({
      'Content-Type': fileType === 'xml' ? 'application/xml' : 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    const fileStream = fs.createReadStream(file);
    return new StreamableFile(fileStream);
  }
}
