import { BadRequestException, ConflictException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Readable } from 'stream'

import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { FileValidationPipe } from '@/src/shared/pipes/file-validation.pipe'
import { GqlContext } from '@/src/shared/types/gql-context.types'

import { ChangeProfileInfoInput } from '../inputs/change-profile-info.input'
import {
	SocialLinkInput,
	SocialLinkOrderInput
} from '../inputs/social-link.input'
import { SocialLinkModel } from '../models/social-link.model'
import { ProfileResolver } from '../profile.resolver'
import { ProfileService } from '../profile.service'

// Mock типи для Upload
interface MockUpload {
	filename: string
	mimetype: string
	encoding: string
	createReadStream: () => Readable
}

// Mock PrismaService
const mockPrismaService = {
	user: {
		findUnique: jest.fn(),
		findMany: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn()
	},
	socialLink: {
		findMany: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		updateMany: jest.fn()
	}
	// Add other Prisma models as needed
}

// Mock GqlAuthGuard - create a class that doesn't require dependencies
class MockGqlAuthGuard {
	canActivate = jest.fn().mockReturnValue(true)
}

describe('ProfileResolver', () => {
	let resolver: ProfileResolver
	let service: ProfileService

	const mockProfileService = {
		changeAvatar: jest.fn(),
		removeAvatar: jest.fn(),
		changeInfo: jest.fn(),
		findSocialLinks: jest.fn(),
		createSocialLink: jest.fn(),
		reorderSocialLinks: jest.fn(),
		updateSocialLink: jest.fn(),
		removeSocialLink: jest.fn()
	}

	const mockUser = {
		id: '1',
		username: 'testuser',
		displayName: 'Test User',
		email: 'test@example.com',
		password: 'hashedpassword',
		avatar: 'avatar.jpg',
		bio: 'Test bio',
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

	const mockSocialLink: SocialLinkModel = {
		id: '1',
		title: 'Twitter',
		url: 'https://twitter.com/testuser',
		position: 1,
		userId: '1',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01')
	}

	const createMockUpload = (
		filename: string,
		mimetype: string = 'image/jpeg'
	): MockUpload => ({
		filename,
		mimetype,
		encoding: '7bit',
		createReadStream: () => {
			const readable = new Readable()
			readable.push(Buffer.from('mock image data'))
			readable.push(null)
			return readable
		}
	})

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProfileResolver,
				{
					provide: ProfileService,
					useValue: mockProfileService
				},
				{
					provide: 'PrismaService',
					useValue: mockPrismaService
				}
			]
		})
			.overrideGuard(GqlAuthGuard)
			.useClass(MockGqlAuthGuard)
			.compile()

		resolver = module.get<ProfileResolver>(ProfileResolver)
		service = module.get<ProfileService>(ProfileService)

		jest.clearAllMocks()
	})

	describe('changeAvatar', () => {
		it('should change user avatar successfully', async () => {
			const mockFile = createMockUpload('avatar.jpg')
			mockProfileService.changeAvatar.mockResolvedValue(true)

			const result = await resolver.changeAvatar(
				mockUser,
				mockFile as any
			)

			expect(service.changeAvatar).toHaveBeenCalledWith(
				mockUser,
				mockFile
			)
			expect(service.changeAvatar).toHaveBeenCalledTimes(1)
			expect(result).toBe(true)
		})

		it('should handle GIF files', async () => {
			const mockFile = createMockUpload('avatar.gif', 'image/gif')
			mockProfileService.changeAvatar.mockResolvedValue(true)

			const result = await resolver.changeAvatar(
				mockUser,
				mockFile as any
			)

			expect(service.changeAvatar).toHaveBeenCalledWith(
				mockUser,
				mockFile
			)
			expect(result).toBe(true)
		})

		it('should handle PNG files', async () => {
			const mockFile = createMockUpload('avatar.png', 'image/png')
			mockProfileService.changeAvatar.mockResolvedValue(true)

			const result = await resolver.changeAvatar(
				mockUser,
				mockFile as any
			)

			expect(service.changeAvatar).toHaveBeenCalledWith(
				mockUser,
				mockFile
			)
			expect(result).toBe(true)
		})

		it('should handle service errors', async () => {
			const mockFile = createMockUpload('avatar.jpg')
			const error = new Error('Storage error')
			mockProfileService.changeAvatar.mockRejectedValue(error)

			await expect(
				resolver.changeAvatar(mockUser, mockFile as any)
			).rejects.toThrow('Storage error')
			expect(service.changeAvatar).toHaveBeenCalledWith(
				mockUser,
				mockFile
			)
		})

		it('should handle large files', async () => {
			const mockFile = createMockUpload('large_avatar.jpg')
			mockProfileService.changeAvatar.mockResolvedValue(true)

			const result = await resolver.changeAvatar(
				mockUser,
				mockFile as any
			)

			expect(result).toBe(true)
		})
	})

	describe('removeAvatar', () => {
		it('should remove user avatar successfully', async () => {
			mockProfileService.removeAvatar.mockResolvedValue(true)

			const result = await resolver.removeAvatar(mockUser)

			expect(service.removeAvatar).toHaveBeenCalledWith(mockUser)
			expect(service.removeAvatar).toHaveBeenCalledTimes(1)
			expect(result).toBe(true)
		})

		it('should handle user without avatar', async () => {
			const userWithoutAvatar = { ...mockUser, avatar: null }
			mockProfileService.removeAvatar.mockResolvedValue(undefined)

			const result = await resolver.removeAvatar(userWithoutAvatar)

			expect(service.removeAvatar).toHaveBeenCalledWith(userWithoutAvatar)
			expect(result).toBeUndefined()
		})

		it('should handle storage errors', async () => {
			const error = new Error('Storage deletion failed')
			mockProfileService.removeAvatar.mockRejectedValue(error)

			await expect(resolver.removeAvatar(mockUser)).rejects.toThrow(
				'Storage deletion failed'
			)
			expect(service.removeAvatar).toHaveBeenCalledWith(mockUser)
		})
	})

	describe('changeInfo', () => {
		const validInput: ChangeProfileInfoInput = {
			username: 'newusername',
			displayName: 'New Display Name',
			bio: 'New bio'
		}

		it('should change user info successfully', async () => {
			mockProfileService.changeInfo.mockResolvedValue(true)

			const result = await resolver.changeInfo(mockUser, validInput)

			expect(service.changeInfo).toHaveBeenCalledWith(
				mockUser,
				validInput
			)
			expect(service.changeInfo).toHaveBeenCalledTimes(1)
			expect(result).toBe(true)
		})

		it('should handle username conflict', async () => {
			const conflictError = new ConflictException(
				'Імя користувача вже зайнято'
			)
			mockProfileService.changeInfo.mockRejectedValue(conflictError)

			await expect(
				resolver.changeInfo(mockUser, validInput)
			).rejects.toThrow(ConflictException)
			await expect(
				resolver.changeInfo(mockUser, validInput)
			).rejects.toThrow('Імя користувача вже зайнято')
			expect(service.changeInfo).toHaveBeenCalledWith(
				mockUser,
				validInput
			)
		})

		it('should handle input without bio', async () => {
			const inputWithoutBio = {
				username: 'newusername',
				displayName: 'New Display Name'
			}
			mockProfileService.changeInfo.mockResolvedValue(true)

			const result = await resolver.changeInfo(
				mockUser,
				inputWithoutBio as ChangeProfileInfoInput
			)

			expect(service.changeInfo).toHaveBeenCalledWith(
				mockUser,
				inputWithoutBio
			)
			expect(result).toBe(true)
		})

		it('should handle special characters in username', async () => {
			const inputWithSpecialChars = {
				username: 'user-name-123',
				displayName: 'User Name',
				bio: 'Bio'
			}
			mockProfileService.changeInfo.mockResolvedValue(true)

			const result = await resolver.changeInfo(
				mockUser,
				inputWithSpecialChars
			)

			expect(service.changeInfo).toHaveBeenCalledWith(
				mockUser,
				inputWithSpecialChars
			)
			expect(result).toBe(true)
		})

		it('should handle long bio', async () => {
			const inputWithLongBio = {
				username: 'username',
				displayName: 'Display Name',
				bio: 'A'.repeat(300) // Max length bio
			}
			mockProfileService.changeInfo.mockResolvedValue(true)

			const result = await resolver.changeInfo(mockUser, inputWithLongBio)

			expect(result).toBe(true)
		})
	})

	describe('findSocialLinks', () => {
		it('should return user social links', async () => {
			const mockSocialLinks = [
				mockSocialLink,
				{ ...mockSocialLink, id: '2', position: 2 }
			]
			mockProfileService.findSocialLinks.mockResolvedValue(
				mockSocialLinks
			)

			const result = await resolver.findSocialLinks(mockUser)

			expect(service.findSocialLinks).toHaveBeenCalledWith(mockUser)
			expect(service.findSocialLinks).toHaveBeenCalledTimes(1)
			expect(result).toEqual(mockSocialLinks)
			expect(result).toHaveLength(2)
		})

		it('should return empty array when no social links', async () => {
			mockProfileService.findSocialLinks.mockResolvedValue([])

			const result = await resolver.findSocialLinks(mockUser)

			expect(service.findSocialLinks).toHaveBeenCalledWith(mockUser)
			expect(result).toEqual([])
			expect(result).toHaveLength(0)
		})

		it('should handle database errors', async () => {
			const error = new Error('Database error')
			mockProfileService.findSocialLinks.mockRejectedValue(error)

			await expect(resolver.findSocialLinks(mockUser)).rejects.toThrow(
				'Database error'
			)
			expect(service.findSocialLinks).toHaveBeenCalledWith(mockUser)
		})
	})

	describe('createSocialLink', () => {
		const validInput: SocialLinkInput = {
			title: 'Instagram',
			url: 'https://instagram.com/testuser'
		}

		it('should create social link successfully', async () => {
			mockProfileService.createSocialLink.mockResolvedValue(true)

			const result = await resolver.createSocialLink(mockUser, validInput)

			expect(service.createSocialLink).toHaveBeenCalledWith(
				mockUser,
				validInput
			)
			expect(service.createSocialLink).toHaveBeenCalledTimes(1)
			expect(result).toBe(true)
		})

		it('should handle different social platforms', async () => {
			const platforms = [
				{ title: 'Twitter', url: 'https://twitter.com/user' },
				{ title: 'YouTube', url: 'https://youtube.com/user' },
				{ title: 'TikTok', url: 'https://tiktok.com/@user' },
				{ title: 'Discord', url: 'https://discord.gg/user' }
			]

			for (const platform of platforms) {
				mockProfileService.createSocialLink.mockResolvedValue(true)
				const result = await resolver.createSocialLink(
					mockUser,
					platform
				)
				expect(result).toBe(true)
			}

			expect(service.createSocialLink).toHaveBeenCalledTimes(
				platforms.length
			)
		})

		it('should handle database errors', async () => {
			const error = new Error('Database constraint violation')
			mockProfileService.createSocialLink.mockRejectedValue(error)

			await expect(
				resolver.createSocialLink(mockUser, validInput)
			).rejects.toThrow('Database constraint violation')
			expect(service.createSocialLink).toHaveBeenCalledWith(
				mockUser,
				validInput
			)
		})
	})

	describe('reorderSocialLinks', () => {
		const validList: SocialLinkOrderInput[] = [
			{ id: '1', position: 2 },
			{ id: '2', position: 1 }
		]

		it('should reorder social links successfully', async () => {
			mockProfileService.reorderSocialLinks.mockResolvedValue(true)

			const result = await resolver.reorderSocialLinks(validList)

			expect(service.reorderSocialLinks).toHaveBeenCalledWith(validList)
			expect(service.reorderSocialLinks).toHaveBeenCalledTimes(1)
			expect(result).toBe(true)
		})

		it('should handle empty list', async () => {
			mockProfileService.reorderSocialLinks.mockResolvedValue(undefined)

			const result = await resolver.reorderSocialLinks([])

			expect(service.reorderSocialLinks).toHaveBeenCalledWith([])
			expect(result).toBeUndefined()
		})

		it('should handle single item list', async () => {
			const singleItem = [{ id: '1', position: 1 }]
			mockProfileService.reorderSocialLinks.mockResolvedValue(true)

			const result = await resolver.reorderSocialLinks(singleItem)

			expect(service.reorderSocialLinks).toHaveBeenCalledWith(singleItem)
			expect(result).toBe(true)
		})

		it('should handle large reorder lists', async () => {
			const largeList = Array.from({ length: 10 }, (_, i) => ({
				id: `${i + 1}`,
				position: 10 - i
			}))
			mockProfileService.reorderSocialLinks.mockResolvedValue(true)

			const result = await resolver.reorderSocialLinks(largeList)

			expect(service.reorderSocialLinks).toHaveBeenCalledWith(largeList)
			expect(result).toBe(true)
		})

		it('should handle database transaction errors', async () => {
			const error = new Error('Transaction failed')
			mockProfileService.reorderSocialLinks.mockRejectedValue(error)

			await expect(
				resolver.reorderSocialLinks(validList)
			).rejects.toThrow('Transaction failed')
			expect(service.reorderSocialLinks).toHaveBeenCalledWith(validList)
		})
	})

	describe('updateSocialLink', () => {
		const socialLinkId = '1'
		const validInput: SocialLinkInput = {
			title: 'Updated Twitter',
			url: 'https://twitter.com/updated_user'
		}

		it('should update social link successfully', async () => {
			mockProfileService.updateSocialLink.mockResolvedValue(true)

			const result = await resolver.updateSocialLink(
				socialLinkId,
				validInput
			)

			expect(service.updateSocialLink).toHaveBeenCalledWith(
				socialLinkId,
				validInput
			)
			expect(service.updateSocialLink).toHaveBeenCalledTimes(1)
			expect(result).toBe(true)
		})

		it('should handle non-existent social link', async () => {
			const error = new Error('Social link not found')
			mockProfileService.updateSocialLink.mockRejectedValue(error)

			await expect(
				resolver.updateSocialLink('nonexistent', validInput)
			).rejects.toThrow('Social link not found')
			expect(service.updateSocialLink).toHaveBeenCalledWith(
				'nonexistent',
				validInput
			)
		})

		it('should handle URL format changes', async () => {
			const urlFormats = [
				'https://example.com',
				'http://example.com',
				'https://subdomain.example.com/path',
				'https://example.com/user?param=value'
			]

			for (const url of urlFormats) {
				const input = { title: 'Test', url }
				mockProfileService.updateSocialLink.mockResolvedValue(true)

				const result = await resolver.updateSocialLink(
					socialLinkId,
					input
				)
				expect(result).toBe(true)
			}

			expect(service.updateSocialLink).toHaveBeenCalledTimes(
				urlFormats.length
			)
		})
	})

	describe('removeSocialLink', () => {
		it('should remove social link successfully', async () => {
			const socialLinkId = '1'
			mockProfileService.removeSocialLink.mockResolvedValue(true)

			const result = await resolver.removeSocialLink(socialLinkId)

			expect(service.removeSocialLink).toHaveBeenCalledWith(socialLinkId)
			expect(service.removeSocialLink).toHaveBeenCalledTimes(1)
			expect(result).toBe(true)
		})

		it('should handle non-existent social link', async () => {
			const error = new Error('Social link not found')
			mockProfileService.removeSocialLink.mockRejectedValue(error)

			await expect(
				resolver.removeSocialLink('nonexistent')
			).rejects.toThrow('Social link not found')
			expect(service.removeSocialLink).toHaveBeenCalledWith('nonexistent')
		})

		it('should handle database constraint errors', async () => {
			const error = new Error('Foreign key constraint')
			mockProfileService.removeSocialLink.mockRejectedValue(error)

			await expect(resolver.removeSocialLink('1')).rejects.toThrow(
				'Foreign key constraint'
			)
			expect(service.removeSocialLink).toHaveBeenCalledWith('1')
		})
	})

	describe('constructor', () => {
		it('should be defined', () => {
			expect(resolver).toBeDefined()
		})

		it('should have profileService injected', () => {
			expect(resolver['profileService']).toBeDefined()
			expect(resolver['profileService']).toBe(service)
		})
	})

	describe('integration tests', () => {
		it('should handle complete profile update flow', async () => {
			const changeInfoInput = {
				username: 'newuser',
				displayName: 'New User',
				bio: 'Updated bio'
			}
			const socialLinkInput = {
				title: 'Twitter',
				url: 'https://twitter.com/newuser'
			}

			mockProfileService.changeInfo.mockResolvedValue(true)
			mockProfileService.createSocialLink.mockResolvedValue(true)
			mockProfileService.findSocialLinks.mockResolvedValue([
				mockSocialLink
			])

			const infoResult = await resolver.changeInfo(
				mockUser,
				changeInfoInput
			)
			const linkResult = await resolver.createSocialLink(
				mockUser,
				socialLinkInput
			)
			const linksResult = await resolver.findSocialLinks(mockUser)

			expect(infoResult).toBe(true)
			expect(linkResult).toBe(true)
			expect(linksResult).toEqual([mockSocialLink])
		})

		it('should handle avatar operations', async () => {
			const mockFile = createMockUpload('avatar.jpg')
			mockProfileService.changeAvatar.mockResolvedValue(true)
			mockProfileService.removeAvatar.mockResolvedValue(true)

			const changeResult = await resolver.changeAvatar(
				mockUser,
				mockFile as any
			)
			const removeResult = await resolver.removeAvatar(mockUser)

			expect(changeResult).toBe(true)
			expect(removeResult).toBe(true)
			expect(service.changeAvatar).toHaveBeenCalledWith(
				mockUser,
				mockFile
			)
			expect(service.removeAvatar).toHaveBeenCalledWith(mockUser)
		})

		it('should handle concurrent social link operations', async () => {
			const createInput = {
				title: 'Instagram',
				url: 'https://instagram.com/user'
			}
			const updateInput = {
				title: 'Updated Twitter',
				url: 'https://twitter.com/updated'
			}
			const reorderList = [
				{ id: '1', position: 2 },
				{ id: '2', position: 1 }
			]

			mockProfileService.createSocialLink.mockResolvedValue(true)
			mockProfileService.updateSocialLink.mockResolvedValue(true)
			mockProfileService.reorderSocialLinks.mockResolvedValue(true)

			const promises = [
				resolver.createSocialLink(mockUser, createInput),
				resolver.updateSocialLink('1', updateInput),
				resolver.reorderSocialLinks(reorderList)
			]

			const results = await Promise.all(promises)

			expect(results).toEqual([true, true, true])
			expect(service.createSocialLink).toHaveBeenCalledWith(
				mockUser,
				createInput
			)
			expect(service.updateSocialLink).toHaveBeenCalledWith(
				'1',
				updateInput
			)
			expect(service.reorderSocialLinks).toHaveBeenCalledWith(reorderList)
		})
	})
})
