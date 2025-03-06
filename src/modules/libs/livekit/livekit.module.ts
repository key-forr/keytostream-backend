import { type DynamicModule, Module } from '@nestjs/common'

import { LivekitService } from './livekit.service'
import {
	LiveKitOptionsSymbol,
	TypeLiveKitAsyncOptions,
	type TypeLiveKitOptions
} from './types/livekit.types'

@Module({})
export class LivekitModule {
	public static register(options: TypeLiveKitOptions): DynamicModule {
		return {
			module: LivekitModule,
			providers: [
				{
					provide: LiveKitOptionsSymbol,
					useValue: options
				},
				LivekitService
			],
			exports: [LivekitService],
			global: true
		}
	}

	public static registerAsync(
		options: TypeLiveKitAsyncOptions
	): DynamicModule {
		return {
			module: LivekitModule,
			imports: options.imports || [],
			providers: [
				{
					provide: LiveKitOptionsSymbol,
					useFactory: options.useFactory,
					inject: options.inject || []
				},
				LivekitService
			],
			exports: [LivekitService],
			global: true
		}
	}
}
