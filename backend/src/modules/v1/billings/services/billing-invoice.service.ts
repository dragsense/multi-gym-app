import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ConfigService } from '@nestjs/config';
const PDFDocument = require('pdfkit');

import { Billing } from '../entities/billing.entity';
import { BillingHistory } from '../entities/billing-history.entity';
import { EBillingStatus } from '@shared/enums/billing.enum';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { BillingHistoryService } from './billing-history.service';
import { UserSettingsService } from '../../user-settings/user-settings.service';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@shared/lib/format.utils';
import type { IUserSettings } from '@shared/interfaces/settings.interface';
import { EntityRouterService } from '@/common/database/entity-router.service';

interface AppConfig {
  name?: string;
  appUrl?: string;
}

@Injectable()
export class BillingInvoiceService {
  private readonly appConfig: AppConfig;

  constructor(
    private readonly entityRouterService: EntityRouterService,
    private readonly configService: ConfigService,
    private readonly billingHistoryService: BillingHistoryService,
    private readonly userSettingsService: UserSettingsService,
  ) {
    this.appConfig = this.configService.get<AppConfig>('app') || {};
  }

  private async getBillingStatus(
    billingId: string,
  ): Promise<{ status: EBillingStatus | null; paidAt?: Date | null }> {
    const billingHistoryRepo = this.entityRouterService.getRepository<BillingHistory>(BillingHistory);
    const lastHistory = await billingHistoryRepo.findOne({
      where: { billing: { id: billingId } },
      order: { createdAt: 'DESC' },
    });

    if (!lastHistory) {
      return { status: null, paidAt: null };
    }

    let paidAt: Date | null = null;
    if (lastHistory.status === EBillingStatus.PAID) {
      paidAt = lastHistory.attemptedAt ?? lastHistory.createdAt;
    }

    return {
      status: lastHistory.status,
      paidAt,
    };
  }

