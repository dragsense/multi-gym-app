import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CheckoutService } from './checkout.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderListDto,
  OrderPaginatedDto,
  OrderDto,
  CheckoutDto,
  SingleQueryDto,
} from '@shared/dtos';
import { AuthUser } from '@/decorators/user.decorator';
import { Timezone } from '@/decorators/timezone.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';

@ApiTags('Orders')
@MinUserLevel(EUserLevels.MEMBER)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly checkoutService: CheckoutService,
  ) {}

  @ApiOperation({ summary: 'Checkout: create order from cart and clear cart (cash or online)' })
  @ApiResponse({ status: 201, description: 'Order created from cart' })
  @Post('checkout')
  async checkout(
    @Body() dto: CheckoutDto,
    @AuthUser() user: User,
    @Timezone() timezone: string,
  ) {
    return this.checkoutService.checkout(user, dto, timezone);
  }

  @ApiOperation({ summary: 'List orders (own for member/staff, all for admin)' })
  @ApiResponse({ status: 200, type: OrderPaginatedDto })
  @Get()
  async list(@Query() query: OrderListDto, @AuthUser() user: User) {
    return this.ordersService.listOrders(query, user);
  }

  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, type: OrderDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Get(':id')
  async getOne(@Param('id') id: string, @AuthUser() user: User, @Query() query: SingleQueryDto<OrderDto>) {
    return this.ordersService.getOrder(id, query, user);
  }

  @ApiOperation({ summary: 'Create order (e.g. from checkout)' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @Post()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @AuthUser() user: User,
  ) {
    return this.ordersService.createOrder(createOrderDto, user);
  }

  @ApiOperation({ summary: 'Update order status (admin only)' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @Patch(':id/status')
  @MinUserLevel(EUserLevels.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: Pick<UpdateOrderDto, 'status'>,
    @AuthUser() user: User,
  ) {
    if (!dto?.status) {
      throw new BadRequestException('Status is required');
    }
    return this.ordersService.updateOrderStatus(id, dto.status, user);
  }
}
