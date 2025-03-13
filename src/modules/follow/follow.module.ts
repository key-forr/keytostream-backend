import { Module } from '@nestjs/common'

import { NotificationService } from '../notification/notification.service'

import { FollowResolver } from './follow.resolver'
import { FollowService } from './follow.service'

@Module({
	providers: [FollowResolver, FollowService, NotificationService]
})
export class FollowModule {}
