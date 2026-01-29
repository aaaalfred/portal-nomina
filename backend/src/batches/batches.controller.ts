import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Body, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile,
  Request
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { BatchesService } from './batches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateBatchDto } from './dto/create-batch.dto';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Lotes')
@ApiBearerAuth()
@Controller('batches')
@UseGuards(JwtAuthGuard)
export class BatchesController {
  constructor(private batchesService: BatchesService) {}

  @ApiOperation({ summary: 'Crear nuevo lote' })
  @Post()
  create(@Body() createBatchDto: CreateBatchDto, @Request() req) {
    return this.batchesService.create(createBatchDto, req.user);
  }

  @ApiOperation({ summary: 'Subir archivo ZIP a lote' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post(':id/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './storage/uploads',
        filename: (req, file, cb) => {
          const filename = `${uuidv4()}-${file.originalname}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/zip' && !file.originalname.endsWith('.zip')) {
          return cb(new Error('Solo se permiten archivos ZIP'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadZip(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.batchesService.uploadZip(+id, file);
  }

  @ApiOperation({ summary: 'Listar todos los lotes' })
  @Get()
  findAll() {
    return this.batchesService.findAll();
  }

  @ApiOperation({ summary: 'Obtener detalle de lote' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.batchesService.findOne(+id);
  }

  @ApiOperation({ summary: 'Ver archivos procesados de un lote' })
  @Get(':id/files')
  getFiles(@Param('id') id: string) {
    return this.batchesService.getFiles(+id);
  }
}
