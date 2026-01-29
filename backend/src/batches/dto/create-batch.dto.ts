import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateBatchDto {
  @ApiProperty({ example: 'quincenal', description: 'Tipo de periodo' })
  @IsString()
  @IsNotEmpty()
  periodType: string;

  @ApiProperty({ example: '2024-01', description: 'ID del periodo' })
  @IsString()
  @IsNotEmpty()
  periodId: string;

  @ApiProperty({ example: '2024-01-15', description: 'Fecha del periodo' })
  @IsDateString()
  @IsNotEmpty()
  fechaPeriodo: string;
}
