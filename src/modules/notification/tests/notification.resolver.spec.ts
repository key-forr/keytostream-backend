import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { GqlExecutionContext } from '@nestjs/graphql'
import { Test, TestingModule } from '@nestjs/testing'

import { NotificationType } from '@/prisma/generated'
import type { User } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'

import { ChangeNotificationsSettingsInput } from '../inputs/change-notifications-settings.input'
import { NotificationResolver } from '../notification.resolver'
import { NotificationService } from '../notification.service'

// Mock GqlExecutionContext
jest.mock('@nestjs/graphql', () => ({
	...jest.requireActual('@nestjs/graphql'),
	GqlExecutionContext: {
		create: jest.fn()
	}
}))

// Mock GqlAuthGuard
jest.mock('@/src/shared/guards/gql-auth.guard')

// Mock PrismaService
const mockPrismaService = {
	user: {
		findUnique: jest.fn()
	}
}

// Mock GqlAuthGuard
const mockGqlAuthGuard = {
	canActivate: jest.fn().mockResolvedValue(true)
}

describe('NotificationResolver', () => {
	let resolver: NotificationResolver
	let notificationService: NotificationService

	// Mock user for testing
	const mockUser: User = {
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
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01')
	}

	// Mock input for testing
	const mockInput: ChangeNotificationsSettingsInput = {
		siteNotifications: true,
		telegramNotifications: false
	}

	// Mock notification service
	const mockNotificationService = {
		findUnreadCount: jest.fn(),
		findByUser: jest.fn(),
		changeSettings: jest.fn()
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				NotificationResolver,
				{
					provide: NotificationService,
					useValue: mockNotificationService
				}
			]
		}).compile()

		resolver = module.get<NotificationResolver>(NotificationResolver)
		notificationService =
			module.get<NotificationService>(NotificationService)

		// Clear all mocks before each test
		jest.clearAllMocks()
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('findUnreadCount', () => {
		it('should return unread notifications count', async () => {
			// Arrange
			const expectedCount = 5
			mockNotificationService.findUnreadCount.mockResolvedValue(
				expectedCount
			)

			// Act
			const result = await resolver.findUnreadCount(mockUser)

			// Assert
			expect(result).toBe(expectedCount)
			expect(
				mockNotificationService.findUnreadCount
			).toHaveBeenCalledWith(mockUser)
			expect(
				mockNotificationService.findUnreadCount
			).toHaveBeenCalledTimes(1)
		})

		it('should return 0 when no unread notifications', async () => {
			// Arrange
			mockNotificationService.findUnreadCount.mockResolvedValue(0)

			// Act
			const result = await resolver.findUnreadCount(mockUser)

			// Assert
			expect(result).toBe(0)
			expect(
				mockNotificationService.findUnreadCount
			).toHaveBeenCalledWith(mockUser)
		})

		it('should handle service errors', async () => {
			// Arrange
			const error = new Error('Database connection failed')
			mockNotificationService.findUnreadCount.mockRejectedValue(error)

			// Act & Assert
			await expect(resolver.findUnreadCount(mockUser)).rejects.toThrow(
				'Database connection failed'
			)
			expect(
				mockNotificationService.findUnreadCount
			).toHaveBeenCalledWith(mockUser)
		})
	})

	describe('findByUser', () => {
		it('should return user notifications', async () => {
			// Arrange
			const mockNotifications = [
				{
					id: 'notification-1',
					message: 'Test notification 1',
					type: NotificationType.STREAM_START,
					isRead: false,
					userId: mockUser.id,
					user: mockUser,
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date('2024-01-01')
				},
				{
					id: 'notification-2',
					message: 'Test notification 2',
					type: NotificationType.NEW_FOLLOWER,
					isRead: true,
					userId: mockUser.id,
					user: mockUser,
					createdAt: new Date('2024-01-02'),
					updatedAt: new Date('2024-01-02')
				}
			]
			mockNotificationService.findByUser.mockResolvedValue(
				mockNotifications
			)

			// Act
			const result = await resolver.findByUser(mockUser)

			// Assert
			expect(result).toEqual(mockNotifications)
			expect(result).toHaveLength(2)
			expect(mockNotificationService.findByUser).toHaveBeenCalledWith(
				mockUser
			)
			expect(mockNotificationService.findByUser).toHaveBeenCalledTimes(1)
		})

		it('should return empty array when no notifications', async () => {
			// Arrange
			mockNotificationService.findByUser.mockResolvedValue([])

			// Act
			const result = await resolver.findByUser(mockUser)

			// Assert
			expect(result).toEqual([])
			expect(result).toHaveLength(0)
			expect(mockNotificationService.findByUser).toHaveBeenCalledWith(
				mockUser
			)
		})

		it('should handle service errors', async () => {
			// Arrange
			const error = new Error('Failed to fetch notifications')
			mockNotificationService.findByUser.mockRejectedValue(error)

			// Act & Assert
			await expect(resolver.findByUser(mockUser)).rejects.toThrow(
				'Failed to fetch notifications'
			)
			expect(mockNotificationService.findByUser).toHaveBeenCalledWith(
				mockUser
			)
		})
	})

	describe('changeSettings', () => {
		it('should change notification settings successfully', async () => {
			// Arrange
			const mockResponse = {
				notificationSettings: {
					id: 'settings-1',
					siteNotifications: true,
					telegramNotifications: false,
					userId: mockUser.id,
					user: mockUser,
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date('2024-01-01')
				}
			}
			mockNotificationService.changeSettings.mockResolvedValue(
				mockResponse
			)

			// Act
			const result = await resolver.changeSettings(mockUser, mockInput)

			// Assert
			expect(result).toEqual(mockResponse)
			expect(result.notificationSettings.siteNotifications).toBe(true)
			expect(result.notificationSettings.telegramNotifications).toBe(
				false
			)
			expect(mockNotificationService.changeSettings).toHaveBeenCalledWith(
				mockUser,
				mockInput
			)
			expect(
				mockNotificationService.changeSettings
			).toHaveBeenCalledTimes(1)
		})

		it('should return telegram auth token when telegram notifications enabled', async () => {
			// Arrange
			const inputWithTelegram: ChangeNotificationsSettingsInput = {
				siteNotifications: true,
				telegramNotifications: true
			}
			const mockResponse = {
				notificationSettings: {
					id: 'settings-1',
					siteNotifications: true,
					telegramNotifications: true,
					userId: mockUser.id,
					user: mockUser,
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date('2024-01-01')
				},
				telegramAuthToken: 'telegram-auth-token-123'
			}
			mockNotificationService.changeSettings.mockResolvedValue(
				mockResponse
			)

			// Act
			const result = await resolver.changeSettings(
				mockUser,
				inputWithTelegram
			)

			// Assert
			expect(result).toEqual(mockResponse)
			expect(result.telegramAuthToken).toBe('telegram-auth-token-123')
			expect(mockNotificationService.changeSettings).toHaveBeenCalledWith(
				mockUser,
				inputWithTelegram
			)
		})

		it('should handle both site and telegram notifications enabled', async () => {
			// Arrange
			const inputBothEnabled: ChangeNotificationsSettingsInput = {
				siteNotifications: true,
				telegramNotifications: true
			}
			const mockResponse = {
				notificationSettings: {
					id: 'settings-1',
					siteNotifications: true,
					telegramNotifications: true,
					userId: mockUser.id,
					user: mockUser,
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date('2024-01-01')
				}
			}
			mockNotificationService.changeSettings.mockResolvedValue(
				mockResponse
			)

			// Act
			const result = await resolver.changeSettings(
				mockUser,
				inputBothEnabled
			)

			// Assert
			expect(result.notificationSettings.siteNotifications).toBe(true)
			expect(result.notificationSettings.telegramNotifications).toBe(true)
			expect(mockNotificationService.changeSettings).toHaveBeenCalledWith(
				mockUser,
				inputBothEnabled
			)
		})

		it('should handle both notifications disabled', async () => {
			// Arrange
			const inputBothDisabled: ChangeNotificationsSettingsInput = {
				siteNotifications: false,
				telegramNotifications: false
			}
			const mockResponse = {
				notificationSettings: {
					id: 'settings-1',
					siteNotifications: false,
					telegramNotifications: false,
					userId: mockUser.id,
					user: mockUser,
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date('2024-01-01')
				}
			}
			mockNotificationService.changeSettings.mockResolvedValue(
				mockResponse
			)

			// Act
			const result = await resolver.changeSettings(
				mockUser,
				inputBothDisabled
			)

			// Assert
			expect(result.notificationSettings.siteNotifications).toBe(false)
			expect(result.notificationSettings.telegramNotifications).toBe(
				false
			)
			expect(mockNotificationService.changeSettings).toHaveBeenCalledWith(
				mockUser,
				inputBothDisabled
			)
		})

		it('should handle service errors', async () => {
			// Arrange
			const error = new Error('Failed to update notification settings')
			mockNotificationService.changeSettings.mockRejectedValue(error)

			// Act & Assert
			await expect(
				resolver.changeSettings(mockUser, mockInput)
			).rejects.toThrow('Failed to update notification settings')
			expect(mockNotificationService.changeSettings).toHaveBeenCalledWith(
				mockUser,
				mockInput
			)
		})

		it('should validate input parameters', async () => {
			// Arrange
			const invalidInput = {} as ChangeNotificationsSettingsInput
			const mockResponse = {
				notificationSettings: {
					id: 'settings-1',
					siteNotifications: false,
					telegramNotifications: false,
					userId: mockUser.id,
					user: mockUser,
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date('2024-01-01')
				}
			}
			mockNotificationService.changeSettings.mockResolvedValue(
				mockResponse
			)

			// Act
			const result = await resolver.changeSettings(mockUser, invalidInput)

			// Assert
			expect(mockNotificationService.changeSettings).toHaveBeenCalledWith(
				mockUser,
				invalidInput
			)
			expect(result).toEqual(mockResponse)
		})
	})

	describe('Integration tests', () => {
		it('should handle multiple operations for the same user', async () => {
			// Arrange
			const mockNotifications = [
				{
					id: 'notification-1',
					message: 'Test notification',
					type: NotificationType.STREAM_START,
					isRead: false,
					userId: mockUser.id,
					user: mockUser,
					createdAt: new Date(),
					updatedAt: new Date()
				}
			]
			const mockSettings = {
				notificationSettings: {
					id: 'settings-1',
					siteNotifications: true,
					telegramNotifications: true,
					userId: mockUser.id,
					user: mockUser,
					createdAt: new Date(),
					updatedAt: new Date()
				}
			}

			mockNotificationService.findUnreadCount.mockResolvedValue(1)
			mockNotificationService.findByUser.mockResolvedValue(
				mockNotifications
			)
			mockNotificationService.changeSettings.mockResolvedValue(
				mockSettings
			)

			// Act
			const unreadCount = await resolver.findUnreadCount(mockUser)
			const notifications = await resolver.findByUser(mockUser)
			const settings = await resolver.changeSettings(mockUser, {
				siteNotifications: true,
				telegramNotifications: true
			})

			// Assert
			expect(unreadCount).toBe(1)
			expect(notifications).toEqual(mockNotifications)
			expect(settings).toEqual(mockSettings)
			expect(
				mockNotificationService.findUnreadCount
			).toHaveBeenCalledTimes(1)
			expect(mockNotificationService.findByUser).toHaveBeenCalledTimes(1)
			expect(
				mockNotificationService.changeSettings
			).toHaveBeenCalledTimes(1)
		})
	})

	describe('Error handling', () => {
		it('should propagate service errors correctly', async () => {
			// Arrange
			const databaseError = new Error('Database connection lost')
			mockNotificationService.findUnreadCount.mockRejectedValue(
				databaseError
			)
			mockNotificationService.findByUser.mockRejectedValue(databaseError)
			mockNotificationService.changeSettings.mockRejectedValue(
				databaseError
			)

			// Act & Assert
			await expect(resolver.findUnreadCount(mockUser)).rejects.toThrow(
				'Database connection lost'
			)
			await expect(resolver.findByUser(mockUser)).rejects.toThrow(
				'Database connection lost'
			)
			await expect(
				resolver.changeSettings(mockUser, mockInput)
			).rejects.toThrow('Database connection lost')
		})
	})
})
