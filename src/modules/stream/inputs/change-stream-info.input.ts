import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsString } from 'class-validator'

@InputType()
export class ChangeStreamInfoInput {
	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	public title: string

	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	public categoryId?: string
}
