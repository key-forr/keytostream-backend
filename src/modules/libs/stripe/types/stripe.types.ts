import type { FactoryProvider, ModuleMetadata } from '@nestjs/common'
import Stripe from 'stripe'

export const StripeOptionsSymbol = Symbol('StripeOptionsSymbol')

export type TypeStripeOptions = {
	apiKey: string
	config?: Stripe.StripeConfig
}

export type TypeStripeAsyncOptions = Pick<ModuleMetadata, 'imports'> &
	Pick<FactoryProvider<TypeStripeOptions>, 'useFactory' | 'inject'>
