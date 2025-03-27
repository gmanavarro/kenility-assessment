import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StorageService } from '../storage/storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product, ProductDocument } from './product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
    private storageService: StorageService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    image: Express.Multer.File,
    userId: string,
  ): Promise<ProductDocument> {
    const existingProduct = await this.productModel.findOne({
      sku: createProductDto.sku,
    });
    if (existingProduct) {
      throw new BadRequestException('SKU already exists');
    }

    const imageUrl = await this.storageService.uploadFile(image);

    const product = new this.productModel({
      ...createProductDto,
      imageUrl,
      createdBy: userId,
    });

    return product.save();
  }

  async findOne(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }
}
