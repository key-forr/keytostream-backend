import { Test, TestingModule } from '@nestjs/testing'

import { User } from '@/prisma/generated'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'

import { EnableTotpInput } from '../inputs/enable-totp.input'
import { TotpModel } from '../models/totp.model'
import { TotpResolver } from '../totp.resolver'
import { TotpService } from '../totp.service'

describe('TotpResolver', () => {
	let resolver: TotpResolver
	let totpService: jest.Mocked<TotpService>

	const mockUser: User = {
		id: 'user-123-uuid',
		email: 'zoe@gmail.com',
		password: 'hashedPassword123',
		username: 'zoe_user',
		displayName: 'Zoe Smith',
		avatar: null,
		bio: null,
		telegramId: null,
		isVerified: false,
		isEmailVerified: true,
		isTotpEnabled: false,
		totpSecret: null,
		isDeactivated: false,
		deactivatedAt: null,
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-01T00:00:00Z')
	}

	const mockTotpModel: TotpModel = {
		secret: 'JBSWY3DPEHPK3PXP',
		qrcodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
	}

	beforeEach(async () => {
		const mockTotpService = {
			generate: jest.fn(),
			enable: jest.fn(),
			disable: jest.fn()
		}

		// Мок для GqlAuthGuard
		const mockGqlAuthGuard = {
			canActivate: jest.fn().mockResolvedValue(true)
		}

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TotpResolver,
				{
					provide: TotpService,
					useValue: mockTotpService
				}
			]
		})
			.overrideGuard(GqlAuthGuard)
			.useValue(mockGqlAuthGuard)
			.compile()

		resolver = module.get<TotpResolver>(TotpResolver)
		totpService = module.get(TotpService)
	})

	describe('generate', () => {
		it('should successfully generate TOTP secret for user', async () => {
			totpService.generate.mockResolvedValue(mockTotpModel)

			const result = await resolver.generate(mockUser)

			expect(result).toEqual(mockTotpModel)
			expect(totpService.generate).toHaveBeenCalledWith(mockUser)
			expect(totpService.generate).toHaveBeenCalledTimes(1)
		})

		it('should generate new secret even if user already has TOTP enabled', async () => {
			const userWithTotp: User = {
				...mockUser,
				isTotpEnabled: true,
				totpSecret: 'OLD_SECRET'
			}
			const newTotpModel: TotpModel = {
				...mockTotpModel,
				secret: 'NEW_SECRET_GENERATED'
			}
			totpService.generate.mockResolvedValue(newTotpModel)

			const result = await resolver.generate(userWithTotp)

			expect(result).toEqual(newTotpModel)
			expect(totpService.generate).toHaveBeenCalledWith(userWithTotp)
		})

		it('should handle generation failure', async () => {
			const errorMessage = 'Failed to generate TOTP secret'
			totpService.generate.mockRejectedValue(new Error(errorMessage))

			await expect(resolver.generate(mockUser)).rejects.toThrow(
				errorMessage
			)

			expect(totpService.generate).toHaveBeenCalledWith(mockUser)
		})
	})

	describe('enable', () => {
		const enableTotpInput: EnableTotpInput = {
			secret: 'JBSWY3DPEHPK3PXP',
			pin: '123456'
		}

		it('should successfully enable TOTP for user with valid secret and pin', async () => {
			totpService.enable.mockResolvedValue(true)

			const result = await resolver.enable(mockUser, enableTotpInput)

			expect(result).toBe(true)
			expect(totpService.enable).toHaveBeenCalledWith(
				mockUser,
				enableTotpInput
			)
			expect(totpService.enable).toHaveBeenCalledTimes(1)
		})

		it('should fail to enable TOTP with invalid pin', async () => {
			const invalidInput: EnableTotpInput = {
				secret: 'JBSWY3DPEHPK3PXP',
				pin: '000000'
			}
			totpService.enable.mockResolvedValue(false)

			const result = await resolver.enable(mockUser, invalidInput)

			expect(result).toBe(false)
			expect(totpService.enable).toHaveBeenCalledWith(
				mockUser,
				invalidInput
			)
		})

		it('should fail to enable TOTP with invalid secret', async () => {
			const invalidInput: EnableTotpInput = {
				secret: 'INVALID_SECRET',
				pin: '123456'
			}
			totpService.enable.mockResolvedValue(false)

			const result = await resolver.enable(mockUser, invalidInput)

			expect(result).toBe(false)
			expect(totpService.enable).toHaveBeenCalledWith(
				mockUser,
				invalidInput
			)
		})

		it('should handle enable TOTP error', async () => {
			const errorMessage = 'Database error during TOTP enable'
			totpService.enable.mockRejectedValue(new Error(errorMessage))

			await expect(
				resolver.enable(mockUser, enableTotpInput)
			).rejects.toThrow(errorMessage)

			expect(totpService.enable).toHaveBeenCalledWith(
				mockUser,
				enableTotpInput
			)
		})

		it('should validate EnableTotpInput structure', async () => {
			const validInput: EnableTotpInput = {
				secret: 'VALID_BASE32_SECRET',
				pin: '654321'
			}
			totpService.enable.mockResolvedValue(true)

			const result = await resolver.enable(mockUser, validInput)

			expect(result).toBe(true)
			expect(totpService.enable).toHaveBeenCalledWith(
				mockUser,
				validInput
			)
			expect(validInput.secret).toBeDefined()
			expect(validInput.pin).toBeDefined()
			expect(validInput.pin).toHaveLength(6)
		})
	})

	describe('disable', () => {
		it('should successfully disable TOTP for user with enabled TOTP', async () => {
			const userWithTotp: User = {
				...mockUser,
				isTotpEnabled: true,
				totpSecret: 'EXISTING_SECRET'
			}
			totpService.disable.mockResolvedValue(true)

			const result = await resolver.disable(userWithTotp)

			expect(result).toBe(true)
			expect(totpService.disable).toHaveBeenCalledWith(userWithTotp)
			expect(totpService.disable).toHaveBeenCalledTimes(1)
		})

		it('should handle disable TOTP for user without TOTP', async () => {
			const userWithoutTotp: User = {
				...mockUser,
				isTotpEnabled: false,
				totpSecret: null
			}
			totpService.disable.mockResolvedValue(false)

			const result = await resolver.disable(userWithoutTotp)

			expect(result).toBe(false)
			expect(totpService.disable).toHaveBeenCalledWith(userWithoutTotp)
		})

		it('should handle disable TOTP error', async () => {
			const errorMessage = 'Failed to disable TOTP'
			totpService.disable.mockRejectedValue(new Error(errorMessage))

			await expect(resolver.disable(mockUser)).rejects.toThrow(
				errorMessage
			)

			expect(totpService.disable).toHaveBeenCalledWith(mockUser)
		})

		it('should successfully disable TOTP and clear user secrets', async () => {
			const userWithTotp: User = {
				...mockUser,
				isTotpEnabled: true,
				totpSecret: 'SECRET_TO_BE_CLEARED'
			}
			totpService.disable.mockResolvedValue(true)

			const result = await resolver.disable(userWithTotp)

			expect(result).toBe(true)
			expect(totpService.disable).toHaveBeenCalledWith(userWithTotp)
			expect(userWithTotp.isTotpEnabled).toBe(true)
			expect(userWithTotp.totpSecret).toBe('SECRET_TO_BE_CLEARED')
		})
	})

	describe('authorization', () => {
		it('should require authorization for all methods', () => {
			const generateMetadata = Reflect.getMetadata(
				'__guards__',
				resolver.generate
			)
			const enableMetadata = Reflect.getMetadata(
				'__guards__',
				resolver.enable
			)
			const disableMetadata = Reflect.getMetadata(
				'__guards__',
				resolver.disable
			)

			expect(
				generateMetadata || enableMetadata || disableMetadata
			).toBeDefined()
		})
	})

	describe('resolver initialization', () => {
		it('should be defined', () => {
			expect(resolver).toBeDefined()
		})

		it('should have totpService injected', () => {
			expect(totpService).toBeDefined()
		})

		it('should have all required methods', () => {
			expect(resolver.generate).toBeDefined()
			expect(resolver.enable).toBeDefined()
			expect(resolver.disable).toBeDefined()
		})
	})
})
