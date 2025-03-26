import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Product } from '../products/product.schema';

export type OrderDocument = Order & Document;

@Schema()
export class OrderItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: Product;

  @Prop({ required: true })
  quantity: number;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  clientName: string;

  @Prop({ required: true })
  total: number;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);
