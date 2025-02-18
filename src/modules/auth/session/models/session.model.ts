import { Field, ID, ObjectType } from '@nestjs/graphql'

import type {
	DeviceInfo,
	LocationInfo,
	SessionMetadata
} from '@/src/shared/types/session-metadata.types'

@ObjectType()
export class LocationModel implements LocationInfo {
	@Field(() => String)
	public country: string

	@Field(() => String)
	public city: string

	@Field(() => Number)
	public latidute: number

	@Field(() => Number)
	public longitude: number
}

@ObjectType()
export class DeviceModel implements DeviceInfo {
	@Field(() => String)
	public browser: string

	@Field(() => String)
	public os: string

	@Field(() => String)
	public type: string
}

@ObjectType()
export class SessionMetadataModel implements SessionMetadata {
	@Field(() => LocationModel)
	public location: LocationModel

	@Field(() => DeviceModel)
	public device: DeviceModel

	@Field(() => String)
	public ip: string
}

@ObjectType()
export class SessionModel {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public userId: string

	@Field(() => String)
	public createdAt: string

	@Field(() => SessionMetadataModel)
	public metadata: SessionMetadataModel
}