  private buildInvoiceHtml(options: {
    billing: Billing;
    status: EBillingStatus | null;
    paidAt?: Date | null;
    history?: BillingHistory[];
    settings?: IUserSettings;
  }): string {
    const { billing, status, paidAt, history, settings } = options;

    const appName: string = this.appConfig?.name || 'Company';
    const appUrl: string = this.appConfig?.appUrl || 'http://localhost:3000';
    const logoUrl = `${appUrl.replace(/\/$/, '')}/logo.png`;

    const issueDate = formatDate(billing.issueDate, settings);
    const dueDate = formatDate(billing.dueDate, settings);
    const paidAtLabel = paidAt ? formatDate(paidAt, settings) : null;

    const fmtCurrency = (amount: number) =>
      formatCurrency(
        amount,
        settings?.currency?.defaultCurrency,
        undefined,
        2,
        2,
        settings,
      );

    const amountFormatted = fmtCurrency(billing.amount);
    const statusLabel = status
      ? status.replace('_', ' ').toUpperCase()
      : 'PENDING';

    const statusColor =
      status === EBillingStatus.PAID
        ? '#16a34a'
        : status === EBillingStatus.FAILED
          ? '#dc2626'
          : status === EBillingStatus.OVERDUE
            ? '#ea580c'
            : '#6b7280';

    const lineItemsHtml =
      billing.lineItems && billing.lineItems.length > 0
        ? billing.lineItems
            .map(
              (item) => `
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">${item.description || '-'}</td>
            <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;text-align:center;">${item.quantity || 0}</td>
            <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;text-align:right;">${fmtCurrency(item.unitPrice || 0)}</td>
            <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:500;">${fmtCurrency((item.quantity || 0) * (item.unitPrice || 0))}</td>
          </tr>`,
            )
            .join('')
        : '<tr><td colspan="4" style="padding:20px 0;text-align:center;color:#94a3b8;">No line items</td></tr>';

    const historyHtml =
      history && history.length > 0
        ? `
      <div style="margin-top:32px;">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:12px;">Payment History</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px 12px;text-align:left;font-weight:500;color:#64748b;border-bottom:1px solid #e2e8f0;">Date</th>
              <th style="padding:10px 12px;text-align:left;font-weight:500;color:#64748b;border-bottom:1px solid #e2e8f0;">Status</th>
              <th style="padding:10px 12px;text-align:left;font-weight:500;color:#64748b;border-bottom:1px solid #e2e8f0;">Note</th>
              <th style="padding:10px 12px;text-align:left;font-weight:500;color:#64748b;border-bottom:1px solid #e2e8f0;">Card</th>
              <th style="padding:10px 12px;text-align:left;font-weight:500;color:#64748b;border-bottom:1px solid #e2e8f0;">Paid By</th>
            </tr>
          </thead>
          <tbody>
            ${history
              .map(
                (h) => `
              <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#475569;">${formatDateTime(h.attemptedAt ?? h.createdAt, settings)}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;"><span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;background:${h.status === EBillingStatus.PAID ? '#dcfce7' : h.status === EBillingStatus.FAILED ? '#fee2e2' : '#f1f5f9'};color:${h.status === EBillingStatus.PAID ? '#166534' : h.status === EBillingStatus.FAILED ? '#991b1b' : '#475569'};">${h.status.replace('_', ' ')}</span></td>
                <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;">${h.message || '-'}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;">${(h.metadata as any)?.cardInfo?.brand || '-'} ${(h.metadata as any)?.cardInfo?.last4 ? `- ${(h.metadata as any).cardInfo.last4}` : ''}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;">${h.paidBy || '-'}</td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice #${billing.id.slice(-8).toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.5;
      padding: 40px 20px;
    }
    .invoice {
        max-width: 100%;
      margin: 0 auto;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .invoice { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <!-- Header -->
    <div style="padding:32px 32px 24px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-start;">
      <div style="display:flex;align-items:center;gap:12px;">
        <img src="${logoUrl}" alt="${appName}" crossorigin="anonymous" style="width:36px;height:36px;border-radius:6px;object-fit:contain;background:#f1f5f9;" onerror="this.style.display='none'" />
        <span style="font-size:18px;font-weight:600;color:#0f172a;">${appName}</span>
      </div>
      <div style="text-align:right;">
        <div style="font-size:24px;font-weight:700;color:#0f172a;">INVOICE</div>
        <div style="font-size:13px;color:#64748b;margin-top:4px;">#${billing.invoiceRef || billing.id}</div>
      </div>
    </div>

    <!-- Info Section -->
    <div style="padding:24px 32px;display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;">
      <div>
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:6px;">Bill To</div>
        <div style="font-size:15px;font-weight:500;color:#0f172a;">${billing.recipientUser?.firstName || ''} ${billing.recipientUser?.lastName || ''}</div>
        ${billing.recipientUser?.email ? `<div style="font-size:13px;color:#64748b;margin-top:2px;">${billing.recipientUser.email}</div>` : ''}
      </div>
      <div style="text-align:right;">
        <div style="margin-bottom:8px;">
          <span style="font-size:12px;color:#64748b;">Issue Date:</span>
          <span style="font-size:13px;font-weight:500;color:#0f172a;margin-left:8px;">${issueDate}</span>
        </div>
        <div style="margin-bottom:8px;">
          <span style="font-size:12px;color:#64748b;">Due Date:</span>
          <span style="font-size:13px;font-weight:500;color:#0f172a;margin-left:8px;">${dueDate}</span>
        </div>
        ${paidAtLabel ? `<div><span style="font-size:12px;color:#64748b;">Paid:</span><span style="font-size:13px;font-weight:500;color:#16a34a;margin-left:8px;">${paidAtLabel}</span></div>` : ''}
      </div>
    </div>

    <!-- Status Badge -->
    <div style="padding:0 32px 24px;">
      <span style="display:inline-block;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:600;letter-spacing:0.03em;background:${statusColor}15;color:${statusColor};">${statusLabel}</span>
    </div>

    <!-- Title -->
    ${billing.title ? `<div style="padding:0 32px 16px;"><div style="font-size:16px;font-weight:600;color:#0f172a;">${billing.title}</div>${billing.description ? `<div style="font-size:13px;color:#64748b;margin-top:4px;">${billing.description}</div>` : ''}</div>` : ''}

    <!-- Line Items -->
    <div style="padding:0 32px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:12px 0;text-align:left;font-weight:500;color:#64748b;border-bottom:1px solid #e2e8f0;">Description</th>
            <th style="padding:12px 0;text-align:center;font-weight:500;color:#64748b;border-bottom:1px solid #e2e8f0;width:60px;">Qty</th>
            <th style="padding:12px 0;text-align:right;font-weight:500;color:#64748b;border-bottom:1px solid #e2e8f0;width:100px;">Price</th>
            <th style="padding:12px 0;text-align:right;font-weight:500;color:#64748b;border-bottom:1px solid #e2e8f0;width:100px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
        </tbody>
      </table>
    </div>

    <!-- Total -->
    <div style="padding:24px 32px;display:flex;justify-content:flex-end;">
      <div style="min-width:200px;">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:2px solid #0f172a;">
          <span style="font-size:14px;font-weight:600;color:#0f172a;">Total</span>
          <span style="font-size:18px;font-weight:700;color:#0f172a;">${amountFormatted}</span>
        </div>
      </div>
    </div>

    <!-- History -->
    <div style="padding:0 32px 32px;">
      ${historyHtml}
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#64748b;">
      <span>&copy; ${new Date().getFullYear()} ${appName}</span>
      ${appUrl ? `<a href="${appUrl}" style="color:#3b82f6;text-decoration:none;">${appUrl.replace(/^https?:\/\//, '')}</a>` : ''}
    </div>
  </div>
</body>
</html>`;
  }

  async getInvoiceHtmlForUser(id: string, currentUser: User): Promise<string> {
    const billingRepo = this.entityRouterService.getRepository<Billing>(Billing);
    const billing = await billingRepo.findOne({
      where: { id },
      relations: ['recipientUser', 'lineItems'],
    });

    if (!billing) {
      throw new NotFoundException('Billing not found');
    }

    const isAdmin =
      currentUser.level === (EUserLevels.PLATFORM_OWNER as number) || currentUser.level === (EUserLevels.ADMIN as number);
    const isOwner =
      billing.recipientUser?.id === currentUser.id ||
      billing.createdByUserId === currentUser.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'You are not authorized to download this invoice',
      );
    }

    const { status, paidAt } = await this.getBillingStatus(billing.id);
    const historyResult = await this.billingHistoryService.getAll(
      {},
      undefined,
      {
        beforeQuery: (query: SelectQueryBuilder<BillingHistory>) => {
          query.where('entity.billingId = :billingId', {
            billingId: billing.id,
          });
        },
      },
    );

    const history = historyResult || [];

    // Get user settings for formatting
    const settings = await this.userSettingsService.getUserSettings(
      billing.recipientUser?.id || currentUser.id,
    );

    return this.buildInvoiceHtml({
      billing,
      status,
      paidAt,
      history,
      settings,
    });
  }

  async getInvoicePdfForUser(
    id: string,
    currentUser: User,
  ): Promise<{ buffer: Buffer; invoiceRef: string }> {
    const billingRepo = this.entityRouterService.getRepository<Billing>(Billing);
    const billing = await billingRepo.findOne({
      where: { id },
      relations: ['recipientUser', 'lineItems'],
    });

    if (!billing) {
      throw new NotFoundException('Billing not found');
    }

    const isSuperAdmin = currentUser.level === (EUserLevels.PLATFORM_OWNER as number) ||
      currentUser.level === (EUserLevels.SUPER_ADMIN as number) || currentUser.level === (EUserLevels.ADMIN as number);
    const isOwner =
      billing.recipientUser?.id === currentUser.id ||
      billing.createdByUserId === currentUser.id;

    if (!isSuperAdmin && !isOwner) {
      throw new ForbiddenException(
        'You are not authorized to download this invoice',
      );
    }

    const { status, paidAt } = await this.getBillingStatus(billing.id);
    const historyResult = await this.billingHistoryService.getAll(
      {},
      undefined,
      {
        beforeQuery: (query: SelectQueryBuilder<BillingHistory>) => {
          query.where('entity.billingId = :billingId', {
            billingId: billing.id,
          });
        },
      },
    );
    const history = historyResult || [];

    const settings = await this.userSettingsService.getUserSettings(
      billing.recipientUser?.id || currentUser.id,
    );

    const buffer = await this.buildInvoicePdf({
      billing,
      status,
      paidAt,
      history,
      settings,
    });

    return { buffer, invoiceRef: billing.invoiceRef };
  }

  private async buildInvoicePdf(options: {
    billing: Billing;
    status: EBillingStatus | null;
    paidAt?: Date | null;
    history?: BillingHistory[];
    settings?: IUserSettings;
  }): Promise<Buffer> {
    const { billing, status, paidAt, history, settings } = options;

    const appName: string = this.appConfig?.name || 'Company';
    const appUrl: string = this.appConfig?.appUrl || '';

    const fmtCurrency = (amount: number) =>
      formatCurrency(
        amount,
        settings?.currency?.defaultCurrency,
        undefined,
        2,
        2,
        settings,
      );

    // Colors matching HTML version
    const colors = {
      primary: '#0f172a',
      secondary: '#64748b',
      muted: '#94a3b8',
      border: '#e2e8f0',
      background: '#f8fafc',
      success: '#16a34a',
      error: '#dc2626',
      warning: '#ea580c',
    };

    const getStatusColor = (s: EBillingStatus | null) => {
      if (s === EBillingStatus.PAID) return colors.success;
      if (s === EBillingStatus.FAILED) return colors.error;
      if (s === EBillingStatus.OVERDUE) return colors.warning;
      return colors.secondary;
    };

    // Try to fetch logo
    const logoUrl = `${appUrl.replace(/\/$/, '')}/logo.png`;
    let logoBuffer: Buffer | null = null;
    try {
      const response = await fetch(logoUrl);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        logoBuffer = Buffer.from(arrayBuffer);
      }
    } catch {
      // Logo fetch failed, continue without logo
    }

    return new Promise((resolve, reject) => {
      /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100; // margins

      // Header section with logo
      let headerTextX = 50;
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 50, 45, { width: 36, height: 36 });
          headerTextX = 95;
        } catch {
          // Image failed, continue without logo
        }
      }
      doc.fontSize(18).fillColor(colors.primary).text(appName, headerTextX, 50);
      doc
        .fontSize(24)
        .fillColor(colors.primary)
        .text('INVOICE', 50, 50, { align: 'right' });
      doc
        .fontSize(11)
        .fillColor(colors.secondary)
        .text(`#${billing.invoiceRef || billing.id.slice(-8).toUpperCase()}`, {
          align: 'right',
        });

