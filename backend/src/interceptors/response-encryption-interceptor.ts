import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../lib/encryption.service';

@Injectable()
export class ResponseEncryptionInterceptor implements NestInterceptor {
    constructor(
        private readonly configService: ConfigService,
        private readonly encryptionService: EncryptionService
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                try {


                    const response = context.switchToHttp().getResponse();
                    const request = context.switchToHttp().getRequest();
                    const url = request.url;




                    // Skip encryption for these endpoints
                    const skipEncryptionEndpoints: RegExp[] = [
                        /^\/api\/docs/,
                        /^\/api\/docs-json/,
                        /^\/api\/health/,
                        /^\/api\/swagger/,
                        /^\/api\/auth\/login/,
                        /^\/api\/auth\/logout/,
                        /^\/api\/auth\/logout-all/,
                        /^\/api\/auth\/register/,
                        /^\/api\/auth\/reset-password/,
                        /^\/api\/auth\/send-reset-link/,
                        /^\/api\/auth\/forgot-password/,
                        /^\/api\/auth\/verify-email/,
                        /^\/api\/auth\/resend-verification-email/,
                        /^\/api\/auth\/change-password/,
                        /^\/api\/csrf-token/,
                        /^\/api\/auth\/verify-otp/,
                        /^\/api\/auth\/refresh/,
                        /^\/api\/auth\/resend-otp/,
                        /^\/api\/billings\/list\/export$/,
                        /^\/api\/files\/\d+\/download$/,

                    ];


                    if (skipEncryptionEndpoints.some((pattern) => pattern.test(url)) || url === '/api') {
                        return data;
                    }

                    // Get encryption config
                    const encryptionConfig = this.configService.get('app.encryption');

                    // Validate encryption configuration
                    if (!encryptionConfig?.key || encryptionConfig.key.length < 32) {
                        throw new Error('ENCRYPTION_KEY environment variable must be at least 32 characters long');
                    }

                    // Encrypt the response data using the encryption service
                    const encryptedResponse = this.encryptionService.encryptResponse(data);

                    // Add security headers
                    response.setHeader('X-Content-Encrypted', 'true');
                    response.setHeader('X-Encryption-Algorithm', encryptionConfig.algorithm);
                    response.setHeader('X-Response-Timestamp', encryptedResponse.timestamp);

                    return encryptedResponse;
                } catch (error) {
                    throw new HttpException(
                        'Response encryption failed',
                        HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                }
            }),
        );
    }
}
