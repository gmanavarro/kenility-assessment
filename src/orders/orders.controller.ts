import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthContext } from '../auth/auth.types';
import { AuthenticationContext } from '../auth/decorators/auth.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MongoIdDto } from '../common/dto/mongo-id.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Body() createOrderDto: CreateOrderDto,
    @AuthenticationContext() ctx: AuthContext,
  ) {
    return this.ordersService.create(createOrderDto, ctx.userId);
  }

  @Get(':id')
  findOne(@Param() params: MongoIdDto) {
    return this.ordersService.findByIdOrThrow(params.id);
  }

  @Patch(':id')
  update(@Param() params: MongoIdDto, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(params.id, updateOrderDto);
  }
}
