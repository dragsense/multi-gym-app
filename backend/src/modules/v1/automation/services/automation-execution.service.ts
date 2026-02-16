import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { Automation } from '../entities/automation.entity';
import { EmailTemplate } from '../../cms/entities/email-template.entity';
import { TemplateRendererService } from '../../cms/services/template-renderer.service';
import { RequestContext } from '@/common/context/request-context';

export interface AutomationContext {
  [key: string]: any;
  user?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  member?: {
    id?: string;
    user?: {
      id?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
    };
  };
  billing?: {
    id?: string;
    amount?: number;
    issueDate?: Date;
    dueDate?: Date;
  };
  checkin?: {
    id?: string;
    checkInTime?: Date;
    checkOutTime?: Date;
    location?: {
      id?: string;
      name?: string;
    };
  };
  membership?: {
    id?: string;
    name?: string;
    startDate?: Date | null;
  };
}

@Injectable()
export class AutomationExecutionService {
  private readonly logger = new Logger(AutomationExecutionService.name);
  private readonly appConfig: any;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly templateRendererService: TemplateRendererService,
  ) {
    this.appConfig = this.configService.get('app') || {};
  }

  /**
   * Execute an automation by sending email
   */
  async executeAutomation(
    automation: Automation,
    context: AutomationContext,
  ): Promise<void> {
    try {
      if (!automation.emailTemplate) {
        this.logger.warn(
          `Automation ${automation.id} has no email template configured`,
        );
        return;
      }

      // Get recipient email from context
      const recipientEmail = this.getRecipientEmail(context);
      if (!recipientEmail) {
        this.logger.warn(
          `No recipient email found for automation ${automation.id}`,
        );
        return;
      }

      // Prepare variables for template rendering
      const variables = this.prepareTemplateVariables(context);

      // Render email template
      const renderedTemplate = this.templateRendererService.renderEmailTemplate(
        {
          content: automation.emailTemplate.content,
          subject: automation.emailTemplate.subject,
        },
        variables,
      );

      // Convert PUCK content to HTML (pass variables for Variable component rendering)
      const puckHtml = this.renderPuckToHtml(renderedTemplate.content, variables);

      // Wrap in email template
      const htmlContent = this.wrapInEmailTemplate(puckHtml, renderedTemplate.subject);

      // Send email
      await this.mailerService.sendMail({
        to: recipientEmail,
        from: this.configService.get('MAIL_FROM') || this.appConfig.mailer?.from,
        subject: renderedTemplate.subject,
        html: htmlContent,
        text: this.extractTextFromHtml(puckHtml),
      });

      this.logger.log(
        `Automation ${automation.id} executed successfully for ${recipientEmail}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to execute automation ${automation.id}:`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  /**
   * Get recipient email from context
   */
  private getRecipientEmail(context: AutomationContext): string | null {
    // Try member user email first
    if (context.member?.user?.email) {
      return context.member.user.email;
    }

    // Try user email
    if (context.user?.email) {
      return context.user.email;
    }

    return null;
  }

  /**
   * Prepare template variables from context
   */
  private prepareTemplateVariables(
    context: AutomationContext,
  ): Record<string, any> {
    const variables: Record<string, any> = {
      appName: this.appConfig.name || 'App',
      appUrl: this.appConfig.appUrl || 'http://localhost:3000',
      loginUrl: `${this.appConfig.appUrl || 'http://localhost:3000'}/login`,
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString(),
    };

    // Add user variables
    if (context.user) {
      variables.user = {
        email: context.user.email,
        firstName: context.user.firstName,
        lastName: context.user.lastName,
        fullName: `${context.user.firstName || ''} ${context.user.lastName || ''}`.trim(),
      };
    }

    // Add member variables
    if (context.member) {
      variables.member = {
        id: context.member.id,
        user: context.member.user
          ? {
            email: context.member.user.email,
            firstName: context.member.user.firstName,
            lastName: context.member.user.lastName,
            fullName: `${context.member.user.firstName || ''} ${context.member.user.lastName || ''}`.trim(),
          }
          : undefined,
      };
    }

    // Add billing variables
    if (context.billing) {
      variables.billing = {
        id: context.billing.id,
        amount: context.billing.amount,
        issueDate: context.billing.issueDate
          ? new Date(context.billing.issueDate).toLocaleDateString()
          : undefined,
        dueDate: context.billing.dueDate
          ? new Date(context.billing.dueDate).toLocaleDateString()
          : undefined,
      };
    }

    // Add checkin variables
    if (context.checkin) {
      variables.checkin = {
        id: context.checkin.id,
        checkInTime: context.checkin.checkInTime
          ? new Date(context.checkin.checkInTime).toLocaleString()
          : undefined,
        checkOutTime: context.checkin.checkOutTime
          ? new Date(context.checkin.checkOutTime).toLocaleString()
          : undefined,
        location: context.checkin.location?.name,
      };
    }

    // Add membership variables
    if (context.membership) {
      variables.membership = {
        id: context.membership.id,
        name: context.membership.name,
        startDate: context.membership.startDate
          ? new Date(context.membership.startDate).toLocaleDateString()
          : undefined,
      };
    }

    return variables;
  }

  /**
   * Render PUCK content to HTML
   * This is a basic implementation - can be enhanced based on PUCK structure
   */
  private renderPuckToHtml(puckContent: any, variables: Record<string, any> = {}): string {
    if (!puckContent) {
      return '<p>No content available</p>';
    }

    // If content is already a string (HTML), return it
    if (typeof puckContent === 'string') {
      return puckContent;
    }

    // If content is an object with PUCK structure
    if (puckContent && typeof puckContent === 'object') {
      // Check if it's a PUCK root structure
      if (puckContent.root && Array.isArray(puckContent.root)) {
        return this.renderPuckRoot(puckContent.root, variables);
      }

      // Check if it's an array directly
      if (Array.isArray(puckContent)) {
        return this.renderPuckRoot(puckContent, variables);
      }

      // Try to extract HTML from common PUCK fields
      if (puckContent.html) {
        return puckContent.html;
      }

      if (puckContent.content) {
        return this.renderPuckToHtml(puckContent.content, variables);
      }
    }

    // Fallback: wrap in a simple HTML structure
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          <div>${JSON.stringify(puckContent)}</div>
        </body>
      </html>
    `;
  }

  /**
   * Render PUCK root array to HTML
   */
  private renderPuckRoot(root: any[], variables: Record<string, any> = {}): string {
    const htmlParts: string[] = [];

    for (const item of root) {
      if (!item || typeof item !== 'object') continue;

      const props = item.props || {};
      const type = item.type || 'div';

      // Render based on component type
      switch (type) {
        case 'Heading':
          const level = props.level || 1;
          const text = props.text || '';
          htmlParts.push(`<h${level}>${this.escapeHtml(text)}</h${level}>`);
          break;

        case 'Text':
          const content = props.text || '';
          htmlParts.push(`<p>${this.escapeHtml(content)}</p>`);
          break;

        case 'Paragraph':
          const paragraphText = props.text || '';
          htmlParts.push(`<p>${this.escapeHtml(paragraphText)}</p>`);
          break;

        case 'Button':
          const buttonText = props.text || 'Click here';
          const buttonUrl = props.url || '#';
          htmlParts.push(
            `<a href="${this.escapeHtml(buttonUrl)}" style="display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 4px; margin: 10px 0;">${this.escapeHtml(buttonText)}</a>`,
          );
          break;

        case 'Html':
          const htmlContent = props.html || '';
          htmlParts.push(htmlContent);
          break;

        case 'Variable':
          // Handle Variable component - look up the value from variables
          const variablePath = props.variable || '';
          const variableValue = this.getNestedValue(variables, variablePath);
          const displayValue = variableValue !== undefined && variableValue !== null
            ? String(variableValue)
            : props.label || `{{${variablePath}}}`; // Fall back to label or show placeholder
          htmlParts.push(`<span>${this.escapeHtml(displayValue)}</span>`);
          break;

        default:
          // Generic component rendering
          if (item.children && Array.isArray(item.children)) {
            const childrenHtml = this.renderPuckRoot(item.children, variables);
            htmlParts.push(`<div>${childrenHtml}</div>`);
          } else if (props.text) {
            htmlParts.push(`<div>${this.escapeHtml(props.text)}</div>`);
          }
          break;
      }
    }

    return htmlParts.join('\n');
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    if (!path) return undefined;
    return path.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined ? current[prop] : undefined;
    }, obj);
  }

  /**
   * Extract plain text from HTML
   */
  private extractTextFromHtml(html: string): string {
    // Remove HTML tags and decode entities
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .trim();
  }

  /**
   * Wrap PUCK HTML content in a proper email template
   */
  private wrapInEmailTemplate(content: string, subject: string): string {
    const appName = this.appConfig.name || 'App';
    const appUrl = this.appConfig.appUrl || 'http://localhost:3000';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(subject)}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: #ffffff;
            padding: 40px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .content {
            color: #333333;
            font-size: 15px;
            margin-bottom: 30px;
        }
        .footer {
            border-top: 1px solid #e0e0e0;
            padding-top: 24px;
            margin-top: 32px;
            text-align: center;
            color: #666666;
            font-size: 13px;
        }
        .link {
            color: #1a1a1a;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.escapeHtml(appName)}. All rights reserved.</p>
            <p style="margin-top: 8px;">
                <a href="${this.escapeHtml(appUrl)}" class="link" style="color: #666666;">Visit our website</a>
            </p>
        </div>
    </div>
</body>
</html>`;
  }
}
