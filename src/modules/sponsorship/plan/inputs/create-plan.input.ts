import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

@InputType()
export class CreatePlanInput {
	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	public title: string

	@Field(() => String, { nullable: true })
	@IsString()
	@IsOptional()
	public description?: string

	@Field(() => Number)
	@IsNumber()
	@IsNotEmpty()
	public price: number
}
