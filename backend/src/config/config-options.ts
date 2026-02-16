import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ConfigModuleOptions } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { EnvironmentVariables } from './dtos/config.dto';

dotenv.config({ path: '.env' });

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}

const configOptions: ConfigModuleOptions = {
  envFilePath: ['.env'],
  isGlobal: true,
  validate,
  cache: true,
};

export default configOptions;
