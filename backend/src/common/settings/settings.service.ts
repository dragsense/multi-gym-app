import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { CrudService } from '@/common/crud/crud.service';
import { Setting } from './entities/setting.entity';
import { ESettingType } from '@shared/enums/setting.enum';

@Injectable()
export class SettingsService extends CrudService<Setting> {
  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepository: Repository<Setting>,
    moduleRef: ModuleRef,
  ) {
    super(settingsRepository, moduleRef);
  }

  async getEntitySettings(entityId: string): Promise<Record<string, unknown>> {
    const repository = this.getRepository();
    const settings = await repository.find({
      where: { entityId },
    });

    const settingsObject: Record<string, any> = {};

    for (const setting of settings) {
      settingsObject[setting.key] = this.parseValue(
        setting.value,
        setting.type,
      );
    }

    return settingsObject;
  }

  async getSetting(entityId: string, key: string): Promise<any> {
    const repository = this.getRepository();
    const setting = await repository.findOne({
      where: { entityId, key },
    });

    if (!setting) {
      return null;
    }

    return this.parseValue(setting.value, setting.type);
  }

  async setSetting(
    entityId: string,
    key: string,
    value: any,
    type: ESettingType = ESettingType.STRING,
    description?: string,
  ): Promise<Setting> {
    const stringValue = this.stringifyValue(value, type);

    const repository = this.getRepository();
    const existingSetting = await repository.findOne({
      where: { entityId, key },
    });

    if (existingSetting) {
      const updated = await this.update(existingSetting.id, {
        value: stringValue,
        type,
        description,
      });
      return updated;
    }

    return this.create({
      entityId,
      key,
      value: stringValue,
      type,
      description,
      isPublic: false,
      isEditable: true,
    });
  }

  async setMultipleSettings(
    entityId: string,
    settings: Record<
      string,
      { value: any; type?: ESettingType; description?: string }
    >,
  ): Promise<Setting[]> {
    const results: Setting[] = [];

    for (const [key, config] of Object.entries(settings)) {
      const setting = await this.setSetting(
        entityId,
        key,
        config.value,
        config.type || ESettingType.STRING,
        config.description,
      );
      results.push(setting);
    }

    return results;
  }

  async deleteSetting(entityId: string, key: string): Promise<void> {
    const setting = await this.getSingle({
      entityId,
      key,
    });

    if (setting) await this.delete(setting.id, {});
  }

  /**
   * Save any object structure as settings
   * Automatically detects value types and creates appropriate settings
   */
  async saveSettings(
    entityId: string,
    data: Record<string, any>,
    prefix: string = '',
  ): Promise<Setting[]> {
    const settingsToCreate: Record<
      string,
      { value: any; type: ESettingType; description?: string }
    > = {};

    // Recursively process the object
    this.processObject(data, settingsToCreate, prefix);

    return this.setMultipleSettings(entityId, settingsToCreate);
  }

  /**
   * Recursively process an object to create settings
   */
  private processObject(
    obj: Record<string, any>,
    settingsToCreate: Record<
      string,
      { value: any; type: ESettingType; description?: string }
    >,
    prefix: string = '',
    parentKey: string = '',
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      const settingKey = prefix ? `${prefix}.${fullKey}` : fullKey;

      if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        // Recursively process nested objects
        this.processObject(value, settingsToCreate, prefix, fullKey);
      } else {
        // Create setting for this value
        const type = this.detectValueType(value);
        settingsToCreate[settingKey] = {
          value,
          type,
          description: `Setting: ${fullKey}`,
        };
      }
    }
  }

  /**
   * Automatically detect the appropriate setting type for a value
   */
  private detectValueType(value: any): ESettingType {
    if (typeof value === 'boolean') return ESettingType.BOOLEAN;
    if (typeof value === 'number') return ESettingType.NUMBER;
    if (Array.isArray(value)) return ESettingType.ARRAY;
    if (typeof value === 'object' && value !== null) return ESettingType.JSON;
    return ESettingType.STRING;
  }

  /**
   * Get settings as a structured object
   * Reconstructs the original object structure from flat settings
   */
  async getSettings(
    entityId: string,
    prefix?: string,
  ): Promise<Record<string, unknown>> {
    const allSettings = await this.getEntitySettings(entityId);
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(allSettings)) {
      // Skip if prefix doesn't match
      if (prefix && !key.startsWith(prefix + '.')) continue;

      // Remove prefix from key
      const cleanKey = prefix ? key.replace(prefix + '.', '') : key;

      // Build nested object structure
      this.setNestedValue(result, cleanKey, value);
    }

    return result;
  }

  /**
   * Helper method to set nested object values
   */
  private setNestedValue(
    obj: Record<string, unknown>,
    path: string,
    value: unknown,
  ): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
  }

  private parseValue(value: string, type: ESettingType): any {
    switch (type) {
      case ESettingType.NUMBER:
        return parseFloat(value);
      case ESettingType.BOOLEAN:
        return value === 'true';
      case ESettingType.JSON:
        return JSON.parse(value);
      case ESettingType.ARRAY:
        return JSON.parse(value);
      default:
        return value;
    }
  }

  private stringifyValue(value: any, type: ESettingType): string {
    switch (type) {
      case ESettingType.JSON:
      case ESettingType.ARRAY:
        return JSON.stringify(value);
      default:
        return String(value);
    }
  }
}
