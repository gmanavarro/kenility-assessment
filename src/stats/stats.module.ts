import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [OrdersModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
