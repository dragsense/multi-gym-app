import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailTemplateOptions {
  title: string;
  greeting?: string;
  content: string;
  actionButton?: {
    text: string;
    url: string;
  };
  footerNote?: string;
  appName?: string;
  appUrl?: string;
}

@Injectable()
export class EmailTemplateService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Generate professional HTML email template
   */
  generateHTML(options: EmailTemplateOptions): string {
    const appConfig = this.configService.get('app');
    const appName = options.appName || appConfig.name;
    const appUrl = options.appUrl || appConfig.appUrl;
    const greeting = options.greeting || 'Hello';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title} - ${appName}</title>
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
        .header { 
            text-align: left; 
            margin-bottom: 30px;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 20px;
        }
        .header-title {
            color: #1a1a1a;
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 8px 0;
        }
        .header-subtitle {
            color: #666666;
            font-size: 14px;
            margin: 0;
        }
        .content {
            color: #333333;
            font-size: 15px;
            margin-bottom: 30px;
        }
        .content p {
            margin: 0 0 16px 0;
        }
        .action-button-container {
            text-align: center;
            margin: 30px 0;
        }
        .action-button {
            display: inline-block;
            padding: 12px 32px;
            background-color: #1a1a1a;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            font-size: 15px;
            border: none;
        }
        .action-button:hover {
            background-color: #333333;
        }
        .footer {
            border-top: 1px solid #e0e0e0;
            padding-top: 24px;
            margin-top: 32px;
            text-align: center;
            color: #666666;
            font-size: 13px;
        }
        .footer-note {
            background-color: #f9f9f9;
            padding: 16px;
            border-radius: 4px;
            margin: 20px 0;
            border-left: 3px solid #d0d0d0;
            font-size: 13px;
            color: #666666;
        }
        .info-box {
            background-color: #f9f9f9;
            padding: 16px;
            border-radius: 4px;
            margin: 20px 0;
            border: 1px solid #e0e0e0;
        }
        .info-box code {
            background-color: #ffffff;
            padding: 4px 8px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            border: 1px solid #e0e0e0;
        }
        .link {
            color: #1a1a1a;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="header-title">${options.title}</h1>
            <p class="header-subtitle">${appName}</p>
        </div>
        
        <div class="content">
            <p>${greeting},</p>
            ${options.content}
        </div>

        ${options.actionButton ? `
        <div class="action-button-container">
            <a href="${options.actionButton.url}" class="action-button">${options.actionButton.text}</a>
        </div>
        ` : ''}

        ${options.footerNote ? `
        <div class="footer-note">
            ${options.footerNote}
        </div>
        ` : ''}

        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            <p style="margin-top: 8px;">
                <a href="${appUrl}" class="link" style="color: #666666;">Visit our website</a>
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate plain text email template
   */
  generateText(options: EmailTemplateOptions): string {
    const appConfig = this.configService.get('app');
    const appName = options.appName || appConfig.name;
    const greeting = options.greeting || 'Hello';

    let text = `${options.title}\n\n`;
    text += `${greeting},\n\n`;
    text += `${options.content.replace(/<[^>]*>/g, '').trim()}\n\n`;

    if (options.actionButton) {
      text += `${options.actionButton.text}: ${options.actionButton.url}\n\n`;
    }

    if (options.footerNote) {
      text += `${options.footerNote.replace(/<[^>]*>/g, '').trim()}\n\n`;
    }

    text += `\n---\n`;
    text += `© ${new Date().getFullYear()} ${appName}. All rights reserved.\n`;

    return text;
  }
}
