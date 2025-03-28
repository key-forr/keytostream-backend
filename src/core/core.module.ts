import { ApolloDriver } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { GraphQLModule } from '@nestjs/graphql'

import { AccountModule } from '../modules/auth/account/account.module'
import { DeactivateModule } from '../modules/auth/deactivate/deactivate.module'
import { PasswordRecoveryModule } from '../modules/auth/password-recovery/password-recovery.module'
import { ProfileModule } from '../modules/auth/profile/profile.module'
import { SessionModule } from '../modules/auth/session/session.module'
import { TotpModule } from '../modules/auth/totp/totp.module'
import { VerificationModule } from '../modules/auth/verification/verification.module'
import { CategoryModule } from '../modules/category/category.module'
import { ChannelModule } from '../modules/channel/channel.module'
import { ChatModule } from '../modules/chat/chat.module'
import { CronModule } from '../modules/cron/cron.module'
import { FollowModule } from '../modules/follow/follow.module'
import { LivekitModule } from '../modules/libs/livekit/livekit.module'
import { MailModule } from '../modules/libs/mail/mail.module'
import { StorageModule } from '../modules/libs/storage/storage.module'
import { StripeModule } from '../modules/libs/stripe/stripe.module'
import { TelegramModule } from '../modules/libs/telegram/telegram.module'
import { NotificationModule } from '../modules/notification/notification.module'
import { PlanModule } from '../modules/sponsorship/plan/plan.module'
import { SubscriptionModule } from '../modules/sponsorship/subscription/subscription.module'
import { TransactionModule } from '../modules/sponsorship/transaction/transaction.module'
import { IngressModule } from '../modules/stream/ingress/ingress.module'
import { StreamModule } from '../modules/stream/stream.module'
import { WebhookModule } from '../modules/webhook/webhook.module'
import { IS_DEV_ENV } from '../shared/utils/is-dev.util'

import { getGraphQLConfig } from './config/graphql.config'
import { getLiveKitConfig } from './config/livekit.config'
import { getStripeConfig } from './config/stripe.config'
import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './redis/redis.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			ignoreEnvFile: !IS_DEV_ENV,
			isGlobal: true
		}),
		GraphQLModule.forRootAsync({
			driver: ApolloDriver,
			imports: [ConfigModule],
			useFactory: getGraphQLConfig,
			inject: [ConfigService]
		}),
		LivekitModule.registerAsync({
			imports: [ConfigModule],
			useFactory: getLiveKitConfig,
			inject: [ConfigService]
		}),
		StripeModule.registerAsync({
			imports: [ConfigModule],
			useFactory: getStripeConfig,
			inject: [ConfigService]
		}),
		PrismaModule,
		RedisModule,
		MailModule,
		StorageModule,
		LivekitModule,
		TelegramModule,
		StripeModule,
		CronModule,
		AccountModule,
		SessionModule,
		ProfileModule,
		VerificationModule,
		PasswordRecoveryModule,
		TotpModule,
		DeactivateModule,
		StreamModule,
		IngressModule,
		WebhookModule,
		CategoryModule,
		ChatModule,
		FollowModule,
		ChannelModule,
		NotificationModule,
		PlanModule,
		TransactionModule,
		SubscriptionModule
	]
})
export class CoreModule {}
