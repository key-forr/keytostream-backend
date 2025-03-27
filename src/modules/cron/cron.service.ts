import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { PrismaService } from '@/src/core/prisma/prisma.service'

import { MailService } from '../libs/mail/mail.service'
import { StorageService } from '../libs/storage/storage.service'
import { TelegramService } from '../libs/telegram/telegram.service'
import { NotificationService } from '../notification/notification.service'

@Injectable()
export class CronService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly mailService: MailService,
		private readonly storageService: StorageService,
		private readonly telegramService: TelegramService,
		private readonly notificationService: NotificationService
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_1AM)
	public async deleteDeactivatedAccounts() {
		const sevenDaysAgo = new Date()
		sevenDaysAgo.setDate(sevenDaysAgo.getDay() - 7)
		//sevenDaysAgo.setSeconds(sevenDaysAgo.getSeconds() - 5)

		const deactivatedAccounts = await this.prismaService.user.findMany({
			where: {
				isDeactivated: true,
				deactivatedAt: {
					lte: sevenDaysAgo
				}
			},
			include: {
				notificationSettings: true,
				stream: true
			}
		})

		await this.prismaService.user.deleteMany({
			where: {
				isDeactivated: true,
				deactivatedAt: {
					lte: sevenDaysAgo
				}
			}
		})

		for (const user of deactivatedAccounts) {
			await this.mailService.sendAccountDeletion(user.email)

			if (
				user.notificationSettings.telegramNotifications &&
				user.telegramId
			) {
				await this.telegramService.sendAccountDeletion(user.telegramId)
			}

			if (user.avatar) {
				this.storageService.remove(user.avatar)
			}

			if (user.stream.thumbnailUrl) {
				this.storageService.remove(user.stream.thumbnailUrl)
			}
		}
	}

	//@Cron(CronExpression.EVERY_10_SECONDS)
	public async notifyUsersEnableTwoFactor() {
		const users = await this.prismaService.user.findMany({
			where: {
				id: '0c65e897-e2cb-4e45-8376-022e4af52083',
				isTotpEnabled: false
			},
			include: {
				notificationSettings: true
			}
		})

		console.log('ENABLE TWO FACTOR OPERATION WORKING')

		for (const user of users) {
			await this.mailService.sendEnableTwoFactor(user.email)

			if (user.notificationSettings.siteNotifications) {
				await this.notificationService.createEnableTwoFactor(user.id)
			}

			if (
				user.notificationSettings.telegramNotifications &&
				user.telegramId
			) {
				await this.telegramService.sendEnableTwoFactor(user.telegramId)
			}
		}
	}
}
