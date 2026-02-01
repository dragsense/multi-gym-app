import { SetMetadata, CustomDecorator } from '@nestjs/common';

export const SKIP_BUSINESS_CHECK_KEY = 'skipBusinessCheck';
export const SkipBusinessCheck = (): CustomDecorator<string> => SetMetadata(SKIP_BUSINESS_CHECK_KEY, true);
