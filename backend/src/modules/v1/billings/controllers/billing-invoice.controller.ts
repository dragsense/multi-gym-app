import {
  Controller,
  Get,
  Header,
  Param,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { BillingInvoiceService } from '../services/billing-invoice.service';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';

@ApiBearerAuth('access-token')
@ApiTags('Billing Invoices')
@MinUserLevel(EUserLevels.MEMBER)
@Controller('billings')
export class BillingInvoiceController {
  constructor(private readonly billingInvoiceService: BillingInvoiceService) {}

  @ApiOperation({ summary: 'Download billing invoice HTML' })
  @ApiParam({ name: 'id', description: 'Billing ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns invoice HTML as a downloadable file',
  })
  @Get(':id/invoice-html')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="invoice.html"')
  async downloadInvoiceHtml(
    @Param('id') id: string,
    @AuthUser() currentUser: User,
  ): Promise<string> {
    return this.billingInvoiceService.getInvoiceHtmlForUser(id, currentUser);
  }

  @ApiOperation({ summary: 'Download billing invoice PDF' })
  @ApiParam({ name: 'id', description: 'Billing ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns invoice PDF as a downloadable file',
  })
  @Get(':id/invoice-pdf')
  async downloadInvoicePdf(
    @Param('id') id: string,
    @AuthUser() currentUser: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, invoiceRef } =
      await this.billingInvoiceService.getInvoicePdfForUser(id, currentUser);

    const filename = `${invoiceRef || 'invoice'}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }
}
