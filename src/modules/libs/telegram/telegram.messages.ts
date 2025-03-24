import type { User } from '@/prisma/generated'
import type { SessionMetadata } from '@/src/shared/types/session-metadata.types'

export const MESSAGES = {
	welcome:
		`<b>👋 Ласкаво просимо до keytostream Bot!</b>\n\n` +
		`Щоб отримувати сповіщення та покращити ваш досвід використання платформи, давайте зв’яжемо ваш Telegram-акаунт з keytostream.\n\n` +
		`Натисніть кнопку нижче та перейдіть до розділу <b>Сповіщення</b>, щоб завершити налаштування.`,
	authSuccess: `🎉 Ви успішно авторизувалися, і ваш Telegram-акаунт пов’язаний з keytostream!\n\n`,
	invalidToken: '❌ Недійсний або прострочений токен.',
	profile: (user: User, followersCount: number) =>
		`<b>👤 Профіль користувача:</b>\n\n` +
		`👤 Ім’я користувача: <b>${user.username}</b>\n` +
		`📧 Email: <b>${user.email}</b>\n` +
		`👥 Кількість підписників: <b>${followersCount}</b>\n` +
		`📝 Про себе: <b>${user.bio || 'Не вказано'}</b>\n\n` +
		`🔧 Натисніть кнопку нижче, щоб перейти до налаштувань профілю.`,
	follows: (user: User) =>
		`📺 <a href="https://keytostream/${user.username}">${user.username}</a>`,
	resetPassword: (token: string, metadata: SessionMetadata) =>
		`<b>🔒 Скидання пароля</b>\n\n` +
		`Ви запросили скидання пароля для вашого облікового запису на платформі <b>keytostream</b>.\n\n` +
		`Щоб створити новий пароль, перейдіть за наступним посиланням:\n\n` +
		`<b><a href="https://keytostream/account/recovery/${token}">Скинути пароль</a></b>\n\n` +
		`📅 <b>Дата запиту:</b> ${new Date().toLocaleDateString()} о ${new Date().toLocaleTimeString()}\n\n` +
		`🖥️ <b>Інформація про запит:</b>\n\n` +
		`🌍 <b>Розташування:</b> ${metadata.location.country}, ${metadata.location.city}\n` +
		`📱 <b>Операційна система:</b> ${metadata.device.os}\n` +
		`🌐 <b>Браузер:</b> ${metadata.device.browser}\n` +
		`💻 <b>IP-адреса:</b> ${metadata.ip}\n\n` +
		`Якщо ви не робили цей запит, просто проігноруйте це повідомлення.\n\n` +
		`Дякуємо за використання <b>keytostream</b>! 🚀`,
	deactivate: (token: string, metadata: SessionMetadata) =>
		`<b>⚠️ Запит на деактивацію акаунта</b>\n\n` +
		`Ви ініціювали процес деактивації вашого акаунта на платформі <b>keytostream</b>.\n\n` +
		`Щоб завершити операцію, підтвердьте свій запит, ввівши наступний код підтвердження:\n\n` +
		`<b>Код підтвердження: ${token}</b>\n\n` +
		`📅 <b>Дата запиту:</b> ${new Date().toLocaleDateString()} о ${new Date().toLocaleTimeString()}\n\n` +
		`🖥️ <b>Інформація про запит:</b>\n\n` +
		`🌍 <b>Розташування:</b> ${metadata.location.country}, ${metadata.location.city}\n` +
		`📱 <b>Операційна система:</b> ${metadata.device.os}\n` +
		`🌐 <b>Браузер:</b> ${metadata.device.browser}\n` +
		`💻 <b>IP-адреса:</b> ${metadata.ip}\n\n` +
		`Якщо ви передумали, просто проігноруйте це повідомлення. Ваш акаунт залишиться активним.\n\n` +
		`Дякуємо, що користуєтесь <b>keytostream</b>! 🚀`,
	accountDeleted:
		`<b>⚠️ Ваш акаунт було повністю видалено.</b>\n\n` +
		`Усі ваші дані були безповоротно видалені. ❌\n\n` +
		`🔒 Ви більше не будете отримувати сповіщення в Telegram та на пошту.\n\n` +
		`Якщо ви захочете повернутися, зареєструйтесь за посиланням:\n` +
		`<b><a href="https://keytostream/account/create">Зареєструватися</a></b>\n\n` +
		`Дякуємо, що були з нами! 🚀`,
	streamStart: (channel: User) =>
		`<b>📡 На каналі ${channel.displayName} почалась трансляція!</b>\n\n` +
		`Дивіться тут: <a href="https://keytostream/${channel.username}">Перейти до трансляції</a>`,
	newFollowing: (follower: User, followersCount: number) =>
		`<b>У вас новий підписник!</b>\n\n` +
		`Це користувач <a href="https://keytostream/${follower.username}">${follower.displayName}</a>\n\n` +
		`Загальна кількість підписників: ${followersCount}`,
	enableTwoFactor:
		`🔐 Захистіть свій акаунт!\n\n` +
		`Увімкніть двофакторну автентифікацію в <a href="https://keytostream/dashboard/settings">налаштуваннях акаунта</a>.`,
	verifyChannel:
		`<b>🎉 Вітаємо! Ваш канал верифіковано</b>\n\n` +
		`Ви отримали офіційний значок верифікації!\n\n` +
		`Це підтверджує автентичність вашого каналу та підвищує довіру глядачів.\n\n` +
		`Дякуємо, що ви з нами!`
}
