import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { BatchesModule } from './batches/batches.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV !== 'production', // Solo dev
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),

    // Modules
    AuthModule,
    EmployeesModule,
    BatchesModule,
    ReceiptsModule,
    UsersModule,
  ],
})
export class AppModule {}
