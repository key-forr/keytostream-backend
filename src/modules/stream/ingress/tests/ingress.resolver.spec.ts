import { UnauthorizedException } from '@nestjs/common'
import { ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { Test, TestingModule } from '@nestjs/testing'
import { IngressInput } from 'livekit-server-sdk'

import type { User } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'

import { IngressResolver } from '../ingress.resolver'
import { IngressService } from '../ingress.service'

const mockUser: User = {
	id: 'user-123',
	email: 'test@example.com',
	password: 'hashedpassword',
	username: 'testuser',
	displayName: 'Test User',
	avatar: null,
	bio: null,
	telegramId: null,
	isVerified: true,
	isEmailVerified: true,
	isTotpEnabled: false,
	totpSecret: null,
	isDeactivated: false,
	deactivatedAt: null,
	createdAt: new Date(),
	updatedAt: new Date()
}

const mockIngressService = {
	create: jest.fn()
}

const mockPrismaService = {
	user: {
		findUnique: jest.fn()
	}
}

describe('IngressResolver', () => {
	let resolver: IngressResolver
	let ingressService: IngressService
	let prismaService: PrismaService
	let gqlAuthGuard: GqlAuthGuard

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				IngressResolver,
				{
					provide: IngressService,
					useValue: mockIngressService
				},
				{
					provide: PrismaService,
					useValue: mockPrismaService
				},
				GqlAuthGuard
			]
		}).compile()

		resolver = module.get<IngressResolver>(IngressResolver)
		ingressService = module.get<IngressService>(IngressService)
		prismaService = module.get<PrismaService>(PrismaService)
		gqlAuthGuard = module.get<GqlAuthGuard>(GqlAuthGuard)

		jest.clearAllMocks()
	})

	describe('create', () => {
		it('повинен успішно створити ingress з RTMP_INPUT', async () => {
			const ingressType = IngressInput.RTMP_INPUT
			mockIngressService.create.mockResolvedValue(true)

			const result = await resolver.create(mockUser, ingressType)

			expect(result).toBe(true)
			expect(ingressService.create).toHaveBeenCalledWith(
				mockUser,
				ingressType
			)
			expect(ingressService.create).toHaveBeenCalledTimes(1)
		})

		it('повинен успішно створити ingress з WHIP_INPUT', async () => {
			const ingressType = IngressInput.WHIP_INPUT
			mockIngressService.create.mockResolvedValue(true)

			const result = await resolver.create(mockUser, ingressType)

			expect(result).toBe(true)
			expect(ingressService.create).toHaveBeenCalledWith(
				mockUser,
				ingressType
			)
			expect(ingressService.create).toHaveBeenCalledTimes(1)
		})

		it('повинен передати помилку від сервісу', async () => {
			const ingressType = IngressInput.RTMP_INPUT
			const error = new Error('Service error')
			mockIngressService.create.mockRejectedValue(error)

			await expect(
				resolver.create(mockUser, ingressType)
			).rejects.toThrow('Service error')
			expect(ingressService.create).toHaveBeenCalledWith(
				mockUser,
				ingressType
			)
		})

		it('повинен обробити випадок коли сервіс повертає false', async () => {
			const ingressType = IngressInput.RTMP_INPUT
			mockIngressService.create.mockResolvedValue(false)

			const result = await resolver.create(mockUser, ingressType)

			expect(result).toBe(false)
			expect(ingressService.create).toHaveBeenCalledWith(
				mockUser,
				ingressType
			)
		})
	})

	describe('Authorization Guard', () => {
		let mockExecutionContext: ExecutionContext
		let mockGqlExecutionContext: any

		beforeEach(() => {
			mockExecutionContext = {
				getClass: jest.fn(),
				getHandler: jest.fn(),
				getArgs: jest.fn(),
				getArgByIndex: jest.fn(),
				switchToRpc: jest.fn(),
				switchToHttp: jest.fn(),
				switchToWs: jest.fn(),
				getType: jest.fn()
			} as ExecutionContext

			mockGqlExecutionContext = {
				getContext: jest.fn().mockReturnValue({
					req: {
						session: {},
						user: null
					}
				}),
				getArgs: jest.fn(),
				getRoot: jest.fn(),
				getInfo: jest.fn()
			}

			jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(
				mockGqlExecutionContext
			)
		})

		it('повинен дозволити доступ для авторизованого користувача', async () => {
			mockGqlExecutionContext.getContext.mockReturnValue({
				req: {
					session: { userId: 'user-123' },
					user: null
				}
			})
			mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

			const result = await gqlAuthGuard.canActivate(mockExecutionContext)

			expect(result).toBe(true)
			expect(prismaService.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'user-123' }
			})
		})

		it('повинен викинути UnauthorizedException для неавторизованого користувача', async () => {
			mockGqlExecutionContext.getContext.mockReturnValue({
				req: {
					session: {},
					user: null
				}
			})

			await expect(
				gqlAuthGuard.canActivate(mockExecutionContext)
			).rejects.toThrow(UnauthorizedException)
			await expect(
				gqlAuthGuard.canActivate(mockExecutionContext)
			).rejects.toThrow('Користувач не авторизований')
		})

		it('повинен встановити користувача в request після успішної авторизації', async () => {
			const mockRequest = {
				session: { userId: 'user-123' },
				user: null
			}
			mockGqlExecutionContext.getContext.mockReturnValue({
				req: mockRequest
			})
			mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

			await gqlAuthGuard.canActivate(mockExecutionContext)

			expect(mockRequest.user).toBe(mockUser)
		})
	})

	describe('Integration tests', () => {
		it('повинен працювати з повним потоком авторизації та створення ingress', async () => {
			const ingressType = IngressInput.RTMP_INPUT
			mockIngressService.create.mockResolvedValue(true)

			const result = await resolver.create(mockUser, ingressType)

			expect(result).toBe(true)
			expect(ingressService.create).toHaveBeenCalledWith(
				mockUser,
				ingressType
			)
		})
	})

	describe('Edge cases', () => {
		it('повинен обробити undefined user', async () => {
			const ingressType = IngressInput.RTMP_INPUT
			mockIngressService.create.mockResolvedValue(true)

			const result = await resolver.create(undefined as any, ingressType)

			expect(ingressService.create).toHaveBeenCalledWith(
				undefined,
				ingressType
			)
		})

		it('повинен обробити undefined ingressType', async () => {
			mockIngressService.create.mockResolvedValue(true)

			const result = await resolver.create(mockUser, undefined as any)

			expect(ingressService.create).toHaveBeenCalledWith(
				mockUser,
				undefined
			)
		})
	})
})
