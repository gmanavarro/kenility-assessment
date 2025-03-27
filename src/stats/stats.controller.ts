import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StatsService } from './stats.service';

@Controller('stats')
@ApiTags('stats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('last-month-total')
  @ApiOperation({ summary: 'Get total sales for last month' })
  @ApiResponse({
    status: 200,
    description: 'Returns the total sales amount for the last month',
  })
  async getLastMonthTotal() {
    return this.statsService.getLastMonthTotal();
  }

  @Get('highest-order')
  @ApiOperation({ summary: 'Get highest amount order' })
  @ApiResponse({
    status: 200,
    description: 'Returns the order with the highest total amount',
  })
  @ApiResponse({ status: 404, description: 'No orders found' })
  async getHighestOrder() {
    return this.statsService.getHighestOrder();
  }
}
