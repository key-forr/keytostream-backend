import { Resolver } from '@nestjs/graphql';
import { TransactionService } from './transaction.service';

@Resolver('Transaction')
export class TransactionResolver {
  constructor(private readonly transactionService: TransactionService) {}
}
