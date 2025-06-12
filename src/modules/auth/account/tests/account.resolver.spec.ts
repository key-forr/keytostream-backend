import { UnauthorizedException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'

import { PrismaService } from '@/src/core/prisma/prisma.service'

import { GqlAuthGuard } from '../../../../shared/guards/gql-auth.guard'
import { AccountResolver } from '../account.resolver'
import { AccountService } from '../account.service'
import { CreateUserInput } from '../inputs/create-user.input'

describe('AccountResolver - createUser', () => {
	let resolver: AccountResolver
	let accountService: AccountService

	const mockAccountService = {
		create: jest.fn()
	}

	const mockPrismaService = {}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AccountResolver,
				{
					provide: AccountService,
					useValue: mockAccountService
				},
				{
					provide: PrismaService,
					useValue: mockPrismaService
				}
			]
		})
			.overrideProvider(GqlAuthGuard)
			.useValue({
				canActivate: jest.fn().mockReturnValue(true)
			})
			.compile()

		resolver = module.get<AccountResolver>(AccountResolver)
		accountService = module.get<AccountService>(AccountService)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('create', () => {
		it('should successfully create user with valid input', async () => {
			const validInput: CreateUserInput = {
				username: 'test-user',
				email: 'test@example.com',
				password: 'password123'
			}

			mockAccountService.create.mockResolvedValue(true)

			const result = await resolver.create(validInput)

			expect(accountService.create).toHaveBeenCalledWith(validInput)
			expect(accountService.create).toHaveBeenCalledTimes(1)
			expect(result).toBe(true)
		})
		it('should handle service error and propagate exception', async () => {
			const validInput: CreateUserInput = {
				username: 'another-user',
				email: 'another@example.com',
				password: 'securepassword'
			}

			const serviceError = new Error('User already exists')
			mockAccountService.create.mockRejectedValue(serviceError)

			await expect(resolver.create(validInput)).rejects.toThrow(
				'User already exists'
			)
			expect(accountService.create).toHaveBeenCalledWith(validInput)
			expect(accountService.create).toHaveBeenCalledTimes(1)
		})
		it('should throw error when email already exists', async () => {
			const duplicateEmailInput: CreateUserInput = {
				username: 'keyforr1',
				email: 'key.forr1@gmail.com',
				password: '12345678'
			}

			const error = new Error('Ця пошта вже зареєстрована')
			mockAccountService.create.mockRejectedValue(error)

			await expect(resolver.create(duplicateEmailInput)).rejects.toThrow(
				'Ця пошта вже зареєстрована'
			)

			expect(accountService.create).toHaveBeenCalledWith(
				duplicateEmailInput
			)
		})
		it('should throw bad request error when password is less than 8 characters', async () => {
			const shortPasswordInput: CreateUserInput = {
				username: 'testuser',
				email: 'test@example.com',
				password: '1234567'
			}

			const error = new Error(
				'password must be longer than or equal to 8 characters'
			)
			mockAccountService.create.mockRejectedValue(error)

			await expect(resolver.create(shortPasswordInput)).rejects.toThrow(
				'password must be longer than or equal to 8 characters'
			)

			expect(accountService.create).toHaveBeenCalledWith(
				shortPasswordInput
			)
		})
	})
})

describe('AccountResolver - findProfile', () => {
	let resolver: AccountResolver
	let accountService: AccountService

	const mockAccountService = {
		me: jest.fn()
	}

	const mockPrismaService = {}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AccountResolver,
				{
					provide: AccountService,
					useValue: mockAccountService
				},
				{
					provide: PrismaService,
					useValue: mockPrismaService
				}
			]
		}).compile()

		resolver = module.get<AccountResolver>(AccountResolver)
		accountService = module.get<AccountService>(AccountService)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('me', () => {
		it('should throw unauthorized error when user is not authenticated', async () => {
			const userId = 'unauthorized-user-id'

			const unauthorizedError = new UnauthorizedException(
				'Користувач не авторизований'
			)
			mockAccountService.me.mockRejectedValue(unauthorizedError)

			await expect(resolver.me(userId)).rejects.toThrow(
				'Користувач не авторизований'
			)

			expect(accountService.me).toHaveBeenCalledWith(userId)
		})

		it('should return user profile when user is authenticated', async () => {
			const userId = 'authenticated-user-id'
			const expectedUserProfile = {
				id: userId,
				username: 'testuser',
				email: 'test@example.com'
			}

			mockAccountService.me.mockResolvedValue(expectedUserProfile)

			const result = await resolver.me(userId)

			expect(accountService.me).toHaveBeenCalledWith(userId)
			expect(accountService.me).toHaveBeenCalledTimes(1)
			expect(result).toEqual(expectedUserProfile)
			expect(result.username).toBe('testuser')
		})
	})
})
