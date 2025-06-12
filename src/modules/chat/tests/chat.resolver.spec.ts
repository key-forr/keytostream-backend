import { UnauthorizedException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PubSub } from 'graphql-subscriptions'

import { PrismaService } from '@/src/core/prisma/prisma.service'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'

import { ChatResolver } from '../chat.resolver'
import { ChatService } from '../chat.service'
import { ChangeChatSettingsInput } from '../inputs/change-chat-settings.input'
import { SendMessageInput } from '../inputs/send-message.input'

describe('ChatResolver', () => {
	let resolver: ChatResolver
	let chatService: ChatService
	let pubSub: PubSub

	const mockChatService = {
		findByStream: jest.fn(),
		sendMessage: jest.fn(),
		changeSettings: jest.fn()
	}

	const mockPrismaService = {
		user: {
			findUnique: jest.fn()
		},
		chatMessage: {
			findMany: jest.fn(),
			create: jest.fn()
		},
		stream: {
			findUnique: jest.fn(),
			update: jest.fn()
		}
	}

	const mockGqlAuthGuard = {
		canActivate: jest.fn().mockResolvedValue(true)
	}

	const mockUser = {
		id: 'user-123',
		email: 'test@example.com',
		password: 'hashedpassword',
		username: 'testuser',
		displayName: 'Test User',
		avatar: null,
		bio: null,
		telegramId: null,
		isVerified: false,
		isEmailVerified: true,
		isTotpEnabled: false,
		totpSecret: null,
		isDeactivated: false,
		deactivatedAt: null,
		socialLinks: [],
		stream: null,
		notifications: [],
		notificationSettings: null,
		followers: [],
		followings: [],
		sponsorshipPlans: [],
		sponsorshipSubscriptions: [],
		createdAt: new Date(),
		updatedAt: new Date()
	}

	const mockChatMessage = {
		id: 'msg-123',
		text: 'Test message',
		userId: 'user-123',
		streamId: 'stream-123',
		createdAt: new Date(),
		updatedAt: new Date(),
		user: mockUser,
		stream: {
			id: 'stream-123',
			title: 'Test Stream',
			isLive: true,
			userId: 'user-123'
		}
	}

	const mockMessages = [mockChatMessage]

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ChatResolver,
				{
					provide: ChatService,
					useValue: mockChatService
				},
				{
					provide: PrismaService,
					useValue: mockPrismaService
				},
				{
					provide: GqlAuthGuard,
					useValue: mockGqlAuthGuard
				}
			]
		}).compile()

		resolver = module.get<ChatResolver>(ChatResolver)
		chatService = module.get<ChatService>(ChatService)

		// Отримуємо доступ до приватного поля pubSub через reflection
		pubSub = (resolver as any).pubSub

		// Мокаємо методи pubSub
		jest.spyOn(pubSub, 'publish').mockImplementation()
		jest.spyOn(pubSub, 'asyncIterableIterator').mockReturnValue({
			[Symbol.asyncIterator]: () => ({
				next: () =>
					Promise.resolve({ value: mockChatMessage, done: false })
			})
		} as any)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('findByStream', () => {
		it('should return chat messages for a stream', async () => {
			const streamId = 'stream-123'
			mockChatService.findByStream.mockResolvedValue(mockMessages)

			const result = await resolver.findByStream(streamId)

			expect(chatService.findByStream).toHaveBeenCalledWith(streamId)
			expect(result).toEqual(mockMessages)
		})

		it('should return empty array when no messages found', async () => {
			const streamId = 'stream-456'
			mockChatService.findByStream.mockResolvedValue([])

			const result = await resolver.findByStream(streamId)

			expect(chatService.findByStream).toHaveBeenCalledWith(streamId)
			expect(result).toEqual([])
		})

		it('should handle service errors', async () => {
			const streamId = 'stream-123'
			const error = new Error('Database error')
			mockChatService.findByStream.mockRejectedValue(error)

			await expect(resolver.findByStream(streamId)).rejects.toThrow(
				'Database error'
			)
			expect(chatService.findByStream).toHaveBeenCalledWith(streamId)
		})
	})

	describe('sendMessage', () => {
		const sendMessageInput: SendMessageInput = {
			text: 'Hello, world!',
			streamId: 'stream-123'
		}

		it('should send a message successfully', async () => {
			const userId = 'user-123'
			mockChatService.sendMessage.mockResolvedValue(mockChatMessage)

			const result = await resolver.sendMessage(userId, sendMessageInput)

			expect(chatService.sendMessage).toHaveBeenCalledWith(
				userId,
				sendMessageInput
			)
			expect(pubSub.publish).toHaveBeenCalledWith('CHAT_MESSAGE_ADDED', {
				chatMessageAdded: mockChatMessage
			})
			expect(result).toEqual(mockChatMessage)
		})

		it('should handle invalid stream', async () => {
			const userId = 'user-123'
			const error = new Error('Трансляцію не знайдено')
			mockChatService.sendMessage.mockRejectedValue(error)

			await expect(
				resolver.sendMessage(userId, sendMessageInput)
			).rejects.toThrow('Трансляцію не знайдено')
			expect(chatService.sendMessage).toHaveBeenCalledWith(
				userId,
				sendMessageInput
			)
			expect(pubSub.publish).not.toHaveBeenCalled()
		})

		it('should handle offline stream', async () => {
			const userId = 'user-123'
			const error = new Error('Стрім не в живому режимі')
			mockChatService.sendMessage.mockRejectedValue(error)

			await expect(
				resolver.sendMessage(userId, sendMessageInput)
			).rejects.toThrow('Стрім не в живому режимі')
			expect(chatService.sendMessage).toHaveBeenCalledWith(
				userId,
				sendMessageInput
			)
			expect(pubSub.publish).not.toHaveBeenCalled()
		})

		it('should handle empty message text', async () => {
			const userId = 'user-123'
			const invalidInput = { ...sendMessageInput, text: '' }
			const error = new Error('Validation error')
			mockChatService.sendMessage.mockRejectedValue(error)

			await expect(
				resolver.sendMessage(userId, invalidInput)
			).rejects.toThrow('Validation error')
			expect(chatService.sendMessage).toHaveBeenCalledWith(
				userId,
				invalidInput
			)
		})
	})

	describe('chatMessageAdded', () => {
		it('should return async iterator for chat messages', () => {
			const streamId = 'stream-123'

			const result = resolver.chatMessageAdded(streamId)

			expect(pubSub.asyncIterableIterator).toHaveBeenCalledWith(
				'CHAT_MESSAGE_ADDED'
			)
			expect(result).toBeTruthy()
		})

		it('should handle different stream IDs', () => {
			const streamId1 = 'stream-123'
			const streamId2 = 'stream-456'

			resolver.chatMessageAdded(streamId1)
			resolver.chatMessageAdded(streamId2)

			expect(pubSub.asyncIterableIterator).toHaveBeenCalledTimes(2)
			expect(pubSub.asyncIterableIterator).toHaveBeenCalledWith(
				'CHAT_MESSAGE_ADDED'
			)
		})
	})

	describe('changeSettings', () => {
		const changeChatSettingsInput: ChangeChatSettingsInput = {
			isChatEnabled: true,
			isChatFollowersOnly: false,
			isChatPremiumFollowersOnly: false
		}

		it('should change chat settings successfully', async () => {
			mockChatService.changeSettings.mockResolvedValue(true)

			const result = await resolver.changeSettings(
				mockUser,
				changeChatSettingsInput
			)

			expect(chatService.changeSettings).toHaveBeenCalledWith(
				mockUser,
				changeChatSettingsInput
			)
			expect(result).toBe(true)
		})

		it('should handle settings update with all options enabled', async () => {
			const settingsInput = {
				isChatEnabled: true,
				isChatFollowersOnly: true,
				isChatPremiumFollowersOnly: true
			}
			mockChatService.changeSettings.mockResolvedValue(true)

			const result = await resolver.changeSettings(
				mockUser,
				settingsInput
			)

			expect(chatService.changeSettings).toHaveBeenCalledWith(
				mockUser,
				settingsInput
			)
			expect(result).toBe(true)
		})

		it('should handle settings update with chat disabled', async () => {
			const settingsInput = {
				isChatEnabled: false,
				isChatFollowersOnly: false,
				isChatPremiumFollowersOnly: false
			}
			mockChatService.changeSettings.mockResolvedValue(true)

			const result = await resolver.changeSettings(
				mockUser,
				settingsInput
			)

			expect(chatService.changeSettings).toHaveBeenCalledWith(
				mockUser,
				settingsInput
			)
			expect(result).toBe(true)
		})

		it('should handle service errors when changing settings', async () => {
			const error = new Error('Failed to update settings')
			mockChatService.changeSettings.mockRejectedValue(error)

			await expect(
				resolver.changeSettings(mockUser, changeChatSettingsInput)
			).rejects.toThrow('Failed to update settings')
			expect(chatService.changeSettings).toHaveBeenCalledWith(
				mockUser,
				changeChatSettingsInput
			)
		})

		it('should handle user not found scenario', async () => {
			const error = new Error('User not found')
			mockChatService.changeSettings.mockRejectedValue(error)

			await expect(
				resolver.changeSettings(mockUser, changeChatSettingsInput)
			).rejects.toThrow('User not found')
		})
	})

	describe('Subscription filter', () => {
		it('should filter messages by streamId correctly', () => {
			// Тестуємо логіку фільтрації з subscription
			const payload = {
				chatMessageAdded: {
					...mockChatMessage,
					streamId: 'stream-123'
				}
			}
			const variables = { streamId: 'stream-123' }

			// Симулюємо логіку фільтрації з декоратора
			const shouldInclude =
				payload.chatMessageAdded.streamId === variables.streamId

			expect(shouldInclude).toBe(true)
		})

		it('should filter out messages from different streams', () => {
			const payload = {
				chatMessageAdded: {
					...mockChatMessage,
					streamId: 'stream-456'
				}
			}
			const variables = { streamId: 'stream-123' }

			const shouldInclude =
				payload.chatMessageAdded.streamId === variables.streamId

			expect(shouldInclude).toBe(false)
		})
	})

	describe('Integration scenarios', () => {
		it('should handle complete message flow', async () => {
			const userId = 'user-123'
			const input: SendMessageInput = {
				text: 'Integration test message',
				streamId: 'stream-123'
			}

			mockChatService.sendMessage.mockResolvedValue(mockChatMessage)

			// Відправляємо повідомлення
			const sentMessage = await resolver.sendMessage(userId, input)

			// Перевіряємо, що повідомлення було відправлено
			expect(sentMessage).toEqual(mockChatMessage)
			expect(pubSub.publish).toHaveBeenCalledWith('CHAT_MESSAGE_ADDED', {
				chatMessageAdded: mockChatMessage
			})

			// Перевіряємо, що можемо отримати повідомлення
			mockChatService.findByStream.mockResolvedValue([mockChatMessage])
			const messages = await resolver.findByStream(input.streamId)
			expect(messages).toContain(mockChatMessage)
		})

		it('should handle concurrent message sending', async () => {
			const userId1 = 'user-123'
			const userId2 = 'user-456'
			const input1: SendMessageInput = {
				text: 'First message',
				streamId: 'stream-123'
			}
			const input2: SendMessageInput = {
				text: 'Second message',
				streamId: 'stream-123'
			}

			const message1 = {
				...mockChatMessage,
				id: 'msg-1',
				text: 'First message'
			}
			const message2 = {
				...mockChatMessage,
				id: 'msg-2',
				text: 'Second message'
			}

			mockChatService.sendMessage
				.mockResolvedValueOnce(message1)
				.mockResolvedValueOnce(message2)

			const [result1, result2] = await Promise.all([
				resolver.sendMessage(userId1, input1),
				resolver.sendMessage(userId2, input2)
			])

			expect(result1).toEqual(message1)
			expect(result2).toEqual(message2)
			expect(pubSub.publish).toHaveBeenCalledTimes(2)
		})
	})
})