      doc.moveDown(2);

      // Divider line
      const headerY = doc.y;
      doc
        .moveTo(50, headerY)
        .lineTo(50 + pageWidth, headerY)
        .strokeColor(colors.border)
        .stroke();

      doc.moveDown(1.5);

      // Bill To and Dates section (two columns)
      const infoY = doc.y;

      // Left column - Bill To
      doc
        .fontSize(9)
        .fillColor(colors.secondary)
        .text('BILL TO', 50, infoY, { continued: false });
      doc
        .fontSize(13)
        .fillColor(colors.primary)
        .text(
          `${billing.recipientUser?.firstName || ''} ${billing.recipientUser?.lastName || ''}`.trim() ||
            'N/A',
          50,
          infoY + 18,
        );
      if (billing.recipientUser?.email) {
        doc
          .fontSize(11)
          .fillColor(colors.secondary)
          .text(billing.recipientUser.email, 50, infoY + 36);
      }

      // Right column - Dates
      const rightCol = 350;
      doc
        .fontSize(10)
        .fillColor(colors.secondary)
        .text('Issue Date:', rightCol, infoY);
      doc
        .fontSize(11)
        .fillColor(colors.primary)
        .text(formatDate(billing.issueDate, settings), rightCol + 80, infoY);

      doc
        .fontSize(10)
        .fillColor(colors.secondary)
        .text('Due Date:', rightCol, infoY + 18);
      doc
        .fontSize(11)
        .fillColor(colors.primary)
        .text(formatDate(billing.dueDate, settings), rightCol + 80, infoY + 18);

