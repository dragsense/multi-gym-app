import { Injectable, ConsoleLogger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerService extends ConsoleLogger {
  private logDir = path.join(process.cwd(), 'logs');
  private errorFile = path.join(this.logDir, `error-${this.getDateString()}.log`);

  constructor(context?: string) {
    super(context || 'Unknown');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private writeToFile(message: string, isError: boolean = false) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}`;
    
    // Only write errors to file (keep last 500 errors)
    if (isError) {
      this.writeToRotatingFile(this.errorFile, logLine, 500);
    }
  }

  private writeToRotatingFile(filePath: string, logLine: string, maxLines: number) {
    try {
      let lines: string[] = [];
      
      // Read existing lines if file exists
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        lines = content.split('\n').filter(line => line.trim());
      }

      // Add new log line
      lines.push(logLine);

      // Keep only last N lines
      if (lines.length > maxLines) {
        lines = lines.slice(-maxLines);
      }

      // Write back to file
      fs.writeFileSync(filePath, lines.join('\n') + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  log(message: string) {
    super.log(message);
    // Don't write regular logs to file, only console
  }

  error(message: string, trace?: string) {
    super.error(message, trace);
    // Only write errors to file with separator
    const separator = '\n' + '='.repeat(80);
    const context = this.context || 'App';
    const fullMessage = `[ERROR] [${context}] ${message}${trace ? `\n${trace}` : ''}${separator}`;
    this.writeToFile(fullMessage, true);
  }

  warn(message: string) {
    super.warn(message);
    // Don't write warnings to file, only console
  }

  debug(message: string) {
    super.debug(message);
    // Don't write debug to file, only console
  }

  // Additional custom methods for activity logging
  logActivity(action: string, module: string, userId?: string, metadata?: any) {
    const message = `${action} in ${module}${userId ? ` by user ${userId}` : ''}${metadata ? ` - ${JSON.stringify(metadata)}` : ''}`;
    this.log(message);
  }

  logApiRequest(method: string, url: string, statusCode: number, responseTime: number, userId?: string) {
    const message = `${method} ${url} - ${statusCode} (${responseTime}ms)${userId ? ` [User: ${userId}]` : ''}`;
    this.log(message);
  }

  logApiError(method: string, url: string, error: Error, userId?: string) {
    const message = `${method} ${url} - ${error.message}${userId ? ` [User: ${userId}]` : ''}`;
    this.error(message, error.stack);
  }
}

