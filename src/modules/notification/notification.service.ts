import { Injectable } from '@nestjs/common'

import {
	NotificationType,
	type SponsorshipPlan,
	TokenType,
	type User
} from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { generateToken } from '@/src/shared/utils/generate-token.util'

import { ChangeNotificationsSettingsInput } from './inputs/change-notifications-settings.input'

@Injectable()
export class NotificationService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async findUnreadCount(user: User) {
		const count = await this.prismaService.notification.count({
			where: {
				isRead: false,
				userId: user.id
			}
		})

		return count
	}

	public async findByUser(user: User) {
		await this.prismaService.notification.updateMany({
			where: {
				isRead: false,
				userId: user.id
			},
			data: {
				isRead: true
			}
		})

		const notifications = await this.prismaService.notification.findMany({
			where: {
				userId: user.id
			},
			orderBy: {
				createdAt: 'desc'
			}
		})

		return notifications
	}

	public async createStreamStart(userId: string, channel: User) {
		const notification = await this.prismaService.notification.create({
			data: {
				message: `<b className='font-medium'>Не Пропустіть!</b>
				<p>Приєднуйтесь до стріму на каналі <a href='/${channel.username}' 
				className='font-semibold'>${channel.displayName} </a>.</p>`,
				type: NotificationType.STREAM_START,
				user: {
					connect: {
						id: userId
					}
				}
			}
		})

		return notification
	}

	public async createNewFollowing(userId: string, follower: User) {
		const notification = await this.prismaService.notification.create({
			data: {
				message: `<b className='font-medium'>У вас новий підписник!</b>
				<p>Це користувач <a href='/${follower.username}'
				className='font-semibold'> ${follower.displayName} </a>.</p>`,
				type: NotificationType.NEW_FOLLOWER,
				user: {
					connect: {
						id: userId
					}
				}
			}
		})

		return notification
	}

	public async createNewSponsorship(
		userId: string,
		plan: SponsorshipPlan,
		sponsor: User
	) {
		const notification = await this.prismaService.notification.create({
			data: {
				message: `<b className='font-medium'>У вас нове спонсорство!</b>
				<p>Користувач <a href='/${sponsor.username}'
				className='font-semibold'>${sponsor.displayName}</a> став вашим
				спонсором, вибравши план <strong>${plan.title}</strong>.</p>`,
				type: NotificationType.NEW_SPONSORSHIP,
				user: {
					connect: {
						id: userId
					}
				}
			}
		})

		return notification
	}

	public async changeSettings(
		user: User,
		input: ChangeNotificationsSettingsInput
	) {
		const { siteNotifications, telegramNotifications } = input

		const notificationSettings =
			await this.prismaService.notificationSettings.upsert({
				where: {
					userId: user.id
				},
				create: {
					siteNotifications,
					telegramNotifications,
					user: {
						connect: {
							id: user.id
						}
					}
				},
				update: {
					siteNotifications,
					telegramNotifications
				},
				include: {
					user: true
				}
			})

		if (
			notificationSettings.telegramNotifications &&
			!notificationSettings.user.telegramId
		) {
			const telegramAuthToken = await generateToken(
				this.prismaService,
				user,
				TokenType.TELEGRAM_AUTH
			)

			return {
				notificationSettings,
				telegramAuthToken: telegramAuthToken.token
			}
		}

		if (
			!notificationSettings.telegramNotifications &&
			notificationSettings.user.telegramId
		) {
			await this.prismaService.user.update({
				where: {
					id: user.id
				},
				data: {
					telegramId: null
				}
			})

			return { notificationSettings }
		}

		return { notificationSettings }
	}
}
