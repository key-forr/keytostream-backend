import { Markup } from 'telegraf'

export const BUTTONS = {
	authSuccess: Markup.inlineKeyboard([
		[
			Markup.button.callback('📜 Мої підписки', 'follows'),
			Markup.button.callback('👤 Переглянути профіль', 'me')
		],
		[Markup.button.url('🌐 На сайт', 'https://keytostream.com')]
	]),
	profile: Markup.inlineKeyboard([
		Markup.button.url(
			'⚙️ Налаштування аккаунта',
			'https://keytostream.com/dashboard/settings'
		)
	])
}
