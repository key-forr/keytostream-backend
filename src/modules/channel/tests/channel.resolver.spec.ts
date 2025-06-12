import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'

import { UserModel } from '../../auth/account/models/user.model'
import { SubscriptionModel } from '../../sponsorship/subscription/models/subscription.model'
import { ChannelResolver } from '../channel.resolver'
import { ChannelService } from '../channel.service'

describe('ChannelResolver', () => {
	let resolver: ChannelResolver
	let service: ChannelService

	const mockChannelService = {
		findRecommended: jest.fn(),
		findByUsername: jest.fn(),
		findFollowersCountByChannel: jest.fn(),
		findSponsorsByChannel: jest.fn()
	}

	const mockUser: Partial<UserModel> = {
		id: '1',
		username: 'testuser',
		displayName: 'Test User',
		email: 'test@example.com',
		isDeactivated: false,
		isVerified: true,
		avatar: 'avatar.jpg',
		bio: 'Test bio',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01')
	}

	const mockSubscription: Partial<SubscriptionModel> = {
		id: '1',
		userId: '1',
		channelId: '2',
		planId: 'plan-1',
		expiresAt: new Date('2024-12-31'),
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01')
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ChannelResolver,
				{
					provide: ChannelService,
					useValue: mockChannelService
				}
			]
		}).compile()

		resolver = module.get<ChannelResolver>(ChannelResolver)
		service = module.get<ChannelService>(ChannelService)

		// Очищуємо всі моки перед кожним тестом
		jest.clearAllMocks()
	})

	describe('findRecommended', () => {
		it('should return array of recommended channels', async () => {
			const mockRecommendedChannels = [
				mockUser,
				{ ...mockUser, id: '2', username: 'testuser2' }
			]
			mockChannelService.findRecommended.mockResolvedValue(
				mockRecommendedChannels
			)

			const result = await resolver.findRecommended()

			expect(service.findRecommended).toHaveBeenCalledTimes(1)
			expect(result).toEqual(mockRecommendedChannels)
			expect(result).toHaveLength(2)
		})

		it('should return empty array when no recommended channels found', async () => {
			mockChannelService.findRecommended.mockResolvedValue([])

			const result = await resolver.findRecommended()

			expect(service.findRecommended).toHaveBeenCalledTimes(1)
			expect(result).toEqual([])
			expect(result).toHaveLength(0)
		})

		it('should handle service errors', async () => {
			const error = new Error('Database connection failed')
			mockChannelService.findRecommended.mockRejectedValue(error)

			await expect(resolver.findRecommended()).rejects.toThrow(
				'Database connection failed'
			)
			expect(service.findRecommended).toHaveBeenCalledTimes(1)
		})
	})

	describe('findByUsername', () => {
		it('should return channel by username', async () => {
			const username = 'testuser'
			mockChannelService.findByUsername.mockResolvedValue(mockUser)

			const result = await resolver.findByUsername(username)

			expect(service.findByUsername).toHaveBeenCalledWith(username)
			expect(service.findByUsername).toHaveBeenCalledTimes(1)
			expect(result).toEqual(mockUser)
		})

		it('should throw NotFoundException when channel not found', async () => {
			const username = 'nonexistentuser'
			const notFoundError = new NotFoundException('Канал не знайдено')
			mockChannelService.findByUsername.mockRejectedValue(notFoundError)

			await expect(resolver.findByUsername(username)).rejects.toThrow(
				NotFoundException
			)
			await expect(resolver.findByUsername(username)).rejects.toThrow(
				'Канал не знайдено'
			)
			expect(service.findByUsername).toHaveBeenCalledWith(username)
		})

		it('should handle empty username', async () => {
			const username = ''
			mockChannelService.findByUsername.mockResolvedValue(null)

			const result = await resolver.findByUsername(username)

			expect(service.findByUsername).toHaveBeenCalledWith('')
			expect(result).toBeNull()
		})

		it('should handle special characters in username', async () => {
			const username = 'test-user_123'
			mockChannelService.findByUsername.mockResolvedValue(mockUser)

			const result = await resolver.findByUsername(username)

			expect(service.findByUsername).toHaveBeenCalledWith(username)
			expect(result).toEqual(mockUser)
		})
	})

	describe('findFollowersCountByChannel', () => {
		it('should return followers count for channel', async () => {
			const channelId = '123'
			const followersCount = 42
			mockChannelService.findFollowersCountByChannel.mockResolvedValue(
				followersCount
			)

			const result = await resolver.findFollowersCountByChannel(channelId)

			expect(service.findFollowersCountByChannel).toHaveBeenCalledWith(
				channelId
			)
			expect(service.findFollowersCountByChannel).toHaveBeenCalledTimes(1)
			expect(result).toBe(followersCount)
			expect(typeof result).toBe('number')
		})

		it('should return 0 when channel has no followers', async () => {
			const channelId = '123'
			mockChannelService.findFollowersCountByChannel.mockResolvedValue(0)

			const result = await resolver.findFollowersCountByChannel(channelId)

			expect(service.findFollowersCountByChannel).toHaveBeenCalledWith(
				channelId
			)
			expect(result).toBe(0)
		})

		it('should handle invalid channel ID', async () => {
			const channelId = 'invalid-id'
			const error = new Error('Invalid channel ID')
			mockChannelService.findFollowersCountByChannel.mockRejectedValue(
				error
			)

			await expect(
				resolver.findFollowersCountByChannel(channelId)
			).rejects.toThrow('Invalid channel ID')
			expect(service.findFollowersCountByChannel).toHaveBeenCalledWith(
				channelId
			)
		})

		it('should handle large follower counts', async () => {
			const channelId = '123'
			const largeCount = 1000000
			mockChannelService.findFollowersCountByChannel.mockResolvedValue(
				largeCount
			)

			const result = await resolver.findFollowersCountByChannel(channelId)

			expect(result).toBe(largeCount)
		})
	})

	describe('findSponsorsByChannel', () => {
		it('should return sponsors for channel', async () => {
			const channelId = '123'
			const mockSponsors = [
				mockSubscription,
				{ ...mockSubscription, id: '2', userId: '3' }
			]
			mockChannelService.findSponsorsByChannel.mockResolvedValue(
				mockSponsors
			)

			const result = await resolver.findSponsorsByChannel(channelId)

			expect(service.findSponsorsByChannel).toHaveBeenCalledWith(
				channelId
			)
			expect(service.findSponsorsByChannel).toHaveBeenCalledTimes(1)
			expect(result).toEqual(mockSponsors)
			expect(result).toHaveLength(2)
		})

		it('should return empty array when channel has no sponsors', async () => {
			const channelId = '123'
			mockChannelService.findSponsorsByChannel.mockResolvedValue([])

			const result = await resolver.findSponsorsByChannel(channelId)

			expect(service.findSponsorsByChannel).toHaveBeenCalledWith(
				channelId
			)
			expect(result).toEqual([])
			expect(result).toHaveLength(0)
		})

		it('should throw NotFoundException when channel not found', async () => {
			const channelId = 'nonexistent-id'
			const notFoundError = new NotFoundException('Канал не знайдено')
			mockChannelService.findSponsorsByChannel.mockRejectedValue(
				notFoundError
			)

			await expect(
				resolver.findSponsorsByChannel(channelId)
			).rejects.toThrow(NotFoundException)
			await expect(
				resolver.findSponsorsByChannel(channelId)
			).rejects.toThrow('Канал не знайдено')
			expect(service.findSponsorsByChannel).toHaveBeenCalledWith(
				channelId
			)
		})

		it('should handle database errors', async () => {
			const channelId = '123'
			const error = new Error('Database error')
			mockChannelService.findSponsorsByChannel.mockRejectedValue(error)

			await expect(
				resolver.findSponsorsByChannel(channelId)
			).rejects.toThrow('Database error')
			expect(service.findSponsorsByChannel).toHaveBeenCalledWith(
				channelId
			)
		})
	})

	describe('constructor', () => {
		it('should be defined', () => {
			expect(resolver).toBeDefined()
		})

		it('should have channelService injected', () => {
			expect(resolver['channelService']).toBeDefined()
			expect(resolver['channelService']).toBe(service)
		})
	})

	describe('integration tests', () => {
		it('should handle multiple concurrent requests', async () => {
			const username = 'testuser'
			const channelId = '123'
			mockChannelService.findByUsername.mockResolvedValue(mockUser)
			mockChannelService.findFollowersCountByChannel.mockResolvedValue(10)

			const promises = [
				resolver.findByUsername(username),
				resolver.findFollowersCountByChannel(channelId)
			]

			const results = await Promise.all(promises)

			expect(results[0]).toEqual(mockUser)
			expect(results[1]).toBe(10)
			expect(service.findByUsername).toHaveBeenCalledWith(username)
			expect(service.findFollowersCountByChannel).toHaveBeenCalledWith(
				channelId
			)
		})

		it('should maintain service call order', async () => {
			mockChannelService.findRecommended.mockResolvedValue([mockUser])
			mockChannelService.findByUsername.mockResolvedValue(mockUser)

			await resolver.findRecommended()
			await resolver.findByUsername('testuser')

			expect(service.findRecommended).toHaveBeenCalledTimes(1)
			expect(service.findByUsername).toHaveBeenCalledTimes(1)
			expect(service.findByUsername).toHaveBeenCalledWith('testuser')
		})
	})
})
