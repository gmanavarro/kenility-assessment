import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import {
  databaseConfig,
  jwtConfig,
  storageConfig,
} from './config/configuration';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { StatsModule } from './stats/stats.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, storageConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigType<typeof databaseConfig>) => ({
        uri: config.uri,
      }),
      inject: [databaseConfig.KEY],
    }),
    AuthModule,
    ProductsModule,
    OrdersModule,
    StorageModule,
    StatsModule,
  ],
})
export class AppModule {}
