import { Field, ID, ObjectType } from '@nestjs/graphql'

import type { SponsorshipPlan } from '@/prisma/generated'
import { UserModel } from '@/src/modules/auth/account/models/user.model'

@ObjectType()
export class PlanModel implements SponsorshipPlan {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public title: string

	@Field(() => String, { nullable: true })
	public description: string

	@Field(() => Number)
	public price: number

	@Field(() => String)
	public stripePlanId: string

	@Field(() => String)
	public stripeProductId: string

	@Field(() => UserModel)
	public channel: UserModel

	@Field(() => String)
	public channelId: string

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
