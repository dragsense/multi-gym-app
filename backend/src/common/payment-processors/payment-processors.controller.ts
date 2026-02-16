import {
  Controller,
  Get,
  Body,
  Post,
  Param,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { PaymentProcessorsService } from './payment-processors.service';
import {
  CreatePaymentProcessorDto,
  UpdatePaymentProcessorDto,
  PaymentProcessorListDto,
  PaymentProcessorPaginatedDto,
  PaymentProcessorDto,
} from '@shared/dtos/payment-processors-dtos';
import { Public } from '@/decorators/access.decorator';
import { SkipBusinessCheck } from '@/decorators/skip-business-check.decorator';

@ApiBearerAuth('access-token')
@ApiTags('Payment Processors')
@Controller('payment-processors')
export class PaymentProcessorsController {
  constructor(private readonly paymentProcessorsService: PaymentProcessorsService) {}

  @ApiOperation({
    summary: 'Get all payment processors with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of payment processors',
    type: PaymentProcessorPaginatedDto,
  })
  @Get()
  @SkipBusinessCheck()
  findAll(@Query() query: PaymentProcessorListDto) {
    return this.paymentProcessorsService.get(query, PaymentProcessorListDto);
  }

  @ApiOperation({ summary: 'Get payment processor by ID' })
  @ApiParam({ name: 'id', description: 'Payment processor ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns payment processor by ID',
    type: PaymentProcessorDto,
  })
  @ApiResponse({ status: 404, description: 'Payment processor not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentProcessorsService.getSingle(id);
  }

  @ApiOperation({ summary: 'Add a new payment processor' })
  @ApiBody({
    type: CreatePaymentProcessorDto,
    description: 'Create a new payment processor',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment processor created successfully',
  })
  @Post()
  create(@Body() createPaymentProcessorDto: CreatePaymentProcessorDto) {
    return this.paymentProcessorsService.createPaymentProcessor(
      createPaymentProcessorDto,
    );
  }

  @ApiOperation({ summary: 'Update payment processor by ID' })
  @ApiParam({ name: 'id', description: 'Payment processor ID' })
  @ApiBody({
    type: UpdatePaymentProcessorDto,
    description: 'Update payment processor information',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment processor updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Payment processor not found' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePaymentProcessorDto: UpdatePaymentProcessorDto,
  ) {
    return this.paymentProcessorsService.updatePaymentProcessor(
      id,
      updatePaymentProcessorDto,
    );
  }

  @ApiOperation({ summary: 'Delete payment processor by ID' })
  @ApiParam({ name: 'id', description: 'Payment processor ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment processor deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Payment processor not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.paymentProcessorsService.delete(id);
  }
}
