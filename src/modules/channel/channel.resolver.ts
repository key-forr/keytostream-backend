import { Args, Query, Resolver } from '@nestjs/graphql'

import { UserModel } from '../auth/account/models/user.model'
import { SubscriptionModel } from '../sponsorship/subscription/models/subscription.model'

import { ChannelService } from './channel.service'

@Resolver('Channel')
export class ChannelResolver {
	public constructor(private readonly channelService: ChannelService) {}

	@Query(() => [UserModel], { name: 'findRecommendedChannels' })
	public async findRecommended() {
		return this.channelService.findRecommended()
	}

	@Query(() => UserModel, { name: 'findChannelByUsername' })
	public async findByUsername(@Args('username') username: string) {
		return this.channelService.findByUsername(username)
	}

	@Query(() => Number, { name: 'findFollowersCountByChannel' })
	public async findFollowersCountByChannel(
		@Args('channelId') channelId: string
	) {
		return this.channelService.findFollowersCountByChannel(channelId)
	}

	@Query(() => [SubscriptionModel], { name: 'findSponsorsByChannel' })
	public async findSponsorsByChannel(@Args('channelId') channelId: string) {
		return this.channelService.findSponsorsByChannel(channelId)
	}
}
