import { Field, ObjectType } from '@nestjs/graphql'

import type { NotificationSettings } from '@/prisma/generated'
import { UserModel } from '@/src/modules/auth/account/models/user.model'

@ObjectType()
export class NotificationSettingsModel implements NotificationSettings {
	@Field(() => String)
	public id: string

	@Field(() => Boolean)
	public siteNotifications: boolean

	@Field(() => Boolean)
	public telegramNotifications: boolean

	@Field(() => UserModel)
	public user: UserModel

	@Field(() => String)
	public userId: string

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}

@ObjectType()
export class ChangeNotificationsSettingsResponse {
	@Field(() => NotificationSettingsModel)
	public notificationSettings: NotificationSettingsModel

	@Field(() => String, { nullable: true })
	public telegramAuthToken?: string
}
