import { Module } from '@nestjs/common'

import { TotpResolver } from './totp.resolver'
import { TotpService } from './totp.service'

@Module({
	providers: [TotpResolver, TotpService]
})
export class TotpModule {}
