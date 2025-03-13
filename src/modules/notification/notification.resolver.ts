import { Resolver } from '@nestjs/graphql'

import { NotificationService } from './notification.service'

@Resolver('Notification')
export class NotificationResolver {
	public constructor(
		private readonly notificationService: NotificationService
	) {}
}
