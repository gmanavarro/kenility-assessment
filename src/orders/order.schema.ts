import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../users/user.schema';

export type OrderDocument = Order & Document<MongooseSchema.Types.ObjectId>;

class OrderItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: User;

  @Prop({ required: true })
  clientName: string;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  total: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