      if (paidAt) {
        doc
          .fontSize(10)
          .fillColor(colors.secondary)
          .text('Paid:', rightCol, infoY + 36);
        doc
          .fontSize(11)
          .fillColor(colors.success)
          .text(formatDate(paidAt, settings), rightCol + 80, infoY + 36);
      }

      doc.y = infoY + 70;

      // Status Badge
      const statusLabel = status
        ? status.replace('_', ' ').toUpperCase()
        : 'PENDING';
      const statusColor = getStatusColor(status);
      doc.fontSize(10).fillColor(statusColor).text(statusLabel, 50);

      doc.moveDown(1.5);

      // Title and Description
      if (billing.title) {
        doc.fontSize(14).fillColor(colors.primary).text(billing.title, 50);
        if (billing.description) {
          doc
            .fontSize(11)
            .fillColor(colors.secondary)
            .text(billing.description, 50);
        }
        doc.moveDown(1);
      }

      // Line Items Table
      const tableTop = doc.y;
      const colWidths = [220, 60, 90, 90];
      const headers = ['Description', 'Qty', 'Price', 'Amount'];

      // Table header background
      doc.rect(50, tableTop, pageWidth, 25).fillColor(colors.background).fill();

      // Table headers
      doc.fontSize(10).fillColor(colors.secondary);
      let xPos = 55;
      headers.forEach((header, i) => {
        const align = i === 0 ? 'left' : 'right';
        doc.text(header, xPos, tableTop + 8, { width: colWidths[i], align });
        xPos += colWidths[i];
      });

