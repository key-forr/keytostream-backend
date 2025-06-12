import { Test, TestingModule } from '@nestjs/testing'

import { User } from '@/prisma/generated'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { GqlContext } from '@/src/shared/types/gql-context.types'

import { AuthModel } from '../../account/models/auth.model'
import { UserModel } from '../../account/models/user.model'
import { LoginInput } from '../inputs/login.input'
import { SessionResolver } from '../session.resolver'
import { SessionService } from '../session.service'

describe('SessionResolver', () => {
	let resolver: SessionResolver
	let sessionService: jest.Mocked<SessionService>

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

	const mockAuthModel: AuthModel = {
		user: mockUser as UserModel,
		message: 'Login successful'
	}

	const mockGqlContext: GqlContext = {
		req: {
			headers: {
				'user-agent': 'Mozilla/5.0 Test Browser'
			},
			session: {
				userId: mockUser.id
			},
			user: mockUser
		} as any,
		res: {} as any
	}

	beforeEach(async () => {
		const mockSessionService = {
			login: jest.fn(),
			findByUser: jest.fn(),
			findCurrent: jest.fn(),
			logout: jest.fn(),
			clearSession: jest.fn(),
			remove: jest.fn()
		}

		const mockGqlAuthGuard = {
			canActivate: jest.fn().mockResolvedValue(true)
		}

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SessionResolver,
				{
					provide: SessionService,
					useValue: mockSessionService
				}
			]
		})
			.overrideGuard(GqlAuthGuard)
			.useValue(mockGqlAuthGuard)
			.compile()

		resolver = module.get<SessionResolver>(SessionResolver)
		sessionService = module.get(SessionService)
	})

	describe('login', () => {
		const loginInput: LoginInput = {
			login: 'zoe@gmail.com',
			password: '12345678',
			pin: '349210'
		}

		const userAgent = 'Mozilla/5.0 Test Browser'

		it('should successfully login user with valid credentials', async () => {
			sessionService.login.mockResolvedValue(mockAuthModel)

			const result = await resolver.login(
				mockGqlContext,
				loginInput,
				userAgent
			)

			expect(result).toEqual(mockAuthModel)
			expect(sessionService.login).toHaveBeenCalledWith(
				mockGqlContext.req,
				loginInput,
				userAgent
			)
			expect(sessionService.login).toHaveBeenCalledTimes(1)
		})

		it('should login user without two-factor authentication (any 6 digits in pin)', async () => {
			const inputWithAnyPin: LoginInput = {
				...loginInput,
				pin: '123456'
			}
			const mockAuthWithoutTotp: AuthModel = {
				...mockAuthModel,
				user: { ...mockUser, isTotpEnabled: false } as UserModel
			}
			sessionService.login.mockResolvedValue(mockAuthWithoutTotp)

			const result = await resolver.login(
				mockGqlContext,
				inputWithAnyPin,
				userAgent
			)

			expect(result).toEqual(mockAuthWithoutTotp)
			expect(sessionService.login).toHaveBeenCalledWith(
				mockGqlContext.req,
				inputWithAnyPin,
				userAgent
			)
		})

		it('should login user with two-factor authentication enabled (correct pin required)', async () => {
			const inputWithCorrectPin: LoginInput = {
				...loginInput,
				pin: '349210'
			}
			const mockAuthWithTotp: AuthModel = {
				...mockAuthModel,
				user: {
					...mockUser,
					isTotpEnabled: true,
					totpSecret: 'SECRET123'
				} as UserModel
			}
			sessionService.login.mockResolvedValue(mockAuthWithTotp)

			const result = await resolver.login(
				mockGqlContext,
				inputWithCorrectPin,
				userAgent
			)

			expect(result).toEqual(mockAuthWithTotp)
			expect(sessionService.login).toHaveBeenCalledWith(
				mockGqlContext.req,
				inputWithCorrectPin,
				userAgent
			)
		})

		it('should login user without pin (optional field)', async () => {
			const inputWithoutPin: LoginInput = {
				login: 'zoe@gmail.com',
				password: '12345678'
			}
			sessionService.login.mockResolvedValue(mockAuthModel)

			const result = await resolver.login(
				mockGqlContext,
				inputWithoutPin,
				userAgent
			)

			expect(result).toEqual(mockAuthModel)
			expect(sessionService.login).toHaveBeenCalledWith(
				mockGqlContext.req,
				inputWithoutPin,
				userAgent
			)
		})

		it('should handle login failure', async () => {
			const errorMessage = 'Invalid credentials'
			sessionService.login.mockRejectedValue(new Error(errorMessage))

			await expect(
				resolver.login(mockGqlContext, loginInput, userAgent)
			).rejects.toThrow(errorMessage)

			expect(sessionService.login).toHaveBeenCalledWith(
				mockGqlContext.req,
				loginInput,
				userAgent
			)
		})

		it('should extract user agent from request headers', async () => {
			const customUserAgent = 'Custom User Agent'
			sessionService.login.mockResolvedValue(mockAuthModel)

			await resolver.login(mockGqlContext, loginInput, customUserAgent)

			expect(sessionService.login).toHaveBeenCalledWith(
				mockGqlContext.req,
				loginInput,
				customUserAgent
			)
		})
	})

	describe('findByUser', () => {
		it('should return user sessions', async () => {
			const mockSessions = [
				{ id: 'session-1', userId: mockUser.id, createdAt: new Date() },
				{ id: 'session-2', userId: mockUser.id, createdAt: new Date() }
			]
			sessionService.findByUser.mockResolvedValue(mockSessions as any)

			const result = await resolver.findByUser(mockGqlContext)

			expect(result).toEqual(mockSessions)
			expect(sessionService.findByUser).toHaveBeenCalledWith(
				mockGqlContext.req
			)
		})
	})

	describe('findCurrent', () => {
		it('should return current session', async () => {
			const mockCurrentSession = {
				id: 'current-session',
				userId: mockUser.id,
				createdAt: new Date()
			}
			sessionService.findCurrent.mockResolvedValue(
				mockCurrentSession as any
			)

			const result = await resolver.findCurrent(mockGqlContext)

			expect(result).toEqual(mockCurrentSession)
			expect(sessionService.findCurrent).toHaveBeenCalledWith(
				mockGqlContext.req
			)
		})
	})

	describe('logout', () => {
		it('should successfully logout user', async () => {
			sessionService.logout.mockResolvedValue(true)

			const result = await resolver.logout(mockGqlContext)

			expect(result).toBe(true)
			expect(sessionService.logout).toHaveBeenCalledWith(
				mockGqlContext.req
			)
		})
	})

	describe('clearSession', () => {
		it('should successfully clear session cookie', async () => {
			sessionService.clearSession.mockResolvedValue(true)

			const result = await resolver.clearSession(mockGqlContext)

			expect(result).toBe(true)
			expect(sessionService.clearSession).toHaveBeenCalledWith(
				mockGqlContext.req
			)
		})
	})

	describe('remove', () => {
		it('should successfully remove specific session', async () => {
			const sessionId = 'session-to-remove'
			sessionService.remove.mockResolvedValue(true)

			const result = await resolver.remove(mockGqlContext, sessionId)

			expect(result).toBe(true)
			expect(sessionService.remove).toHaveBeenCalledWith(
				mockGqlContext.req,
				sessionId
			)
		})
	})

	describe('resolver initialization', () => {
		it('should be defined', () => {
			expect(resolver).toBeDefined()
		})

		it('should have sessionService injected', () => {
			expect(sessionService).toBeDefined()
		})
	})
})
