import { Module } from '@nestjs/common';
import { PasswordRecoveryService } from './password-recovery.service';
import { PasswordRecoveryResolver } from './password-recovery.resolver';

@Module({
  providers: [PasswordRecoveryResolver, PasswordRecoveryService],
})
export class PasswordRecoveryModule {}
