import {
  Injectable,
} from '@nestjs/common';
import { BillingsService } from '../billings.service';

@Injectable()
export class BillingMiscService {
  constructor(
    private readonly billingsService: BillingsService,
  ){}

  async hasAnyInvodiePaid(billingId: string): Promise<boolean> {
    const billingStatus = await this.billingsService.getBillingStatus(billingId);
    return true;
  }

}



 //------------------Sudo Code------------------------------ 
//  1. getBillings = [{}, {}]
//  2. checkSessionPayments = {
//    const Billings = this.getBillings();
//
//    if(sessionBllings?.length <= 0)
//      return false;
//
//    reutn SessionMiscService.some(
//      sesison billing => this.billingsService.checkBillingPayment(Billing.billing.id))
//    )
//  }



/*
1)Create function (f1)that will take sessionId   checkSessionPayments(sessionId)
2)Inside that function(f2) call another funcion that will take sesionId and return Billings in array
3)If billing lenght is 0 mean no billing made so f1 will return false (mean we can delete session)
4)If billing lenght>0   run SessionMiscService.some on each blling
         reutn SessionMiscService.some(
         sesison billing => this.billingsService.checkBillingPayment(Billing.billing.id))

*/