import { Injectable } from '@nestjs/common';
import { OrderDocument } from '../orders/order.schema';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class StatsService {
  constructor(private readonly ordersService: OrdersService) {}

  async getLastMonthTotal(): Promise<number> {
    return this.ordersService.getLastMonthTotal();
  }

  async getHighestOrder(): Promise<OrderDocument> {
    return this.ordersService.getHighestOrder();
  }
}
