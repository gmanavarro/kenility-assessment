import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private productsService: ProductsService,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
    userId: string,
  ): Promise<OrderDocument> {
    const items = await Promise.all(
      createOrderDto.items.map(async (item) => {
        const product = await this.productsService.findByIdOrThrow(
          item.productId,
        );
        return {
          productId: product._id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: item.quantity,
        };
      }),
    );

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const order = new this.orderModel({
      createdBy: userId,
      clientName: createOrderDto.clientName,
      items,
      total,
    });

    return order.save();
  }

  async findByIdOrThrow(id: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async update(
    id: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<OrderDocument> {
    await this.findByIdOrThrow(id);

    const updateData: Partial<Order> = {};

    if (updateOrderDto.clientName) {
      updateData.clientName = updateOrderDto.clientName;
    }

    if (updateOrderDto.items) {
      const items = await Promise.all(
        updateOrderDto.items.map(async (item) => {
          const product = await this.productsService.findByIdOrThrow(
            item.productId,
          );
          return {
            productId: product._id.toString(),
            name: product.name,
            sku: product.sku,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: item.quantity,
          };
        }),
      );

      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      updateData.items = items;
      updateData.total = total;
    }

    if (Object.keys(updateData).length > 0) {
      await this.orderModel.updateOne({ _id: id }, updateData);
    }

    return this.findByIdOrThrow(id);
  }

  async getLastMonthTotal(): Promise<number> {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const orders = await this.orderModel
      .find({
        createdAt: { $gte: lastMonth },
      })
      .select('total')
      .lean()
      .exec();

    return orders.reduce((sum, order) => sum + order.total, 0);
  }

  async getHighestOrder(): Promise<OrderDocument> {
    const order = await this.orderModel
      .findOne()
      .sort({ total: 'desc' })
      .lean()
      .exec();

    if (!order) {
      throw new NotFoundException('No orders found');
    }

    return order;
  }
}
