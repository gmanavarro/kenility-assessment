import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthContext } from '../auth/auth.types';
import { AuthenticationContext } from '../auth/decorators/auth.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MongoIdDto } from '../common/dto/mongo-id.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@ApiTags('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiResponse({ status: 400, description: 'Bad request' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order successfully created' })
  create(
    @Body() createOrderDto: CreateOrderDto,
    @AuthenticationContext() ctx: AuthContext,
  ) {
    return this.ordersService.create(createOrderDto, ctx.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by id' })
  @ApiResponse({ status: 200, description: 'Returns the order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param() params: MongoIdDto) {
    return this.ordersService.findByIdOrThrow(params.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order' })
  @ApiResponse({ status: 200, description: 'Order successfully updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  update(@Param() params: MongoIdDto, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(params.id, updateOrderDto);
  }
}
