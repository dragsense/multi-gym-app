import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplateRendererService {
  /**
   * Replace dynamic variables in a string
   * Supports nested object notation like user.email, user.firstName
   */
  replaceVariables(
    content: string,
    variables: Record<string, any>,
  ): string {
    let result = content;

    // Replace variables in format {{variable.path}}
    const variableRegex = /\{\{([^}]+)\}\}/g;
    result = result.replace(variableRegex, (match, path) => {
      const value = this.getNestedValue(variables, path.trim());
      return value !== undefined && value !== null ? String(value) : match;
    });

    return result;
  }

  /**
   * Replace variables in PUCK content structure
   */
  replaceVariablesInPuckContent(
    content: any,
    variables: Record<string, any>,
  ): any {
    if (typeof content === 'string') {
      return this.replaceVariables(content, variables);
    }

    if (Array.isArray(content)) {
      return content.map((item) =>
        this.replaceVariablesInPuckContent(item, variables),
      );
    }

    if (content && typeof content === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(content)) {
        result[key] = this.replaceVariablesInPuckContent(value, variables);
      }
      return result;
    }

    return content;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined ? current[prop] : undefined;
    }, obj);
  }

  /**
   * Render email template with variables
   */
  renderEmailTemplate(
    template: { content: any; subject: string },
    variables: Record<string, any>,
  ): { content: any; subject: string } {
    return {
      content: this.replaceVariablesInPuckContent(template.content, variables),
      subject: this.replaceVariables(template.subject, variables),
    };
  }
}
