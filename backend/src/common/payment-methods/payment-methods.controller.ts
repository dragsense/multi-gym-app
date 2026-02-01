import {
  Controller,
  Get,
  UseGuards,
  Body,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Patch,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { PaymentMethodsService } from './payment-methods.service';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
  PaymentMethodListDto,
  PaymentMethodPaginatedDto,
  PaymentMethodDto,
} from '@shared/dtos/payment-methods-dtos';

@ApiBearerAuth('access-token')
@ApiTags('Payment Methods')
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @ApiOperation({
    summary: 'Get all payment methods with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of payment methods',
    type: PaymentMethodPaginatedDto,
  })
  @Get()
  findAll(@Query() query: PaymentMethodListDto) {
    return this.paymentMethodsService.get(query, PaymentMethodListDto);
  }

  @ApiOperation({ summary: 'Get payment method by ID' })
  @ApiParam({ name: 'id', description: 'Payment method ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns payment method by ID',
    type: PaymentMethodDto,
  })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentMethodsService.getSingle(id);
  }

  @ApiOperation({ summary: 'Add a new payment method' })
  @ApiBody({
    type: CreatePaymentMethodDto,
    description: 'Create a new payment method',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment method created successfully',
  })
  @Post()
  create(@Body() createPaymentMethodDto: CreatePaymentMethodDto) {
    return this.paymentMethodsService.createPaymentMethod(
      createPaymentMethodDto,
    );
  }

  @ApiOperation({ summary: 'Update payment method by ID' })
  @ApiParam({ name: 'id', description: 'Payment method ID' })
  @ApiBody({
    type: UpdatePaymentMethodDto,
    description: 'Update payment method information',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment method updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.updatePaymentMethod(
      id,
      updatePaymentMethodDto,
    );
  }

  @ApiOperation({ summary: 'Delete payment method by ID' })
  @ApiParam({ name: 'id', description: 'Payment method ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment method deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.paymentMethodsService.delete(id);
  }
}
