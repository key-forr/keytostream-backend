import { Module } from '@nestjs/common'

import { PasswordRecoveryResolver } from './password-recovery.resolver'
import { PasswordRecoveryService } from './password-recovery.service'

@Module({
	providers: [PasswordRecoveryResolver, PasswordRecoveryService]
})
export class PasswordRecoveryModule {}
