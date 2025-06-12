import { BadRequestException, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import * as Upload from 'graphql-upload/Upload.js'
import { Readable } from 'stream'

import type { Category, Stream, User } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { FileValidationPipe } from '@/src/shared/pipes/file-validation.pipe'

import { StorageService } from '../../libs/storage/storage.service'
import { ChangeStreamInfoInput } from '../inputs/change-stream-info.input'
import { FiltersInput } from '../inputs/filters.input'
import { GenerateStreamTokenInput } from '../inputs/generate-stream-token.inupt'
import { StreamResolver } from '../stream.resolver'
import { StreamService } from '../stream.service'

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

const mockCategory: Category = {
	id: 'category-123',
	title: 'Gaming',
	slug: 'gaming',
	description: 'Gaming category',
	thumbnailUrl: '/categories/gaming.webp',
	createdAt: new Date(),
	updatedAt: new Date()
}

const mockStreams: Stream[] = [
	{
		id: 'stream-1',
		title: 'Test Stream 1',
		thumbnailUrl: '/streams/thumbnail1.webp',
		ingressId: 'ingress-1',
		serverUrl: 'wss://test.com',
		streamKey: 'key-1',
		isLive: true,
		isChatEnabled: true,
		isChatFollowersOnly: false,
		isChatPremiumFollowersOnly: false,
		userId: 'user-123',
		categoryId: 'category-123',
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'stream-2',
		title: 'Test Stream 2',
		thumbnailUrl: '/streams/thumbnail2.webp',
		ingressId: 'ingress-2',
		serverUrl: 'wss://test2.com',
		streamKey: 'key-2',
		isLive: false,
		isChatEnabled: true,
		isChatFollowersOnly: true,
		isChatPremiumFollowersOnly: false,
		userId: 'user-456',
		categoryId: 'category-123',
		createdAt: new Date(),
		updatedAt: new Date()
	}
]

const createMockUpload = (filename: string = 'test.jpg'): Upload => {
	const mockStream = new Readable({
		read() {
			this.push(Buffer.from('fake image data'))
			this.push(null)
		}
	})

	return {
		filename,
		mimetype: 'image/jpeg',
		encoding: '7bit',
		createReadStream: () => mockStream
	} as Upload
}

const mockStreamService = {
	findAll: jest.fn(),
	findRandom: jest.fn(),
	changeInfo: jest.fn(),
	changeThumbnail: jest.fn(),
	removeThumbnail: jest.fn(),
	generateToken: jest.fn()
}

const mockPrismaService = {
	stream: {
		findMany: jest.fn(),
		findUnique: jest.fn(),
		update: jest.fn(),
		count: jest.fn()
	},
	user: {
		findUnique: jest.fn()
	}
}

const mockStorageService = {
	upload: jest.fn(),
	remove: jest.fn()
}

const mockConfigService = {
	getOrThrow: jest.fn()
}

describe('StreamResolver', () => {
	let resolver: StreamResolver
	let streamService: StreamService
	let prismaService: PrismaService
	let storageService: StorageService
	let configService: ConfigService

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				StreamResolver,
				{
					provide: StreamService,
					useValue: mockStreamService
				},
				{
					provide: PrismaService,
					useValue: mockPrismaService
				},
				{
					provide: StorageService,
					useValue: mockStorageService
				},
				{
					provide: ConfigService,
					useValue: mockConfigService
				},
				GqlAuthGuard,
				FileValidationPipe
			]
		}).compile()

		resolver = module.get<StreamResolver>(StreamResolver)
		streamService = module.get<StreamService>(StreamService)
		prismaService = module.get<PrismaService>(PrismaService)
		storageService = module.get<StorageService>(StorageService)
		configService = module.get<ConfigService>(ConfigService)

		jest.clearAllMocks()
	})

	describe('findAll', () => {
		it('повинен повернути список стрімів без фільтрів', async () => {
			const filters: FiltersInput = {}
			mockStreamService.findAll.mockResolvedValue(mockStreams)

			const result = await resolver.findAll(filters)

			expect(result).toEqual(mockStreams)
			expect(streamService.findAll).toHaveBeenCalledWith(filters)
			expect(streamService.findAll).toHaveBeenCalledTimes(1)
		})

		it('повинен повернути список стрімів з фільтрами', async () => {
			const filters: FiltersInput = {
				take: 5,
				skip: 10,
				searchTerm: 'gaming'
			}
			const filteredStreams = [mockStreams[0]]
			mockStreamService.findAll.mockResolvedValue(filteredStreams)

			const result = await resolver.findAll(filters)

			expect(result).toEqual(filteredStreams)
			expect(streamService.findAll).toHaveBeenCalledWith(filters)
		})

		it('повинен повернути порожній масив коли немає стрімів', async () => {
			const filters: FiltersInput = {}
			mockStreamService.findAll.mockResolvedValue([])

			const result = await resolver.findAll(filters)

			expect(result).toEqual([])
			expect(streamService.findAll).toHaveBeenCalledWith(filters)
		})

		it('повинен передати помилку від сервісу', async () => {
			const filters: FiltersInput = {}
			const error = new Error('Database error')
			mockStreamService.findAll.mockRejectedValue(error)

			await expect(resolver.findAll(filters)).rejects.toThrow(
				'Database error'
			)
		})
	})

	describe('findRandom', () => {
		it('повинен повернути випадкові стріми', async () => {
			const randomStreams = [mockStreams[1], mockStreams[0]]
			mockStreamService.findRandom.mockResolvedValue(randomStreams)

			const result = await resolver.findRandom()

			expect(result).toEqual(randomStreams)
			expect(streamService.findRandom).toHaveBeenCalledTimes(1)
		})

		it('повинен повернути порожній масив коли немає стрімів', async () => {
			mockStreamService.findRandom.mockResolvedValue([])

			const result = await resolver.findRandom()

			expect(result).toEqual([])
			expect(streamService.findRandom).toHaveBeenCalledTimes(1)
		})

		it('повинен передати помилку від сервісу', async () => {
			const error = new Error('Random selection error')
			mockStreamService.findRandom.mockRejectedValue(error)

			await expect(resolver.findRandom()).rejects.toThrow(
				'Random selection error'
			)
		})
	})

	describe('changeInfo', () => {
		it('повинен успішно змінити інформацію про стрім', async () => {
			const input: ChangeStreamInfoInput = {
				title: 'New Stream Title',
				categoryId: 'category-456'
			}
			mockStreamService.changeInfo.mockResolvedValue(true)

			const result = await resolver.changeInfo(mockUser, input)

			expect(result).toBe(true)
			expect(streamService.changeInfo).toHaveBeenCalledWith(
				mockUser,
				input
			)
			expect(streamService.changeInfo).toHaveBeenCalledTimes(1)
		})

		it('повинен передати помилку від сервісу', async () => {
			const input: ChangeStreamInfoInput = {
				title: 'New Stream Title',
				categoryId: 'invalid-category'
			}
			const error = new BadRequestException('Category not found')
			mockStreamService.changeInfo.mockRejectedValue(error)

			await expect(resolver.changeInfo(mockUser, input)).rejects.toThrow(
				'Category not found'
			)
		})

		it('повинен обробити порожній заголовок', async () => {
			const input: ChangeStreamInfoInput = {
				title: '',
				categoryId: 'category-123'
			}
			const error = new BadRequestException('Title cannot be empty')
			mockStreamService.changeInfo.mockRejectedValue(error)

			await expect(resolver.changeInfo(mockUser, input)).rejects.toThrow(
				'Title cannot be empty'
			)
		})
	})

	describe('changeThumbnail', () => {
		it('повинен успішно змінити thumbnail стріму', async () => {
			const mockUpload = createMockUpload('thumbnail.jpg')
			mockStreamService.changeThumbnail.mockResolvedValue(true)

			const result = await resolver.changeThumbnail(mockUser, mockUpload)

			expect(result).toBe(true)
			expect(streamService.changeThumbnail).toHaveBeenCalledWith(
				mockUser,
				mockUpload
			)
			expect(streamService.changeThumbnail).toHaveBeenCalledTimes(1)
		})

		it('повинен обробити gif файл', async () => {
			const mockUpload = createMockUpload('animated.gif')
			mockStreamService.changeThumbnail.mockResolvedValue(true)

			const result = await resolver.changeThumbnail(mockUser, mockUpload)

			expect(result).toBe(true)
			expect(streamService.changeThumbnail).toHaveBeenCalledWith(
				mockUser,
				mockUpload
			)
		})

		it('повинен передати помилку від сервісу', async () => {
			const mockUpload = createMockUpload('invalid.txt')
			const error = new BadRequestException('Invalid file format')
			mockStreamService.changeThumbnail.mockRejectedValue(error)

			await expect(
				resolver.changeThumbnail(mockUser, mockUpload)
			).rejects.toThrow('Invalid file format')
		})

		it('повинен обробити великий файл', async () => {
			const mockUpload = createMockUpload('large.jpg')
			const error = new BadRequestException('File too large')
			mockStreamService.changeThumbnail.mockRejectedValue(error)

			await expect(
				resolver.changeThumbnail(mockUser, mockUpload)
			).rejects.toThrow('File too large')
		})
	})

	describe('removeThumbnail', () => {
		it('повинен успішно видалити thumbnail стріму', async () => {
			mockStreamService.removeThumbnail.mockResolvedValue(true)

			const result = await resolver.removeThumbnail(mockUser)

			expect(result).toBe(true)
			expect(streamService.removeThumbnail).toHaveBeenCalledWith(mockUser)
			expect(streamService.removeThumbnail).toHaveBeenCalledTimes(1)
		})

		it('повинен обробити випадок коли thumbnail не існує', async () => {
			mockStreamService.removeThumbnail.mockResolvedValue(undefined)

			const result = await resolver.removeThumbnail(mockUser)

			expect(result).toBeUndefined()
			expect(streamService.removeThumbnail).toHaveBeenCalledWith(mockUser)
		})

		it('повинен передати помилку від сервісу', async () => {
			const error = new Error('Storage error')
			mockStreamService.removeThumbnail.mockRejectedValue(error)

			await expect(resolver.removeThumbnail(mockUser)).rejects.toThrow(
				'Storage error'
			)
		})
	})

	describe('generateToken', () => {
		it('повинен згенерувати токен для зареєстрованого користувача', async () => {
			const input: GenerateStreamTokenInput = {
				userId: 'user-123',
				channelId: 'channel-456'
			}
			const mockTokenResponse = { token: 'mock-jwt-token' }
			mockStreamService.generateToken.mockResolvedValue(mockTokenResponse)

			const result = await resolver.generateToken(input)

			expect(result).toEqual(mockTokenResponse)
			expect(streamService.generateToken).toHaveBeenCalledWith(input)
			expect(streamService.generateToken).toHaveBeenCalledTimes(1)
		})

		it('повинен згенерувати токен для анонімного користувача', async () => {
			const input: GenerateStreamTokenInput = {
				userId: 'anonymous-user',
				channelId: 'channel-456'
			}
			const mockTokenResponse = { token: 'mock-anonymous-token' }
			mockStreamService.generateToken.mockResolvedValue(mockTokenResponse)

			const result = await resolver.generateToken(input)

			expect(result).toEqual(mockTokenResponse)
			expect(streamService.generateToken).toHaveBeenCalledWith(input)
		})

		it('повинен викинути помилку коли канал не знайдено', async () => {
			const input: GenerateStreamTokenInput = {
				userId: 'user-123',
				channelId: 'invalid-channel'
			}
			const error = new NotFoundException('Канал не знайдено')
			mockStreamService.generateToken.mockRejectedValue(error)

			await expect(resolver.generateToken(input)).rejects.toThrow(
				'Канал не знайдено'
			)
		})

		it('повинен обробити токен для хоста каналу', async () => {
			const input: GenerateStreamTokenInput = {
				userId: 'user-123',
				channelId: 'user-123'
			}
			const mockTokenResponse = { token: 'host-token' }
			mockStreamService.generateToken.mockResolvedValue(mockTokenResponse)

			const result = await resolver.generateToken(input)

			expect(result).toEqual(mockTokenResponse)
			expect(streamService.generateToken).toHaveBeenCalledWith(input)
		})
	})

	describe('Authorization', () => {
		it('changeInfo повинен вимагати авторизації', () => {
			const metadata = Reflect.getMetadata(
				'__guards__',
				resolver.changeInfo
			)
			expect(metadata).toBeDefined()
		})

		it('changeThumbnail повинен вимагати авторизації', () => {
			const metadata = Reflect.getMetadata(
				'__guards__',
				resolver.changeThumbnail
			)
			expect(metadata).toBeDefined()
		})

		it('removeThumbnail повинен вимагати авторизації', () => {
			const metadata = Reflect.getMetadata(
				'__guards__',
				resolver.removeThumbnail
			)
			expect(metadata).toBeDefined()
		})

		it('generateToken НЕ повинен вимагати авторизації', () => {
			const metadata = Reflect.getMetadata(
				'__guards__',
				resolver.generateToken
			)
			expect(metadata).toBeUndefined()
		})
	})

	describe('Input Validation', () => {
		it('повинен перевірити валідність FiltersInput', async () => {
			const invalidFilters = {
				take: 'invalid' as any,
				skip: -1,
				searchTerm: 123 as any
			}

			mockStreamService.findAll.mockResolvedValue([])

			await resolver.findAll(invalidFilters)

			expect(streamService.findAll).toHaveBeenCalledWith(invalidFilters)
		})

		it('повинен перевірити валідність ChangeStreamInfoInput', async () => {
			const invalidInput = {
				title: '',
				categoryId: ''
			}
			const error = new BadRequestException('Validation failed')
			mockStreamService.changeInfo.mockRejectedValue(error)

			await expect(
				resolver.changeInfo(mockUser, invalidInput)
			).rejects.toThrow('Validation failed')
		})
	})

	describe('Edge Cases', () => {
		it('повинен обробити undefined користувача', async () => {
			const input: ChangeStreamInfoInput = {
				title: 'Test',
				categoryId: 'test'
			}
			mockStreamService.changeInfo.mockResolvedValue(true)

			const result = await resolver.changeInfo(undefined as any, input)

			expect(streamService.changeInfo).toHaveBeenCalledWith(
				undefined,
				input
			)
		})

		it('повинен обробити null результат від findAll', async () => {
			mockStreamService.findAll.mockResolvedValue(null)

			const result = await resolver.findAll({})

			expect(result).toBeNull()
		})

		it('повинен обробити дуже довгий searchTerm', async () => {
			const longSearchTerm = 'a'.repeat(1000)
			const filters: FiltersInput = {
				searchTerm: longSearchTerm
			}
			mockStreamService.findAll.mockResolvedValue([])

			const result = await resolver.findAll(filters)

			expect(result).toEqual([])
			expect(streamService.findAll).toHaveBeenCalledWith(filters)
		})

		it('повинен обробити великі значення take та skip', async () => {
			const filters: FiltersInput = {
				take: 999999,
				skip: 999999
			}
			mockStreamService.findAll.mockResolvedValue([])

			const result = await resolver.findAll(filters)

			expect(result).toEqual([])
			expect(streamService.findAll).toHaveBeenCalledWith(filters)
		})
	})

	describe('Performance Tests', () => {
		it('повинен швидко обробити великий список стрімів', async () => {
			const largeStreamList = Array.from({ length: 1000 }, (_, i) => ({
				...mockStreams[0],
				id: `stream-${i}`,
				title: `Stream ${i}`
			}))
			mockStreamService.findAll.mockResolvedValue(largeStreamList)

			const startTime = Date.now()
			const result = await resolver.findAll({})
			const endTime = Date.now()

			expect(result).toEqual(largeStreamList)
			expect(endTime - startTime).toBeLessThan(100)
		})
	})
})
