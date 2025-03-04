import { Field, InputType } from '@nestjs/graphql'
import {
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
	MaxLength
} from 'class-validator'

@InputType()
export class ChangeProfileInfoInput {
	@Field()
	@IsString()
	@IsNotEmpty()
	@Matches(/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/)
	public username: string

	@Field()
	@IsString()
	@IsNotEmpty()
	public displayName: string

	@Field()
	@IsString()
	@IsOptional()
	@MaxLength(300)
	public bio?: string
}
