import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import type { Request } from 'express'

import { GqlContext } from '@/src/shared/types/gql-context.types'

import { NewPasswordInput } from '../inputs/new-password.input'
import { ResetPasswordInput } from '../inputs/reset-password.input'
import { PasswordRecoveryResolver } from '../password-recovery.resolver'
import { PasswordRecoveryService } from '../password-recovery.service'

describe('PasswordRecoveryResolver', () => {
	let resolver: PasswordRecoveryResolver
	let passwordRecoveryService: PasswordRecoveryService

	const mockPasswordRecoveryService = {
		resetPassword: jest.fn(),
		newPassword: jest.fn()
	}

	const mockRequest = {
		ip: '127.0.0.1',
		headers: {
			'user-agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
		},
		connection: {
			remoteAddress: '127.0.0.1'
		}
	} as unknown as Request

	const mockGqlContext: GqlContext = {
		req: mockRequest,
		res: {} as any
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PasswordRecoveryResolver,
				{
					provide: PasswordRecoveryService,
					useValue: mockPasswordRecoveryService
				}
			]
		}).compile()

		resolver = module.get<PasswordRecoveryResolver>(
			PasswordRecoveryResolver
		)
		passwordRecoveryService = module.get<PasswordRecoveryService>(
			PasswordRecoveryService
		)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('resetPassword', () => {
		const resetPasswordInput: ResetPasswordInput = {
			email: 'test@example.com'
		}

		const userAgent =
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

		it('should reset password successfully', async () => {
			mockPasswordRecoveryService.resetPassword.mockResolvedValue(true)

			const result = await resolver.resetPassword(
				mockGqlContext,
				resetPasswordInput,
				userAgent
			)

			expect(passwordRecoveryService.resetPassword).toHaveBeenCalledWith(
				mockRequest,
				resetPasswordInput,
				userAgent
			)
			expect(result).toBe(true)
		})

		it('should handle user not found', async () => {
			const error = new NotFoundException('Користувача не найдено')
			mockPasswordRecoveryService.resetPassword.mockRejectedValue(error)

			await expect(
				resolver.resetPassword(
					mockGqlContext,
					resetPasswordInput,
					userAgent
				)
			).rejects.toThrow('Користувача не найдено')

			expect(passwordRecoveryService.resetPassword).toHaveBeenCalledWith(
				mockRequest,
				resetPasswordInput,
				userAgent
			)
		})

		it('should handle invalid email format', async () => {
			const invalidInput = { email: 'invalid-email' }
			const error = new BadRequestException('Invalid email format')
			mockPasswordRecoveryService.resetPassword.mockRejectedValue(error)

			await expect(
				resolver.resetPassword(
					mockGqlContext,
					invalidInput as ResetPasswordInput,
					userAgent
				)
			).rejects.toThrow('Invalid email format')
		})

		it('should handle empty email', async () => {
			const emptyEmailInput = { email: '' }
			const error = new BadRequestException('Email cannot be empty')
			mockPasswordRecoveryService.resetPassword.mockRejectedValue(error)

			await expect(
				resolver.resetPassword(
					mockGqlContext,
					emptyEmailInput as ResetPasswordInput,
					userAgent
				)
			).rejects.toThrow('Email cannot be empty')
		})

		it('should handle service errors', async () => {
			const error = new Error('Service unavailable')
			mockPasswordRecoveryService.resetPassword.mockRejectedValue(error)

			await expect(
				resolver.resetPassword(
					mockGqlContext,
					resetPasswordInput,
					userAgent
				)
			).rejects.toThrow('Service unavailable')
		})

		it('should work with different user agents', async () => {
			const mobileUserAgent =
				'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'
			mockPasswordRecoveryService.resetPassword.mockResolvedValue(true)

			const result = await resolver.resetPassword(
				mockGqlContext,
				resetPasswordInput,
				mobileUserAgent
			)

			expect(passwordRecoveryService.resetPassword).toHaveBeenCalledWith(
				mockRequest,
				resetPasswordInput,
				mobileUserAgent
			)
			expect(result).toBe(true)
		})

		it('should handle undefined user agent', async () => {
			mockPasswordRecoveryService.resetPassword.mockResolvedValue(true)

			const result = await resolver.resetPassword(
				mockGqlContext,
				resetPasswordInput,
				undefined
			)

			expect(passwordRecoveryService.resetPassword).toHaveBeenCalledWith(
				mockRequest,
				resetPasswordInput,
				undefined
			)
			expect(result).toBe(true)
		})
	})

	describe('newPassword', () => {
		const newPasswordInput: NewPasswordInput = {
			password: 'newSecurePassword123',
			passwordRepeat: 'newSecurePassword123',
			token: '123e4567-e89b-12d3-a456-426614174000'
		}

		it('should set new password successfully', async () => {
			mockPasswordRecoveryService.newPassword.mockResolvedValue(true)

			const result = await resolver.newPassword(newPasswordInput)

			expect(passwordRecoveryService.newPassword).toHaveBeenCalledWith(
				newPasswordInput
			)
			expect(result).toBe(true)
		})

		it('should handle token not found', async () => {
			const error = new NotFoundException('Токен не знайдено')
			mockPasswordRecoveryService.newPassword.mockRejectedValue(error)

			await expect(
				resolver.newPassword(newPasswordInput)
			).rejects.toThrow('Токен не знайдено')
			expect(passwordRecoveryService.newPassword).toHaveBeenCalledWith(
				newPasswordInput
			)
		})

		it('should handle expired token', async () => {
			const error = new BadRequestException('Токен завершився')
			mockPasswordRecoveryService.newPassword.mockRejectedValue(error)

			await expect(
				resolver.newPassword(newPasswordInput)
			).rejects.toThrow('Токен завершився')
			expect(passwordRecoveryService.newPassword).toHaveBeenCalledWith(
				newPasswordInput
			)
		})

		it('should handle invalid token format', async () => {
			const invalidTokenInput = {
				...newPasswordInput,
				token: 'invalid-token-format'
			}
			const error = new BadRequestException('Invalid token format')
			mockPasswordRecoveryService.newPassword.mockRejectedValue(error)

			await expect(
				resolver.newPassword(invalidTokenInput)
			).rejects.toThrow('Invalid token format')
		})

		it('should handle password too short', async () => {
			const shortPasswordInput = {
				...newPasswordInput,
				password: '123',
				passwordRepeat: '123'
			}
			const error = new BadRequestException('Password too short')
			mockPasswordRecoveryService.newPassword.mockRejectedValue(error)

			await expect(
				resolver.newPassword(shortPasswordInput)
			).rejects.toThrow('Password too short')
		})

		it('should handle password mismatch', async () => {
			const mismatchInput = {
				...newPasswordInput,
				passwordRepeat: 'differentPassword123'
			}
			const error = new BadRequestException('Паролі не співпадають')
			mockPasswordRecoveryService.newPassword.mockRejectedValue(error)

			await expect(resolver.newPassword(mismatchInput)).rejects.toThrow(
				'Паролі не співпадають'
			)
		})

		it('should handle empty password', async () => {
			const emptyPasswordInput = {
				...newPasswordInput,
				password: '',
				passwordRepeat: ''
			}
			const error = new BadRequestException('Password cannot be empty')
			mockPasswordRecoveryService.newPassword.mockRejectedValue(error)

			await expect(
				resolver.newPassword(emptyPasswordInput)
			).rejects.toThrow('Password cannot be empty')
		})

		it('should handle empty token', async () => {
			const emptyTokenInput = {
				...newPasswordInput,
				token: ''
			}
			const error = new BadRequestException('Token cannot be empty')
			mockPasswordRecoveryService.newPassword.mockRejectedValue(error)

			await expect(resolver.newPassword(emptyTokenInput)).rejects.toThrow(
				'Token cannot be empty'
			)
		})

		it('should handle service errors', async () => {
			const error = new Error('Database connection failed')
			mockPasswordRecoveryService.newPassword.mockRejectedValue(error)

			await expect(
				resolver.newPassword(newPasswordInput)
			).rejects.toThrow('Database connection failed')
		})
	})

	describe('Integration scenarios', () => {
		it('should handle complete password recovery flow', async () => {
			const email = 'user@example.com'
			const resetInput: ResetPasswordInput = { email }
			const userAgent = 'Mozilla/5.0 Test Browser'

			// Step 1: Reset password request
			mockPasswordRecoveryService.resetPassword.mockResolvedValue(true)

			const resetResult = await resolver.resetPassword(
				mockGqlContext,
				resetInput,
				userAgent
			)
			expect(resetResult).toBe(true)

			// Step 2: Set new password
			const newPasswordInput: NewPasswordInput = {
				password: 'newStrongPassword123',
				passwordRepeat: 'newStrongPassword123',
				token: '123e4567-e89b-12d3-a456-426614174000'
			}

			mockPasswordRecoveryService.newPassword.mockResolvedValue(true)

			const newPasswordResult =
				await resolver.newPassword(newPasswordInput)
			expect(newPasswordResult).toBe(true)

			expect(passwordRecoveryService.resetPassword).toHaveBeenCalledWith(
				mockRequest,
				resetInput,
				userAgent
			)
			expect(passwordRecoveryService.newPassword).toHaveBeenCalledWith(
				newPasswordInput
			)
		})

		it('should handle multiple reset requests for same email', async () => {
			const resetInput: ResetPasswordInput = { email: 'test@example.com' }
			const userAgent = 'Test Browser'

			mockPasswordRecoveryService.resetPassword.mockResolvedValue(true)

			// Simulate multiple requests
			const requests = Array(3)
				.fill(null)
				.map(() =>
					resolver.resetPassword(
						mockGqlContext,
						resetInput,
						userAgent
					)
				)

			const results = await Promise.all(requests)

			expect(results).toEqual([true, true, true])
			expect(passwordRecoveryService.resetPassword).toHaveBeenCalledTimes(
				3
			)
		})

		it('should handle concurrent new password requests', async () => {
			const input1: NewPasswordInput = {
				password: 'password123',
				passwordRepeat: 'password123',
				token: '123e4567-e89b-12d3-a456-426614174001'
			}

			const input2: NewPasswordInput = {
				password: 'password456',
				passwordRepeat: 'password456',
				token: '123e4567-e89b-12d3-a456-426614174002'
			}

			mockPasswordRecoveryService.newPassword
				.mockResolvedValueOnce(true)
				.mockResolvedValueOnce(true)

			const [result1, result2] = await Promise.all([
				resolver.newPassword(input1),
				resolver.newPassword(input2)
			])

			expect(result1).toBe(true)
			expect(result2).toBe(true)
			expect(passwordRecoveryService.newPassword).toHaveBeenCalledTimes(2)
		})
	})

	describe('Edge cases', () => {
		it('should handle special characters in email', async () => {
			const specialEmail = 'user+test@sub-domain.example.co.uk'
			const resetInput: ResetPasswordInput = { email: specialEmail }
			const userAgent = 'Test Browser'

			mockPasswordRecoveryService.resetPassword.mockResolvedValue(true)

			const result = await resolver.resetPassword(
				mockGqlContext,
				resetInput,
				userAgent
			)

			expect(passwordRecoveryService.resetPassword).toHaveBeenCalledWith(
				mockRequest,
				resetInput,
				userAgent
			)
			expect(result).toBe(true)
		})

		it('should handle very long password', async () => {
			const longPassword = 'a'.repeat(100) + '123'
			const longPasswordInput: NewPasswordInput = {
				password: longPassword,
				passwordRepeat: longPassword,
				token: '123e4567-e89b-12d3-a456-426614174000'
			}

			mockPasswordRecoveryService.newPassword.mockResolvedValue(true)

			const result = await resolver.newPassword(longPasswordInput)

			expect(passwordRecoveryService.newPassword).toHaveBeenCalledWith(
				longPasswordInput
			)
			expect(result).toBe(true)
		})

		it('should handle international characters in password', async () => {
			const internationalPassword = 'пароль123ñäöü'
			const internationalInput: NewPasswordInput = {
				password: internationalPassword,
				passwordRepeat: internationalPassword,
				token: '123e4567-e89b-12d3-a456-426614174000'
			}

			mockPasswordRecoveryService.newPassword.mockResolvedValue(true)

			const result = await resolver.newPassword(internationalInput)

			expect(passwordRecoveryService.newPassword).toHaveBeenCalledWith(
				internationalInput
			)
			expect(result).toBe(true)
		})
	})
})
