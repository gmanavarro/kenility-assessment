import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthContext } from '../auth/auth.types';
import { AuthenticationContext } from '../auth/decorators/auth.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MongoIdDto } from '../common/dto/mongo-id.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ImageValidatorInterceptor } from './interceptors/image-validator.interceptor';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'), ImageValidatorInterceptor)
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() image: Express.Multer.File,
    @AuthenticationContext() ctx: AuthContext,
  ) {
    return this.productsService.create(createProductDto, image, ctx.userId);
  }

  @Get(':id')
  findOne(@Param() params: MongoIdDto) {
    return this.productsService.findOne(params.id);
  }
}
