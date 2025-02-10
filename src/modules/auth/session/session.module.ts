import { Module } from '@nestjs/common'

import { SessionResolver } from './session.resolver'
import { SessionService } from './session.service'

@Module({
	providers: [SessionResolver, SessionService]
})
export class SessionModule {}
