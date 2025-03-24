import { Module } from '@nestjs/common'

import { TelegramService } from '../../libs/telegram/telegram.service'

import { PasswordRecoveryResolver } from './password-recovery.resolver'
import { PasswordRecoveryService } from './password-recovery.service'

@Module({
	providers: [
		PasswordRecoveryResolver,
		PasswordRecoveryService,
		TelegramService
	]
})
export class PasswordRecoveryModule {}
