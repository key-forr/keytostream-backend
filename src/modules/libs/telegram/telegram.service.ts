import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Action, Command, Ctx, Start, Update } from 'nestjs-telegraf'
import { Context, Telegraf } from 'telegraf'

import { TokenType } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import type { SessionMetadata } from '@/src/shared/types/session-metadata.types'

import { BUTTONS } from './telegram.buttons'
import { MESSAGES } from './telegram.messages'

@Update()
@Injectable()
export class TelegramService extends Telegraf {
	private readonly _token: string

	public constructor(
		private readonly prismaService: PrismaService,
		private readonly configService: ConfigService
	) {
		super(configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'))
		this._token = configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN')
	}

	@Start()
	public async onStart(@Ctx() ctx: any) {
		const chatId = ctx.chat.id.toString()
		const token = ctx.message.text.split(' ')[1]

		if (token) {
			const authToken = await this.prismaService.token.findUnique({
				where: {
					token,
					type: TokenType.TELEGRAM_AUTH
				}
			})

			if (!authToken) {
				await ctx.reply(MESSAGES.invalidToken)
			}

			const hasExpired = new Date(authToken.expiresIn) < new Date()

			if (hasExpired) {
				await ctx.reply(MESSAGES.invalidToken)
			}

			await this.connectTelegram(authToken.userId, chatId)

			await this.prismaService.token.delete({
				where: {
					id: authToken.id
				}
			})

			await ctx.replyWithHTML(MESSAGES.authSuccess, BUTTONS.authSuccess)
		} else {
			const user = await this.findUserByChatId(chatId)

			if (user) {
				return await this.onMe(ctx)
			} else {
				await ctx.replyWithHTML(MESSAGES.welcome, BUTTONS.profile)
			}
		}
	}

	@Command('me')
	@Action('me')
	public async onMe(@Ctx() ctx: Context) {
		const chatId = ctx.chat.id.toString()

		const user = await this.findUserByChatId(chatId)
		const followersCount = await this.prismaService.follow.count({
			where: {
				followingId: (await user).id
			}
		})

		await ctx.replyWithHTML(
			MESSAGES.profile(user, followersCount),
			BUTTONS.profile
		)
	}

	@Command('follows')
	@Action('follows')
	public async onFollows(@Ctx() ctx: Context) {
		const chatId = ctx.chat.id.toString()

		const user = await this.findUserByChatId(chatId)
		const follows = await this.prismaService.follow.findMany({
			where: {
				followerId: user.id
			},
			include: {
				following: true
			}
		})

		if (user && follows.length) {
			const followsList = follows
				.map(follow => MESSAGES.follows(follow.following))
				.join('\n')

			const message = `<b>🌟 Канали на які ви підписані:</b>\n\n${followsList}`

			await ctx.replyWithHTML(message)
		} else {
			await ctx.replyWithHTML('<b>❌ У вас немає підписок.</b>')
		}
	}

	public async sendPasswordResetToken(
		chatId: string,
		token: string,
		metadata: SessionMetadata
	) {
		await this.telegram.sendMessage(
			chatId,
			MESSAGES.resetPassword(token, metadata),
			{ parse_mode: 'HTML' }
		)
	}

	public async sendDeactivateToken(
		chatId: string,
		token: string,
		metadata: SessionMetadata
	) {
		await this.telegram.sendMessage(
			chatId,
			MESSAGES.deactivate(token, metadata),
			{ parse_mode: 'HTML' }
		)
	}

	public async sendAccountDeletion(chatId: string) {
		await this.telegram.sendMessage(chatId, MESSAGES.accountDeleted, {
			parse_mode: 'HTML'
		})
	}

	private async connectTelegram(userId: string, chatId: string) {
		await this.prismaService.user.update({
			where: {
				id: userId
			},
			data: {
				telegramId: chatId
			}
		})
	}

	private async findUserByChatId(chatId: string) {
		const user = await this.prismaService.user.findUnique({
			where: {
				telegramId: chatId
			},
			include: {
				followers: true,
				followings: true
			}
		})

		return user
	}
}
