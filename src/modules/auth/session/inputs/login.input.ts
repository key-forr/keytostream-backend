import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsString, Length, MinLength } from 'class-validator'

@InputType()
export class LoginInput {
	@Field()
	@IsString()
	@IsNotEmpty()
	public login: string

	@Field()
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	public password: string

	@Field(() => String, { nullable: true })
	@IsString()
	@IsNotEmpty()
	@Length(6, 6)
	public pin?: string
}
