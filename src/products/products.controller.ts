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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { AuthContext } from '../auth/auth.types';
import { AuthenticationContext } from '../auth/decorators/auth.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MongoIdDto } from '../common/dto/mongo-id.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ImageValidatorInterceptor } from './interceptors/image-validator.interceptor';
import { ProductsService } from './products.service';

@Controller('products')
@ApiTags('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiResponse({ status: 400, description: 'Bad request' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiExtraModels(CreateProductDto)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'), ImageValidatorInterceptor)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      allOf: [
        { $ref: getSchemaPath(CreateProductDto) },
        {
          properties: {
            image: {
              type: 'string',
              format: 'binary',
              description: 'Product image file',
            },
          },
          required: ['image'],
        },
      ],
    },
  })
  @ApiResponse({ status: 201, description: 'Product successfully created' })
  @ApiResponse({ status: 409, description: 'SKU already exists' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() image: Express.Multer.File,
    @AuthenticationContext() ctx: AuthContext,
  ) {
    return this.productsService.create(createProductDto, image, ctx.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Returns all products' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiResponse({ status: 200, description: 'Returns the product' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param() params: MongoIdDto) {
    return this.productsService.findByIdOrThrow(params.id);
  }
}
