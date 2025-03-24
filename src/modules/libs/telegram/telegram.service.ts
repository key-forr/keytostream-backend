import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Command, Ctx, Start, Update } from 'nestjs-telegraf'
import { Context, Telegraf } from 'telegraf'

import { TokenType } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'

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
				return ctx.reply('Токен не знайден')
			}

			const hasExpired = new Date(authToken.expiresIn) < new Date()

			if (hasExpired) {
				return ctx.reply('Невалідний токен')
			}

			await this.connectTelegram(authToken.userId, chatId)

			await this.prismaService.token.delete({
				where: {
					id: authToken.id
				}
			})

			return await ctx.replyWithHTML('Успішна авторизація')
		}

		const user = await this.findUserByChatId(chatId)

		if (user) {
			return await this.onMe(ctx)
		}

		return await ctx.replyWithHTML('Ласкаво просимо')
	}

	@Command('me')
	public async onMe(@Ctx() ctx: Context) {
		const chatId = ctx.chat.id.toString()

		const user = this.findUserByChatId(chatId)

		await ctx.reply(`Email користувача: ${(await user).email}`)
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
