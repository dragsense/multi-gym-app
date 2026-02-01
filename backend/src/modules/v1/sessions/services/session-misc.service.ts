import {
  Injectable,
} from '@nestjs/common';
import { SessionBilling } from '../entities/session-billing.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { BillingsService } from '../../billings/billings.service';
import { EntityRouterService } from '@/common/database/entity-router.service';

@Injectable()
export class SessionMiscService {
  private readonly customLogger = new LoggerService(SessionMiscService.name);
  constructor(
    private readonly entityRouterService: EntityRouterService,
    private readonly billingsService: BillingsService,
  ){}


  async hasAnyPaidBillingForSession(sessionId: string): Promise<boolean> {
    const sessionBillingRepo = this.entityRouterService.getRepository<SessionBilling>(SessionBilling);
    const sessionBillings = await sessionBillingRepo.find({
    where: {
      session: { id: sessionId },
    },
    relations: ['billing']
    });
    
    if (!sessionBillings || sessionBillings.length === 0) {
      return false;
    }
    
    for (const sessionBilling of sessionBillings) {
       if (!sessionBilling.billing) continue;
        const { hasPaid } =
        await this.billingsService.checkBillingPayment(
           sessionBilling.billing.id,
        );
       if (hasPaid) {
         return true;
       }
      }
    return false;
  }

}
