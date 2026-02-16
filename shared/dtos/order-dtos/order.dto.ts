import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  ArrayMinSize,
  ValidateNested,
  ValidateIf,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OmitType, PartialType } from '../../lib/dto-type-adapter';
import { Type, Transform } from 'class-transformer';
import { PaginationMetaDto } from '../common/pagination.dto';
import { ListQueryDto } from '../common/list-query.dto';
import { FieldType, FieldOptions } from '../../decorators/field.decorator';
import { EOrderStatus } from '../../enums/order.enum';
import { EPaymentPreference } from '../../enums/membership.enum';
import { IOrder } from '../../interfaces/order.interface';
import { UserDto } from '../user-dtos/user.dto';
import {
  CreateOrderLineItemDto,
  OrderLineItemDto,
} from './order-line-item.dto';
import { Equals } from '../../decorators/crud.dto.decorators';
import { BillingDto } from '../billing-dtos/billing.dto';
import { OrderHistoryDto } from './order-history.dto';

export class CreateOrderDto {
  @ApiProperty({
    example: 'Product order - T-Shirt, Water Bottle',
    description: 'Order title',
  })
  @IsString()
  @IsNotEmpty()
  @FieldType('text', true)
  title: string;

  @ApiPropertyOptional({
    example: 'Store purchase',
    description: 'Order description',
  })
  @IsOptional()
  @IsString()
  @FieldType('textarea', false)
  description?: string;

  @ApiProperty({ type: () => UserDto, description: 'Buyer (user who placed the order)' })
  @IsNotEmpty({ message: 'Buyer user is required' })
  @ValidateNested()
  @Type(() => UserDto)
  @FieldType('nested', true, UserDto)
  buyerUser: UserDto;

  @ApiProperty({
    type: [CreateOrderLineItemDto],
    description: 'Order line items',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one line item is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderLineItemDto)
  @FieldType('nestedArray', true, CreateOrderLineItemDto)
  lineItems: CreateOrderLineItemDto[];

  @ApiPropertyOptional({
    example: 'pm_xxx',
    description: 'Stripe payment method ID',
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    example: 'pi_xxx',
    description: 'Stripe payment intent ID',
  })
  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  @ApiPropertyOptional({ description: 'Shipping Address Line 1' })
  @IsOptional()
  @IsString()
  @FieldType('text', false)
  shippingAddressLine1?: string;

  @ApiPropertyOptional({ description: 'Shipping Address Line 2' })
  @IsOptional()
  @IsString()
  @FieldType('text', false)
  shippingAddressLine2?: string;

  @ApiPropertyOptional({ description: 'Shipping City' })
  @IsOptional()
  @IsString()
  @FieldType('text', false)
  shippingCity?: string;

  @ApiPropertyOptional({ description: 'Shipping State/Province' })
  @IsOptional()
  @IsString()
  @FieldType('text', false)
  shippingState?: string;

  @ApiPropertyOptional({ description: 'Shipping Postal Code' })
  @IsOptional()
  @IsString()
  @FieldType('text', false)
  shippingZip?: string;

  @ApiPropertyOptional({ description: 'Shipping Country' })
  @IsOptional()
  @IsString()
  @FieldType('text', false)
  shippingCountry?: string;
}

export class UpdateOrderDto extends PartialType(
  OmitType(CreateOrderDto, ['lineItems', 'buyerUser']),
) {
  @ApiPropertyOptional({ enum: EOrderStatus, description: 'Order status' })
  @IsOptional()
  @IsEnum(EOrderStatus)
  status?: EOrderStatus;
}

export class OrderListDto extends ListQueryDto<IOrder> {
  @ApiPropertyOptional({ enum: EOrderStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(EOrderStatus)
  @Equals()
  @FieldType('select', false)
  @FieldOptions([
    { label: 'Pending', value: EOrderStatus.PENDING },
    { label: 'Shipped', value: EOrderStatus.SHIPPED },
    { label: 'Fulfilled', value: EOrderStatus.FULFILLED },
    { label: 'Cancelled', value: EOrderStatus.CANCELLED },
    { label: 'Refunded', value: EOrderStatus.REFUNDED },
  ])
  status?: EOrderStatus;
}

export class OrderDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: EOrderStatus })
  @IsOptional()
  @IsEnum(EOrderStatus)
  status?: EOrderStatus;

  @ApiProperty({ type: () => UserDto, description: 'Buyer' })
  @ValidateNested()
  @Type(() => UserDto)
  buyerUser: UserDto;

  @ApiPropertyOptional({ example: 59.98, description: 'Total amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({ type: [OrderLineItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderLineItemDto)
  lineItems?: OrderLineItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingAddressLine1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingAddressLine2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingCity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingState?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingZip?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingCountry?: string;

  @ApiPropertyOptional({ type: () => BillingDto, description: 'Associated billing/invoice' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BillingDto)
  billing?: BillingDto;

  @ApiPropertyOptional({ type: [OrderHistoryDto], description: 'Order status history timeline' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderHistoryDto)
  history?: OrderHistoryDto[];

  @ApiPropertyOptional()
  @IsOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  updatedAt?: Date;
}

export class OrderPaginatedDto {
  @ApiProperty({ type: [OrderDto] })
  data: OrderDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

/** Checkout: create order from current cart */
export class CheckoutDto {
  @ApiPropertyOptional({
    example: 'Order - T-Shirt, Bottle',
    description: 'Order title (defaults to generated from cart)',
  })
  @IsOptional()
  @IsString()
  @FieldType('text', false)
  title?: string;

  @ApiProperty({
    enum: EPaymentPreference,
    example: EPaymentPreference.CASH,
    description: 'Payment preference: CASH (pay at facility) or ONLINE (card)',
  })
  @IsEnum(EPaymentPreference)
  @FieldType('radio', true)
  @FieldOptions([
    { value: EPaymentPreference.CASH, label: 'Cash' },
    { value: EPaymentPreference.ONLINE, label: 'Online' },
  ])
  paymentPreference: EPaymentPreference;

  @ApiPropertyOptional({
    example: 'pm_xxx',
    description: 'Stripe payment method ID (optional - payment is processed separately via billing payment intent API)',
  })
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    description: 'Save the card for future use',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  saveForFutureUse?: boolean;

  @ApiPropertyOptional({ description: 'Set the card as default for future payments', default: false })
  @IsOptional()
  @IsBoolean()
  setAsDefault?: boolean;

  @ApiProperty({ description: 'Shipping Address Line 1' })
  @IsNotEmpty({ message: 'Address is required' })
  @IsString()
  @FieldType('text', true)
  shippingAddressLine1: string;

  @ApiPropertyOptional({ description: 'Shipping Address Line 2' })
  @IsOptional()
  @IsString()
  @FieldType('text', false)
  shippingAddressLine2?: string;

  @ApiProperty({ description: 'Shipping City' })
  @IsNotEmpty({ message: 'City is required' })
  @IsString()
  @FieldType('text', true)
  shippingCity: string;

  @ApiPropertyOptional({ description: 'Shipping State/Province' })
  @IsOptional()
  @IsString()
  @FieldType('text', false)
  shippingState?: string;

  @ApiProperty({ description: 'Shipping Postal Code' })
  @IsNotEmpty({ message: 'Zip code is required' })
  @IsString()
  @FieldType('text', true)
  shippingZip: string;

  @ApiProperty({ description: 'Shipping Country' })
  @IsNotEmpty({ message: 'Country is required' })
  @IsString()
  @FieldType('text', true)
  shippingCountry: string;
}