      // Header bottom border
      doc
        .moveTo(50, tableTop + 25)
        .lineTo(50 + pageWidth, tableTop + 25)
        .strokeColor(colors.border)
        .stroke();

      // Table rows
      let yPos = tableTop + 35;
      doc.fillColor(colors.primary);

      if (billing.lineItems && billing.lineItems.length > 0) {
        billing.lineItems.forEach((item) => {
          const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
          xPos = 55;

          doc.fontSize(11).text(item.description || '-', xPos, yPos, {
            width: colWidths[0],
          });
          xPos += colWidths[0];
          doc.text(String(item.quantity || 0), xPos, yPos, {
            width: colWidths[1],
            align: 'right',
          });
          xPos += colWidths[1];
          doc.text(fmtCurrency(item.unitPrice || 0), xPos, yPos, {
            width: colWidths[2],
            align: 'right',
          });
          xPos += colWidths[2];
          doc.text(fmtCurrency(lineTotal), xPos, yPos, {
            width: colWidths[3],
            align: 'right',
          });

          yPos += 25;

          // Row border
          doc
            .moveTo(50, yPos - 5)
            .lineTo(50 + pageWidth, yPos - 5)
            .strokeColor('#f1f5f9')
            .stroke();
        });
      } else {
        doc
          .fontSize(11)
          .fillColor(colors.muted)
          .text('No line items', 50, yPos, {
            width: pageWidth,
            align: 'center',
          });
        yPos += 25;
      }

      // Total section
      yPos += 15;
      doc
        .moveTo(350, yPos)
        .lineTo(50 + pageWidth, yPos)
        .strokeColor(colors.primary)
        .lineWidth(2)
        .stroke();
      doc.lineWidth(1);

      yPos += 10;
      doc.fontSize(12).fillColor(colors.primary).text('Total', 350, yPos);
      doc
        .fontSize(16)
        .fillColor(colors.primary)
        .text(fmtCurrency(billing.amount), 430, yPos - 2, {
          width: 115,
          align: 'right',
        });

      // Payment History
      if (history && history.length > 0) {
        yPos += 50;
        doc
          .fontSize(9)
          .fillColor(colors.secondary)
          .text('PAYMENT HISTORY', 50, yPos);
        yPos += 20;

        // History table header
        doc.rect(50, yPos, pageWidth, 22).fillColor(colors.background).fill();
        doc.fontSize(9).fillColor(colors.secondary);
        doc.text('Date', 55, yPos + 6, { width: 150 });
        doc.text('Status', 205, yPos + 6, { width: 100 });
        doc.text('Note', 305, yPos + 6, { width: 200 });

        yPos += 25;

        history.forEach((h) => {
          const hStatusColor =
            h.status === EBillingStatus.PAID
              ? colors.success
              : h.status === EBillingStatus.FAILED
                ? colors.error
                : colors.secondary;

          doc
            .fontSize(9)
            .fillColor(colors.secondary)
            .text(
              formatDateTime(h.attemptedAt ?? h.createdAt, settings),
              55,
              yPos,
              { width: 120 },
            );
          doc
            .fillColor(hStatusColor)
            .text(h.status.replace('_', ' '), 175, yPos, { width: 80 });
          doc
            .fillColor(colors.secondary)
            .text(h.message || '-', 255, yPos, { width: 150 });
          doc
            .fillColor(colors.secondary)
            .text(h.paidBy || '-', 405, yPos, { width: 145 });

          yPos += 18;
        });
      }

      // Footer - add some space then footer content
      doc.moveDown(3);
      const currentY: number = doc.y as number;
      const footerY = Math.max(currentY, (doc.page.height as number) - 80);

      // Only draw footer line if we have space
      if (footerY < doc.page.height - 30) {
        doc
          .moveTo(50, footerY)
          .lineTo(50 + pageWidth, footerY)
          .strokeColor(colors.border)
          .stroke();

        doc
          .fontSize(9)
          .fillColor(colors.secondary)
          .text(`© ${new Date().getFullYear()} ${appName}`, 50, footerY + 15, {
            continued: false,
            lineBreak: false,
          });

        if (appUrl) {
          doc
            .fillColor('#3b82f6')
            .text(
              appUrl.replace(/^https?:\/\//, ''),
              50 + pageWidth - 150,
              footerY + 15,
              { width: 150, align: 'right', lineBreak: false },
            );
        }
      }

      doc.end();
      /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    });
  }
}
