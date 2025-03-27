import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
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
        const product = await this.productsService.findOne(item.productId);
        return {
          productId: product._id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          pictureUrl: product.pictureUrl,
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

  async findAll(): Promise<OrderDocument[]> {
    return this.orderModel.find();
  }

  async findById(id: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById({ _id: id });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }
}
